import { afterEach, test, expect } from "bun:test";
import { mkdtemp, cp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { proyectoDePrueba } from "./proyecto";
const tempDirs: string[] = [];
afterEach(async () => {
  for (const dir of tempDirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
test("registro JSON: revisar, registrar, actualizar y plazo; sin red real", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-flujo-"));
  tempDirs.push(dir);
  const reg = join(dir, "registro");
  await cp(join(import.meta.dir, "../../../test/fixtures/registro"), reg, {
    recursive: true,
  });
  const pre = join(dir, "network-mock.js");
  await writeFile(pre, 'globalThis.fetch = async () => new Response("OK");');
  async function cli(args: string[], cwd = dir) {
    const p = Bun.spawn(
      [
        process.execPath,
        "--preload",
        pre,
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
        env: { ...process.env, HACKNIGHT_USUARIO: "demo-alba" },
      },
    );
    const out = await new Response(p.stdout).text();
    return { ...JSON.parse(out), status: await p.exited };
  }
  const ev = await Bun.file(join(reg, "evento.json")).json();
  ev.registroFueraDePlazo = true;
  await writeFile(join(reg, "evento.json"), JSON.stringify(ev));
  const project = await proyectoDePrueba(dir);
  const ficha = await Bun.file(join(project, "ficha.json")).json();
  ficha.url = "http://127.0.0.1:1234";
  await writeFile(join(project, "ficha.json"), JSON.stringify(ficha));
  const before = await cli(["revisar"], project);
  expect(before.status).toBe(2);
  expect(
    before.data.hallazgos.some((h: { tipo: string }) => h.tipo === "DNI"),
  ).toBe(true);
  expect(JSON.stringify(before)).not.toContain("12345678Z");
  await writeFile(
    join(project, "index.html"),
    '<a href="mailto:test@example.org">¿Algo está mal? Avísanos</a>',
  );
  expect((await cli(["revisar"], project)).ok).toBe(true);
  const receipt = await cli(["registrar"], project);
  expect(receipt.data.numero).toBe("RE-2026-22O-0001");
  expect(receipt.data.herramienta).toBe("derechos");
  ficha.nombre = "Nombre actualizado";
  await writeFile(join(project, "ficha.json"), JSON.stringify(ficha));
  expect((await cli(["submit"], project)).data.numero).toBe(
    receipt.data.numero,
  );
  ficha.nombre = "Persona 12345678Z";
  await writeFile(join(project, "ficha.json"), JSON.stringify(ficha));
  const pii = await cli(["revisar"], project);
  expect(pii.ok).toBe(false);
  expect(JSON.stringify(pii)).not.toContain("12345678Z");
  ficha.nombre = "Nombre limpio";
  await writeFile(join(project, "ficha.json"), JSON.stringify(ficha));
  ev.inicio = "2000-01-01T00:00:00Z";
  ev.fin = "2000-01-01T01:00:00Z";
  ev.registroFueraDePlazo = false;
  await writeFile(join(reg, "evento.json"), JSON.stringify(ev));
  const late = await cli(["registrar"], project);
  expect(late.code).toBe("EVENT_CLOSED");
  expect(late.status).toBe(4);
});
