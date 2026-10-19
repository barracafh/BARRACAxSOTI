import { afterEach, test, expect } from "bun:test";
import { mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { RegistroLocal } from "@hacknight/shared/registro/local";
import { entradas } from "../src/commands/social";
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
test("el tablón solo publica avisos del comité", async () => {
  const { dir, ctx } = await fixture();
  await ctx.registro.crearIssue("Falso aviso", "No debería aparecer", [
    "aviso",
  ]);
  const committee = new RegistroLocal(dir, "demo-mentor-ona");
  await committee.crearIssue("Bona vesprada", "Comienza el build", ["aviso"]);
  expect((await entradas(ctx)).map((e) => e.texto)).toEqual([
    "@demo-mentor-ona: Comienza el build",
  ]);
  await ctx.registro.crearIssue("Hola", "Texto suelto", ["tablon"]);
  expect((await cli(dir, ["publicar", "Hola"])).ok).toBe(false);
  for (const command of ["tablon", "feed"]) {
    const result = await cli(dir, [command, "-n", "20"]);
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
  }
});
