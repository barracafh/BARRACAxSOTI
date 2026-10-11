import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config, type Options } from "./config";
import { RegistroLocal } from "@barbaritat/shared/registro/local";
import { RegistroGitHub } from "../registro/github";
import { CliError } from "@barbaritat/shared/errors";
import type { Registro } from "@barbaritat/shared/modelo";
export interface Contexto {
  opts: Options;
  registro: Registro;
  cwd: string;
  config: Awaited<ReturnType<typeof config>>;
}
export async function contexto(opts: Options): Promise<Contexto> {
  const cfg = await config(opts);
  const local = cfg.registro.startsWith("file:");
  if (!local && opts.usuario)
    throw new CliError(
      "USAGE",
      "--usuario solo está disponible en el registro local.",
      "GitHub usa la sesión de gh.",
      2,
    );
  return {
    opts,
    config: cfg,
    cwd: resolve(opts.cwd ?? process.cwd()),
    registro: local
      ? new RegistroLocal(fileURLToPath(cfg.registro), opts.usuario)
      : new RegistroGitHub(cfg.registro),
  };
}
export async function identidad(ctx: Contexto) {
  const usuario = await ctx.registro.usuario();
  const equipo = (await ctx.registro.equipos()).find((t) =>
    t.miembros.some((m) => m.toLowerCase() === usuario.toLowerCase()),
  );
  return { usuario, equipo };
}
export async function miEquipo(ctx: Contexto) {
  const { usuario, equipo } = await identidad(ctx);
  if (!equipo)
    throw new CliError(
      "NO_TEAM",
      "No tienes squad asignado.",
      "Pide al comité que te incluya en equipos.json.",
      4,
    );
  const track = (await ctx.registro.tracks()).find(
    (t) => t.slug === equipo.herramienta && t.estado !== "fuera",
  );
  if (!track)
    throw new CliError(
      "CONFIG",
      "El track del squad no está disponible.",
      "El comité debe revisar equipos.json.",
      2,
    );
  return { usuario, equipo, track };
}
