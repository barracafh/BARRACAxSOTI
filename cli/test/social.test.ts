import { test, expect } from "bun:test";
import { mkdtemp, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { RegistroLocal } from "../src/registro/local";
import { entradas, obtenerCola } from "../src/commands/social";
import { snapshot } from "../src/commands/pantalla";
import { renderPantalla, frame, diffFrame } from "../src/lib/screen";
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "barbaritat-social-"));
  await cp(join(import.meta.dir, "../demo/registro"), dir, { recursive: true });
  const r = new RegistroLocal(dir);
  return {
    dir,
    r,
    ctx: {
      opts: { json: true },
      registro: r,
      cwd: dir,
      config: {
        registro: pathToFileURL(dir).href,
        plantilla: undefined,
        releases: undefined,
      },
    },
  };
}
async function cli(dir: string, args: string[], user = "demo-alba") {
  const p = Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, "../src/index.ts"),
      "--json",
      "--registro",
      pathToFileURL(dir).href,
      "--usuario",
      user,
      ...args,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const out = await new Response(p.stdout).text();
  const code = await p.exited;
  return { status: code, ...JSON.parse(out) };
}
test("flujo de cola y todos sus comandos JSON", async () => {
  const { dir, ctx } = await fixture();
  const a = await cli(dir, ["cita", "--motivo", "Despliegue"]);
  expect(a.ok).toBe(true);
  expect(a.data.turno).toBe("D-001");
  expect(a.data.posicion).toBe(1);
  expect(
    (await cli(dir, ["cita", "--motivo", "Otra consulta"])).data.cita.turno,
  ).toBe("D-001");
  expect(await ctx.registro.issues()).toHaveLength(1);
  expect((await cli(dir, ["cita", "estado"])).data.cita.estado).toBe("espera");
  expect((await cli(dir, ["ventanilla"])).status).toBe(4);
  expect((await cli(dir, ["ventanilla"], "demo-mentor-ona")).ok).toBe(true);
  expect(
    (await cli(dir, ["ventanilla", "llamar"], "demo-mentor-ona")).data.estado,
  ).toBe("llamado");
  expect(
    (await cli(dir, ["ventanilla", "atendido"], "demo-mentor-ona")).data.estado,
  ).toBe("atendido");
  expect(await obtenerCola(ctx)).toEqual([]);
  expect((await cli(dir, ["cita", "Ayuda"])).ok).toBe(true);
  expect((await cli(dir, ["cita", "anular"])).ok).toBe(true);
});
test("aviso de intruso se descarta y publicación exige confirmación", async () => {
  const { dir, ctx } = await fixture();
  await ctx.registro.crearIssue("Falso aviso", "No debería aparecer", [
    "aviso",
  ]);
  const committee = new RegistroLocal(dir, "demo-mentor-ona");
  await committee.crearIssue("Bona vesprada", "Comienza el build", ["aviso"]);
  expect((await entradas(ctx)).map((e) => e.texto)).toEqual([
    "@demo-mentor-ona: Comienza el build",
  ]);
  expect((await cli(dir, ["publicar", "Hola"])).status).toBe(2);
  expect((await cli(dir, ["publicar", "Hola", "--confirmar"])).ok).toBe(true);
  expect(
    (await cli(dir, ["publicar", "a".repeat(501), "--confirmar"])).ok,
  ).toBe(false);
  for (const command of ["tablon", "feed"]) {
    const result = await cli(dir, [command, "-n", "20"]);
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(2);
  }
});
test("la cola rechaza identidad de squad falsificada y usa la mesa del registro", async () => {
  const { r, ctx } = await fixture();
  await r.crearIssue(
    "Ayuda",
    JSON.stringify({
      tipo: "cita",
      squad: "squad-taulell",
      herramienta: "claridad",
      mesa: "999",
      motivo: "x",
      estado: "espera",
    }),
    ["ventanilla"],
  );
  expect(await obtenerCola(ctx)).toEqual([]);
});
test("pantalla plain incluye negociados, cuenta atrás, turnos, avisos y no usa ANSI", async () => {
  const { dir, ctx } = await fixture();
  await cli(dir, ["cita", "--motivo", "Ayuda"]);
  const s = await snapshot(ctx);
  const rendered = renderPantalla(
    s,
    Date.parse("2026-10-22T19:00:00Z"),
    80,
  ).join("\n");
  expect(rendered).toContain("01:00:00");
  expect(rendered).toContain("Estado de los negociados");
  expect(rendered).toContain("D-001 → Mesa 1");
  expect(rendered).toContain("Avisos del comité");
  expect(rendered).not.toContain("\x1b");
  for (const line of rendered.split("\n"))
    expect(Bun.stringWidth(line)).toBeLessThanOrEqual(80);
  expect(frame(s, 80, 24)).toHaveLength(24);
  expect(diffFrame(["a", "b"], ["a", "c"])).toEqual([{ row: 1, line: "c" }]);
  for (const command of ["pantalla", "tv"])
    expect((await cli(dir, [command, "--once", "--plain"])).ok).toBe(true);
});
