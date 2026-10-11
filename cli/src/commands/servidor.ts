import { resolve } from "node:path";
import type { Contexto } from "../lib/contexto";
import { iniciarServidor } from "../live/servidor";
import { CliError } from "../lib/errors";
import { salida } from "../lib/output";

export async function servidor(
  ctx: Contexto,
  opts: { puerto?: string; db?: string },
) {
  const puerto = Number(opts.puerto ?? 4310);
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535)
    throw new CliError(
      "USAGE",
      "Puerto inválido.",
      "Usa un número entre 0 y 65535.",
      2,
    );
  const running = await iniciarServidor(ctx, {
    puerto,
    db: resolve(opts.db ?? ".barbaritat-live/uso.sqlite"),
  });
  (ctx.opts.json ? process.stderr : process.stdout).write(
    `Ventanilla local · ${running.url}\nCtrl+C para cerrar.\n`,
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
