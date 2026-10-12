import { paleta, type Color } from "@hacknight/shared/paleta";
export { paleta, roles, type Color } from "@hacknight/shared/paleta";
let enabled =
  Boolean(process.stdout.isTTY) &&
  process.env.NO_COLOR === undefined &&
  process.env.TERM !== "dumb";
export function setPlain(plain: boolean) {
  enabled =
    !plain &&
    Boolean(process.stdout.isTTY) &&
    process.env.NO_COLOR === undefined &&
    process.env.TERM !== "dumb";
}
export function paint(color: Color, text: string) {
  if (!enabled) return text;
  const hex = paleta[color];
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `\x1b[38;2;${rgb.join(";")}m${text}\x1b[39m`;
}
// Fondo del proyector; sin color, conserva el texto plano y el fondo del usuario.
export function fondo(color?: Color) {
  if (!enabled) return "";
  if (!color) return "\x1b[49m";
  const rgb = [1, 3, 5].map((i) => parseInt(paleta[color].slice(i, i + 2), 16));
  return `\x1b[48;2;${rgb.join(";")}m`;
}
// Badge: las tintas de BARRACA son claras y llevan texto nit; la noche, paper.
export function badge(color: Color, text: string) {
  if (!enabled) return text;
  const hex = paleta[color];
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const ink = color.startsWith("nit") ? "paper" : "nit";
  return `\x1b[48;2;${rgb.join(";")}m${paint(ink, ` ${text} `)}\x1b[49m`;
}
export const width = Bun.stringWidth;
export const terminalText = (s: string) =>
  Bun.stripANSI(s)
    .replace(/🌙\uFE0F?/gu, "☾")
    .replace(/\p{Bidi_Control}/gu, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
export function fit(s: string, n: number): string {
  if (width(s) <= n) return s;
  let out = "";
  for (const ch of new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  }).segment(Bun.stripANSI(s))) {
    if (width(out + ch.segment) > n - 1) break;
    out += ch.segment;
  }
  return out + "…";
}
export function wrap(s: string, n: number): string[] {
  const lines: string[] = [];
  for (const line of s.split("\n")) {
    let rest = line;
    while (width(rest) > n) {
      let chunk = "";
      for (const ch of rest) {
        if (width(chunk + ch) > n) break;
        chunk += ch;
      }
      const space = chunk.lastIndexOf(" ");
      if (space > n / 2) chunk = chunk.slice(0, space);
      lines.push(chunk);
      rest = rest.slice(chunk.length).trimStart();
    }
    lines.push(rest);
  }
  return lines;
}
export function panel(
  title: string,
  lines: string[],
  columns = process.stdout.columns ?? 80,
) {
  const w = Math.max(12, Math.min(80, columns));
  const head = fit(` ${terminalText(title)} `, w - 4);
  return [
    paint("cian", `┌─${head}${"─".repeat(Math.max(0, w - 3 - width(head)))}┐`),
    ...lines
      .flatMap((x) => wrap(terminalText(x), w - 4))
      .map((x) => `│ ${x}${" ".repeat(Math.max(0, w - 4 - width(x)))} │`),
    paint("cian", `└${"─┬─".repeat(Math.ceil((w - 2) / 3)).slice(0, w - 2)}┘`),
  ].join("\n");
}
export const trackLabel = (t: {
  glifo: string;
  nombre: string;
  ventanilla: number;
  color: Color;
}) =>
  `${badge(t.color, t.glifo)} Negociado de ${terminalText(t.nombre)} · Ventanilla ${t.ventanilla}`;
