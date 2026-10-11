import { lstat, mkdir, open, readFile } from "node:fs/promises";
import { join } from "node:path";
import { options, root } from "../common";

const endpoint = "https://openrouter.ai/api/v1/keys";
export function validateSquads(squads: string[], limit: number) {
  if (
    !squads.length ||
    squads.length > 15 ||
    new Set(squads).size !== squads.length ||
    squads.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
  )
    throw new Error("Indica entre 1 y 15 squads, con slugs únicos.");
  if (
    !Number.isFinite(limit) ||
    limit <= 0 ||
    limit > 20 ||
    squads.length * limit > 300
  )
    throw new Error(
      "El límite debe ser mayor que 0 y como máximo 20 USD por squad (300 USD en total).",
    );
}

async function privateDirectory(path: string) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0)
    throw new Error(
      "La carpeta de claves debe ser privada (700) y no ser un enlace simbólico.",
    );
}

export async function provisionKeys(config: {
  squads: string[];
  limit?: number;
  apply?: boolean;
  secretDir?: string;
  masterKey?: string;
  fetcher?: typeof fetch;
  log?: (message: string) => void;
}) {
  const {
    squads,
    limit = 20,
    apply = false,
    fetcher = fetch,
    log = console.log,
  } = config;
  validateSquads(squads, limit);
  if (!apply) {
    log(
      `Simulación: ${squads.length} squads × ${limit} USD = ${squads.length * limit} USD como máximo. Sin llamadas ni archivos.`,
    );
    for (const squad of squads)
      log(
        `POST ${endpoint} ${JSON.stringify({ name: `hacknight-${squad}`, limit, limit_reset: null, include_byok_in_limit: true })}`,
      );
    log(
      "Las claves irían a .local-secrets/openrouter/<squad>.json, con permisos 600. Nunca se imprimen.",
    );
    return;
  }
  const masterKey =
    config.masterKey ?? process.env.OPENROUTER_PROVISIONING_API_KEY;
  if (!masterKey)
    throw new Error(
      "Falta OPENROUTER_PROVISIONING_API_KEY (clave maestra de gestión).",
    );
  const secretDir = config.secretDir ?? join(root, ".local-secrets/openrouter");
  // Check both levels before creating any request or file; symlink parents are rejected.
  await privateDirectory(join(secretDir, ".."));
  await privateDirectory(secretDir);
  for (const squad of squads) {
    const path = join(secretDir, `${squad}.json`);
    let file;
    try {
      file = await open(path, "wx", 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST")
        throw new Error("No se pudo reservar el archivo privado de claves.");
      const stat = await lstat(path);
      if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0)
        throw new Error(
          "Archivo de claves inseguro; debe ser regular y tener permisos 600.",
        );
      let existing;
      try {
        existing = JSON.parse(await readFile(path, "utf8"));
      } catch {
        throw new Error(
          "Archivo de claves inválido; requiere revisión manual.",
        );
      }
      if (
        existing.status !== "created" ||
        existing.squad !== squad ||
        existing.limit !== limit ||
        typeof existing.key !== "string" ||
        !existing.key ||
        typeof existing.hash !== "string" ||
        !existing.hash
      )
        throw new Error(
          `Estado pendiente o límite distinto para ${squad}; comprueba OpenRouter manualmente antes de repetir. No borres el archivo para reintentar a ciegas.`,
        );
      log(`${squad}: ya tiene clave guardada; no se crea otra.`);
      continue;
    }
    try {
      // Reserve durably before the non-idempotent request. A failed call is never retried automatically.
      const pending = {
        squad,
        limit,
        status: "pending",
        name: `hacknight-${squad}`,
      };
      await file.writeFile(JSON.stringify(pending) + "\n");
      await file.sync();
      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${masterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: pending.name,
            limit,
            limit_reset: null,
            include_byok_in_limit: true,
          }),
        });
      } catch {
        throw new Error(
          "No se pudo confirmar la creación. Revisa el estado pendiente en OpenRouter; no se reintenta automáticamente.",
        );
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          `OpenRouter rechazó la petición (HTTP ${response.status}); respuesta omitida para no exponer claves. Revisa el estado pendiente.`,
        );
      }
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Respuesta no válida de OpenRouter; revisa el estado pendiente.",
        );
      }
      if (
        typeof data?.key !== "string" ||
        !data.key ||
        typeof data.data?.hash !== "string" ||
        !data.data.hash
      )
        throw new Error(
          "OpenRouter no devolvió clave y hash válidos; revisa el estado pendiente.",
        );
      const bytes = Buffer.from(
        JSON.stringify(
          {
            ...pending,
            status: "created",
            key: data.key,
            hash: data.data.hash,
          },
          null,
          2,
        ) + "\n",
      );
      let offset = 0;
      while (offset < bytes.length) {
        const { bytesWritten } = await file.write(
          bytes,
          offset,
          bytes.length - offset,
          offset,
        );
        if (!bytesWritten)
          throw new Error(
            "No se pudo guardar la clave completa; revisa el archivo privado y el estado en OpenRouter.",
          );
        offset += bytesWritten;
      }
      await file.truncate(bytes.length);
      await file.sync();
      log(`${squad}: clave guardada en archivo privado (600).`);
    } finally {
      await file.close();
    }
  }
}

if (import.meta.main) {
  // Do not expose arbitrary exceptions or provider bodies through Bun's uncaught-error output.
  try {
    const args = options(["equipos", "limite"]);
    const teams: unknown = await Bun.file(
      args.get("equipos") ??
        join(root, "packages/shared/registro-base/equipos.json"),
    ).json();
    if (
      !Array.isArray(teams) ||
      teams.some((team) => !team || typeof team.id !== "string")
    )
      throw new Error("equipos.json debe ser una lista de squads con id.");
    await provisionKeys({
      squads: teams.map((team) => team.id),
      limit: Number(args.get("limite") ?? 20),
      apply: args.apply,
    });
  } catch {
    console.error(
      "No se completó la preparación de claves. Revisa argumentos, permisos y estados privados pendientes; no se imprime la respuesta del proveedor ni se reintenta.",
    );
    process.exitCode = 1;
  }
}
