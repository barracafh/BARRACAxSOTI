import { readFile, rm, writeFile } from "node:fs/promises";
import { conBloqueo, ErrorBloqueo } from "@buildnight/shared/registro/bloqueo";

const [mode, path, counter] = process.argv.slice(2);
if (!path) throw new Error("Falta el directorio del bloqueo de prueba.");
if (mode === "hold") {
  await conBloqueo(path, async () => {
    console.log("bloqueado");
    await Bun.stdin.text();
  });
} else if (mode === "increment" && counter) {
  let completed = 0;
  for (let attempt = 0; completed < 15 && attempt < 2000; attempt++) {
    try {
      await conBloqueo(path, async () => {
        // La creación exclusiva detecta inmediatamente dos secciones críticas.
        const active = `${counter}.active`;
        await writeFile(active, "activo", { flag: "wx" });
        try {
          const value = Number(await readFile(counter, "utf8"));
          await Bun.sleep(1);
          await writeFile(counter, String(value + 1));
        } finally {
          await rm(active);
        }
      });
      completed++;
    } catch (error) {
      if (!(error instanceof ErrorBloqueo)) throw error;
      await Bun.sleep(2);
    }
  }
  if (completed !== 15) throw new Error("No se pudo completar la prueba.");
}
