import { logoPng } from "../assets/logo";
import {
  detectImageProtocol,
  renderImage,
  type ImageProtocol,
} from "./term-images";
import { paint, wrap } from "./estilo";
// Mecánica de glifos del banner MIT; letras nuevas B, R y T.
const glyphs: Record<string, string[]> = {
  B: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  R: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"],
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
export const wordmarkRows = () =>
  Array.from({ length: 6 }, (_, i) =>
    [..."BARBARITAT"].map((c) => glyphs[c]![i]).join(""),
  );
export function banner(
  columns = process.stdout.columns ?? 80,
  protocol: ImageProtocol | null = detectImageProtocol(
    process.env,
    Boolean(process.stdout.isTTY),
  ),
) {
  const png = logoPng();
  const mark =
    png && protocol && process.env.NO_COLOR === undefined
      ? renderImage(protocol, png, {
          maxColumns: Math.max(1, columns - 2),
          maxRows: 6,
        })
      : null;
  return (
    (mark ??
      (columns >= 79
        ? wordmarkRows()
            .map((s) => paint("roig", s))
            .join("\n")
        : paint("roig", "BARBARITAT"))) +
    "\n" +
    wrap(
      "VALENCIANA · BARRACA × SOTI · 22/10/2026",
      Math.max(10, columns),
    ).join("\n")
  );
}
