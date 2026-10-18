import { fit, panel, paint, terminalText, fondo } from "./estilo";
import { cuentaAtras } from "./tiempo";
import { numeroRegistro, sello } from "./justificante";
import type { EstadoEvento } from "@hacknight/shared/actividad";
export interface EstadoPantalla extends EstadoEvento {
  pausa?: boolean;
  error?: string;
}
const digits: Record<string, string[]> = {
  "0": ["███", "█ █", "█ █", "█ █", "███"],
  "1": [" ██", "  █", "  █", "  █", "  █"],
  "2": ["███", "  █", "███", "█  ", "███"],
  "3": ["███", "  █", "███", "  █", "███"],
  "4": ["█ █", "█ █", "███", "  █", "  █"],
  "5": ["███", "█  ", "███", "  █", "███"],
  "6": ["███", "█  ", "███", "█ █", "███"],
  "7": ["███", "  █", "  █", "  █", "  █"],
  "8": ["███", "█ █", "███", "█ █", "███"],
  "9": ["███", "█ █", "███", "  █", "███"],
  ":": [" ", "█", " ", "█", " "],
};
export const digitos = (text: string) =>
  Array.from({ length: 5 }, (_, i) =>
    [...text].map((c) => digits[c]?.[i] ?? " ").join(" "),
  );
export function renderPantalla(
  s: EstadoPantalla,
  now = Date.now(),
  columns = 80,
): string[] {
  const reloj = cuentaAtras(s.evento.fin, now);
  const lines = [
    paint("magenta", fit(terminalText(s.evento.nombre), columns)),
    `Fin del build · Europe/Madrid · ${reloj.cerrado ? "PLAZO CERRADO" : reloj.texto}`,
    ...(columns >= 40 ? digitos(reloj.texto) : []),
  ];
  const rows = s.tracks
    .filter((t) => t.estado !== "fuera")
    .flatMap((t) => {
      const teams = s.equipos.filter((e) => e.herramienta === t.slug);
      return [
        `${t.glifo} V${t.ventanilla} ${t.nombre} · ${teams.length} squad(s) · ${t.estado}`,
        ...teams.map((team) => {
          const r = s.registros.find((r) => r.ficha.equipo === team.id);
          return `  ${team.nombre}: ${r ? "registrado · " + r.estado : "sin registro"}${r ? " · " + r.ficha.url : ""}`;
        }),
      ];
    });
  lines.push(...panel("Estado de los negociados", rows, columns).split("\n"));
  lines.push(
    ...panel(
      "Últimos registros",
      s.registros.length
        ? s.registros
            .slice(0, 3)
            .map(
              (r) =>
                `${numeroRegistro(r.numero)} · ${r.ficha.nombre}\n${r.ficha.herramienta} · ${r.estado} · ${r.ficha.url}`,
            )
        : ["Aún no hay registros."],
      columns,
    ).split("\n"),
  );
  if (s.registros.length) lines.push(...sello(s.evento, columns).split("\n"));
  const avisos = s.entradas.filter((e) => e.tipo === "aviso");
  lines.push(
    ...panel(
      "Avisos del comité",
      avisos.length ? avisos.slice(0, 3).map((e) => e.texto) : ["Sin avisos."],
      columns,
    ).split("\n"),
  );
  const feed = s.entradas.filter((e) => e.tipo !== "aviso");
  const tick = feed.length ? Math.floor(now / 8000) % feed.length : 0;
  lines.push(
    ...panel(
      "Tablón · ticker",
      feed.length
        ? [`${feed[tick]!.glifo} ${feed[tick]!.texto}`]
        : ["El tablón está abierto."],
      columns,
    ).split("\n"),
  );
  if (s.error) lines.push(terminalText(s.error));
  lines.push(
    `${s.pausa ? "PAUSA" : "EN DIRECTO"} · p pausa · q salir · ${terminalText(s.evento.organizan)}`,
  );
  return lines.map((l) => fit(l, Math.max(12, columns)));
}
// Mecánica portada del watcher/screen.ts MIT: frame puro, buffer alternativo,
// repintado solo de filas distintas y restauración de stdin/cursor.
export function diffFrame(previous: string[] | undefined, next: string[]) {
  if (!previous || previous.length !== next.length) return;
  return next.flatMap((line, row) =>
    line === previous[row] ? [] : [{ row, line }],
  );
}
export function frame(
  s: EstadoPantalla,
  columns: number,
  rows: number,
  now = Date.now(),
): string[] {
  const all = renderPantalla(s, now, columns);
  if (all.length <= rows) return all;
  const fixed = Math.min(7, Math.max(1, rows - 4));
  const room = Math.max(1, rows - fixed - 2);
  const body = all.slice(fixed, -1);
  const pages = Math.ceil(body.length / room);
  const page = Math.floor(now / 8000) % pages;
  const content = body.slice(page * room, (page + 1) * room);
  while (content.length < room) content.push("");
  return [
    ...all.slice(0, fixed),
    ...content,
    `Panel ${page + 1}/${pages} · cambia cada 8 s`,
    all.at(-1)!,
  ]
    .slice(0, rows)
    .map((l) => fit(l, columns));
}
export function startScreen(
  getState: () => EstadoPantalla,
  onQuit: () => void,
  onPause: () => void,
) {
  const out = process.stdout,
    stdin = process.stdin;
  let previous: string[] | undefined;
  const originalRaw = stdin.isRaw;
  let pausedAt: number | undefined;
  const draw = (force = false) => {
    const s = getState();
    if (s.pausa) pausedAt ??= Date.now();
    else pausedAt = undefined;
    const next = frame(
      s,
      out.columns || 80,
      out.rows || 24,
      pausedAt ?? Date.now(),
    );
    const changes = force ? undefined : diffFrame(previous, next);
    out.write(
      changes === undefined
        ? `\x1b[H${next.map((l) => paint("paper", l) + "\x1b[K").join("\n")}\x1b[J`
        : changes
            .map(
              ({ row, line }) =>
                `\x1b[${row + 1};1H${paint("paper", line)}\x1b[K`,
            )
            .join(""),
    );
    previous = next;
  };
  const key = (buf: Buffer) => {
    const k = buf.toString();
    if (k === "q" || k === "\x03" || k === "\x04") onQuit();
    else if (k === "p") {
      onPause();
      draw();
    }
  };
  const resize = () => draw(true);
  out.write(`\x1b[?1049h\x1b[?25l${fondo("nit")}\x1b[2J`);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.on("data", key);
  out.on("resize", resize);
  const timer = setInterval(draw, 1000);
  draw();
  return {
    stop: () => {
      clearInterval(timer);
      out.off("resize", resize);
      stdin.off("data", key);
      stdin.setRawMode(Boolean(originalRaw));
      stdin.pause();
      out.write(`${fondo()}\x1b[?25h\x1b[?1049l`);
    },
  };
}
