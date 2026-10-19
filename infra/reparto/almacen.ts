import { rename } from "node:fs/promises";
import { estadoVacio, type Estado } from "./reparto";

export async function leer(archivo: string): Promise<Estado> {
  const f = Bun.file(archivo);
  return (await f.exists()) ? await f.json() : estadoVacio();
}

// A unique temp name: two writers never rename each other's file.
export async function escribir(ruta: string, datos: unknown) {
  const tmp = `${ruta}.${crypto.randomUUID()}.tmp`;
  await Bun.write(tmp, JSON.stringify(datos, null, 2) + "\n");
  await rename(tmp, ruta);
}

// One save at a time: a second tab working on an old copy gets the newer
// state back (409) instead of overwriting it or racing it.
let cola: Promise<unknown> = Promise.resolve();
export function guardar(archivo: string, nuevo: Estado) {
  const turno = cola.then(async () => {
    const actual = await leer(archivo);
    if (nuevo.version !== actual.version)
      return { conflicto: true, estado: actual };
    nuevo.version++;
    await escribir(archivo, nuevo);
    return { conflicto: false, estado: nuevo };
  });
  cola = turno.catch(() => {});
  return turno;
}
