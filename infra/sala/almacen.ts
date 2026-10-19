import { neon } from "@neondatabase/serverless";
import type { Parte } from "@buildnight/shared/clasificacion";
import {
  totalUso,
  ventanaId,
  type Lote,
} from "@buildnight/shared/contrato-uso";
import type { Evento } from "@buildnight/shared/modelo";

// One statement with positional parameters; returns its rows.
export type Consulta = (
  texto: string,
  params?: unknown[],
) => Promise<Record<string, unknown>[]>;

let base: Consulta | undefined;
export function postgres(): Consulta | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const sql = neon(url);
  return (base ??= (texto, params = []) =>
    sql.query(texto, params) as Promise<Record<string, unknown>[]>);
}

// The same tables as the local SQLite store.
const esquema = [
  `CREATE TABLE IF NOT EXISTS usos (
    ventana text, usuario text, id text, herramienta text, fecha timestamptz,
    input bigint, output bigint, cache_read bigint, cache_write bigint,
    PRIMARY KEY (ventana, usuario, id))`,
  `CREATE TABLE IF NOT EXISTS watchers (
    ventana text, usuario text, cliente text, ultima bigint,
    PRIMARY KEY (ventana, usuario, cliente))`,
];
let listo: Promise<void> | undefined;
const preparar = (q: Consulta) =>
  (listo ??= (async () => {
    for (const s of esquema) await q(s);
  })().catch((e) => {
    listo = undefined;
    throw e;
  }));

// A repeated request keeps its largest counters, as in the local store.
export async function guardar(
  q: Consulta,
  lote: Lote,
  usuario: string,
  now = Date.now(),
) {
  await preparar(q);
  const unicos = new Map<string, Lote["eventos"][number]>();
  for (const e of lote.eventos) {
    const previo = unicos.get(e.id);
    if (!previo || totalUso(e) > totalUso(previo)) unicos.set(e.id, e);
  }
  const eventos = [...unicos.values()];
  let cambios = 0;
  if (eventos.length)
    cambios = (
      await q(
        `INSERT INTO usos
        SELECT $1, $2, * FROM unnest($3::text[], $4::text[], $5::timestamptz[],
          $6::bigint[], $7::bigint[], $8::bigint[], $9::bigint[])
        ON CONFLICT (ventana, usuario, id) DO UPDATE SET
          input = excluded.input, output = excluded.output,
          cache_read = excluded.cache_read, cache_write = excluded.cache_write
        WHERE usos.herramienta = excluded.herramienta
          AND excluded.input + excluded.output + excluded.cache_read + excluded.cache_write
            > usos.input + usos.output + usos.cache_read + usos.cache_write
        RETURNING 1`,
        [
          lote.ventana,
          usuario,
          eventos.map((e) => e.id),
          eventos.map((e) => e.herramienta),
          eventos.map((e) => e.fecha),
          eventos.map((e) => e.input),
          eventos.map((e) => e.output),
          eventos.map((e) => e.cacheRead),
          eventos.map((e) => e.cacheWrite),
        ],
      )
    ).length;
  await q(
    `INSERT INTO watchers VALUES ($1, $2, $3, $4)
    ON CONFLICT (ventana, usuario, cliente) DO UPDATE SET ultima = excluded.ultima`,
    [lote.ventana, usuario, lote.cliente, now],
  );
  return { recibidos: lote.eventos.length, cambios };
}

// Sums by person, tool and slice of the window: a few thousand rows at most.
export async function leer(q: Consulta, evento: Evento) {
  await preparar(q);
  const ventana = ventanaId(evento);
  const segundos = (Date.parse(evento.fin) - Date.parse(evento.inicio)) / 1000;
  const [partes, watchers] = await Promise.all([
    q(
      `SELECT usuario, herramienta,
        LEAST(23, GREATEST(0, floor(extract(epoch FROM fecha - $2::timestamptz) / $3 * 24)))::int AS tramo,
        sum(input)::float8 AS input, sum(output)::float8 AS output,
        sum(cache_read)::float8 AS "cacheRead", sum(cache_write)::float8 AS "cacheWrite",
        count(*)::int AS peticiones
      FROM usos WHERE ventana = $1 GROUP BY 1, 2, 3`,
      [ventana, evento.inicio, segundos],
    ),
    q(
      `SELECT usuario, max(ultima)::float8 AS ultima FROM watchers
      WHERE ventana = $1 GROUP BY usuario`,
      [ventana],
    ),
  ]);
  return {
    partes: partes as Parte[],
    ultimas: new Map(
      watchers.map((w) => [w.usuario as string, w.ultima as number]),
    ),
  };
}
