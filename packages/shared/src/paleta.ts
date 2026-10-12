// Paleta común de terminal y web: los tokens de BARRACA, con sus nombres.
// Origen: packages/brand/src/tokens.css del repo de BARRACA Founders House.
export const paleta = {
  nit: "#0C0912",
  "nit-2": "#150F1F",
  magenta: "#FF2E88",
  "magenta-deep": "#E01F74",
  cian: "#33E6FF",
  acid: "#C8FF3D",
  after: "#FF9B42",
  paper: "#F3ECE0",
  muted: "#8A7F94",
} as const;
export type Color = keyof typeof paleta;
export const roles = {
  ok: "acid",
  error: "magenta",
  aviso: "after",
  acento: "cian",
  marca: "magenta",
  tenue: "muted",
} as const;
