import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { catalogPath, generateTracks } from "../scripts/tracks";
import sample from "../tracks/derechos/track.json";

test("el catálogo generado está al día con tracks/**/track.json", async () => {
  expect(await Bun.file(catalogPath).text()).toBe(await generateTracks());
});

test("rechaza rutas inconsistentes y ventanillas duplicadas", async () => {
  const dir = await mkdtemp(join(tmpdir(), "buildnight-tracks-"));
  try {
    await mkdir(join(dir, "derechos"));
    await Bun.write(
      join(dir, "derechos/track.json"),
      JSON.stringify({ ...sample, slug: "otra-ruta" }),
    );
    await expect(generateTracks(dir)).rejects.toThrow("Ruta incorrecta");
    await Bun.write(join(dir, "derechos/track.json"), JSON.stringify(sample));
    await mkdir(join(dir, "otro"));
    await Bun.write(
      join(dir, "otro/track.json"),
      JSON.stringify({ ...sample, slug: "otro" }),
    );
    await expect(generateTracks(dir)).rejects.toThrow("duplicado");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
