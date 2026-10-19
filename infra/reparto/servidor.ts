import { mkdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { root } from "../common";
import { leerTracks, validarEquipos } from "../equipos/preparar";
import { escribir, guardar, leer } from "./almacen";
import pagina from "./index.html";

const puerto = 4312;
// Guest data: outside Git, like the Luma CSV it comes from.
const dir = join(root, ".reparto");
const archivoEstado = join(dir, "estado.json");
const archivoEquipos = join(dir, "equipos.json");
const tracks = await leerTracks();
await mkdir(dir, { recursive: true });

// Only this machine's own page: no other Host (DNS rebinding), no other site.
const propios = [`127.0.0.1:${puerto}`, `localhost:${puerto}`];
function ajena(req: Request) {
  const origen = req.headers.get("origin");
  return (
    !propios.includes(req.headers.get("host") ?? "") ||
    (origen !== null && !propios.some((p) => origen === `http://${p}`))
  );
}
const prohibido = () => new Response(null, { status: 403 });

Bun.serve({
  hostname: "127.0.0.1",
  port: puerto,
  // Bundle the page once at start: hot reload only adds a socket and flakiness.
  development: false,
  routes: {
    "/": pagina,
    "/api/estado": {
      GET: async (req) =>
        ajena(req)
          ? prohibido()
          : Response.json({ estado: await leer(archivoEstado), tracks }),
      PUT: async (req) => {
        if (ajena(req)) return prohibido();
        const nuevo = await req.json().catch(() => null);
        if (
          typeof nuevo?.version !== "number" ||
          !Array.isArray(nuevo.grupos) ||
          typeof nuevo.personas !== "object"
        )
          return Response.json({ error: "Estado no válido." }, { status: 400 });
        const { conflicto, estado } = await guardar(archivoEstado, nuevo);
        return conflicto
          ? Response.json(estado, { status: 409 })
          : Response.json({ version: estado.version });
      },
    },
    "/api/exportar": {
      POST: async (req) => {
        if (ajena(req)) return prohibido();
        try {
          const equipos = validarEquipos(await req.json(), tracks);
          await escribir(archivoEquipos, equipos);
          return Response.json({
            ruta: relative(root, archivoEquipos),
            equipos,
          });
        } catch (error) {
          return Response.json(
            { error: (error as Error).message },
            { status: 400 },
          );
        }
      },
    },
  },
});

console.log(
  `Reparto en http://127.0.0.1:${puerto} · estado en ${relative(root, archivoEstado)}`,
);
