import type { Contexto } from "../lib/contexto";
import { miEquipo } from "../lib/contexto";
import { consumoLocal } from "../consumo/local";
import { salida } from "../lib/output";
import { panel, trackLabel } from "../lib/estilo";
export async function consumo(ctx: Contexto) {
  const { equipo, track } = await miEquipo(ctx);
  const evento = await ctx.registro.evento();
  const data = await consumoLocal(ctx.cwd, evento.inicio, evento.fin);
  salida(
    { ...data, equipo: equipo.id, herramienta: track.slug },
    trackLabel(track) +
      "\n" +
      panel("Tasa de esfuerzo · solo local", [
        `Squad: ${equipo.nombre}`,
        `${data.total.toLocaleString("es-ES")} tokens · ${data.peticiones} peticiones`,
        data.alcance,
        `Desde ${data.desde} hasta ${data.hasta}`,
        ...Object.entries(data.porHerramienta).map(
          ([k, v]) => `${k}: ${v} tokens`,
        ),
        ...data.avisos,
        ...(data.total
          ? []
          : ["Sin consumo local atribuible al proyecto durante el build."]),
        "Cursor: no se instala ningún hook; no se recoge su consumo.",
      ]),
    ctx.opts.json,
  );
}
