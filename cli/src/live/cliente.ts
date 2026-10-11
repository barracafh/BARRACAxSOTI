import { hostname } from "node:os";
import { resolve } from "node:path";
import {
  hash,
  publicarUso,
  servidorLocal,
  ventanaId,
  type Lote,
} from "./contrato";
import { leerConsumo } from "../consumo/local";
import type { Evento } from "../lib/modelo";

export async function escanear(options: {
  cwd: string;
  usuario: string;
  evento: Evento;
  servidor?: string;
}) {
  const { resumen, usos } = await leerConsumo(
    options.cwd,
    options.evento.inicio,
    options.evento.fin,
  );
  const eventos = usos.map(publicarUso);
  let cambios = 0;
  if (options.servidor) {
    const base = servidorLocal(options.servidor);
    // Reenviar es seguro: el backend deduplica por ventana, persona e ID.
    // Recupera el historial retenido también tras una caída o reinicio del watcher.
    for (let i = 0; i < Math.max(1, eventos.length); i += 200) {
      const lote: Lote = {
        version: 1,
        ventana: ventanaId(options.evento),
        usuario: options.usuario,
        cliente: hash(`${hostname()}|${resolve(options.cwd)}`),
        eventos: eventos.slice(i, i + 200),
      };
      const res = await fetch(new URL("/api/uso", base), {
        method: "POST",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lote),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok)
        throw new Error(
          `El servidor rechazó el lote (HTTP ${res.status}). Revisa usuario, registro y ventana del build.`,
        );
      const receipt = (await res.json()) as {
        ok?: boolean;
        recibidos?: number;
        cambios?: number;
      };
      if (
        !receipt.ok ||
        receipt.recibidos !== lote.eventos.length ||
        !Number.isSafeInteger(receipt.cambios)
      )
        throw new Error(
          "El servidor no confirmó los contadores. Se reintentará sin duplicarlos.",
        );
      cambios += receipt.cambios!;
    }
  }
  return { ...resumen, sincronizado: Boolean(options.servidor), cambios };
}
