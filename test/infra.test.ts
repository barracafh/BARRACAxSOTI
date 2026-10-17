import { expect, test } from "bun:test";
import { mkdtemp, rm, stat, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executePlan, options, root } from "../infra/common";
import { registryPlan } from "../infra/registro/preparar";
import { provisionKeys } from "../infra/ia/claves";

const fakeMaster = "synthetic-master-value";
const fakeKey = "synthetic-squad-value";

test("registro: dry-run no ejecuta; siembra JSON, etiquetas y revisiones del comité", async () => {
  const plan = await registryPlan("example/registro", "@example/comite");
  let calls = 0;
  const messages: string[] = [];
  await executePlan(
    plan,
    false,
    async () => {
      calls++;
    },
    (message) => messages.push(message),
  );
  expect(calls).toBe(0);
  expect(messages.join("\n")).toContain("'gh' 'repo' 'create'");
  expect(JSON.parse(plan.files["equipos.json"]!)).toEqual([]);
  expect(plan.files["tracks.json"]).toBe(
    await Bun.file(
      join(root, "packages/shared/registro-base/tracks.json"),
    ).text(),
  );
  expect(plan.files[".github/CODEOWNERS"]).toContain(
    "/equipos.json @example/comite",
  );
  expect(plan.files[".github/CODEOWNERS"]).toContain(
    "/.github/CODEOWNERS @example/comite",
  );
  expect(
    plan.commands
      .filter((command) => command.args[1] === "label")
      .map((command) => command.args[3]),
  ).toEqual(["ventanilla", "aviso", "tablon"]);
  const protection = JSON.parse(plan.commands.at(-1)!.input!);
  expect(
    protection.required_pull_request_reviews.require_code_owner_reviews,
  ).toBe(true);
  expect(protection.enforce_admins).toBe(true);
  expect(protection.allow_force_pushes).toBe(false);
  expect(protection.allow_deletions).toBe(false);
  expect(options([], []).apply).toBe(false);
  expect(() => options([], ["--apply", "--dry-run"])).toThrow();
  expect(() => options([], ["--aply"])).toThrow();
});

test("IA: dry-run no llama, no guarda y nunca imprime la clave maestra", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-keys-dry-"));
  try {
    let calls = 0;
    const logs: string[] = [];
    await provisionKeys({
      squads: ["squad-prueba"],
      secretDir: join(dir, "keys"),
      masterKey: fakeMaster,
      fetcher: (async () => {
        calls++;
        throw new Error("No debe llamar");
      }) as unknown as typeof fetch,
      log: (line) => logs.push(line),
    });
    expect(calls).toBe(0);
    await expect(stat(join(dir, "keys"))).rejects.toThrow();
    expect(logs.join("\n")).not.toContain(fakeMaster);
    expect(logs.join("\n")).toContain('"limit":20');
    for (const limit of [0, -1, 21, NaN, Infinity])
      await expect(
        provisionKeys({ squads: ["squad-prueba"], limit }),
      ).rejects.toThrow();
    await expect(provisionKeys({ squads: ["../escape"] })).rejects.toThrow();
    await expect(
      provisionKeys({ squads: ["squad", "squad"] }),
    ).rejects.toThrow();
    await expect(
      provisionKeys({
        squads: Array.from({ length: 16 }, (_, i) => `squad-${i}`),
      }),
    ).rejects.toThrow();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("IA: proveedor simulado, claves 600, límite sin reinicio y reejecución sin duplicar", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-keys-apply-"));
  try {
    const logs: string[] = [];
    const requests: RequestInit[] = [];
    const fetcher = (async (url: string | URL | Request, init: RequestInit) => {
      expect(String(url)).toBe("https://openrouter.ai/api/v1/keys");
      requests.push(init);
      return Response.json({ key: fakeKey, data: { hash: "synthetic-hash" } });
    }) as unknown as typeof fetch;
    const config = {
      squads: ["squad-prueba", "squad-dos"],
      apply: true,
      masterKey: fakeMaster,
      secretDir: join(dir, "keys"),
      fetcher,
      log: (line: string) => logs.push(line),
    };
    await provisionKeys(config);
    expect(requests).toHaveLength(2);
    expect(JSON.parse(requests[0]!.body as string)).toMatchObject({
      limit: 20,
      limit_reset: null,
      include_byok_in_limit: true,
    });
    const path = join(dir, "keys/squad-prueba.json");
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect((await stat(join(dir, "keys"))).mode & 0o777).toBe(0o700);
    const saved = await Bun.file(path).json();
    expect(saved.status).toBe("created");
    expect(saved.key === fakeKey).toBe(true);
    expect(JSON.stringify(saved).includes(fakeMaster)).toBe(false);
    await provisionKeys(config);
    expect(requests).toHaveLength(2);
    expect(logs.join("\n").includes(fakeKey)).toBe(false);
    expect(logs.join("\n").includes(fakeMaster)).toBe(false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("IA: conserva éxitos parciales y bloquea reintentos ambiguos sin filtrar errores", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-keys-failure-"));
  try {
    let calls = 0;
    const fetcher = (async () => {
      calls++;
      if (calls === 1)
        return Response.json({
          key: fakeKey,
          data: { hash: "synthetic-hash" },
        });
      throw new Error(fakeMaster + fakeKey);
    }) as unknown as typeof fetch;
    const config = {
      squads: ["squad-uno", "squad-dos"],
      apply: true,
      masterKey: fakeMaster,
      secretDir: join(dir, "keys"),
      fetcher,
      log: () => {},
    };
    let message = "";
    try {
      await provisionKeys(config);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("No se pudo confirmar");
    expect(message.includes(fakeMaster)).toBe(false);
    expect(message.includes(fakeKey)).toBe(false);
    expect(
      (await Bun.file(join(dir, "keys/squad-uno.json")).json()).status,
    ).toBe("created");
    expect(
      (await Bun.file(join(dir, "keys/squad-dos.json")).json()).status,
    ).toBe("pending");
    await expect(provisionKeys(config)).rejects.toThrow("Estado pendiente");
    expect(calls).toBe(2);
    await symlink(
      join(dir, "keys/squad-uno.json"),
      join(dir, "keys/squad-link.json"),
    );
    await expect(
      provisionKeys({ ...config, squads: ["squad-link"] }),
    ).rejects.toThrow("inseguro");
    expect(calls).toBe(2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
