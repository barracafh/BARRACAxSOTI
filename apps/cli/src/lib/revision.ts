import { readFile, lstat } from "node:fs/promises";
import { join } from "node:path";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ejecutar } from "./proceso";
import { leerFicha } from "./ficha";
import { detectar, type Hallazgo } from "./detectores";
import { CliError } from "@hacknight/shared/errors";
import type { Contexto } from "./contexto";
import type { Ficha } from "@hacknight/shared/modelo";
export interface Regla {
  numero: number;
  nombre: string;
  ok: boolean;
  detalle: string;
}
export interface Revision {
  ok: boolean;
  reglas: Regla[];
  avisos: string[];
  hallazgos: Hallazgo[];
  ficha: Ficha | null;
}
export const oficial = (url: string) => {
  try {
    const h = new URL(url).hostname;
    return [
      "gob.es",
      "gva.es",
      "valencia.es",
      "boe.es",
      "ine.es",
      "juntaelectoralcentral.es",
      "correos.es",
      "infosubvenciones.es",
      "incibe.es",
    ].some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
};
export function direccionPublica(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".invalid")
  )
    return false;
  if (isIP(h) === 4) {
    const [a, b] = h.split(".").map(Number);
    return (
      a !== 0 &&
      a !== 10 &&
      a !== 127 &&
      a !== 169 &&
      !(a === 172 && b! >= 16 && b! <= 31) &&
      !(a === 192 && b === 168) &&
      !(a === 100 && b! >= 64 && b! <= 127) &&
      a! < 224
    );
  }
  if (isIP(h) === 6) return !/^(::|f[cd]|fe[89ab])/.test(h);
  return h.includes(".");
}
export async function comprobarUrl(
  raw: string,
  local: boolean,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  let u = new URL(raw);
  const signal = AbortSignal.timeout(5000);
  for (let n = 0; n < 5; n++) {
    if (!/^https?:$/.test(u.protocol) || u.username || u.password)
      throw new Error("URL inválida");
    if (!local) {
      if (!direccionPublica(u.hostname))
        throw new Error("La URL debe ser pública");
      const addresses = await lookup(u.hostname, { all: true });
      if (
        !addresses.length ||
        addresses.some((a) => !direccionPublica(a.address))
      )
        throw new Error("La URL apunta a una red privada");
    }
    const res = await fetcher(u, { signal, redirect: "manual", method: "GET" });
    await res.body?.cancel();
    if (res.status >= 200 && res.status < 300) return `HTTP ${res.status}`;
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      u = new URL(location, u);
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("Demasiadas redirecciones");
}
export async function revisar(
  ctx: Contexto,
  fetcher: typeof fetch = fetch,
): Promise<Revision> {
  const tracks = await ctx.registro.tracks();
  const reglas: Regla[] = [];
  const avisos: string[] = [];
  let ficha: Ficha | null = null;
  try {
    ficha = await leerFicha(ctx.cwd, tracks);
  } catch (e) {
    if (!(e instanceof CliError)) throw e;
  }
  let marker = false;
  try {
    const m = JSON.parse(
      await readFile(join(ctx.cwd, ".hacknight/plantilla.json"), "utf8"),
    );
    marker = m.plantilla === "hacknight" && typeof m.version === "string";
  } catch {}
  reglas.push({
    numero: 1,
    nombre: "Plantilla",
    ok: marker,
    detalle: marker
      ? "Marcador de plantilla presente."
      : "Falta .hacknight/plantilla.json válido (plantilla y version).",
  });
  let urlOK = false;
  let urlDetalle = "Falta una URL en una ficha válida.";
  if (ficha)
    try {
      urlDetalle = await comprobarUrl(
        ficha.url,
        ctx.registro.tipo === "local",
        fetcher,
      );
      urlOK = true;
    } catch (e) {
      urlDetalle =
        e instanceof Error && /timeout|abort/i.test(e.name + " " + e.message)
          ? "Silencio administrativo (sentido negativo). Vuelva a intentarlo."
          : `La URL no responde con 2xx${e instanceof Error && e.message.startsWith("HTTP ") ? ": " + e.message : "."}`;
    }
  reglas.push({
    numero: 2,
    nombre: "URL pública",
    ok: urlOK,
    detalle: urlDetalle,
  });
  reglas.push({
    numero: 3,
    nombre: "Ficha",
    ok: Boolean(ficha),
    detalle: ficha
      ? "Ficha válida contra ficha.schema.json."
      : "Ejecuta ficha validar para ver los campos pendientes.",
  });
  const fuentesOK = Boolean(
    ficha?.fuentes.length &&
      ficha.fuentes.every((f) => f.url.startsWith("https://")),
  );
  reglas.push({
    numero: 4,
    nombre: "Fuentes",
    ok: fuentesOK,
    detalle: fuentesOK
      ? "Fuentes citadas con HTTPS."
      : "Añade al menos una fuente con HTTPS.",
  });
  if (ficha && !ficha.fuentes.some((f) => oficial(f.url)))
    avisos.push(
      "No se reconoce ningún dominio oficial entre las fuentes; revísalas.",
    );
  const hallazgos: Hallazgo[] = [];
  const textos: { archivo: string; texto: string }[] = [];
  let scanOK = true;
  let scanDetalle =
    "Archivos versionados analizados; es una comprobación heurística.";
  try {
    const files = (
      await ejecutar(["git", "ls-files", "-z"], undefined, ctx.cwd)
    )
      .split("\0")
      .filter(Boolean);
    if (!files.length) {
      scanOK = false;
      scanDetalle =
        "No hay archivos versionados. Añade el proyecto con git add.";
    }
    if (ficha && !files.includes("ficha.json")) files.push("ficha.json");
    // The committee's verified material in every team repo is full of official
    // phone lines and mailboxes, which the heuristic reads as personal data.
    const material = files.filter((f) =>
      /^(?:datos\/|comun\/|contexto\.md$|SETUP\.md$)/.test(f),
    );
    if (material.length)
      avisos.push(
        "datos/, comun/, contexto.md y SETUP.md son material de la organización y no se analizan; vuestros datos, en otra carpeta.",
      );
    for (const archivo of files.filter((f) => !material.includes(f))) {
      const path = join(ctx.cwd, archivo);
      try {
        const stat = await lstat(path);
        if (stat.isSymbolicLink()) {
          scanOK = false;
          avisos.push(`Enlace simbólico sin analizar: ${archivo}`);
          continue;
        }
        const bytes = await readFile(path);
        const texto = bytes.toString("utf8");
        hallazgos.push(...detectar(texto, archivo));
        if (!bytes.includes(0)) textos.push({ archivo, texto });
        else
          avisos.push(
            `Binario: revisa manualmente ${archivo}; el análisis no extrae texto de PDFs ni imágenes.`,
          );
      } catch {
        scanOK = false;
        avisos.push(`No se pudo analizar ${archivo}.`);
      }
    }
  } catch {
    scanOK = false;
    scanDetalle =
      "No se pudo enumerar el repositorio Git. Ejecuta git init y git add.";
  }
  if (ficha) {
    // El registro publica estos valores decodificados, no los escapes del JSON original.
    for (const hallazgo of detectar(JSON.stringify(ficha), "ficha.json"))
      if (
        !hallazgos.some(
          (h) => h.archivo === hallazgo.archivo && h.tipo === hallazgo.tipo,
        )
      )
        hallazgos.push(hallazgo);
  }
  reglas.push({
    numero: 5,
    nombre: "Datos personales",
    ok: scanOK && hallazgos.length === 0,
    detalle: hallazgos.length
      ? `${hallazgos.length} indicio(s). Elimina o sustituye los datos antes de publicar.`
      : scanDetalle,
  });
  const codigo = textos.filter(
    (t) =>
      /\.(?:[cm]?[jt]sx?|html?|vue|svelte|astro)$/i.test(t.archivo) &&
      !/(^|\/)(?:test|tests|__tests__|node_modules)\//.test(t.archivo) &&
      !/[.-](test|spec)\./.test(t.archivo),
  );
  const boton = codigo.some(
    (t) =>
      t.texto.includes("¿Algo está mal? Avísanos") ||
      /<(?:Avisanos|BotonAviso)\b/.test(t.texto),
  );
  reglas.push({
    numero: 6,
    nombre: "Botón de aviso",
    ok: boton,
    detalle: boton
      ? "Texto o componente de aviso encontrado."
      : "Añade «¿Algo está mal? Avísanos» o <BotonAviso /> al código versionado.",
  });
  if (
    ficha?.herramienta === "sello" &&
    !textos.some((t) =>
      /(dominios-oficiales|lista-blanca)\.json$/.test(t.archivo),
    )
  )
    avisos.push(
      "Sello: falta dominios-oficiales.json (lista blanca de dominios).",
    );
  if (ficha?.herramienta === "como-voto") {
    const dated = textos.filter((t) =>
      /(?:\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b|\b20\d{2}-\d{2}-\d{2}\b)/.test(
        t.texto,
      ),
    );
    if (
      !dated.length ||
      dated.some(
        (t) =>
          !/https:\/\/(?:www\.)?(?:boe\.es|juntaelectoralcentral\.es)\//.test(
            t.texto,
          ),
      )
    )
      avisos.push(
        "¿Cómo voto?: revisa cada fecha y enlázala al BOE o a la Junta Electoral; la comprobación por archivo no acredita cada cita.",
      );
  }
  if (ficha?.herramienta === "claridad")
    avisos.push(
      "Claridad: confirma que los PDFs de ejemplo son convocatorias públicas o simuladas, nunca notificaciones personales.",
    );
  return { ok: reglas.every((r) => r.ok), reglas, avisos, hallazgos, ficha };
}
export function revisionTexto(r: Revision) {
  return [
    "Requerimiento de subsanación",
    ...r.reglas.map(
      (x) =>
        `${x.numero}. [${x.ok ? "OK" : "FALTA"}] ${x.nombre}: ${x.detalle}`,
    ),
    ...r.hallazgos.map((h) => `${h.archivo}:${h.linea} · ${h.valor}`),
    ...r.avisos.map((a) => `Aviso: ${a}`),
  ].join("\n");
}

// La ficha se usa internamente para registrar; nunca se reimprime en un informe.
export function revisionPublica({ ficha: _, ...informe }: Revision) {
  return informe;
}
