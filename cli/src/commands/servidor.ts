import { resolve, join } from "node:path";
import { contexto, type Contexto } from "../lib/contexto";
import { pathToFileURL } from "node:url";
import { inicializarRegistro } from "../registro/gestion";
import { RegistroLocal } from "../registro/local";
import { iniciarServidor } from "../live/servidor";
import { CliError } from "../lib/errors";
import { salida } from "../lib/output";

export async function servidor(
  ctx: Contexto,
  opts: { puerto?: string; db?: string; directorio?: string },
) {
  const puerto = Number(opts.puerto ?? 4310);
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535)
    throw new CliError(
      "USAGE",
      "Puerto inválido.",
      "Usa un número entre 0 y 65535.",
      2,
    );
  if (
    opts.directorio ||
    ctx.config.registro === "barbaritat-valenciana/registro"
  ) {
    const dir = resolve(opts.directorio ?? ".barbaritat-live/registro");
    await inicializarRegistro(dir);
    ctx = await contexto({ ...ctx.opts, registro: pathToFileURL(dir).href });
  }
  if (!(ctx.registro instanceof RegistroLocal))
    throw new CliError(
      "USAGE",
      "La web requiere un registro local.",
      "Usa servidor --directorio <ruta> o --registro file:///…",
      2,
    );
  const running = await iniciarServidor(ctx, {
    puerto,
    db: resolve(opts.db ?? join(ctx.registro.dir, "uso.sqlite")),
  });
  (ctx.opts.json ? process.stderr : process.stdout).write(
    `Ventanilla local · ${running.url}\nAdministración · ${running.url}admin\nClave local en ${running.clavePath}\nRegistro · ${pathToFileURL(ctx.registro.dir).href}\nNo se inicia ningún watcher. Ctrl+C para cerrar.\n`,
  );
  let quit!: () => void;
  const done = new Promise<void>((r) => {
    quit = r;
  });
  process.once("SIGINT", quit);
  process.once("SIGTERM", quit);
  try {
    await done;
  } finally {
    process.off("SIGINT", quit);
    process.off("SIGTERM", quit);
    await running.close();
  }
  salida(
    { url: running.url, detenido: true },
    "Servidor detenido.",
    ctx.opts.json,
  );
}
