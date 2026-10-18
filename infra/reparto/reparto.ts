// The team draft: turns Luma's guest export into the teams infra/equipos
// expects. Pure logic, shared by the page and the tests.
import {
  equipoSchema,
  type Equipo,
  type Track,
} from "@hacknight/shared/modelo";

export type Persona = {
  id: string;
  nombre: string;
  // What they typed to accept the terms; often their real name.
  firma: string;
  estado: string;
  checkin: boolean;
  // The team they registered with; empty when they asked us to find one.
  equipo: string;
  habilidades: string[];
  tracks: string[];
  voluntaria: boolean;
  github: string;
  propuesta: string;
  enLuma: boolean;
};
export type Grupo = {
  id: string;
  nombre: string;
  track: string;
  pieza: string;
  mesa: string;
  capitan: string;
  miembros: string[];
};
export type Estado = {
  version: number;
  importado: string;
  personas: Record<string, Persona>;
  grupos: Grupo[];
};

export const estadoVacio = (): Estado => ({
  version: 0,
  importado: "",
  personas: {},
  grupos: [],
});

export const estados: Record<string, string> = {
  approved: "aprobada",
  declined: "rechazada",
  waitlist: "en lista de espera",
  pending_approval: "pendiente",
};

// Luma's question offers the Session 003 line-up titles; the CLI uses slugs.
const tracksLuma: Record<string, string> = {
  "Buscador de ayudas": "derechos",
  "Traductor de documentos": "claridad",
  "Verificador de webs y mensajes": "sello",
  "Asistente de trámites": "brujula",
  "Guía de las elecciones generales 2026": "como-voto",
  "Track libre": "libre",
};

// Header prefixes, so a reworded question tail doesn't break the import.
const columnas = {
  id: "guest_id",
  nombre: "name",
  estado: "approval_status",
  checkin: "checked_in_at",
  conEquipo: "¿Vienes con equipo",
  equipo: "Nombre del equipo",
  habilidades: "¿Qué haces mejor",
  tracks: "Tus tres tracks",
  capitan: "¿Te apetece capitanear",
  github: "Usuario de GitHub",
  propuesta: "Si quieres el track libre",
  firma: "Terms and Conditions",
};

// Luma exports profile URLs; the registry wants the bare handle.
export const usuario = (github: string) =>
  github
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "")
    .replace(/^@|\/+$/g, "");

// "Terreta Hub", "terretahub" and "TerretaHub" are the same team.
export const clave = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

export function leerCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    if (comillas) {
      if (c !== '"') campo += c;
      else if (texto[i + 1] === '"') {
        campo += c;
        i++;
      } else comillas = false;
    } else if (c === '"') comillas = true;
    else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      filas.push([...fila, campo]);
      fila = [];
      campo = "";
    } else campo += c;
  }
  if (campo || fila.length) filas.push([...fila, campo]);
  return filas;
}

function personas(csv: string): Persona[] {
  const [cabecera = [], ...filas] = leerCsv(csv.replace(/^﻿/, ""));
  const indice = Object.fromEntries(
    Object.entries(columnas).map(([k, inicio]) => {
      const i = cabecera.findIndex((h) => h.startsWith(inicio));
      if (i < 0)
        throw new Error(
          `El CSV no tiene la columna «${inicio}». ¿Es el export de invitados de Luma de esta noche?`,
        );
      return [k, i];
    }),
  ) as Record<keyof typeof columnas, number>;
  return filas
    .map((f) => {
      const v = (k: keyof typeof columnas) => (f[indice[k]] ?? "").trim();
      const lista = (k: keyof typeof columnas) =>
        v(k)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return {
        id: v("id"),
        nombre: v("nombre"),
        firma: v("firma"),
        estado: v("estado"),
        checkin: v("checkin") !== "",
        equipo: v("conEquipo").startsWith("Vengo") ? v("equipo") : "",
        habilidades: lista("habilidades"),
        tracks: lista("tracks").map((t) => tracksLuma[t] ?? t),
        voluntaria: v("capitan") === "Sí",
        github: v("github"),
        propuesta: v("propuesta"),
        enLuma: true,
      };
    })
    .filter((p) => p.id);
}

export const nuevoGrupo = (nombre: string): Grupo => ({
  id: crypto.randomUUID(),
  nombre,
  track: "",
  pieza: "",
  mesa: "",
  capitan: "",
  miembros: [],
});

// Luma is the source of truth for people; the groups are ours. Nobody is
// removed: whoever left Luma stays flagged, so their team shows the gap.
export function importar(estado: Estado, csv: string): Estado {
  const nuevas = Object.fromEntries(personas(csv).map((p) => [p.id, p]));
  for (const [id, p] of Object.entries(estado.personas))
    nuevas[id] ??= { ...p, enLuma: false };
  const grupos = structuredClone(estado.grupos);
  const enGrupo = new Set(grupos.flatMap((g) => g.miembros));
  for (const p of Object.values(nuevas)) {
    // Seed a team only when someone is newly approved, so a manual move
    // survives the next import.
    const k = clave(p.equipo);
    if (
      !k ||
      p.estado !== "approved" ||
      estado.personas[p.id]?.estado === "approved" ||
      enGrupo.has(p.id)
    )
      continue;
    let g = grupos.find(
      (o) =>
        clave(o.nombre) === k ||
        o.miembros.some((id) => clave(nuevas[id]?.equipo ?? "") === k),
    );
    if (!g) grupos.push((g = nuevoGrupo(p.equipo)));
    g.miembros.push(p.id);
  }
  capitanes(grupos, nuevas);
  return {
    ...estado,
    importado: new Date().toISOString(),
    personas: nuevas,
    grupos,
  };
}

