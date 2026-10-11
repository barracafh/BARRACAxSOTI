import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Contexto } from "../lib/contexto";
import { snapshot } from "../commands/pantalla";
import { paleta } from "../lib/estilo";
import { AlmacenUso } from "./almacen";
import { loteSchema } from "./contrato";
import html from "../../web/index.html" with { type: "text" };
import css from "../../web/style.css" with { type: "text" };
import js from "../../web/app.js" with { type: "text" };

import { RegistroLocal } from "../registro/local";
import { administracion, ErrorGestion } from "../registro/gestion";
import {
  crearAdmin,
  claveAdministracion,
  cuerpoJson,
  ErrorHttp,
} from "./admin";
import adminHtml from "../../web/admin.html" with { type: "text" };
import adminJs from "../../web/admin.js" with { type: "text" };

export function crearHandler(
  ctx: Contexto,
  almacen: AlmacenUso,
  clave?: string,
) {
  if (!(ctx.registro instanceof RegistroLocal))
    throw new Error("Se requiere registro local");
  const registro = ctx.registro;
  const admin = crearAdmin(registro, clave);
  return async (req: Request) => {
    const url = new URL(req.url);
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const json = (data: unknown, status = 200) =>
      Response.json(data, { status, headers });
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
      return json({ error: "Host no permitido" }, 403);
    if (req.headers.get("origin") && req.headers.get("origin") !== url.origin)
      return json({ error: "Origen no permitido" }, 403);
    try {
      const adminResponse = await admin(req);
      if (adminResponse) return adminResponse;
      if (req.method === "GET" && url.pathname === "/api/estado") {
        const gestion = await administracion(registro);
        // Una revisión coherente para toda la respuesta, aunque se esté editando.
        const estable = Object.assign(Object.create(registro), registro, {
          evento: async () => gestion.evento,
          equipos: async () => gestion.equipos,
          comite: async () => gestion.comite,
        });
        const estado = await snapshot({ ...ctx, registro: estable });
        const { vistas } = gestion;
        const consumo = vistas.clasificacion
          ? almacen.clasificacion(estado.evento, estado.equipos, estado.tracks)
          : null;
        if (consumo && !vistas.personas) consumo.personas = [];
        return json({
          evento: estado.evento,
          vistas,
          paleta,
          tracks: vistas.negociados ? estado.tracks : [],
          equipos: vistas.negociados
            ? estado.equipos.map(({ miembros, ...equipo }) => equipo)
            : [],
          registros: vistas.tablon ? estado.registros : [],
          cola: vistas.ventanilla ? estado.cola : [],
          entradas: vistas.tablon ? estado.entradas : [],
          consumo,
        });
      }
      if (req.method === "POST" && url.pathname === "/api/uso") {
        const raw = await cuerpoJson(req);
        const parsed = loteSchema.safeParse(raw);
        if (!parsed.success)
          return json(
            {
              error:
                "Lote inválido; solo se admiten contadores del contrato v1",
            },
            400,
          );
        const [evento, equipos] = await Promise.all([
          ctx.registro.evento(),
          ctx.registro.equipos(),
        ]);
        try {
          return json({
            ok: true,
            ...almacen.recibir(parsed.data, evento, equipos),
          });
        } catch (e) {
          return json(
            { error: e instanceof Error ? e.message : "Lote rechazado" },
            422,
          );
        }
      }
      if (req.method === "GET") {
        if (
          url.pathname === "/pantalla" &&
          !(await administracion(registro)).vistas.pantalla
        )
          return new Response(
            "La pantalla está deshabilitada por el comité. Vuelve a la web del evento.",
            { status: 403, headers },
          );
        const assets: Record<string, [string, string]> = {
          "/admin": [String(adminHtml), "text/html; charset=utf-8"],
          "/admin.js": [adminJs, "text/javascript; charset=utf-8"],
          "/": [String(html), "text/html; charset=utf-8"],
          "/pantalla": [String(html), "text/html; charset=utf-8"],
          "/style.css": [css, "text/css; charset=utf-8"],
          "/app.js": [js, "text/javascript; charset=utf-8"],
          "/paleta.css": [
            `:root{${Object.entries(paleta)
              .map(([k, v]) => `--${k}:${v}`)
              .join(";")}}`,
            "text/css; charset=utf-8",
          ],
        };
        const asset = assets[url.pathname];
        if (asset)
          return new Response(asset[0], {
            headers: {
              ...headers,
              "Content-Type": asset[1],
              "Content-Security-Policy":
                "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
            },
          });
      }
      return json({ error: "Ruta no encontrada" }, 404);
    } catch (e) {
      if (e instanceof ErrorHttp || e instanceof ErrorGestion)
        return json({ error: e.message }, e.status);
      return json({ error: "No se pudo leer el registro local" }, 500);
    }
  };
}

export async function iniciarServidor(
  ctx: Contexto,
  options: {
    puerto: number;
    db: string;
  },
) {
  if (ctx.registro.tipo !== "local")
    throw new Error("El servidor de pruebas requiere --registro file:///…");
  await mkdir(dirname(options.db), { recursive: true });
  const almacen = new AlmacenUso(options.db);
  try {
    await snapshot(ctx);
    const admin = await claveAdministracion(
      (ctx.registro as RegistroLocal).dir,
    );
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: options.puerto,
      maxRequestBodySize: 256_000,
      fetch: crearHandler(ctx, almacen, admin.clave),
    });
    return {
      url: server.url.href,
      clavePath: admin.path,
      close: async () => {
        await server.stop(true);
        almacen.close();
      },
    };
  } catch (e) {
    almacen.close();
    throw e;
  }
}
