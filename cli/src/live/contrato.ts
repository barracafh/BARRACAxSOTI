import { createHash } from "node:crypto";
import { z } from "zod";
import type { Uso } from "../consumo/colectores";
import type { Evento } from "../lib/modelo";

// Contrato propio; toma del watcher MIT la normalización y la deduplicación.
// Nunca se serializan logs, rutas, prompts, respuestas ni IDs de sesión originales.
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const ventanaId = (evento: Evento) =>
  hash(`${evento.inicio}|${evento.fin}`);
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
