import { chmod, rename, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import type { Contexto } from "../lib/contexto";
import { repo } from "@hacknight/shared/modelo";
import { CliError } from "@hacknight/shared/errors";
import { salida } from "../lib/output";
import { VERSION, COMPILED } from "../version";
export const sha256 = (bytes: Uint8Array) =>
  new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
// Adaptación del flujo update.ts MIT: assets por plataforma, SHA256 y rename.
export function assetName(platform = process.platform, arch = process.arch) {
  const os = platform === "win32" ? "windows" : platform;
  if (
    !["linux", "darwin", "windows"].includes(os) ||
    !["x64", "arm64"].includes(arch)
  )
    throw new CliError(
      "PLATFORM",
      "No hay binario para esta plataforma.",
      "Compila desde el código fuente.",
      2,
    );
  return `hacknight-${os}-${arch}${os === "windows" ? ".exe" : ""}`;
}
export function isNewer(candidate: string, current: string) {
  const a = candidate
      .replace(/^cli-v|^v/, "")
      .split(".")
      .map(Number),
    b = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i]! > b[i]!;
  }
  return false;
}
export function verificar(bytes: Uint8Array, sums: string, asset: string) {
  const entries = sums
    .split(/\r?\n/)
    .map((l) => l.trim().split(/\s+/))
    .filter((parts) => parts[1]?.replace(/^\*/, "") === asset);
  if (
    entries.length !== 1 ||
    !entries[0]?.[0] ||
    !/^[a-f0-9]{64}$/i.test(entries[0][0]) ||
    sha256(bytes) !== entries[0][0].toLowerCase()
  )
    throw new CliError(
      "CHECKSUM",
      "La descarga no coincide con SHA256SUMS.",
      "No se ha reemplazado el binario.",
      2,
    );
}
async function request(url: string, fetcher: typeof fetch) {
  try {
    const r = await fetcher(url, {
      signal: AbortSignal.timeout(30000),
      headers: { "User-Agent": `hacknight/${VERSION}` },
    });
    if (!r.ok) throw new Error("HTTP");
    return r;
  } catch {
    throw new CliError(
      "NETWORK",
      "Silencio administrativo (sentido negativo). Vuelva a intentarlo.",
      "Comprueba que el repo de releases y sus assets existen.",
      5,
    );
  }
}
export async function release(nombre: string, fetcher: typeof fetch = fetch) {
  if (!repo.safeParse(nombre).success)
    throw new CliError(
      "CONFIG",
      "Releases debe ser propietario/repo.",
      "Revisa --releases.",
      2,
    );
  const response = await request(
    `https://api.github.com/repos/${nombre}/releases/latest`,
    fetcher,
  );
  const data = z
    .object({ tag_name: z.string().regex(/^cli-v\d+\.\d+\.\d+$/) })
    .safeParse(await response.json());
  if (!data.success)
    throw new CliError(
      "RELEASE",
      "La última release no tiene formato cli-vX.Y.Z.",
      "Revisa el repositorio configurado.",
      2,
    );
  return data.data;
}
export async function instalarRelease(
  nombre: string,
  tag: string,
  target: string,
  fetcher: typeof fetch = fetch,
) {
  const asset = assetName();
  const base = `https://github.com/${nombre}/releases/download/${tag}`;
  const [binary, sums] = await Promise.all([
    request(`${base}/${asset}`, fetcher),
    request(`${base}/SHA256SUMS`, fetcher),
  ]);
  const bytes = new Uint8Array(await binary.arrayBuffer());
  verificar(bytes, await sums.text(), asset);
  const staging = join(dirname(target), `.${asset}.${crypto.randomUUID()}.tmp`);
  await writeFile(staging, bytes, { mode: 0o755 });
  await chmod(staging, 0o755);
  try {
    if (process.platform === "win32") {
      const old = `${target}.${Date.now()}.old`;
      await rename(target, old);
      try {
        await rename(staging, target);
      } catch (e) {
        await rename(old, target);
        throw e;
      }
    } else await rename(staging, target);
  } catch {
    await rm(staging, { force: true });
    throw new CliError(
      "UPDATE_NOT_WRITABLE",
      "No se pudo reemplazar el binario.",
      "Instálalo en un directorio con permisos de escritura.",
      1,
    );
  }
}
export async function actualizar(ctx: Contexto, check = false) {
  const nombre = ctx.config.releases;
  if (!nombre) {
    salida(
      {
        habilitada: false,
        version: VERSION,
        motivo: "Repositorio de releases pendiente.",
      },
      "Actualización desactivada: el comité debe configurar releases.",
      ctx.opts.json,
    );
    return;
  }
  const latest = await release(nombre);
  const newer = isNewer(latest.tag_name, VERSION);
  if (!newer || check) {
    salida(
      { version: VERSION, ultima: latest.tag_name, disponible: newer },
      newer
        ? `Nueva versión: ${latest.tag_name}`
        : `Versión ${VERSION} al día.`,
      ctx.opts.json,
    );
    return;
  }
  if (!COMPILED)
    throw new CliError(
      "SOURCE_CHECKOUT",
      "Este CLI se ejecuta desde el código fuente.",
      "Actualiza el código y vuelve a compilar; no se reemplaza Bun.",
      2,
    );
  await instalarRelease(nombre, latest.tag_name, process.execPath);
  salida(
    { instalada: latest.tag_name },
    `Actualizado a ${latest.tag_name}. Apa!`,
    ctx.opts.json,
  );
}
