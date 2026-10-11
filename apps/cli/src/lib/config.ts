import { join } from "node:path";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { esAusente } from "@hacknight/shared/io";
import { CliError } from "@hacknight/shared/errors";
const schema = z.object({
  registro: z.string().optional(),
  plantilla: z.string().optional(),
  releases: z.string().optional(),
});
export type Options = {
  json?: boolean;
  registro?: string;
  plantilla?: string;
  releases?: string;
  cwd?: string;
  usuario?: string;
  confirmar?: boolean;
  plain?: boolean;
};
export async function config(opts: Options) {
  let file: z.infer<typeof schema> = {};
  const path =
    process.env.HACKNIGHT_CONFIG ??
    join(
      process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"),
      "hacknight",
      "config.json",
    );
  try {
    file = schema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (e) {
    if (!esAusente(e))
      throw new CliError(
        "CONFIG",
        `Configuración inválida: ${path}`,
        "Revisa el JSON.",
        2,
      );
  }
  return {
    registro:
      opts.registro ??
      process.env.HACKNIGHT_REGISTRO ??
      file.registro ??
      "hacknight/registro",
    plantilla:
      opts.plantilla ?? process.env.HACKNIGHT_PLANTILLA ?? file.plantilla,
    releases: opts.releases ?? process.env.HACKNIGHT_RELEASES ?? file.releases,
  };
}
