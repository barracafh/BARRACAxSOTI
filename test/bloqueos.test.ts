import { expect, test } from "bun:test";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { conBloqueo } from "@buildnight/shared/registro/bloqueo";
import {
  administracion,
  guardarGestion,
  inicializarRegistro,
} from "@buildnight/shared/registro/gestion";
import { RegistroLocal } from "@buildnight/shared/registro/local";

const childScript = resolve(import.meta.dir, "support/lock-process.ts");
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "buildnight-lock-test-"));
  await inicializarRegistro(dir);
  return dir;
}
async function mantener(path: string) {
  const child = Bun.spawn([process.execPath, childScript, "hold", path], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  const reader = child.stdout.getReader();
  const { value } = await reader.read();
  reader.releaseLock();
  if (new TextDecoder().decode(value).trim() !== "bloqueado") {
    child.kill();
    throw new Error("El subproceso no adquirió el bloqueo.");
  }
  return child;
}

for (const name of [".admin-lock", ".lock"]) {
  test(`${name}: respeta al propietario vivo y recupera una caída real`, async () => {
    const dir = await fixture();
    const path = join(dir, name);
    const child = await mantener(path);
    const guardar = async () => {
      const reg = new RegistroLocal(dir, "demo-builder");
      return name === ".admin-lock"
        ? guardarGestion(reg, await administracion(reg))
        : reg.crearIssue("Prueba", "Contenido ficticio", ["tablon"]);
    };
    try {
      for (let i = 0; i < 3; i++)
        await expect(guardar()).rejects.toThrow("ocupado");
      expect(await readdir(`${path}.claims`)).toHaveLength(1);
      child.kill("SIGKILL");
      expect(await child.exited).not.toBe(0);
      await guardar();
      expect(await readdir(`${path}.claims`)).toEqual([]);
      if (name === ".admin-lock")
        expect((await administracion(new RegistroLocal(dir))).revision).toBe(1);
      else expect(await new RegistroLocal(dir).issues()).toHaveLength(1);
    } finally {
      child.kill();
      await child.exited;
      await rm(dir, { recursive: true, force: true });
    }
  });

  test(`${name}: conserva los bloqueos heredados sin propietario`, async () => {
    const dir = await fixture();
    const path = join(dir, name);
    try {
      await mkdir(path);
      await expect(conBloqueo(path, async () => "incorrecto")).rejects.toThrow(
        "sin propietario verificable",
      );
      expect((await stat(path)).isDirectory()).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

test("la recuperación concurrente mantiene exclusión y no pierde escrituras", async () => {
  const dir = await fixture();
  const path = join(dir, ".lock"),
    counter = join(dir, "counter");
  await writeFile(counter, "0");
  const owner = await mantener(path);
  owner.kill("SIGKILL");
  await owner.exited;
  const children = Array.from({ length: 5 }, () =>
    Bun.spawn([process.execPath, childScript, "increment", path, counter], {
      stdout: "pipe",
      stderr: "pipe",
    }),
  );
  try {
    const results = await Promise.all(
      children.map(async (child) => ({
        status: await child.exited,
        error: await new Response(child.stderr).text(),
      })),
    );
    for (const result of results)
      expect(result, result.error).toEqual({ status: 0, error: "" });
    expect(await readFile(counter, "utf8")).toBe("75");
    expect(await readdir(`${path}.claims`)).toEqual([]);
    await expect(
      conBloqueo(path, async () => {
        throw new Error("fallo de prueba");
      }),
    ).rejects.toThrow("fallo de prueba");
    expect(await readdir(`${path}.claims`)).toEqual([]);
  } finally {
    for (const child of children) child.kill();
    await Promise.all(children.map((child) => child.exited));
    await rm(dir, { recursive: true, force: true });
  }
}, 15000);
