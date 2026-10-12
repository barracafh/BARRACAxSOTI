import { expect, test } from "bun:test";
import { resolve, join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dir, "..");
async function dependencias(entrypoints: string[]) {
  // Los source maps describen el código que realmente entra en cada bundle.
  const dir = await mkdtemp(join(tmpdir(), "hacknight-bundle-test-"));
  try {
    const build = Bun.spawn(
      [
        process.execPath,
        "build",
        ...entrypoints,
        "--target=bun",
        "--sourcemap=external",
        "--root",
        root,
        "--outdir",
        dir,
      ],
      { cwd: root, stdout: "pipe", stderr: "pipe" },
    );
    const [exitCode, out, err] = await Promise.all([
      build.exited,
      new Response(build.stdout).text(),
      new Response(build.stderr).text(),
    ]);
    if (exitCode !== 0) throw new Error(`Compilación fallida: ${out}${err}`);
    const files: string[] = [];
    let code = "";
    for await (const path of new Bun.Glob("**/*.js*").scan(dir)) {
      const output = Bun.file(join(dir, path));
      if (path.endsWith(".map")) {
        const map = await output.json();
        files.push(...map.sources);
      } else code += await output.text();
    }
    return { files, code };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("el CLI compilado incluye el watcher, sin servidor, SQLite ni assets web", async () => {
  const graph = await dependencias(["apps/cli/src/index.ts"]);
  expect(
    graph.files.some((p) => p.endsWith("apps/cli/src/watcher/cliente.ts")),
  ).toBe(true);
  expect(graph.files.some((p) => /(^|\/)(server|web)\//.test(p))).toBe(false);
  expect(graph.code.includes("bun:sqlite")).toBe(false);
  expect(graph.code.includes("renderRanking")).toBe(false);
});

test("el servidor incluye web y SQLite sin importar comandos del CLI", async () => {
  const graph = await dependencias(["apps/server/src/index.ts"]);
  expect(graph.files.some((p) => p.endsWith("apps/server/src/admin.ts"))).toBe(
    true,
  );
  expect(graph.code.includes("renderRanking")).toBe(true);
  expect(graph.code.includes("bun:sqlite")).toBe(true);
  expect(graph.files.some((p) => /(^|\/)cli\//.test(p))).toBe(false);
});

test("los contratos y el registro compartidos no dependen de ninguna aplicación", async () => {
  const graph = await dependencias([
    "packages/shared/src/registro/local.ts",
    "packages/shared/src/actividad.ts",
    "packages/shared/src/contrato-uso.ts",
    "packages/shared/src/paleta.ts",
  ]);
  expect(graph.files.some((p) => /(^|\/)(cli|server|web)\//.test(p))).toBe(
    false,
  );
  expect(graph.code.includes("bun:sqlite")).toBe(false);
});
