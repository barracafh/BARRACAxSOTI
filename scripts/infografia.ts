import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { format } from "prettier";

// Índice de apartados (## y ###) de los Markdown con infografía. La infografía
// lo usa para enlazar cada bloque con el ancla de GitHub de su apartado.
const root = resolve(import.meta.dir, "..");
export const indexPath = join(root, "tracks/comun/infografia/indice.js");

// Los Markdown comunes numerados y el contexto.md de cada track.
export async function documents(directory = join(root, "tracks")) {
  const docs: string[] = [];
  for (const name of await readdir(join(directory, "comun")))
    if (/^\d.*\.md$/.test(name)) docs.push(`comun/${name}`);
  for await (const path of new Bun.Glob("*/contexto.md").scan(directory))
    docs.push(path);
  return docs.sort();
}

// Misma regla que GitHub para las anclas: minúsculas, sin puntuación, espacios a guiones.
export function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/ /g, "-");
}

export function headings(markdown: string) {
  const seen = new Map<string, number>();
  const found: [number, string, string][] = [];
  let code = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) code = !code;
    const match = !code && line.match(/^(#{1,4}) (.+)$/);
    if (!match) continue;
    const text = match[2]!.trim();
    let anchor = slug(text);
    const n = seen.get(anchor);
    seen.set(anchor, (n ?? -1) + 1);
    if (n !== undefined) anchor += `-${n + 1}`;
    if (match[1]!.length === 2 || match[1]!.length === 3)
      found.push([match[1]!.length, text.replace(/`/g, ""), anchor]);
  }
  return found;
}

export async function generateIndex(directory = join(root, "tracks")) {
  const toc: Record<string, [number, string, string][]> = {};
  for (const path of await documents(directory))
    toc[path] = headings(await Bun.file(join(directory, path)).text());
  return format(
    `// Generado con bun run infografia:indice. No editar a mano.\nconst TOC = ${JSON.stringify(toc)};\n`,
    { parser: "babel" },
  );
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check"))
    throw new Error("Uso: bun scripts/infografia.ts [--check]");
  const generated = await generateIndex();
  if (args.includes("--check")) {
    if ((await Bun.file(indexPath).text()) !== generated)
      throw new Error(
        "Índice de la infografía desactualizado. Ejecuta bun run infografia:indice.",
      );
    console.log("Índice de la infografía al día.");
  } else {
    await Bun.write(indexPath, generated);
    console.log("Índice de la infografía generado.");
  }
}
