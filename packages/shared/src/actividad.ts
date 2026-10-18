import type {
  Registro,
  Evento,
  Equipo,
  Track,
  RegistroFicha,
  Issue,
} from "./modelo";
import { paleta } from "./paleta";
import type { Gestion } from "./registro/gestion";
export interface EstadoEvento {
  evento: Evento;
  tracks: Track[];
  equipos: Equipo[];
  registros: RegistroFicha[];
  entradas: Entrada[];
}
export interface Entrada {
  id: string;
  tipo: string;
  fecha: string;
  herramienta: string | null;
  glifo: string;
  texto: string;
  url: string;
}
export async function entradas(registro: Registro): Promise<Entrada[]> {
  const [issues, comite, registros, tracks, teams] = await Promise.all([
    registro.issues(),
    registro.comite(),
    registro.fichas(),
    registro.tracks(),
    registro.equipos(),
  ]);
  const pushes = await registro.pushes(teams);
  return componerEntradas(issues, comite, registros, pushes, tracks);
}
function componerEntradas(
  issues: Issue[],
  comite: string[],
  registros: RegistroFicha[],
  pushes: Awaited<ReturnType<Registro["pushes"]>>,
  tracks: Track[],
): Entrada[] {
  const out: Entrada[] = [];
  const glifo = (slug: string | null) =>
    tracks.find((t) => t.slug === slug)?.glifo ?? "·";
  for (const i of issues) {
    if (
      !i.etiquetas.includes("aviso") ||
      !comite.some((c) => c.toLowerCase() === i.autor.toLowerCase())
    )
      continue;
    out.push({
      id: `issue-${i.numero}`,
      tipo: "aviso",
      fecha: i.fecha,
      herramienta: null,
      glifo: glifo(null),
      texto: `@${i.autor}: ${i.cuerpo || i.titulo}`,
      url: i.url,
    });
  }
  for (const r of registros)
    out.push({
      id: `registro-${r.numero}`,
      tipo: "registro",
      fecha: r.fecha,
      herramienta: r.ficha.herramienta,
      glifo: glifo(r.ficha.herramienta),
      texto: `Registro ${r.ficha.nombre} · ${r.estado}`,
      url: r.ficha.url,
    });
  for (const p of pushes)
    out.push({
      id: `push-${p.id}`,
      tipo: "push",
      fecha: p.fecha,
      herramienta: p.herramienta,
      glifo: glifo(p.herramienta),
      texto: p.texto,
      url: p.url,
    });
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
export async function snapshot(
  registro: Registro,
  configuracion?: { evento: Evento; equipos: Equipo[]; comite: string[] },
): Promise<EstadoEvento> {
  const [evento, tracks, equipos, registros, issues, comite] =
    await Promise.all([
      configuracion?.evento ?? registro.evento(),
      registro.tracks(),
      configuracion?.equipos ?? registro.equipos(),
      registro.fichas(),
      registro.issues(),
      configuracion?.comite ?? registro.comite(),
    ]);
  const pushes = await registro.pushes(equipos);
  return {
    evento,
    tracks,
    equipos,
    registros: [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    entradas: componerEntradas(issues, comite, registros, pushes, tracks),
  };
}

// What the event web may show: a view switched off sends no data, and teams
// never list their members.
export function estadoPublico<Consumo>(
  estado: EstadoEvento,
  vistas: Gestion["vistas"],
  consumo: Consumo,
) {
  return {
    evento: estado.evento,
    vistas,
    paleta,
    tracks: vistas.negociados ? estado.tracks : [],
    equipos: vistas.negociados
      ? estado.equipos.map(({ miembros, ...equipo }) => equipo)
      : [],
    registros: vistas.tablon ? estado.registros : [],
    entradas: vistas.tablon ? estado.entradas : [],
    consumo,
  };
}
