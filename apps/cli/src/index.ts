#!/usr/bin/env bun
import { Command, CommanderError } from "commander";
import { select, isCancel } from "@clack/prompts";
import { contexto, type Contexto } from "./lib/contexto";
import { setPlain } from "./lib/estilo";
import { fallo, salida } from "./lib/output";
import { CliError } from "@hacknight/shared/errors";
import { tracks, expediente } from "./commands/base";
import { ficha, revision, registrar } from "./commands/entrega";
import { cita, ventanilla, tablon, publicar } from "./commands/social";
import { pantalla } from "./commands/pantalla";
import { tramitar, datos } from "./commands/arranque";
import { actualizar } from "./commands/actualizar";
import { consumo } from "./commands/consumo";
import { observar } from "./commands/observar";
import { eventoBase } from "@hacknight/shared/evento";
import { VERSION } from "./version";
const program = new Command()
  .name("hacknight")
  .description(`La ventanilla de ${eventoBase.nombre}`)
  .version(VERSION, "-V, --version", "Mostrar versión")
  .helpOption("-h, --help", "Mostrar ayuda")
  .option("--json", "Un documento JSON; sin interacción")
  .option("--registro <repo|file-url>", "Registro central")
  .option("--cwd <directorio>", "Directorio del proyecto")
  .option("--usuario <handle>", "Handle de participante (solo local)")
  .option("--plantilla <repo|directorio>", "Plantilla del squad")
  .option("--releases <repo>", "Repositorio de releases")
  .option("--confirmar", "Confirmación explícita de una acción pública")
  .option("--plain", "Texto plano");
const json = process.argv.includes("--json");
const ayudaES = (s: string) =>
  s
    .replace(/^Usage:/gm, "Uso:")
    .replace(/^Options:/gm, "Opciones:")
    .replace(/^Commands:/gm, "Trámites:")
    .replace(/display help for command/g, "Mostrar ayuda");
program
  .configureOutput({
    writeErr: () => {},
    writeOut: (s) => {
      if (!json) process.stdout.write(ayudaES(s));
    },
  })
  .exitOverride();
const run = (fn: (ctx: Contexto) => Promise<unknown>) => async () => {
  const opts = program.opts();
  setPlain(Boolean(opts.json || opts.plain));
  const ctx = await contexto(opts);
  await fn(ctx);
};
program
  .command("tracks [slug]")
  .alias("negociados")
  .description("Negociados y piezas")
  .action(async (slug) => run((ctx) => tracks(ctx, slug))());
program
  .command("expediente")
  .description("Su expediente; sin menú")
  .action(run(expediente));
program
  .command("ficha [accion]")
  .description("Editar o validar ficha.json")
  .option("--desde <archivo>", "Importar una ficha sin interacción")
  .action(async (a, o) => run((ctx) => ficha(ctx, a, o.desde))());
program
  .command("revisar")
  .description("Requerimiento de subsanación")
  .action(run(revision));
program
  .command("registrar")
  .description("Registrar o actualizar la ficha")
  .action(run(registrar));
program.command("check", { hidden: true }).action(run(revision));
program.command("submit", { hidden: true }).action(run(registrar));
program
  .command("cita [accion]")
  .description("Pedir ayuda, estado o anular")
  .option("--motivo <texto>", "Motivo corto")
  .action(async (a, o) => run((ctx) => cita(ctx, a, o.motivo))());
program
  .command("ventanilla [accion] [numero]")
  .description("Cola del comité; llamar y atendido")
  .option("--track <slug>", "Filtra por negociado")
  .action(async (a, n, o) => run((ctx) => ventanilla(ctx, a, n, o.track))());
program
  .command("tablon")
  .description("Publicaciones, avisos, registros y pushes")
  .option("-n <cantidad>", "Número de entradas", "20")
  .action(async (o) => run((ctx) => tablon(ctx, Number(o.n)))());
program
  .command("publicar <texto>")
  .description("Publicación pública, hasta 500 caracteres")
  .action(async (texto) => run((ctx) => publicar(ctx, texto))());
program
  .command("pantalla")
  .description("Proyector del local")
  .option("--once", "Una captura y salir")
  .action(async (o) => run((ctx) => pantalla(ctx, o.once))());
program
  .command("help-me [motivo]", { hidden: true })
  .action(async (m) => run((ctx) => cita(ctx, undefined, m))());
