import { readFile, writeFile, chmod } from "node:fs/promises";
import { join } from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { esAusente } from "@hacknight/shared/io";
import {
  administracion,
  guardarGestion,
} from "@hacknight/shared/registro/gestion";
import type { RegistroLocal } from "@hacknight/shared/registro/local";

export async function claveAdministracion(dir: string) {
  const path = join(dir, ".admin-key");
  try {
    await readFile(path, "utf8");
  } catch (e) {
    if (!esAusente(e)) throw e;
    try {
      await writeFile(path, crypto.randomUUID() + crypto.randomUUID(), {
        flag: "wx",
        mode: 0o600,
      });
    } catch (e) {
      if (!(e instanceof Error && "code" in e && e.code === "EEXIST")) throw e;
    }
  }
  await chmod(path, 0o600);
  const clave = (await readFile(path, "utf8")).trim();
  if (clave.length < 32)
    throw new Error(
      "La clave local de administración debe tener al menos 32 caracteres.",
    );
  return { path, clave };
}
export async function cuerpoJson(req: Request, max = 256_000) {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new ErrorHttp("Se requiere Content-Type application/json", 415);
  const reader = req.body?.getReader();
  if (!reader) throw new ErrorHttp("Falta el cuerpo JSON", 400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > max) {
      await reader.cancel();
      throw new ErrorHttp("Petición demasiado grande", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new ErrorHttp("JSON inválido", 400);
  }
}
export class ErrorHttp extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
const digest = (value: string) => createHash("sha256").update(value).digest();
export function crearAdmin(registro: RegistroLocal, clave?: string) {
  const sesiones = new Map<string, number>();
  let intentos = 0,
    ventana = 0;
  const cookie = (value: string, age: number) =>
    `hacknight_admin=${value}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${age}`;
  const token = (req: Request) =>
    req.headers
      .get("cookie")
      ?.split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith("hacknight_admin="))
      ?.slice("hacknight_admin=".length) ?? "";
  return async (req: Request): Promise<Response | undefined> => {
    const path = new URL(req.url).pathname;
    if (!path.startsWith("/api/admin")) return;
    const respond = (value: unknown, status = 200, extra = {}) =>
      Response.json(value, {
        status,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          ...extra,
        },
      });
    if (path === "/api/admin/sesion" && req.method === "POST") {
      if (Date.now() - ventana > 60000) {
        intentos = 0;
        ventana = Date.now();
      }
      if (++intentos > 20)
        return respond(
          { error: "Demasiados intentos. Espera un minuto." },
          429,
        );
      const body = await cuerpoJson(req, 1024);
      if (
        !clave ||
        typeof body?.clave !== "string" ||
        !timingSafeEqual(digest(body.clave), digest(clave))
      )
        return respond({ error: "Clave de administración incorrecta." }, 401);
      for (const [id, end] of sesiones)
        if (end < Date.now()) sesiones.delete(id);
      if (sesiones.size >= 20) sesiones.delete(sesiones.keys().next().value!);
      const id = crypto.randomUUID() + crypto.randomUUID();
      sesiones.set(id, Date.now() + 8 * 3600000);
      return respond({ ok: true }, 200, { "Set-Cookie": cookie(id, 8 * 3600) });
    }
    const session = token(req);
    if ((sesiones.get(session) ?? 0) <= Date.now())
      return respond({ error: "Inicia sesión en administración." }, 401);
    if (path === "/api/admin/sesion" && req.method === "DELETE") {
      sesiones.delete(session);
      return respond({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
    }
    if (path === "/api/admin" && req.method === "GET")
      return respond({
        ...(await administracion(registro)),
        tracks: await registro.tracks(),
      });
    if (path === "/api/admin" && req.method === "PUT")
      return respond(await guardarGestion(registro, await cuerpoJson(req)));
    return respond({ error: "Ruta no encontrada" }, 404);
  };
}
