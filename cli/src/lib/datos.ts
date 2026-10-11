import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Contexto } from "./contexto";
import type { Paquete } from "@hacknight/shared/modelo";
import { CliError } from "@hacknight/shared/errors";
export const sha256 = (bytes: Uint8Array) =>
  new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
export async function descargar(
  ctx: Contexto,
  p: Paquete,
  destino = join(ctx.cwd, "datos"),
  fetcher: typeof fetch = fetch,
) {
  if (p.pendiente)
    throw new CliError(
      "NOT_CONFIGURED",
      `El paquete ${p.id} está pendiente.`,
      "El track lead debe publicar la URL y su SHA256.",
      4,
    );
  if (!/^[a-f0-9]{64}$/i.test(p.sha256))
    throw new CliError(
      "CHECKSUM",
      `SHA256 inválido para ${p.id}.`,
      "Corrige el catálogo de paquetes.",
      2,
    );
  let bytes: Uint8Array;
  try {
    const u = new URL(p.url);
    if (u.protocol === "file:" && ctx.registro.tipo === "local")
      bytes = await readFile(fileURLToPath(u));
    else if (u.protocol === "https:") {
      const response = await fetcher(u, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error("HTTP");
      bytes = new Uint8Array(await response.arrayBuffer());
    } else throw new Error("URL");
  } catch {
    throw new CliError(
      "NETWORK",
      `No se pudo descargar ${p.id}.`,
      "Silencio administrativo (sentido negativo). Vuelva a intentarlo.",
      5,
    );
  }
  if (sha256(bytes).toLowerCase() !== p.sha256.toLowerCase())
    throw new CliError(
      "CHECKSUM",
      `La suma SHA256 de ${p.id} no coincide.`,
      "No se ha instalado el paquete; consulta al track lead.",
      2,
    );
  const ext = extname(new URL(p.url).pathname);
  const file = join(
    destino,
    p.id + (/^\.[a-z0-9]{1,8}$/i.test(ext) ? ext : ".bin"),
  );
  await mkdir(destino, { recursive: true });
  const tmp = file + "." + crypto.randomUUID() + ".tmp";
  await writeFile(tmp, bytes);
  await rename(tmp, file);
  return { id: p.id, archivo: file, sha256: p.sha256 };
}
