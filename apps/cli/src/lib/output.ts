import { spinner } from "@clack/prompts";
import { CliError } from "@buildnight/shared/errors";
import { paint, terminalText, wrap } from "./estilo";
export function salida(data: unknown, texto: string, json = false) {
  console.log(json ? JSON.stringify({ ok: true, data }) : texto);
}
export function fallo(e: unknown, json = false) {
  const err =
    e instanceof CliError
      ? e
      : new CliError(
          "ERROR",
          "No se pudo completar el trámite.",
          "Revisa los archivos y vuelve a intentarlo.",
        );
  if (json)
    console.log(
      JSON.stringify({
        ok: false,
        code: err.code,
        message: err.message,
        hint: err.hint,
        exitCode: err.exitCode,
        ...(err.data === undefined ? {} : { data: err.data }),
      }),
    );
  else
    console.error(
      wrap(
        `${paint("magenta", "Resolución desestimatoria")}\n${terminalText(err.message)}\nCómo subsanarlo: ${terminalText(err.hint)}`,
        Math.max(20, Math.min(80, process.stdout.columns ?? 80)),
      ).join("\n"),
    );
  process.exitCode = err.exitCode;
}
export async function tramitando<T>(
  label: string,
  json: boolean | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (json || !process.stdout.isTTY || !process.stdin.isTTY) return fn();
  const s = spinner();
  s.start(label);
  try {
    const r = await fn();
    s.stop("Trámite consultado.");
    return r;
  } catch (e) {
    s.stop("Trámite interrumpido.");
    throw e;
  }
}
