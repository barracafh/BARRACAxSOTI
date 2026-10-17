import type { Equipo, Evento, Track } from "./modelo";
import { totalUso, ventanaId } from "./contrato-uso";

// Usage summed by person, tool and one of 24 slices of the build window, so a
// store can hand over a few thousand rows instead of every request.
export type Parte = {
  usuario: string;
  herramienta: string;
  tramo: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  peticiones: number;
};

export function tramo(fecha: string, evento: Evento) {
  const inicio = Date.parse(evento.inicio),
    fin = Date.parse(evento.fin);
  return Math.min(
    23,
    Math.max(
      0,
      Math.floor(((Date.parse(fecha) - inicio) / (fin - inicio)) * 24),
    ),
  );
}

export function clasificar(
  partes: Parte[],
  ultimas: Map<string, number>,
  evento: Evento,
  equipos: Equipo[],
  tracks: Track[],
  now = Date.now(),
) {
  const personas = equipos.flatMap((e) =>
    e.miembros.map((usuario) => ({
      usuario,
      equipo: e.id,
      track: e.herramienta,
      total: 0,
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      peticiones: 0,
      ultima: ultimas.get(usuario.toLowerCase()) ?? null,
    })),
  );
  const herramientas = ["claude-code", "codex"].map((id) => ({
    id,
    total: 0,
    peticiones: 0,
  }));
  const personaPorUsuario = new Map(
    personas.map((p) => [p.usuario.toLowerCase(), p]),
  );
  const herramientaPorId = new Map(herramientas.map((h) => [h.id, h]));
  const inicio = Date.parse(evento.inicio),
    fin = Date.parse(evento.fin);
  const evolucion = Array.from({ length: 24 }, (_, i) => ({
    inicio: new Date(inicio + ((fin - inicio) * i) / 24).toISOString(),
    total: 0,
  }));
  for (const u of partes) {
    const p = personaPorUsuario.get(u.usuario);
    if (!p) continue;
    const total = totalUso(u);
    for (const key of ["input", "output", "cacheRead", "cacheWrite"] as const)
      p[key] += u[key];
    p.total += total;
    p.peticiones += u.peticiones;
    const h = herramientaPorId.get(u.herramienta);
    if (h) {
      h.total += total;
      h.peticiones += u.peticiones;
    }
    evolucion[u.tramo]!.total += total;
  }
  const ordenar = <T extends { total: number }>(rows: T[]) =>
    rows.sort((a, b) => b.total - a.total);
  const squads = ordenar(
    equipos.map((e) => {
      const miembros = personas.filter((p) => p.equipo === e.id);
      return {
        id: e.id,
        nombre: e.nombre,
        track: e.herramienta,
        pieza: e.pieza,
        mesa: e.mesa,
        total: miembros.reduce((s, p) => s + p.total, 0),
        peticiones: miembros.reduce((s, p) => s + p.peticiones, 0),
        activos: miembros.filter((p) => p.ultima && now - p.ultima < 90000)
          .length,
      };
    }),
  );
  return {
    ventana: ventanaId(evento),
    generado: now,
    total: personas.reduce((s, p) => s + p.total, 0),
    input: personas.reduce((s, p) => s + p.input, 0),
    output: personas.reduce((s, p) => s + p.output, 0),
    cacheRead: personas.reduce((s, p) => s + p.cacheRead, 0),
    cacheWrite: personas.reduce((s, p) => s + p.cacheWrite, 0),
    peticiones: personas.reduce((s, p) => s + p.peticiones, 0),
    activos: personas.filter((p) => p.ultima && now - p.ultima < 90000).length,
    squads,
    personas: ordenar(personas),
    herramientas: ordenar(herramientas),
    evolucion,
    tracks: ordenar(
      tracks
        .filter((t) => t.estado !== "fuera")
        .map((t) => ({
          slug: t.slug,
          nombre: t.nombre,
          total: squads
            .filter((s) => s.track === t.slug)
            .reduce((s, e) => s + e.total, 0),
        })),
    ),
  };
}
