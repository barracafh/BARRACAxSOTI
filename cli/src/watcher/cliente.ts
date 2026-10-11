import type { Uso } from "../consumo/colectores";
import { usoSchema, type EventoUso } from "@barbaritat/shared/contrato-uso";
import { hostname } from "node:os";
import { resolve } from "node:path";
import { hash, ventanaId, type Lote } from "@barbaritat/shared/contrato-uso";
import { leerConsumo } from "../consumo/local";
import type { Evento } from "@barbaritat/shared/modelo";

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
