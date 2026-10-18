import { afterEach, test, expect } from "bun:test";
import { mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { RegistroLocal } from "@hacknight/shared/registro/local";
import { entradas } from "../src/commands/social";
import { snapshot } from "../src/commands/pantalla";
import { renderPantalla, frame, diffFrame } from "../src/lib/screen";
const tempDirs: string[] = [];
afterEach(async () => {
  for (const dir of tempDirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-social-"));
  tempDirs.push(dir);
  await cp(join(import.meta.dir, "../../../test/fixtures/registro"), dir, {
    recursive: true,
  });
  const r = new RegistroLocal(dir, "demo-alba");
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
    {
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, HACKNIGHT_USUARIO: "demo-alba" },
    },
  );
  const out = await new Response(p.stdout).text();
  const code = await p.exited;
  return { status: code, ...JSON.parse(out) };
}
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
test("pantalla plain incluye negociados, cuenta atrás, avisos y no usa ANSI", async () => {
  const { dir, ctx } = await fixture();
  const s = await snapshot(ctx);
  const rendered = renderPantalla(
    s,
    Date.parse("2026-10-22T19:00:00Z"),
    80,
  ).join("\n");
  expect(rendered).toContain("01:00:00");
  expect(rendered).toContain("Estado de los negociados");
  expect(rendered).not.toContain("Turnos");
  expect(rendered).toContain("Avisos del comité");
  expect(rendered).not.toContain("\x1b");
  for (const line of rendered.split("\n"))
    expect(Bun.stringWidth(line)).toBeLessThanOrEqual(80);
  expect(frame(s, 80, 24)).toHaveLength(24);
  expect(diffFrame(["a", "b"], ["a", "c"])).toEqual([{ row: 1, line: "c" }]);
  for (const command of ["pantalla", "tv"])
    expect((await cli(dir, [command, "--once", "--plain"])).ok).toBe(true);
});
