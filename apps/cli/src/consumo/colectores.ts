// Adaptados de los normalizadores locales MIT de HackSpain, commit 2865d19.
// Solo extraen contadores, identidad de evento y cwd para filtrar en memoria.
import { z } from "zod";
const token = z.number().int().nonnegative().catch(0).default(0);
export interface Uso {
  id: string;
  herramienta: "claude-code" | "codex" | "pi";
  fecha: number;
  cwd?: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}
const claude = z.object({
  type: z.literal("assistant"),
  sessionId: z.string(),
  timestamp: z.string(),
  cwd: z.string().optional(),
  message: z.object({
    id: z.string(),
    model: z.string(),
    usage: z.object({
      input_tokens: token,
      output_tokens: token,
      cache_creation_input_tokens: token,
      cache_read_input_tokens: token,
    }),
  }),
});
export function normalizarClaude(value: unknown): Uso | null {
  const p = claude.safeParse(value);
  if (!p.success || p.data.message.model === "<synthetic>") return null;
  const v = p.data,
    u = v.message.usage,
    fecha = Date.parse(v.timestamp);
  if (!Number.isFinite(fecha)) return null;
  return {
    id: `claude:${v.sessionId}:${v.message.id}`,
    herramienta: "claude-code",
    fecha,
    cwd: v.cwd,
    input: u.input_tokens,
    output: u.output_tokens,
    cacheRead: u.cache_read_input_tokens,
    cacheWrite: u.cache_creation_input_tokens,
  };
}
const usage = z.object({
  input_tokens: token,
  output_tokens: token,
  cached_input_tokens: token,
  cache_write_input_tokens: token,
});
type Counts = z.infer<typeof usage>;
const codex = z.object({
  timestamp: z.string().optional(),
  type: z.string(),
  payload: z.object({
    id: z.string().optional(),
    session_id: z.string().optional(),
    cwd: z.string().optional(),
    type: z.string().optional(),
    info: z
      .object({
        total_token_usage: usage.optional(),
        last_token_usage: usage.optional(),
      })
      .nullish(),
  }),
});
export interface EstadoCodex {
  session: string;
  cwd?: string;
  total?: Counts;
  linea: number;
}
export function normalizarCodex(value: unknown, s: EstadoCodex): Uso | null {
  s.linea++;
  const p = codex.safeParse(value);
  if (!p.success) return null;
  const v = p.data,
    b = v.payload;
  if (v.type === "session_meta") {
    s.session = b.session_id ?? b.id ?? s.session;
    s.cwd = b.cwd ?? s.cwd;
    return null;
  }
  if (v.type === "turn_context") {
    s.cwd = b.cwd ?? s.cwd;
    return null;
  }
  if (v.type !== "event_msg" || b.type !== "token_count" || !b.info)
    return null;
  const total = b.info.total_token_usage;
  let u = b.info.last_token_usage;
  if (total) {
    if (
      s.total &&
      total.input_tokens >= s.total.input_tokens &&
      total.output_tokens >= s.total.output_tokens
    ) {
      u = {
        input_tokens: Math.max(0, total.input_tokens - s.total.input_tokens),
        output_tokens: Math.max(0, total.output_tokens - s.total.output_tokens),
        cached_input_tokens: Math.max(
          0,
          total.cached_input_tokens - s.total.cached_input_tokens,
        ),
        cache_write_input_tokens: Math.max(
          0,
          total.cache_write_input_tokens - s.total.cache_write_input_tokens,
        ),
      };
    } else u ??= total;
    s.total = total;
  }
  const fecha = Date.parse(v.timestamp ?? "");
  if (!u || !Number.isFinite(fecha)) return null;
  // Codex incluye cacheRead dentro de input; reasoning ya está dentro de output.
  const input = Math.max(0, u.input_tokens - u.cached_input_tokens);
  if (
    input +
      u.output_tokens +
      u.cached_input_tokens +
      u.cache_write_input_tokens ===
    0
  )
    return null;
  return {
    id: `codex:${s.session}:${total ? JSON.stringify(total) : s.linea}`,
    herramienta: "codex",
    fecha,
    cwd: s.cwd,
    input,
    output: u.output_tokens,
    cacheRead: u.cached_input_tokens,
    cacheWrite: u.cache_write_input_tokens,
  };
}

// Pi (pi.dev) writes one JSONL per session: a header with the cwd, then
// entries whose assistant messages carry usage with cache already split out.
const piUsage = z.object({
  input: token,
  output: token,
  cacheRead: token,
  cacheWrite: token,
});
const piEntrada = z.union([
  z.object({ type: z.literal("session"), id: z.string(), cwd: z.string() }),
  z.object({
    type: z.literal("message"),
    timestamp: z.string(),
    message: z.object({
      role: z.literal("assistant"),
      model: z.string(),
      responseId: z.string().optional(),
      timestamp: z.number().optional(),
      usage: piUsage,
    }),
  }),
]);
export function normalizarPi(value: unknown, s: { cwd?: string }): Uso | null {
  const p = piEntrada.safeParse(value);
  if (!p.success) return null;
  if (p.data.type === "session") {
    s.cwd = p.data.cwd;
    return null;
  }
  const m = p.data.message,
    u = m.usage,
    fecha = m.timestamp ?? Date.parse(p.data.timestamp);
  if (
    !Number.isFinite(fecha) ||
    u.input + u.output + u.cacheRead + u.cacheWrite === 0
  )
    return null;
  // A forked session copies its messages into a new file; keying on the
  // response, not the file, counts each request once.
  return {
    id: `pi:${m.responseId ?? `${m.model}:${fecha}`}`,
    herramienta: "pi",
    fecha,
    cwd: s.cwd,
    ...u,
  };
}
