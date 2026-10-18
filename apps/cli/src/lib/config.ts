import { join } from "node:path";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { esAusente } from "@hacknight/shared/io";
import { CliError } from "@hacknight/shared/errors";
const schema = z.object({
  registro: z.string().optional(),
  avisos: z.string().optional(),
  releases: z.string().optional(),
});
export type Options = {
  json?: boolean;
  registro?: string;
  releases?: string;
  cwd?: string;
  usuario?: string;
  plain?: boolean;
};
export const rutaConfig = () =>
  process.env.HACKNIGHT_CONFIG ??
  join(
    process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"),
    "hacknight",
    "config.json",
  );
// releases stays optional in the type: without it, actualizar is disabled.
export async function config(opts: Options): Promise<{
  registro: string;
  avisos: string;
  releases?: string;
}> {
  let file: z.infer<typeof schema> = {};
  const path = rutaConfig();
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
      "barracafh/build-registro",
    avisos:
      process.env.HACKNIGHT_AVISOS ?? file.avisos ?? "barracafh/build-comite",
    releases:
      opts.releases ??
      process.env.HACKNIGHT_RELEASES ??
      file.releases ??
      "barracafh/build-registro",
  };
}
