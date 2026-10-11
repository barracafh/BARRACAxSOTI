import { join, resolve } from "node:path";
import { trackSchema, type Track } from "@hacknight/shared/modelo";
import { format } from "prettier";

const root = resolve(import.meta.dir, "..");
export const catalogPath = join(
  root,
  "packages/shared/registro-base/tracks.json",
);

export async function generateTracks(directory = join(root, "tracks")) {
  const tracks: Track[] = [];
  const slugs = new Set<string>();
  const windows = new Set<number>();
  const prefixes = new Set<string>();
  for await (const path of new Bun.Glob("**/track.json").scan(directory)) {
    const track = trackSchema
      .strict()
      .parse(await Bun.file(join(directory, path)).json());
    const expected = `${track.estado === "fuera" ? "fuera/" : ""}${track.slug}/track.json`;
    if (path !== expected)
      throw new Error(`Ruta incorrecta: ${path}; debe ser ${expected}.`);
    if (
      slugs.has(track.slug) ||
      windows.has(track.ventanilla) ||
      prefixes.has(track.prefijo)
    )
      throw new Error(`Slug, ventanilla o prefijo duplicado: ${path}.`);
    if (track.estado === "fuera" && !track.motivo?.trim())
      throw new Error(`Falta el motivo de descarte: ${path}.`);
    slugs.add(track.slug);
    windows.add(track.ventanilla);
    prefixes.add(track.prefijo);
    tracks.push(track);
  }
  if (!tracks.length) throw new Error("No se han encontrado tracks.");
  tracks.sort((a, b) => a.ventanilla - b.ventanilla);
  return format(JSON.stringify(tracks), { parser: "json" });
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check"))
    throw new Error("Uso: bun scripts/tracks.ts [--check]");
  const generated = await generateTracks();
  if (args.includes("--check")) {
    if ((await Bun.file(catalogPath).text()) !== generated)
      throw new Error(
        "Catálogo desactualizado. Ejecuta bun run tracks:generar.",
      );
    console.log("Catálogo de tracks al día.");
  } else {
    await Bun.write(catalogPath, generated);
    console.log("Catálogo de tracks generado.");
  }
}
