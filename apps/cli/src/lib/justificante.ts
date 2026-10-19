import type { Evento, RegistroFicha, Track } from "@buildnight/shared/modelo";
import { eventoBase } from "@buildnight/shared/evento";
import { fechaMadrid } from "./tiempo";
import { paint, trackLabel, panel, terminalText, width, wrap } from "./estilo";
export const numeroRegistro = (n: number) =>
  `RE-2026-22O-${String(n).padStart(4, "0")}`;
export function justificante(
  registro: RegistroFicha,
  track: Track,
  fueraDePlazo: boolean,
  tasaTokens?: number,
) {
  const numero = numeroRegistro(registro.numero);
  const csv = new Bun.CryptoHasher("sha256")
    .update(
      JSON.stringify({ numero, fecha: registro.fecha, ficha: registro.ficha }),
    )
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return {
    numero,
    fecha: registro.fecha,
    csv,
    negociado: track.nombre,
    ventanilla: track.ventanilla,
    herramienta: track.slug,
    fueraDePlazo,
    url: registro.url,
    estado: registro.estado,
    tasaTokens,
  };
}
export function sello(
  evento: Evento = eventoBase,
  columns = process.stdout.columns ?? 80,
) {
  const inner = Math.min(34, Math.max(5, columns - 7));
  const fecha = new Date(evento.inicio)
    .toLocaleDateString("es-ES", {
      timeZone: "Europe/Madrid",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replaceAll(".", "")
    .toUpperCase();
  const rows = [
    "REGISTRO DE ENTRADA",
    terminalText(evento.nombre_corto).toUpperCase(),
    fecha,
  ].flatMap((line) => wrap(line, inner));
  return paint(
    "magenta",
    [
      `   ╔${"═".repeat(inner + 2)}╗`,
      ...rows.map((line) => `   ║ ${line}${" ".repeat(inner - width(line))} ║`),
      `   ╚${"═".repeat(inner + 2)}╝`,
    ].join("\n"),
  );
}
export function justificanteTexto(
  j: ReturnType<typeof justificante>,
  track: Track,
  evento: Evento = eventoBase,
) {
  return (
    panel("Justificante de registro", [
      j.numero,
      fechaMadrid(j.fecha) + " · Europe/Madrid",
      `Código seguro de verificación: ${j.csv}`,
      `${j.fueraDePlazo ? "Presentado fuera de plazo" : "Presentado dentro de plazo"} · ${j.estado}`,
      j.url,
      ...(j.tasaTokens
        ? [`Tasa abonada: ${j.tasaTokens} tokens (contribución local)`]
        : []),
    ]) +
    "\n" +
    trackLabel(track) +
    "\n" +
    sello(evento)
  );
}
