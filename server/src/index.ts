#!/usr/bin/env bun
import { Command, CommanderError } from "commander";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inicializarRegistro } from "@barbaritat/shared/registro/gestion";
import { RegistroLocal } from "@barbaritat/shared/registro/local";
import { CliError } from "@barbaritat/shared/errors";
import { iniciarServidor } from "./servidor";

const json = process.argv.includes("--json");
const program = new Command()
  .name("barbaritat-server")
  .description("Web y administración local de Barbaritat Valenciana")
  .version("0.1.0")
  .option(
    "--directorio <ruta>",
    "Crear o abrir el registro local",
    ".barbaritat-live/registro",
  )
  .option("--puerto <numero>", "Puerto HTTP local", "4310")
  .option("--db <archivo>", "Persistencia SQLite de contadores")
  .option("--json", "Un documento JSON al cerrar; diagnóstico en stderr")
  .configureOutput({
    writeOut: (s) => {
      if (!json) process.stdout.write(s);
    },
    writeErr: () => {},
  })
  .exitOverride();

try {
  program.parse();
  const opts = program.opts();
  const puerto = Number(opts.puerto);
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535)
    throw new CliError(
      "USAGE",
      "Puerto inválido.",
      "Usa un número entre 0 y 65535.",
      2,
    );
  const dir = resolve(opts.directorio);
  await inicializarRegistro(dir);
  const running = await iniciarServidor(new RegistroLocal(dir), {
    puerto,
    db: resolve(opts.db ?? join(dir, "uso.sqlite")),
  });
  const quit = Promise.withResolvers<void>();
  const stop = () => quit.resolve();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  (json ? process.stderr : process.stdout).write(
    `Ventanilla local · ${running.url}\nAdministración · ${running.url}admin\nClave local en ${running.clavePath}\nRegistro · ${pathToFileURL(dir).href}\nNo se inicia ningún watcher. Ctrl+C para cerrar.\n`,
  );
  try {
    await quit.promise;
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    await running.close();
  }
  console.log(
    json
      ? JSON.stringify({ ok: true, data: { url: running.url, detenido: true } })
      : "Servidor detenido.",
  );
} catch (error) {
  if (error instanceof CommanderError && error.exitCode === 0) {
    if (json)
      console.log(
        JSON.stringify({
          ok: true,
          data:
            error.code === "commander.version"
              ? { version: program.version() }
              : { ayuda: program.helpInformation() },
        }),
      );
  } else {
    const e =
      error instanceof CliError
        ? error
        : new CliError(
            error instanceof CommanderError ? "USAGE" : "SERVER",
            error instanceof Error
              ? error.message
              : "No se pudo arrancar el servidor.",
            "Consulta barbaritat-server --help y revisa el directorio y el puerto.",
            error instanceof CommanderError ? 2 : 1,
          );
    if (json)
      console.log(
        JSON.stringify({
          ok: false,
          error: { code: e.code, message: e.message, hint: e.hint },
        }),
      );
    else console.error(`${e.message}\n${e.hint}`);
    process.exitCode = e.exitCode;
  }
}
