import { PNG } from "pngjs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
// No logo por defecto. Aplana transparencia sobre blanco para la tarjeta.
const input = resolve(
  process.argv[2] ?? new URL("../assets/logo.png", import.meta.url).pathname,
);
const output = resolve(
  process.argv[3] ?? new URL("../src/assets/logo.ts", import.meta.url).pathname,
);
const png = PNG.sync.read(await readFile(input));
for (let i = 0; i < png.data.length; i += 4) {
  const a = png.data[i + 3]! / 255;
  for (let c = 0; c < 3; c++)
    png.data[i + c] = Math.round(png.data[i + c]! * a + 255 * (1 - a));
  png.data[i + 3] = 255;
}
const bytes = PNG.sync.write(png, { colorType: 2 });
await writeFile(
  output,
  `// Generado por scripts/embed-logo.ts; tarjeta sobre blanco.\nexport const LOGO_WIDTH = ${png.width};\nexport const LOGO_HEIGHT = ${png.height};\nexport function logoPng(): Uint8Array | null { return Buffer.from('${bytes.toString("base64")}', 'base64'); }\n`,
);
console.log(`Logo incrustado: ${png.width} × ${png.height}`);
