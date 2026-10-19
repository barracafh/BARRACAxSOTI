// Replays the offline copies without internet: GET /<host>/<path>?<query>
// returns the stored response of https://<host>/<path>?<query>.
import { join } from "node:path";
import type { Entry } from "./lib/polite";

const root = import.meta.dir;
const port = Number(process.env.PORT ?? 8787);

/** Same key for the same request, whatever the order or encoding of the query. */
function key(url: URL) {
  const params = [...url.searchParams].sort(([a, x], [b, y]) =>
    a === b ? x.localeCompare(y) : a.localeCompare(b),
  );
  return `${url.host}${url.pathname.replace(/\/+$/, "")}?${new URLSearchParams(params)}`;
}

const routes = new Map<string, { entry: Entry; path: string }>();
const sources: Record<string, number> = {};
for await (const manifest of new Bun.Glob("*/raw/manifest.json").scan(root)) {
  const source = manifest.split("/")[0]!;
  const entries: Entry[] = await Bun.file(join(root, manifest)).json();
  for (const entry of entries)
    routes.set(key(new URL(entry.url)), {
      entry,
      path: join(root, source, "raw", entry.file),
    });
  sources[source] = entries.length;
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const cors = { "Access-Control-Allow-Origin": "*" };
    if (url.pathname === "/")
      return Response.json(
        {
          uso: `GET http://localhost:${port}/<host>/<ruta>?<consulta>`,
          ejemplo: `http://localhost:${port}/www.infosubvenciones.es/bdnstrans/api/regiones?vpd=GE`,
          fuentes: sources,
        },
        { headers: cors },
      );
    const original = new URL(`https:/${url.pathname}${url.search}`);
    const route = routes.get(key(original));
    if (!route)
      return Response.json(
        {
          error:
            "No está en la copia offline. Mira data-backup/<fuente>/raw/manifest.json.",
          url: original.href,
        },
        { status: 404, headers: cors },
      );
    return new Response(Bun.file(route.path), {
      status: route.entry.status,
      headers: {
        ...cors,
        "Content-Type": route.entry.contentType ?? "application/octet-stream",
        "X-Offline-Fetched-At": route.entry.fetchedAt,
      },
    });
  },
});

console.log(
  `Copia offline en http://localhost:${port} (${routes.size} respuestas).`,
);
