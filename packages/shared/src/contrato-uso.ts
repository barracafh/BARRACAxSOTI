import { createHash } from "node:crypto";
import { z } from "zod";
import type { Equipo, Evento } from "./modelo";

// Contrato propio; toma del watcher MIT la normalización y la deduplicación.
// Nunca se serializan logs, rutas, prompts, respuestas ni IDs de sesión originales.
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const ventanaId = (evento: Evento) =>
  hash(
    `${new Date(evento.inicio).toISOString()}|${new Date(evento.fin).toISOString()}`,
  );
const contador = z.number().int().min(0).max(1_000_000_000);
export const usoSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{64}$/),
  herramienta: z.enum(["claude-code", "codex"]),
  fecha: z.iso.datetime({ offset: true }),
  input: contador,
  output: contador,
  cacheRead: contador,
  cacheWrite: contador,
});
export const loteSchema = z.strictObject({
  version: z.literal(1),
  ventana: z.string().regex(/^[a-f0-9]{64}$/),
  usuario: z.string().regex(/^[A-Za-z0-9-]{1,39}$/),
  cliente: z.string().regex(/^[a-f0-9]{64}$/),
  eventos: z.array(usoSchema).max(200),
});
export type EventoUso = z.infer<typeof usoSchema>;
export type Lote = z.infer<typeof loteSchema>;
export const totalUso = (
  e: Pick<EventoUso, "input" | "output" | "cacheRead" | "cacheWrite">,
) => e.input + e.output + e.cacheRead + e.cacheWrite;

// What every store checks before counting a batch. Returns the handle, lowercased.
export function validarLote(
  lote: Lote,
  evento: Evento,
  equipos: Equipo[],
  now = Date.now(),
) {
  if (lote.ventana !== ventanaId(evento))
    throw new Error(
      "La ventana del watcher no coincide con el evento del servidor.",
    );
  const usuario = lote.usuario.toLowerCase();
  if (!equipos.some((e) => e.miembros.some((m) => m.toLowerCase() === usuario)))
    throw new Error("El usuario no está asignado a un squad del registro.");
  const inicio = Date.parse(evento.inicio),
    fin = Date.parse(evento.fin);
  if (
    lote.eventos.some(
      (e) =>
        Date.parse(e.fecha) < inicio ||
        Date.parse(e.fecha) >= fin ||
        Date.parse(e.fecha) > now + 5000,
    )
  )
    throw new Error("Hay contadores fuera de la ventana del build.");
  return usuario;
}
