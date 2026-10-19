import type { Uso } from "../consumo/colectores";
import {
  usoSchema,
  hash,
  totalUso,
  ventanaId,
  type EventoUso,
  type Lote,
} from "@hacknight/shared/contrato-uso";
import { hostname } from "node:os";
import { resolve } from "node:path";
import { leerConsumo } from "../consumo/local";
import type { Evento } from "@hacknight/shared/modelo";

// The room's server answered 401: the GitHub session is gone or revoked.
export class SesionCaducada extends Error {}

export async function escanear(options: {
  cwd: string;
  usuario: string;
  evento: Evento;
  servidor?: string;
  token?: string;
  // Confirmed totals by window and event: changing the schedule replays history.
  enviados?: Map<string, number>;
}) {
  const { resumen, usos } = await leerConsumo(
    options.cwd,
    options.evento.inicio,
    options.evento.fin,
  );
  let cambios = 0;
  if (options.servidor) {
    const base = servidorDestino(options.servidor);
    const ventana = ventanaId(options.evento);
    const eventos = usos
      .map(publicarUso)
      .filter(
        (e) =>
          totalUso(e) > (options.enviados?.get(`${ventana}:${e.id}`) ?? -1),
      );
    const cliente = hash(`${hostname()}|${resolve(options.cwd)}`);
    // Reenviar es seguro: el backend deduplica por ventana, persona e ID.
    // Recupera el historial retenido también tras una caída o reinicio del watcher.
    for (let i = 0; i < Math.max(1, eventos.length); i += 200) {
      const lote: Lote = {
        version: 1,
        ventana,
        usuario: options.usuario,
        cliente,
        eventos: eventos.slice(i, i + 200),
      };
      const res = await fetch(new URL("/api/uso", base), {
        method: "POST",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
          ...(options.token
            ? { Authorization: `Bearer ${options.token}` }
            : {}),
        },
        body: JSON.stringify(lote),
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 401)
        throw new SesionCaducada(
          "La sala no reconoce tu sesión de GitHub. Vuelve a lanzar observar para confirmarla.",
        );
      if (!res.ok)
        throw new Error(
          res.status === 429 || res.status >= 500
            ? `La sala no está disponible (HTTP ${res.status}). Se reintentará sin cerrar tu sesión.`
            : `El servidor rechazó el lote (HTTP ${res.status}). Revisa usuario, registro y ventana del build.`,
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
      for (const e of lote.eventos)
        options.enviados?.set(`${ventana}:${e.id}`, totalUso(e));
    }
  }
  return { ...resumen, sincronizado: Boolean(options.servidor), cambios };
}

export function publicarUso(e: Uso): EventoUso {
  return usoSchema.parse({
    id: hash(e.id),
    herramienta: e.herramienta,
    fecha: new Date(e.fecha).toISOString(),
    input: e.input,
    output: e.output,
    cacheRead: e.cacheRead,
    cacheWrite: e.cacheWrite,
  });
}
// The room's HTTPS server, or a local one for development.
export function servidorDestino(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:") return servidorLocal(value);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "El servidor debe ser una URL HTTPS sin ruta ni credenciales.",
    );
  return url;
}
export function servidorLocal(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Esta versión conecta solo con un servidor HTTP local, sin ruta ni credenciales.",
    );
  return url;
}
