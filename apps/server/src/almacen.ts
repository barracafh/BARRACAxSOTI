import { Database } from "bun:sqlite";
import type { Equipo, Evento, Track } from "@buildnight/shared/modelo";
import {
  validarLote,
  ventanaId,
  type Lote,
  type EventoUso,
} from "@buildnight/shared/contrato-uso";
import { clasificar, tramo } from "@buildnight/shared/clasificacion";

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
    const usuario = validarLote(lote, evento, equipos, now);
    const upsert = this.db.query(`INSERT INTO usos VALUES (?,?,?,?,?,?,?,?,?)
      ON CONFLICT(ventana,usuario,id) DO UPDATE SET
        input=excluded.input, output=excluded.output, cacheRead=excluded.cacheRead, cacheWrite=excluded.cacheWrite
      WHERE usos.herramienta=excluded.herramienta
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
    const watchers = this.db
      .query<
        { usuario: string; ultima: number },
        [string]
      >("SELECT usuario, MAX(ultima) AS ultima FROM watchers WHERE ventana=? GROUP BY usuario")
      .all(ventana);
    const usos = this.db
      .query<Fila, [string]>("SELECT * FROM usos WHERE ventana=?")
      .all(ventana);
    return clasificar(
      usos.map((u) => ({ ...u, tramo: tramo(u.fecha, evento), peticiones: 1 })),
      new Map(watchers.map((w) => [w.usuario, w.ultima])),
      evento,
      equipos,
      tracks,
      now,
    );
  }
}
