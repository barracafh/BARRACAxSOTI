import { paint, wrap, terminalText, width, fit } from "./estilo";
import { eventoBase } from "@buildnight/shared/evento";
import type { Evento } from "@buildnight/shared/modelo";
// Mecánica de glifos del banner MIT, con las letras de la marca del evento.
const glyphs: Record<string, string[]> = {
  B: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
  U: [
    "██╗   ██╗",
    "██║   ██║",
    "██║   ██║",
    "██║   ██║",
    "╚██████╔╝",
    " ╚═════╝ ",
  ],
  L: ["██╗     ", "██║     ", "██║     ", "██║     ", "███████╗", "╚══════╝"],
  D: ["██████╗ ", "██╔══██╗", "██║  ██║", "██║  ██║", "██████╔╝", "╚═════╝ "],
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  R: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"],
  H: ["██╗  ██╗", "██║  ██║", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  C: [" ██████╗", "██╔════╝", "██║     ", "██║     ", "╚██████╗", " ╚═════╝"],
  K: ["██╗  ██╗", "██║ ██╔╝", "█████╔╝ ", "██╔═██╗ ", "██║  ██╗", "╚═╝  ╚═╝"],
  N: [
    "███╗  ██╗",
    "████╗ ██║",
    "██╔██╗██║",
    "██║╚████║",
    "██║ ╚███║",
    "╚═╝  ╚══╝",
  ],
  G: [
    " ██████╗ ",
    "██╔════╝ ",
    "██║  ███╗",
    "██║   ██║",
    "╚██████╔╝",
    " ╚═════╝ ",
  ],
  " ": ["   ", "   ", "   ", "   ", "   ", "   "],
  I: ["██╗", "██║", "██║", "██║", "██║", "╚═╝"],
  T: [
    "████████╗",
    "╚══██╔══╝",
    "   ██║   ",
    "   ██║   ",
    "   ██║   ",
    "   ╚═╝   ",
  ],
};
export function wordmarkRows(nombre = eventoBase.nombre_corto) {
  const chars = [...terminalText(nombre).toUpperCase()];
  // Un nombre nuevo sin glifos propios sigue siendo legible.
  if (chars.some((c) => !glyphs[c])) return [chars.join("")];
  return Array.from({ length: 6 }, (_, i) =>
    chars.map((c) => glyphs[c]![i]).join(""),
  );
}
export function banner(
  columns = process.stdout.columns ?? 80,
  evento: Evento = eventoBase,
) {
  const rows = wordmarkRows(evento.nombre_corto);
  return (
    (columns >= Math.max(...rows.map((row) => width(row)))
      ? rows.map((s) => paint("magenta", s)).join("\n")
      : paint(
          "magenta",
          fit(`☾ ${terminalText(evento.nombre_corto).toLowerCase()}`, columns),
        )) +
    "\n" +
    wrap(
      `${terminalText(evento.organizan)} · ${new Date(evento.inicio).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })} · Flywire`,
      Math.max(10, columns),
    ).join("\n")
  );
}
