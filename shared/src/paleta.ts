// Paleta común de terminal y web; adaptada del patrón MIT de style.ts.
export const paleta = {
  roig: "#C8102E",
  tinta: "#1A1A1A",
  cal: "#F5F1E6",
  cobalto: "#1F4E9E",
  taronja: "#EE7F1B",
  horta: "#2F7D4A",
  arena: "#E8DCC4",
} as const;
export type Color = keyof typeof paleta;
export const roles = {
  ok: "horta",
  error: "roig",
  aviso: "taronja",
  acento: "cobalto",
  marca: "roig",
  tenue: "arena",
} as const;
