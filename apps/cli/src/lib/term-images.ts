export type ImageProtocol = "kitty" | "iterm";

const IMAGE_COLUMNS = 36;
const IMAGE_MAX_ROWS = 12;
const PIXELS_PER_COLUMN = 16;
// Las celdas del terminal son aproximadamente el doble de altas que de anchas.
const CELL_ASPECT = 2;
const KITTY_CHUNK = 4096;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const KONSOLE_WITH_KITTY_GRAPHICS = 220_400;
const ESC = String.fromCodePoint(27);
const BEL = String.fromCodePoint(7);

type Env = Record<string, string | undefined>;

type ImageCells = { columns: number; rows: number };
type ImageBounds = { maxColumns?: number; maxRows?: number };

// Sin soporte conocido o passthrough de tmux/screen, el banner usa texto.
export function detectImageProtocol(
  env: Env,
  isTty: boolean,
): ImageProtocol | null {
  if (!isTty || env.HACKNIGHT_NO_IMAGES || env.TMUX || env.STY) {
    return null;
  }
  const program = (env.TERM_PROGRAM ?? "").toLowerCase();
  if (
    env.KITTY_WINDOW_ID ||
    env.TERM === "xterm-kitty" ||
    env.GHOSTTY_RESOURCES_DIR ||
    env.WEZTERM_EXECUTABLE ||
    program === "ghostty" ||
    program === "wezterm"
  ) {
    return "kitty";
  }
  const konsole = Number.parseInt(env.KONSOLE_VERSION ?? "", 10);
  if (Number.isFinite(konsole) && konsole >= KONSOLE_WITH_KITTY_GRAPHICS) {
    return "kitty";
  }
  if (
    program === "iterm.app" ||
    program === "warpterminal" ||
    program === "vscode" ||
    env.LC_TERMINAL === "iTerm2"
  ) {
    return "iterm";
  }
  return null;
}

export function pngSize(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 24) {
    return null;
  }
  for (const [i, expected] of PNG_SIGNATURE.entries()) {
    if (bytes[i] !== expected) {
      return null;
    }
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width === 0 || height === 0) {
    return null;
  }
  return { height, width };
}

export function imageCells(
  width: number,
  height: number,
  bounds: ImageBounds = {},
): ImageCells {
  const maxColumns = Math.max(1, bounds.maxColumns ?? IMAGE_COLUMNS);
  const maxRows = Math.max(1, bounds.maxRows ?? IMAGE_MAX_ROWS);
  let columns = Math.max(
    1,
    Math.min(maxColumns, Math.ceil(width / PIXELS_PER_COLUMN)),
  );
  let rows = Math.max(
    1,
    Math.round((columns * (height / width)) / CELL_ASPECT),
  );
  if (rows > maxRows) {
    rows = maxRows;
    columns = Math.max(
      1,
      Math.min(maxColumns, Math.round((rows * CELL_ASPECT * width) / height)),
    );
  }
  return { columns, rows };
}

// Kitty limita cada bloque base64 a 4 KiB; q=2 evita respuestas en stdin.
export function kittySequence(
  png: Uint8Array,
  columns: number,
  rows: number,
): string {
  const data = Buffer.from(png).toString("base64");
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += KITTY_CHUNK) {
    const more = i + KITTY_CHUNK < data.length ? 1 : 0;
    const head = i === 0 ? `a=T,f=100,c=${columns},r=${rows},q=2,` : "";
    chunks.push(
      `${ESC}_G${head}m=${more};${data.slice(i, i + KITTY_CHUNK)}${ESC}\\`,
    );
  }
  return chunks.join("");
}

export function itermSequence(
  png: Uint8Array,
  columns: number,
  rows: number,
): string {
  const data = Buffer.from(png).toString("base64");
  return `${ESC}]1337;File=inline=1;size=${png.byteLength};width=${columns};height=${rows};preserveAspectRatio=1:${data}${BEL}`;
}

export function renderImage(
  protocol: ImageProtocol,
  png: Uint8Array,
  bounds: ImageBounds = {},
): string | null {
  const size = pngSize(png);
  if (!size) {
    return null;
  }
  const { columns, rows } = imageCells(size.width, size.height, bounds);
  return protocol === "kitty"
    ? kittySequence(png, columns, rows)
    : itermSequence(png, columns, rows);
}
