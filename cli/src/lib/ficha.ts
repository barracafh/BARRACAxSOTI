import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fichaSchema, type Ficha, type Track } from "@barbaritat/shared/modelo";
import { CliError } from "@barbaritat/shared/errors";
export function validarFicha(value: unknown, tracks: Track[]): Ficha {
  const parsed = fichaSchema.safeParse(value);
  if (!parsed.success)
    throw new CliError(
      "VALIDATION",
      "La ficha no cumple el esquema.",
      "Completa los campos con barbaritat ficha.",
      2,
      parsed.error.issues.map((i) => ({
        campo: i.path.join("."),
        motivo: i.message,
      })),
    );
  if (
    !tracks.some(
      (t) => t.slug === parsed.data.herramienta && t.estado !== "fuera",
    )
  )
    throw new CliError(
      "VALIDATION",
      "Herramienta no válida o fuera del hack.",
      "Consulta barbaritat tracks.",
      2,
    );
  return parsed.data;
}
export async function leerFicha(cwd: string, tracks: Track[]) {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(join(cwd, "ficha.json"), "utf8"));
  } catch {
    throw new CliError(
      "VALIDATION",
      "Falta ficha.json o no es JSON válido.",
      "Ejecuta barbaritat ficha o tramitar.",
      2,
    );
  }
  return validarFicha(raw, tracks);
}
