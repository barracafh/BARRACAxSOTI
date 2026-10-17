import { afterEach, test, expect } from "bun:test";
import { mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RegistroLocal } from "@hacknight/shared/registro/local";
import { cuentaAtras } from "../src/lib/tiempo";
import { wordmarkRows, banner } from "../src/lib/banner";
import { panel } from "../src/lib/estilo";
const tempDirs: string[] = [];
afterEach(async () => {
  for (const dir of tempDirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
test("el fixture de pruebas tiene todos los negociados y cuatro squads", async () => {
  const r = new RegistroLocal(
    join(import.meta.dir, "../../../test/fixtures/registro"),
    "demo-alba",
  );
  expect((await r.tracks()).length).toBe(13);
  expect((await r.equipos()).length).toBe(4);
  expect(await r.comite()).toHaveLength(2);
  expect((await r.evento()).fin).toBe("2026-10-22T22:00:00+02:00");
});
test("registro local persiste y cierra issues", async () => {
  const p = await mkdtemp(join(tmpdir(), "hacknight-test-"));
  tempDirs.push(p);
  await cp(join(import.meta.dir, "../../../test/fixtures/registro"), p, {
    recursive: true,
  });
  const r = new RegistroLocal(p, "demo-alba");
  const i = await r.crearIssue("Ayuda", "Texto", ["ventanilla"]);
  expect(i.numero).toBe(1);
  await r.editarIssue(i.numero, { estado: "closed" });
  expect((await new RegistroLocal(p).issues())[0]?.estado).toBe("closed");
});
test("cuenta atrás no depende de la zona de la máquina", () => {
  expect(
    cuentaAtras("2026-10-22T22:00:00+02:00", Date.parse("2026-10-22T19:00:00Z"))
      .texto,
  ).toBe("01:00:00");
  expect(
    cuentaAtras("2026-10-22T22:00:00+02:00", Date.parse("2026-10-22T21:00:00Z"))
      .cerrado,
  ).toBe(true);
});
test("marca y azulejos caben en 80 columnas y marca pequeña en 30", () => {
  expect(
    Math.max(...wordmarkRows().map((s) => Bun.stringWidth(s))),
  ).toBeLessThanOrEqual(80);
  for (const line of panel("Su expediente", ["a".repeat(200)]).split("\n"))
    expect(Bun.stringWidth(line)).toBeLessThanOrEqual(80);
  expect(wordmarkRows()).toHaveLength(6);
  expect(new Set(wordmarkRows().map((s) => Bun.stringWidth(s))).size).toBe(1);
  expect(banner(30, null)).toContain("☾ build night");
  expect(banner(80, null)).toContain("BARRACA x SOTI · 22/10/2026 · MAISA");
  for (const columns of [30, 72, 73, 80])
    for (const line of banner(columns, null).split("\n"))
      expect(Bun.stringWidth(line)).toBeLessThanOrEqual(columns);
  const lunar = panel("🌙 Hack night", ["Una noche 🌙 para construir"], 30);
  expect(lunar).toContain("☾ Hack night");
  expect(lunar).not.toContain("🌙");
  expect(new Set(lunar.split("\n").map((s) => Bun.stringWidth(s))).size).toBe(
    1,
  );
});
for (const args of [
  [],
  ["expediente"],
  ["tracks"],
  ["tracks", "derechos"],
  ["status"],
  ["vuelva-usted-mañana"],
])
  test(`JSON base: ${args.join(" ")}`, async () => {
    const p = Bun.spawn(
      [
        process.execPath,
        join(import.meta.dir, "../src/index.ts"),
        "--json",
        "--registro",
        new URL("../../../test/fixtures/registro", import.meta.url).href,
        ...args,
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, HACKNIGHT_USUARIO: "demo-alba" },
      },
    );
    const out = await new Response(p.stdout).text();
    expect(await p.exited).toBe(0);
    expect(JSON.parse(out).ok).toBe(true);
  });
