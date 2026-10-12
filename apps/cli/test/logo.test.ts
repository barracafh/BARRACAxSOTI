import { afterEach, test, expect } from "bun:test";
import { PNG } from "pngjs";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const tempDirs: string[] = [];
afterEach(async () => {
  for (const dir of tempDirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
test("embed-logo aplana un PNG de prueba sobre blanco sin guardarlo en el repo", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-logo-"));
  tempDirs.push(dir);
  const png = new PNG({ width: 8, height: 4 });
  png.data.fill(0);
  await writeFile(join(dir, "test.png"), PNG.sync.write(png));
  const p = Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, "../scripts/embed-logo.ts"),
      join(dir, "test.png"),
      join(dir, "logo.ts"),
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  expect(await p.exited).toBe(0);
  const text = await readFile(join(dir, "logo.ts"), "utf8");
  expect(text).toContain("LOGO_WIDTH = 8");
  const encoded = text.match(/Buffer.from\('([^']+)'/)![1]!;
  const output = PNG.sync.read(Buffer.from(encoded, "base64"));
  expect([...output.data.slice(0, 4)]).toEqual([255, 255, 255, 255]);
});
