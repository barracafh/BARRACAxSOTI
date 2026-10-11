import { lstat, mkdir, cp, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Contexto } from "../lib/contexto";
import { miEquipo } from "../lib/contexto";
import { repo } from "@barbaritat/shared/modelo";
import { esAusente, guardar } from "@barbaritat/shared/io";
import { ejecutar } from "../lib/proceso";
import { confirmar } from "../lib/confirmacion";
import { CliError, usage } from "@barbaritat/shared/errors";
import { salida, tramitando } from "../lib/output";
import { panel, trackLabel } from "../lib/estilo";
import { descargar } from "../lib/datos";
import { plantilla } from "../assets/plantilla";
export async function datos(ctx: Contexto, paquete?: string, track?: string) {
  const tracks = await ctx.registro.tracks();
  if (track && !tracks.some((t) => t.slug === track))
    throw usage("Track desconocido.", "Consulta tracks.");
  const packs = tracks
    .filter((t) => !track || t.slug === track)
    .flatMap((t) =>
      t.paquetes.map((p) => ({ ...p, herramienta: t.slug, glifo: t.glifo })),
    );
  if (!paquete) {
    salida(
      packs,
      panel(
        "Paquetes de datos",
        packs.map(
          (p) =>
            `${p.glifo} track ${p.herramienta} · ${p.id} · ${p.pendiente ? "PENDIENTE" : p.sha256}`,
        ),
      ),
      ctx.opts.json,
    );
    return;
  }
  const pack = packs.find((p) => p.id === paquete);
  if (!pack)
    throw new CliError(
      "NOT_FOUND",
      "No existe ese paquete.",
      "Usa barbaritat datos.",
      4,
    );
  const result = await tramitando("Compulsando…", ctx.opts.json, () =>
    descargar(ctx, pack),
  );
  salida(
    result,
    `Paquete descargado y verificado: ${result.archivo}`,
    ctx.opts.json,
  );
}
export async function tramitar(
  ctx: Contexto,
  opts: { destino?: string; dryRun?: boolean },
) {
  const { equipo, track } = await miEquipo(ctx);
  const target = resolve(ctx.cwd, opts.destino ?? equipo.id);
  let exists = false;
  try {
    await lstat(target);
    exists = true;
  } catch (e) {
    if (!esAusente(e)) throw e;
  }
  if (exists)
    throw usage(
      `El destino ya existe: ${target}`,
      "Elige --destino con un directorio nuevo; no se sobrescriben proyectos.",
    );
  if (
    ctx.registro.tipo === "github" &&
    (!ctx.config.plantilla ||
      !repo.safeParse(ctx.config.plantilla).success ||
      !repo.safeParse(equipo.repo).success)
  )
    throw new CliError(
      "NOT_CONFIGURED",
      "Faltan plantilla o repo del squad.",
      "Configura plantilla=propietario/repo y el repo en equipos.json.",
      4,
    );
  const plan = {
    equipo: equipo.id,
    herramienta: track.slug,
    negociado: track.nombre,
    ventanilla: track.ventanilla,
    destino: target,
    plantilla: ctx.config.plantilla ?? "demo/plantilla-stub",
    repo: equipo.repo,
    publico: ctx.registro.tipo === "github",
    paquetes: track.paquetes.map((p) => ({ id: p.id, pendiente: p.pendiente })),
    dryRun: Boolean(opts.dryRun),
  };
  if (opts.dryRun) {
    salida(
      plan,
      trackLabel(track) +
        "\n" +
        panel("Simulación de trámite", [
          `Crear ${target}`,
          `Plantilla: ${plan.plantilla}`,
          `Repositorio: ${equipo.repo || "local"}`,
          `Ficha: ${equipo.id} · track ${track.slug}`,
          ...track.paquetes.map(
            (p) =>
              `Datos: ${p.id} · ${p.pendiente ? "pendiente; no se descarga" : "descargar y verificar SHA256"}`,
          ),
        ]),
      ctx.opts.json,
    );
    return;
  }
  if (ctx.registro.tipo === "github") {
    await confirmar(
      ctx,
      `Crear el repositorio PÚBLICO ${equipo.repo} desde ${ctx.config.plantilla} y clonarlo en ${target}.`,
    );
    await ejecutar([
      "gh",
      "repo",
      "create",
      equipo.repo,
      "--template",
      ctx.config.plantilla!,
      "--public",
    ]);
    await ejecutar(["gh", "repo", "clone", equipo.repo, target]);
  } else {
    if (ctx.config.plantilla) {
      const source = ctx.config.plantilla.startsWith("file:")
        ? fileURLToPath(ctx.config.plantilla)
        : resolve(ctx.cwd, ctx.config.plantilla);
      await cp(source, target, {
        recursive: true,
        errorOnExist: true,
        force: false,
        filter: (p) => !p.split(/[\\/]/).includes(".git"),
      });
    } else {
      await mkdir(join(target, ".barbaritat"), { recursive: true });
      for (const [path, texto] of Object.entries(plantilla))
        await writeFile(join(target, path), texto);
    }
    await ejecutar(["git", "init"], undefined, target);
  }
  const ficha = {
    nombre: equipo.pieza,
    frase: track.frase,
    icono: track.glifo,
    herramienta: track.slug,
    equipo: equipo.id,
    url: "https://example.invalid/pendiente",
    fuentes: track.fuentes,
    datos: "simulados",
  };
  // Una plantilla real no debe incluir ficha: no se pisan metadatos de equipo.
  try {
    await lstat(join(target, "ficha.json"));
    throw usage(
      "La plantilla ya contiene ficha.json.",
      "Revisa el archivo existente y adapta el equipo manualmente.",
    );
  } catch (e) {
    if (!esAusente(e)) throw e;
  }
  await guardar(join(target, "ficha.json"), ficha);
  const descargados = [];
  for (const p of track.paquetes.filter((p) => !p.pendiente))
    descargados.push(await descargar(ctx, p, join(target, "datos")));
  if (ctx.registro.tipo === "local")
    await ejecutar(["git", "add", "."], undefined, target);
  salida(
    { ...plan, descargados },
    trackLabel(track) +
      "\n" +
      panel("Expediente abierto", [
        `Proyecto: ${target}`,
        `Squad: ${equipo.nombre} · Pieza: ${equipo.pieza}`,
        "Ficha pre-rellenada. Completa su URL con barbaritat ficha.",
        ...track.paquetes
          .filter((p) => p.pendiente)
          .map((p) => `Pendiente del track lead: ${p.id}`),
        "Siguiente: barbaritat revisar",
      ]),
    ctx.opts.json,
  );
}
