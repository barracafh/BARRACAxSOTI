import { afterEach, test, expect } from "bun:test";
import { mkdtemp, cp, writeFile, access, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { RegistroLocal } from "@hacknight/shared/registro/local";
import { descargar, sha256 } from "../src/lib/datos";
import {
  assetName,
  verificar,
  isNewer,
  instalarRelease,
  release,
} from "../src/commands/actualizar";
const tempDirs: string[] = [];
afterEach(async () => {
  for (const dir of tempDirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-start-"));
  tempDirs.push(dir);
  const reg = join(dir, "registro");
  await cp(join(import.meta.dir, "../../../test/fixtures/registro"), reg, {
    recursive: true,
  });
  return { dir, reg };
}
async function cli(reg: string, cwd: string, args: string[]) {
  const p = Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, "../src/index.ts"),
      "--registro",
      pathToFileURL(reg).href,
      "--cwd",
      cwd,
      "--json",
      ...args,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        HACKNIGHT_USUARIO: "demo-alba",
        // Empty switches the update off, so no test reaches GitHub releases.
        HACKNIGHT_RELEASES: "",
      },
    },
  );
  const data = JSON.parse(await new Response(p.stdout).text());
  return { ...data, status: await p.exited };
}
test("tramitar dry-run no escribe y arranque copia stub y asignación", async () => {
  const { dir, reg } = await setup();
  const dry = await cli(reg, dir, ["tramitar", "--dry-run"]);
  expect(dry.ok).toBe(true);
  await expect(access(join(dir, "squad-taronja"))).rejects.toThrow();
  const start = await cli(reg, dir, ["tramitar"]);
  expect(start.ok).toBe(true);
  const ficha = await Bun.file(join(dir, "squad-taronja/ficha.json")).json();
  expect(ficha.herramienta).toBe("derechos");
  expect(
    await Bun.file(join(dir, "squad-taronja/index.html")).text(),
  ).toContain("12345678Z");
  expect((await cli(reg, dir, ["tramitar"])).ok).toBe(false);
  expect(
    (await cli(reg, dir, ["init", "--dry-run", "--destino", "otro"])).ok,
  ).toBe(true);
});
test("datos lista pendientes y actualizar está desactivado", async () => {
  const { dir, reg } = await setup();
  const list = await cli(reg, dir, ["datos"]);
  expect(list.data).toHaveLength(9);
  expect((await cli(reg, dir, ["datos", "derechos-base"])).code).toBe(
    "NOT_CONFIGURED",
  );
  expect((await cli(reg, dir, ["actualizar"])).data.habilitada).toBe(false);
});
test("paquete local verifica checksum antes de instalar y funciona por CLI", async () => {
  const { dir, reg } = await setup();
  const file = join(dir, "pack.csv");
  await writeFile(file, "municipio,ayuda\nDemo,Ayuda");
  const pack = {
    id: "demo-pack",
    nombre: "Prueba",
    url: pathToFileURL(file).href,
    sha256: sha256(await Bun.file(file).bytes()),
    pendiente: false,
  };
  const ctx = {
    opts: {},
    registro: new RegistroLocal(reg),
    cwd: dir,
    config: {
      registro: pathToFileURL(reg).href,
      plantilla: undefined,
      releases: undefined,
    },
  };
  await expect(
    descargar(ctx, { ...pack, sha256: "0".repeat(64) }),
  ).rejects.toMatchObject({ code: "CHECKSUM" });
  await expect(access(join(dir, "datos/demo-pack.csv"))).rejects.toThrow();
  const result = await descargar(ctx, pack);
  expect(await Bun.file(result.archivo).text()).toContain("municipio");
  const ts = await ctx.registro.tracks();
  ts[0]!.paquetes = [pack];
  await writeFile(join(reg, "tracks.json"), JSON.stringify(ts));
  expect((await cli(reg, dir, ["datos", "demo-pack"])).ok).toBe(true);
});
test("assets, semver y SHA256 de actualización", () => {
  expect(assetName("darwin", "arm64")).toBe("hacknight-darwin-arm64");
  expect(assetName("win32", "x64")).toBe("hacknight-windows-x64.exe");
  expect(isNewer("cli-v0.2.0", "0.1.0")).toBe(true);
  expect(isNewer("cli-v0.1.0", "0.1.0")).toBe(false);
  const b = Buffer.from("binary");
  expect(() => verificar(b, `${sha256(b)}  binary`, "binary")).not.toThrow();
  expect(() => verificar(b, `${"0".repeat(64)}  binary`, "binary")).toThrow();
  expect(() => verificar(b, `${sha256(b)}  evil-binary`, "binary")).toThrow();
});
test("actualización con fetch simulado reemplaza únicamente tras checksum correcto", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-update-"));
  tempDirs.push(dir);
  const target = join(dir, "binary");
  await writeFile(target, "old");
  const bytes = Buffer.from("new");
  const asset = assetName();
  const good = (async (url: string | URL | Request) =>
    new Response(
      String(url).endsWith("SHA256SUMS") ? `${sha256(bytes)}  ${asset}` : bytes,
    )) as unknown as typeof fetch;
  await instalarRelease("owner/releases", "cli-v0.2.0", target, good);
  expect(await Bun.file(target).text()).toBe("new");
  const bad = (async () => new Response("invalid")) as unknown as typeof fetch;
  await expect(
    instalarRelease("owner/releases", "cli-v0.3.0", target, bad),
  ).rejects.toMatchObject({ code: "CHECKSUM" });
  expect(await Bun.file(target).text()).toBe("new");
});
test("release rechaza tags no estables", async () => {
  const f = (async () =>
    Response.json({ tag_name: "other-v1" })) as unknown as typeof fetch;
  await expect(release("owner/releases", f)).rejects.toMatchObject({
    code: "RELEASE",
  });
});
