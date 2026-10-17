import type { Contexto } from "../lib/contexto";
import { miEquipo } from "../lib/contexto";
import { CliError } from "@hacknight/shared/errors";
import { salida } from "../lib/output";
import { panel, trackLabel, fit, terminalText } from "../lib/estilo";
import { escanear, servidorDestino, SesionCaducada } from "../watcher/cliente";
import { olvidarSesion, sesion } from "../watcher/sesion";

export async function observar(
  ctx: Contexto,
  opts: { servidor?: string; intervalo?: string; once?: boolean },
) {
  const segundos = Number(opts.intervalo ?? 60);
  if (!Number.isFinite(segundos) || segundos < 1 || segundos > 300)
    throw new CliError(
      "USAGE",
      "El intervalo debe estar entre 1 y 300 segundos.",
      "Usa --intervalo 60.",
      2,
    );
  const { usuario, equipo, track } = await miEquipo(ctx);
  let evento = await ctx.registro.evento();
  // With the event's GitHub registry, counters go to its room by default.
  const servidor =
    opts.servidor ??
    (ctx.registro.tipo === "github" ? evento.enlaces.sala : undefined);
  if (servidor) servidorDestino(servidor);
  // Asked before the screen takes over the terminal, so the code stays visible.
  let token =
    servidor && servidorDestino(servidor).protocol === "https:"
      ? await sesion((texto) => process.stderr.write(`${texto}\n`))
      : undefined;
  const enviados = new Map<string, number>();
  let ultimo: Awaited<ReturnType<typeof escanear>> | undefined;
  let error = "",
    cerrado = false,
    pausa = false,
    ciclos = 0;
  const tty =
    !ctx.opts.json &&
    !ctx.opts.plain &&
    process.stdin.isTTY &&
    process.stdout.isTTY;
  const lines = () => [
    `${terminalText(evento.nombre)} · WATCHER`,
    trackLabel(track),
    ...panel("Tasa de esfuerzo", [
      `${equipo.nombre} · @${usuario} · Mesa ${equipo.mesa}`,
      ultimo
        ? `${ultimo.total.toLocaleString("es-ES")} tokens · ${ultimo.peticiones} peticiones`
        : "Esperando la primera lectura…",
      "Total = entrada + salida + caché leída + caché escrita",
      ...Object.entries(ultimo?.porHerramienta ?? {}).map(
        ([k, v]) => `${k}: ${v.toLocaleString("es-ES")} tokens`,
      ),
      ...(ultimo?.avisos ?? []),
      error ||
        (servidor ? `Sincronizado · ${servidor}` : "Solo local · sin envío"),
      "Claude Code y Codex · logs de este proyecto durante el build",
      `${pausa ? "PAUSA" : "EN DIRECTO"} · ciclo ${ciclos} · cada ${segundos} s`,
      "p pausa · q salir · Ctrl+C salir",
    ]).split("\n"),
  ];
  const draw = () => {
    if (cerrado) return;
    if (ctx.opts.json) {
      if (!opts.once)
        process.stderr.write(
          `${error || "Lectura completada"} · ${ultimo?.total ?? 0} tokens\n`,
        );
    } else if (tty) {
      const rows = lines()
        .slice(0, process.stdout.rows || 24)
        .map((l) => fit(l, process.stdout.columns || 80));
      process.stdout.write(
        `\x1b[H${rows.map((l) => l + "\x1b[K").join("\n")}\x1b[J`,
      );
    } else if (!opts.once) process.stdout.write(lines().join("\n") + "\n");
  };
  const tick = async () => {
    try {
      evento = await ctx.registro.evento();
      ultimo = await escanear({
        cwd: ctx.cwd,
        usuario,
        evento,
        servidor,
        token,
        enviados,
      });
      error = "";
      ciclos++;
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await olvidarSesion();
        token = undefined;
      }
      error =
        e instanceof Error ? e.message : "No se pudo leer o enviar el consumo.";
    }
    draw();
  };
  if (opts.once) {
    await tick();
    if (error)
      throw new CliError(
        "SYNC_PENDING",
        error,
        "Comprueba la conexión con el servidor y vuelve a ejecutar observar.",
        5,
      );
    salida(
      { ...ultimo, equipo: equipo.id, track: track.slug, ciclos },
      lines().join("\n"),
      ctx.opts.json,
    );
    return;
  }
  let terminar!: () => void;
  const done = new Promise<void>((r) => {
    terminar = r;
  });
  const quit = () => {
    cerrado = true;
    terminar();
  };
  const key = (buf: Buffer) => {
    const k = buf.toString();
    if (["q", "\x03", "\x04"].includes(k)) quit();
    if (k === "p") {
      pausa = !pausa;
      draw();
    }
  };
  const raw = process.stdin.isRaw;
  process.once("SIGINT", quit);
  process.once("SIGTERM", quit);
  if (tty) {
    process.stdout.write("\x1b[?1049h\x1b[?25l\x1b[2J");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", key);
  }
  let pending: Promise<void> | undefined;
  const start = () => {
    if (!pending && !pausa && !cerrado)
      pending = tick().finally(() => {
        pending = undefined;
      });
  };
  const timer = setInterval(start, segundos * 1000);
  try {
    start();
    await done;
    await pending;
  } finally {
    clearInterval(timer);
    process.off("SIGINT", quit);
    process.off("SIGTERM", quit);
    if (tty) {
      process.stdin.off("data", key);
      process.stdin.setRawMode(Boolean(raw));
      process.stdin.pause();
      process.stdout.write("\x1b[?25h\x1b[?1049l");
    }
  }
  salida(
    {
      ...ultimo,
      equipo: equipo.id,
      track: track.slug,
      ciclos,
      pendiente: Boolean(error),
    },
    `Watcher detenido · ${ultimo?.total ?? 0} tokens${error ? " · envío pendiente" : ""}`,
    ctx.opts.json,
  );
  if (error) process.exitCode = 5;
}
