import type { Contexto } from "../lib/contexto";
import { identidad } from "../lib/contexto";
import { CliError } from "@hacknight/shared/errors";
import { salida, tramitando } from "../lib/output";
import { panel, trackLabel, terminalText } from "../lib/estilo";
import { banner } from "../lib/banner";
import { cuentaAtras } from "../lib/tiempo";
import { revisar } from "../lib/revision";
export async function tracks(ctx: Contexto, slug?: string) {
  const ts = await tramitando("Consultando el registro…", ctx.opts.json, () =>
    ctx.registro.tracks(),
  );
  const chosen = slug
    ? ts.filter((t) => t.slug === slug)
    : ts.filter((t) => t.estado !== "fuera");
  if (!chosen.length)
    throw new CliError(
      "NOT_FOUND",
      "No existe ese negociado.",
      "Usa hacknight tracks para ver la lista.",
      4,
    );
  const teams = await ctx.registro.equipos();
  const data = chosen.map((t) => ({
    ...t,
    squads: teams.filter((s) => s.herramienta === t.slug),
  }));
  const text = data
    .map(
      (t) =>
        trackLabel(t) +
        "\n" +
        panel(`track ${t.slug} · ${t.estado}`, [
          t.frase,
          ...(slug
            ? [
                t.ciudadano,
                `Dificultad: ${t.dificultad}`,
                ...t.piezas.map((p) => `Pieza: ${p}`),
                ...t.fuentes.map((f) => `Fuente: ${f.nombre} · ${f.url}`),
                ...t.guias,
                ...t.squads.map((s) => `Squad: ${s.nombre} · Mesa ${s.mesa}`),
              ]
            : []),
          ...(t.cupo
            ? [`Cupo: ${t.cupo} · por orden de llegada; lo asigna el comité`]
            : []),
          ...(t.motivo ? [`Motivo: ${t.motivo}`] : []),
        ]),
    )
    .join("\n\n");
  salida(data, text, ctx.opts.json);
}
export async function expediente(ctx: Contexto) {
  const [{ usuario, equipo }, evento, tracks] = await Promise.all([
    identidad(ctx),
    ctx.registro.evento(),
    ctx.registro.tracks(),
  ]);
  const track = tracks.find((t) => t.slug === equipo?.herramienta);
  const reloj = cuentaAtras(evento.fin);
  const revision = await revisar(ctx);
  const reglas = revision.reglas;
  const data = {
    usuario,
    equipo: equipo ?? null,
    track: track ?? null,
    cuentaAtras: reloj,
    reglas,
  };
  salida(
    data,
    banner(undefined, evento) +
      "\n" +
      (track ? trackLabel(track) + "\n" : "") +
      panel("Su expediente", [
        `Bona vesprada, @${terminalText(usuario)}`,
        equipo
          ? `Squad: ${equipo.nombre} · Mesa ${equipo.mesa}`
          : "Squad: pendiente de asignación",
        `Track: ${track?.nombre ?? "pendiente"}`,
        `Fin del build: ${evento.fin} · Quedan ${reloj.texto}`,
        ...reglas.map(
          (r, i) => `${i + 1}. [${r.ok ? "OK" : "FALTA"}] ${r.nombre}`,
        ),
        `Siguiente trámite: hacknight revisar`,
      ]),
    ctx.opts.json,
  );
}
