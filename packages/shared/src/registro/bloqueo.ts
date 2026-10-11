import { lstat, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { esAusente, guardar } from "../io";

export class ErrorBloqueo extends Error {
  constructor(public readonly heredado = false) {
    super(
      heredado
        ? "Hay un bloqueo antiguo sin propietario verificable. Detén los procesos que usan el registro y retira el directorio de bloqueo manualmente."
        : "El registro local está ocupado. Reintenta.",
    );
  }
}

function vivo(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM y cualquier error desconocido no prueban que el propietario murió.
    return !(
      error instanceof Error &&
      "code" in error &&
      error.code === "ESRCH"
    );
  }
}

async function comprobarHeredado(path: string) {
  try {
    await lstat(path);
  } catch (error) {
    if (esAusente(error)) return;
    throw error;
  }
  throw new ErrorBloqueo(true);
}

// Algoritmo de la panadería: cada intento publica primero que está eligiendo
// turno, después un número mayor que los publicados. Antes de entrar, cede a
// quien aún elige o tiene prioridad. No espera: el llamante puede reintentar.
// Las rutas son únicas por intento; recuperar un proceso muerto nunca borra
// la ruta compartida que otro proceso pudiera haber adquirido entretanto.
export async function conBloqueo<T>(
  path: string,
  fn: () => Promise<T>,
): Promise<T> {
  await comprobarHeredado(path);
  const dir = `${path}.claims`;
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const id = `${process.pid}-${crypto.randomUUID()}.json`;
  const claim = join(dir, id);
  const leerTurnos = async () => {
    const turnos: { id: string; numero: bigint | null }[] = [];
    for (const name of await readdir(dir)) {
      const match = /^([1-9]\d*)-[a-f0-9-]{36}\.json$/.exec(name);
      if (!match) continue;
      if (!vivo(Number(match[1]))) {
        // Solo se retira la reclamación única de un proceso confirmado muerto.
        await rm(join(dir, name), { force: true });
        continue;
      }
      try {
        const data = JSON.parse(await readFile(join(dir, name), "utf8"));
        const numero =
          typeof data?.numero === "string" && /^[1-9]\d*$/.test(data.numero)
            ? BigInt(data.numero)
            : null;
        turnos.push({ id: name, numero });
      } catch (error) {
        if (esAusente(error)) continue;
        // Una reclamación ilegible de un proceso vivo nunca se roba.
        throw new ErrorBloqueo();
      }
    }
    return turnos;
  };
  try {
    await guardar(claim, { numero: null });
    const numero =
      (await leerTurnos()).reduce(
        (max, t) => (t.numero !== null && t.numero > max ? t.numero : max),
        0n,
      ) + 1n;
    await guardar(claim, { numero: numero.toString() });
    for (const other of await leerTurnos()) {
      if (
        other.id !== id &&
        (other.numero === null ||
          other.numero < numero ||
          (other.numero === numero && other.id < id))
      )
        throw new ErrorBloqueo();
    }
    await comprobarHeredado(path);
    return await fn();
  } finally {
    await rm(claim, { force: true });
  }
}
