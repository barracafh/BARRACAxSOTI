import { cp, writeFile } from "node:fs/promises";
import { join } from "node:path";

// What infra/equipos hands demo-alba's squad: the stub, its ficha and Git.
export async function proyectoDePrueba(dir: string) {
  const project = join(dir, "squad-taronja");
  await cp(join(import.meta.dir, "fixtures/plantilla-stub"), project, {
    recursive: true,
  });
  await writeFile(
    join(project, "ficha.json"),
    JSON.stringify({
      nombre: "Ayudas para ti",
      frase: "Encuentra tu ayuda.",
      icono: "+",
      herramienta: "derechos",
      equipo: "squad-taronja",
      url: "https://example.invalid/pendiente",
      fuentes: [{ nombre: "BOE", url: "https://www.boe.es/" }],
      datos: "simulados",
    }),
  );
  for (const args of [
    ["init", "-q"],
    ["add", "."],
  ])
    await Bun.spawn(["git", ...args], { cwd: project }).exited;
  return project;
}
