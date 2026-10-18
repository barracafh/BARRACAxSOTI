import { entradas as leerEntradas } from "@hacknight/shared/actividad";
import type { Contexto } from "../lib/contexto";
import { usage } from "@hacknight/shared/errors";
import { salida } from "../lib/output";
import { terminalText, wrap } from "../lib/estilo";
export const entradas = (ctx: Contexto) => leerEntradas(ctx.registro);
export async function tablon(ctx: Contexto, n = 20) {
  if (!Number.isInteger(n) || n < 1 || n > 100)
    throw usage("-n debe ser un entero entre 1 y 100.");
  const items = (await entradas(ctx)).slice(0, n);
  salida(
    items,
    items.length
      ? items
          .map((e) =>
            wrap(
              `${e.glifo} [${e.tipo}] ${e.herramienta ?? "comité"} · ${terminalText(e.texto)}\n  ${terminalText(e.url)}`,
              Math.max(20, Math.min(80, process.stdout.columns ?? 80)),
            ).join("\n"),
          )
          .join("\n\n")
      : "El tablón está vacío.",
    ctx.opts.json,
  );
}
