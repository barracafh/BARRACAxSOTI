import { logoPng } from "../assets/logo";
import {
  detectImageProtocol,
  renderImage,
  type ImageProtocol,
} from "./term-images";
import { paint, wrap, terminalText, width, fit } from "./estilo";
import { eventoBase } from "@hacknight/shared/evento";
import type { Evento } from "@hacknight/shared/modelo";
// Mecánica de glifos del banner MIT, con las letras de la marca del evento.
const glyphs: Record<string, string[]> = {
  B: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
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
  protocol: ImageProtocol | null = detectImageProtocol(
    process.env,
    Boolean(process.stdout.isTTY),
  ),
  evento: Evento = eventoBase,
) {
  const png = logoPng();
  const mark =
    png && protocol && process.env.NO_COLOR === undefined
      ? renderImage(protocol, png, {
          maxColumns: Math.max(1, columns - 2),
          maxRows: 6,
        })
      : null;
  const rows = wordmarkRows(evento.nombre_corto);
  return (
    (mark ??
      (columns >= Math.max(...rows.map((row) => width(row)))
        ? rows.map((s) => paint("roig", s)).join("\n")
        : paint(
            "roig",
            fit(
              `☾ ${terminalText(evento.nombre_corto).toLowerCase()}`,
              columns,
            ),
          ))) +
    "\n" +
    wrap(
      `${terminalText(evento.organizan)} · ${new Date(evento.inicio).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })} · MAISA`,
      Math.max(10, columns),
    ).join("\n")
  );
}
