import { z } from "zod";
import type {
  Registro,
  Evento,
  Equipo,
  Track,
  RegistroFicha,
  Issue,
} from "./modelo";
import { cola, type Cita } from "./cola";
export interface EstadoEvento {
  evento: Evento;
  tracks: Track[];
  equipos: Equipo[];
  registros: RegistroFicha[];
  cola: Cita[];
  entradas: Entrada[];
}
export async function obtenerCola(registro: Registro) {
  const [issues, teams, tracks] = await Promise.all([
    registro.issues(),
    registro.equipos(),
    registro.tracks(),
  ]);
  return cola(issues, teams, tracks);
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
  return componerEntradas(issues, comite, registros, pushes, tracks, teams);
}
function componerEntradas(
  issues: Issue[],
  comite: string[],
  registros: RegistroFicha[],
  pushes: Awaited<ReturnType<Registro["pushes"]>>,
  tracks: Track[],
  teams: Equipo[],
): Entrada[] {
  const out: Entrada[] = [];
  const glifo = (slug: string | null) =>
    tracks.find((t) => t.slug === slug)?.glifo ?? "·";
  for (const i of issues) {
    const aviso =
      i.etiquetas.includes("aviso") &&
      comite.some((c) => c.toLowerCase() === i.autor.toLowerCase());
    if (i.etiquetas.includes("aviso") && !aviso) continue;
    if (!aviso && !i.etiquetas.includes("tablon")) continue;
    const track =
      teams.find((t) =>
        t.miembros.some((m) => m.toLowerCase() === i.autor.toLowerCase()),
      )?.herramienta ?? null;
    let texto = i.cuerpo || i.titulo;
    try {
      const parsed = z
        .object({ texto: z.string() })
        .safeParse(JSON.parse(i.cuerpo));
      if (parsed.success) texto = parsed.data.texto;
    } catch {}
    out.push({
      id: `issue-${i.numero}`,
      tipo: aviso ? "aviso" : "publicacion",
      fecha: i.fecha,
      herramienta: track,
      glifo: glifo(track),
      texto: `@${i.autor}: ${texto}`,
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
export async function snapshot(registro: Registro): Promise<EstadoEvento> {
  const [evento, tracks, equipos, registros, issues, comite] =
    await Promise.all([
      registro.evento(),
      registro.tracks(),
      registro.equipos(),
      registro.fichas(),
      registro.issues(),
      registro.comite(),
    ]);
  const pushes = await registro.pushes(equipos);
  return {
    evento,
    tracks,
    equipos,
    registros: [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    cola: cola(issues, equipos, tracks),
    entradas: componerEntradas(
      issues,
      comite,
      registros,
      pushes,
      tracks,
      equipos,
    ),
  };
}
