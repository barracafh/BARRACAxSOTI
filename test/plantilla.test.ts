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

test("tramitar usa la plantilla real, consume el ejemplo y excluye artefactos y secretos", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-template-init-"));
  try {
    const template = join(dir, "template");
    await copyTemplate(template);
    for (const folder of ["node_modules", ".next", "out", ".vercel"]) {
      await mkdir(join(template, folder));
      await Bun.write(join(template, folder, "excluded.txt"), "fixture");
    }
    await Bun.write(join(template, ".env.local"), "SYNTHETIC=true\n");
    const command = [
      process.execPath,
      join(root, "apps/cli/src/index.ts"),
      "--registro",
      pathToFileURL(join(root, "test/fixtures/registro")).href,
      "--usuario",
      "demo-alba",
      "--cwd",
      dir,
      "--plantilla",
      pathToFileURL(template).href,
      "--json",
      "tramitar",
    ];
    const result = JSON.parse(await ejecutar(command));
    expect(result.ok).toBe(true);
    const project = join(dir, "squad-taronja");
    const ficha = await Bun.file(join(project, "ficha.json")).json();
    expect(ficha.equipo).toBe("squad-taronja");
    expect(ficha.herramienta).toBe("derechos");
    expect(
      (await Bun.file(join(project, ".hacknight/plantilla.json")).json())
        .exampleFicha,
    ).toBe(false);
    for (const folder of ["node_modules", ".next", "out", ".vercel"])
      expect(
        await Bun.file(join(project, folder, "excluded.txt")).exists(),
      ).toBe(false);
    expect(await Bun.file(join(project, ".env.local")).exists()).toBe(false);
    expect(await Bun.file(join(project, "src/app/page.tsx")).exists()).toBe(
      true,
    );
    const ctx = await contexto({
      registro: pathToFileURL(join(root, "test/fixtures/registro")).href,
      cwd: project,
      usuario: "demo-alba",
    });
    const report = await revisar(ctx, (async () => {
      throw new Error("Sin publicar");
    }) as unknown as typeof fetch);
    expect(report.reglas.filter((r) => !r.ok).map((r) => r.numero)).toEqual([
      2,
    ]);

    // A real squad's ficha must never be silently overwritten.
    await Bun.write(
      join(template, "ficha.json"),
      JSON.stringify({ ...ficha, equipo: "otro-squad" }),
    );
    await expect(
      ejecutar([...command, "--destino", "rejected"]),
    ).rejects.toThrow();
    expect(
      (await Bun.file(join(dir, "rejected/ficha.json")).json()).equipo,
    ).toBe("otro-squad");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
