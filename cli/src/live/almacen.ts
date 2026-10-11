import { Database } from "bun:sqlite";
import type { Equipo, Evento, Track } from "../lib/modelo";
import { totalUso, ventanaId, type Lote, type EventoUso } from "./contrato";

type Fila = EventoUso & { usuario: string };
export class AlmacenUso {
  private db: Database;
  constructor(path: string) {
    this.db = new Database(path, { create: true });
    this.db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS usos (
        ventana TEXT, usuario TEXT, id TEXT, herramienta TEXT, fecha TEXT,
        input INTEGER, output INTEGER, cacheRead INTEGER, cacheWrite INTEGER,
        PRIMARY KEY(ventana, usuario, id));
      CREATE TABLE IF NOT EXISTS watchers (
        ventana TEXT, usuario TEXT, cliente TEXT, ultima INTEGER,
        PRIMARY KEY(ventana, usuario, cliente));`);
  }
  close() {
    this.db.close();
  }
  recibir(lote: Lote, evento: Evento, equipos: Equipo[], now = Date.now()) {
    if (lote.ventana !== ventanaId(evento))
      throw new Error(
        "La ventana del watcher no coincide con el evento del servidor.",
      );
    const usuario = lote.usuario.toLowerCase();
    if (
      !equipos.some((e) => e.miembros.some((m) => m.toLowerCase() === usuario))
    )
      throw new Error("El usuario no está asignado a un squad del registro.");
    const inicio = Date.parse(evento.inicio),
      fin = Date.parse(evento.fin);
    if (
      lote.eventos.some(
        (e) =>
          Date.parse(e.fecha) < inicio ||
          Date.parse(e.fecha) >= fin ||
          Date.parse(e.fecha) > now + 5000,
      )
    )
      throw new Error("Hay contadores fuera de la ventana del build.");
    const upsert = this.db.query(`INSERT INTO usos VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(ventana,usuario,id) DO UPDATE SET
        input=excluded.input, output=excluded.output, cacheRead=excluded.cacheRead, cacheWrite=excluded.cacheWrite
      WHERE usos.herramienta=excluded.herramienta AND usos.fecha=excluded.fecha
        AND excluded.input+excluded.output+excluded.cacheRead+excluded.cacheWrite > usos.input+usos.output+usos.cacheRead+usos.cacheWrite`);
    let cambios = 0;
    this.db.transaction(() => {
      for (const e of lote.eventos)
        cambios += upsert.run(
          lote.ventana,
          usuario,
          e.id,
          e.herramienta,
          e.fecha,
          e.input,
          e.output,
          e.cacheRead,
          e.cacheWrite,
        ).changes;
      this.db
        .query(
          `INSERT INTO watchers VALUES (?,?,?,?) ON CONFLICT(ventana,usuario,cliente) DO UPDATE SET ultima=excluded.ultima`,
        )
        .run(lote.ventana, usuario, lote.cliente, now);
    })();
    return { recibidos: lote.eventos.length, cambios };
  }
  clasificacion(
    evento: Evento,
    equipos: Equipo[],
    tracks: Track[],
    now = Date.now(),
  ) {
    const ventana = ventanaId(evento);
    const usos = this.db
      .query<Fila, [string]>("SELECT * FROM usos WHERE ventana=?")
      .all(ventana);
    const watchers = this.db
      .query<
        { usuario: string; ultima: number },
        [string]
      >("SELECT usuario, MAX(ultima) AS ultima FROM watchers WHERE ventana=? GROUP BY usuario")
      .all(ventana);
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
        ultima:
          watchers.find((w) => w.usuario === usuario.toLowerCase())?.ultima ??
          null,
      })),
    );
    const herramientas = ["claude-code", "codex"].map((id) => ({
      id,
      total: 0,
      peticiones: 0,
    }));
    const inicio = Date.parse(evento.inicio),
      fin = Date.parse(evento.fin);
    const evolucion = Array.from({ length: 24 }, (_, i) => ({
      inicio: new Date(inicio + ((fin - inicio) * i) / 24).toISOString(),
      total: 0,
    }));
    for (const u of usos) {
      const p = personas.find((p) => p.usuario.toLowerCase() === u.usuario);
      if (!p) continue;
      const total = totalUso(u);
      for (const key of ["input", "output", "cacheRead", "cacheWrite"] as const)
        p[key] += u[key];
      p.total += total;
      p.peticiones++;
      const h = herramientas.find((h) => h.id === u.herramienta)!;
      h.total += total;
      h.peticiones++;
      const i = Math.min(
        23,
        Math.max(
          0,
          Math.floor(((Date.parse(u.fecha) - inicio) / (fin - inicio)) * 24),
        ),
      );
      evolucion[i]!.total += total;
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
      ventana,
      generado: now,
      total: personas.reduce((s, p) => s + p.total, 0),
      input: personas.reduce((s, p) => s + p.input, 0),
      output: personas.reduce((s, p) => s + p.output, 0),
      cacheRead: personas.reduce((s, p) => s + p.cacheRead, 0),
      cacheWrite: personas.reduce((s, p) => s + p.cacheWrite, 0),
      peticiones: personas.reduce((s, p) => s + p.peticiones, 0),
      activos: personas.filter((p) => p.ultima && now - p.ultima < 90000)
        .length,
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
}
