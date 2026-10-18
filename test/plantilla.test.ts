import { expect, test } from "bun:test";
import { cp, mkdtemp, mkdir, rm } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { fichaSchema } from "@hacknight/shared/modelo";
import { paleta } from "@hacknight/shared/paleta";
import { contexto } from "../apps/cli/src/lib/contexto";
import { revisar, type Revision } from "../apps/cli/src/lib/revision";
import { ejecutar } from "../apps/cli/src/lib/proceso";

const root = resolve(import.meta.dir, "..");
const source = join(root, "plantilla");
async function copyTemplate(target: string) {
  await cp(source, target, {
    recursive: true,
    filter: (p) =>
      !relative(source, p)
        .split(/[\\/]/)
        .some(
          (part) =>
            ["node_modules", ".next", "out", "next-env.d.ts"].includes(part) ||
            part.endsWith(".tsbuildinfo"),
        ),
  });
}

test("la plantilla independiente pasa revisar salvo la URL pública", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-template-"));
  try {
    const project = join(dir, "project");
    await copyTemplate(project);
    await ejecutar(["git", "init"], undefined, project);
    await ejecutar(["git", "add", "."], undefined, project);
    const child = Bun.spawn(
      [
        process.execPath,
        join(root, "apps/cli/src/index.ts"),
        "--registro",
        pathToFileURL(join(root, "test/fixtures/registro")).href,
        "--cwd",
        project,
        "--usuario",
        "demo-alba",
        "--json",
        "revisar",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, HACKNIGHT_CONFIG: join(dir, "no-config.json") },
      },
    );
    const [output, stderr, status] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(stderr).toBe("");
    expect(status).toBe(2);
    const report = JSON.parse(output).data as Revision;
    expect(report.hallazgos).toEqual([]);
    expect(
      report.reglas.filter((rule) => !rule.ok).map((rule) => rule.numero),
    ).toEqual([2]);
    expect(
      fichaSchema.safeParse(await Bun.file(join(project, "ficha.json")).json())
        .success,
    ).toBe(true);
    const css = (
      await Bun.file(join(project, "src/styles/paleta.css")).text()
    ).toLowerCase();
    for (const [token, color] of Object.entries(paleta))
      expect(css).toContain(`--color-${token}: ${color.toLowerCase()}`);
    expect(await Bun.file(join(project, "bun.lock")).exists()).toBe(true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}, 15000);