program
  .command("feed", { hidden: true })
  .option("-n <cantidad>", "Entradas", "20")
  .action(async (o) => run((ctx) => tablon(ctx, Number(o.n)))());
program
  .command("tv", { hidden: true })
  .option("--once")
  .action(async (o) => run((ctx) => pantalla(ctx, o.once))());
program
  .command("tramitar")
  .description("Crear el proyecto desde la plantilla")
  .option("--dry-run", "Mostrar el plan sin cambios")
  .option("--destino <directorio>", "Directorio nuevo")
  .action(async (o) => run((ctx) => tramitar(ctx, o))());
program
  .command("datos [paquete]")
  .description("Listar o descargar datos verificados")
  .option("--track <slug>", "Filtrar por negociado")
  .action(async (p, o) => run((ctx) => datos(ctx, p, o.track))());
program
  .command("actualizar")
  .description("Actualizar desde releases, si se habilitan")
  .option("--check", "Solo consultar")
  .action(async (o) => run((ctx) => actualizar(ctx, o.check))());
program
  .command("init", { hidden: true })
  .option("--dry-run")
  .option("--destino <directorio>")
  .action(async (o) => run((ctx) => tramitar(ctx, o))());
program
  .command("consumo")
  .description("Tokens locales del proyecto durante el build")
  .action(run(consumo));
for (const name of ["observar", "watch"]) {
  program
    .command(name, { hidden: name === "watch" })
    .description("Watcher de tokens; envío opcional al servidor local")
    .option("--servidor <url>", "Servidor local de la clasificación")
    .option("--intervalo <segundos>", "Segundos entre lecturas", "5")
    .option("--once", "Una lectura y salir")
    .action(async (o) => run((ctx) => observar(ctx, o))());
}
program.command("status", { hidden: true }).action(run(expediente));
program.command("vuelva-usted-mañana", { hidden: true }).action(() =>
  salida(
    {
      cita: "Vuelva usted mañana.",
      autor: "Mariano José de Larra",
      obra: "Vuelva usted mañana (1833)",
    },
    "«Vuelva usted mañana.» — Mariano José de Larra, 1833",
    json,
  ),
);
program.action(
  run(async (ctx) => {
    await expediente(ctx);
    if (ctx.opts.json || !process.stdin.isTTY || !process.stdout.isTTY) return;
    const acciones: Record<
      string,
      { label: string; run: () => Promise<unknown> }
    > = {
      tracks: { label: "Negociados · tracks", run: () => tracks(ctx) },
      expediente: { label: "Su expediente", run: () => expediente(ctx) },
      tramitar: {
        label: "Abrir proyecto · tramitar",
        run: () => tramitar(ctx, {}),
      },
      ficha: { label: "Editar ficha", run: () => ficha(ctx) },
      revisar: {
        label: "Requerimiento de subsanación",
        run: () => revision(ctx),
      },
      registrar: { label: "Registrar ficha", run: () => registrar(ctx) },
      cita: { label: "Pedir ayuda · cita", run: () => cita(ctx) },
      tablon: { label: "Leer el tablón", run: () => tablon(ctx) },
      datos: { label: "Paquetes de datos", run: () => datos(ctx) },
      pantalla: { label: "Pantalla del local", run: () => pantalla(ctx) },
      ventanilla: {
        label: "Ventanilla del comité",
        run: () => ventanilla(ctx),
      },
    };
    for (;;) {
      const choice = await select({
        message: "Seleccione un trámite",
        options: [
          ...Object.entries(acciones).map(([value, a]) => ({
            value,
            label: a.label,
          })),
          { value: "salir", label: "Salir · Apa!" },
        ],
      });
      if (isCancel(choice) || choice === "salir") return;
      try {
        await acciones[choice]?.run();
      } catch (e) {
        fallo(e);
        process.exitCode = 0;
      }
    }
  }),
);
try {
  await program.parseAsync();
} catch (e) {
  if (e instanceof CommanderError && e.exitCode === 0) {
    if (json)
      salida(
        e.code === "commander.version"
          ? { version: program.version() }
          : { ayuda: ayudaES(program.helpInformation()) },
        "",
        true,
      );
  } else
    fallo(
      e instanceof CommanderError
        ? new CliError(
            "USAGE",
            "El comando o sus argumentos no son válidos.",
            "Usa hacknight --help para consultar los trámites y opciones.",
            2,
          )
        : e,
      json,
    );
}
