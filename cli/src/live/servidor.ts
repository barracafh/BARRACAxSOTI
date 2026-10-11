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

export interface Simulacion {
  estado(): { automatica: boolean };
  accion(accion: "pausar" | "reanudar" | "impulso"): Promise<void>;
}

export function crearHandler(
  ctx: Contexto,
  almacen: AlmacenUso,
  demo = false,
  simulacion?: Simulacion,
) {
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
      if (req.method === "GET" && url.pathname === "/api/estado") {
        const estado = await snapshot(ctx);
        return json({
          ...estado,
          demo,
          simulacion: simulacion?.estado(),
          paleta,
          consumo: almacen.clasificacion(
            estado.evento,
            estado.equipos,
            estado.tracks,
          ),
        });
      }
      if (req.method === "POST" && url.pathname === "/api/demo" && simulacion) {
        if (Number(req.headers.get("content-length")) > 100)
          return json({ error: "Petición demasiado grande" }, 413);
        const body = await req.text();
        if (body.length > 100)
          return json({ error: "Petición demasiado grande" }, 413);
        let accion: unknown;
        try {
          accion = JSON.parse(body).accion;
        } catch {
          return json({ error: "Acción inválida" }, 400);
        }
        if (
          accion !== "pausar" &&
          accion !== "reanudar" &&
          accion !== "impulso"
        )
          return json({ error: "Acción inválida" }, 400);
        await simulacion.accion(accion);
        return json({ ok: true, ...simulacion.estado() });
      }
      if (req.method === "POST" && url.pathname === "/api/uso") {
        const reader = req.body?.getReader();
        if (!reader) return json({ error: "Falta el lote" }, 400);
        let bytes = 0;
        const chunks: Uint8Array[] = [];
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 256_000) {
            await reader.cancel();
            return json({ error: "Lote demasiado grande" }, 413);
          }
          chunks.push(value);
        }
        let raw: unknown;
        try {
          raw = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          return json({ error: "JSON inválido" }, 400);
        }
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
        const assets: Record<string, [string, string]> = {
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
    } catch {
      return json({ error: "No se pudo leer el registro local" }, 500);
    }
  };
}

export async function iniciarServidor(
  ctx: Contexto,
  options: {
    puerto: number;
    db: string;
    demo?: boolean;
    simulacion?: Simulacion;
  },
) {
  if (ctx.registro.tipo !== "local")
    throw new Error("El servidor de pruebas requiere --registro file:///…");
  await mkdir(dirname(options.db), { recursive: true });
  const almacen = new AlmacenUso(options.db);
  try {
    await snapshot(ctx);
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: options.puerto,
      maxRequestBodySize: 256_000,
      fetch: crearHandler(ctx, almacen, options.demo, options.simulacion),
    });
    return {
      url: server.url.href,
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