// Whoever came with a team and offered to captain gets the ★, unless more
// than one of them did: then the committee picks.
function capitanes(grupos: Grupo[], personas: Record<string, Persona>) {
  for (const g of grupos) {
    if (g.miembros.includes(g.capitan)) continue;
    const quieren = g.miembros.filter(
      (id) => personas[id]?.voluntaria && personas[id]?.equipo,
    );
    g.capitan = quieren.length === 1 ? quieren[0]! : "";
  }
}

// Replaces the groups with an equipos.json, matching members by GitHub
// handle against the people already imported from Luma.
export function restaurar(estado: Estado, json: string) {
  let datos: unknown;
  try {
    datos = JSON.parse(json);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  const leido = equipoSchema.array().safeParse(datos);
  if (!leido.success) {
    const fallo = leido.error.issues[0];
    throw new Error(
      `No tiene el formato de equipos.json (${fallo?.path.join(".")}: ${fallo?.message}).`,
    );
  }
  const ids = new Map(
    Object.values(estado.personas)
      .filter((p) => p.github)
      .map((p) => [usuario(p.github).toLowerCase(), p.id]),
  );
  if (!ids.size)
    throw new Error(
      "Importa antes el CSV de Luma: los equipos se cruzan con sus personas por usuario de GitHub.",
    );
  const vistos = new Set<string>();
  const sueltos: string[] = [];
  const grupos = leido.data.map((e) => ({
    ...nuevoGrupo(e.nombre),
    track: e.herramienta,
    pieza: e.pieza,
    mesa: e.mesa,
    miembros: e.miembros.flatMap((m) => {
      const id = ids.get(usuario(m).toLowerCase());
      if (!id) sueltos.push(usuario(m));
      if (!id || vistos.has(id)) return [];
      vistos.add(id);
      return [id];
    }),
  }));
  capitanes(grupos, estado.personas);
  return { estado: { ...estado, grupos }, sueltos };
}

export function mover(estado: Estado, id: string, destino: string) {
  if (estado.grupos.some((g) => g.id === destino && g.miembros.includes(id)))
    return;
  for (const g of estado.grupos) {
    g.miembros = g.miembros.filter((m) => m !== id);
    if (g.capitan === id) g.capitan = "";
  }
  estado.grupos.find((g) => g.id === destino)?.miembros.push(id);
}

// Each squad on a track takes the next piece, as tracks/README.md asks.
export function piezaDe(g: Grupo, grupos: Grupo[], track?: Track) {
  const n = grupos.filter((o) => o.track === g.track).indexOf(g);
  return g.pieza.trim() || track?.piezas[n] || track?.piezas[0] || "";
}

// The committee's checklist from docs/equipos.md; warnings, not blockers.
export function avisos(g: Grupo, personas: Record<string, Persona>) {
  const ms = g.miembros.flatMap((id) => personas[id] ?? []);
  const lista: string[] = [];
  if (!g.track) lista.push("sin track");
  if (ms.length < 3 || ms.length > 5)
    lista.push(
      `${ms.length} persona${ms.length === 1 ? "" : "s"}; van de 3 a 5`,
    );
  if (!ms.some((p) => p.habilidades.includes("Frontend")))
    lista.push("nadie de front");
  if (!ms.some((p) => p.habilidades.some((h) => /^(IA|Data)/.test(h))))
    lista.push("nadie de datos/IA");
  if (!g.miembros.includes(g.capitan)) {
    const n = ms.filter((p) => p.voluntaria).length;
    lista.push(n > 1 ? `sin capitán; se ofrecen ${n}` : "sin capitán");
  }
  for (const p of ms)
    if (!p.enLuma || p.estado !== "approved")
      lista.push(
        `${p.nombre}: ${p.enLuma ? (estados[p.estado] ?? p.estado) : "ya no está en Luma"}`,
      );
  return lista;
}

// The registry format from apps/cli/README.md; validarEquipos has the last word.
export function aEquipos(estado: Estado, tracks: Track[]): Equipo[] {
  return estado.grupos.map((g, i) => {
    const nombre = g.nombre.trim() || `El equipo ${i + 1}`;
    const track = tracks.find((t) => t.slug === g.track);
    if (!track) throw new Error(`«${nombre}» no tiene track.`);
    if (!g.miembros.length) throw new Error(`«${nombre}» no tiene miembros.`);
    if (!g.nombre.trim()) throw new Error(`${nombre} no tiene nombre.`);
    const n = estado.grupos.filter((o) => o.track === g.track).indexOf(g);
    return {
      id: track.cupo === 1 ? track.slug : `${track.slug}-${"abcdefgh"[n]}`,
      nombre,
      herramienta: track.slug,
      pieza: piezaDe(g, estado.grupos, track) || track.nombre,
      mesa: g.mesa.trim() || String(i + 1),
      miembros: g.miembros.map((id) => {
        const p = estado.personas[id];
        if (!p?.github)
          throw new Error(
            `«${nombre}»: ${p?.nombre ?? id} no tiene usuario de GitHub.`,
          );
        return p.github;
      }),
      repo: "",
    };
  });
}
