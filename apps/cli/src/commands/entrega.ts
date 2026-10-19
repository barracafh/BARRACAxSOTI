import { consumoLocal } from "../consumo/local";
import { text, select, isCancel } from "@clack/prompts";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Contexto } from "../lib/contexto";
import { miEquipo } from "../lib/contexto";
import { leerFicha, validarFicha } from "../lib/ficha";
import { guardar } from "@buildnight/shared/io";
import { CliError, usage } from "@buildnight/shared/errors";
import { salida } from "../lib/output";
import { panel } from "../lib/estilo";
import { revisar, revisionTexto, revisionPublica } from "../lib/revision";
import { justificante, justificanteTexto } from "../lib/justificante";
import type { Ficha } from "@buildnight/shared/modelo";
async function ask(message: string, initialValue = "") {
  const v = await text({
    message,
    initialValue,
    validate: (v) => (v?.trim() ? undefined : "Campo obligatorio."),
  });
  if (isCancel(v))
    throw new CliError(
      "CANCELLED",
      "Trámite cancelado.",
      "Puedes retomarlo cuando quieras.",
      130,
    );
  return v;
}
export async function ficha(ctx: Contexto, accion?: string, desde?: string) {
  const tracks = await ctx.registro.tracks();
  if (accion === "validar") {
    const data = await leerFicha(ctx.cwd, tracks);
    return salida(
      data,
      panel("Ficha válida", [
        data.nombre,
        `track ${data.herramienta} · ${data.equipo}`,
        data.url,
      ]),
      ctx.opts.json,
    );
  }
  if (accion)
    throw usage("Subtrámite desconocido.", "Usa ficha o ficha validar.");
  if (desde) {
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(resolve(ctx.cwd, desde), "utf8"));
    } catch {
      throw usage("No se pudo leer --desde.", "Indica un JSON válido.");
    }
    const data = validarFicha(raw, tracks);
    await guardar(join(ctx.cwd, "ficha.json"), data);
    return salida(
      data,
      "Ficha guardada. Sigue con buildnight revisar.",
      ctx.opts.json,
    );
  }
  if (ctx.opts.json || !process.stdin.isTTY || !process.stdout.isTTY)
    throw usage(
      "Editar la ficha requiere datos explícitos sin TTY.",
      "Usa ficha --desde archivo.json o ficha validar.",
    );
  const { equipo, track } = await miEquipo(ctx);
  let old: Partial<Ficha> = {};
  try {
    old = JSON.parse(await readFile(join(ctx.cwd, "ficha.json"), "utf8"));
  } catch {}
  const herramienta = await select({
    message: "Negociado · track",
    initialValue: old.herramienta ?? track.slug,
    options: tracks
      .filter((t) => t.estado !== "fuera")
      .map((t) => ({
        value: t.slug,
        label: `${t.glifo} ${t.nombre} · Ventanilla ${t.ventanilla}`,
      })),
  });
  if (isCancel(herramienta))
    throw new CliError(
      "CANCELLED",
      "Trámite cancelado.",
      "Vuelve cuando quieras.",
      130,
    );
  const datos = await select({
    message: "Datos del proyecto (nunca personales reales)",
    options: [
      { value: "simulados", label: "Simulados" },
      { value: "reales", label: "Reales y públicos" },
    ],
    initialValue: old.datos ?? "simulados",
  });
  if (isCancel(datos))
    throw new CliError(
      "CANCELLED",
      "Trámite cancelado.",
      "Vuelve cuando quieras.",
      130,
    );
  let fuentes: unknown;
  try {
    fuentes = JSON.parse(
      await ask(
        'Fuentes JSON: [{"nombre":"BOE","url":"https://www.boe.es/"}]',
        JSON.stringify(old.fuentes ?? track.fuentes),
      ),
    );
  } catch (e) {
    if (e instanceof CliError) throw e;
    throw usage("Fuentes no es JSON válido.");
  }
  const data = validarFicha(
    {
      nombre: await ask("Nombre", old.nombre ?? track.nombre),
      frase: await ask("Frase", old.frase ?? track.frase),
      icono: await ask("Icono o glifo", old.icono ?? track.glifo),
      herramienta,
      equipo: equipo.id,
      url: await ask("URL pública", old.url ?? ""),
      fuentes,
      datos,
    },
    tracks,
  );
  await guardar(join(ctx.cwd, "ficha.json"), data);
  salida(
    data,
    "Ficha guardada. Apa! Sigue con buildnight revisar.",
    ctx.opts.json,
  );
}
export async function revision(ctx: Contexto) {
  const r = await revisar(ctx);
  if (!r.ok)
    throw new CliError(
      "VALIDATION",
      revisionTexto(r),
      "Corrige las reglas marcadas FALTA y repite revisar.",
      2,
      revisionPublica(r),
    );
  salida(
    revisionPublica(r),
    panel("Revisión completada", revisionTexto(r).split("\n")),
    ctx.opts.json,
  );
}
export async function registrar(ctx: Contexto) {
  const { equipo, track } = await miEquipo(ctx);
  const evento = await ctx.registro.evento();
  const r = await revisar(ctx);
  if (!r.ok || !r.ficha)
    throw new CliError(
      "VALIDATION",
      revisionTexto(r),
      "Subsanar antes de registrar.",
      2,
      revisionPublica(r),
    );
  if (r.ficha.equipo !== equipo.id || r.ficha.herramienta !== track.slug)
    throw new CliError(
      "NOT_ALLOWED",
      "La ficha no corresponde a tu squad y track asignados.",
      "Revisa ficha.json y equipos.json.",
      4,
    );
  const fecha = new Date().toISOString();
  const fueraDePlazo = Date.parse(fecha) > Date.parse(evento.fin);
  if (fueraDePlazo && !evento.registroFueraDePlazo)
    throw new CliError(
      "EVENT_CLOSED",
      "Presentado fuera de plazo. El registro está cerrado.",
      "Consulta al comité; evento.json no admite entregas tardías.",
      4,
    );
  const entry = await ctx.registro.registrar(r.ficha, fecha);
  const tasa = await consumoLocal(ctx.cwd, evento.inicio, evento.fin);
  const j = justificante(entry, track, fueraDePlazo, tasa.total || undefined);
  salida(j, justificanteTexto(j, track, evento), ctx.opts.json);
}
