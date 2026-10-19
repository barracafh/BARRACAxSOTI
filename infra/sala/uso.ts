import { hash, loteSchema, validarLote } from "@buildnight/shared/contrato-uso";
import type { Equipo, Evento } from "@buildnight/shared/modelo";
import { RegistroGitHub } from "../../apps/cli/src/registro/github";
import { guardar, postgres, type Consulta } from "./almacen";
import { lectorGitHub, registro } from "./estado";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

// Logins by token hash, so each watcher costs GitHub one /user call every 10 min.
const logins = new Map<string, { login: string; hasta: number }>();
export async function quien(token: string, fetcher: typeof fetch, now: number) {
  const clave = hash(token);
  const visto = logins.get(clave);
  if (visto && visto.hasta > now) return visto.login;
  const res = await fetcher("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "build-night-sala",
    },
    signal: AbortSignal.timeout(5000),
  });
  if (res.status === 401) return undefined;
  if (!res.ok) throw new Error(`GitHub respondió HTTP ${res.status}`);
  const { login } = (await res.json()) as { login?: unknown };
  if (typeof login !== "string" || !login)
    throw new Error("GitHub no devolvió un usuario válido.");
  logins.set(clave, { login, hasta: now + 600_000 });
  return login;
}

// The event and its teams change rarely; one read a minute per instance is enough.
let registroLeido:
  | { hasta: number; datos: Promise<[Evento, Equipo[]]> }
  | undefined;
function leerRegistro(fetcher: typeof fetch, now: number) {
  if (!registroLeido || registroLeido.hasta <= now) {
    const r = new RegistroGitHub(
      registro,
      lectorGitHub(process.env.GITHUB_TOKEN, fetcher),
    );
    const datos = Promise.all([r.evento(), r.equipos()]);
    datos.catch(() => (registroLeido = undefined));
    registroLeido = { hasta: now + 60_000, datos };
  }
  return registroLeido.datos;
}

export async function recibirUso(
  req: Request,
  deps: { fetcher?: typeof fetch; consulta?: Consulta; now?: number } = {},
) {
  const { fetcher = fetch, now = Date.now() } = deps;
  const consulta = deps.consulta ?? postgres();
  if (!consulta) return json({ error: "El ranking no está activo." }, 503);
  const token = req.headers
    .get("authorization")
    ?.match(/^Bearer ([\w.-]+)$/)?.[1];
  if (!token) return json({ error: "Falta la sesión de GitHub." }, 401);
  const lote = loteSchema.safeParse(await req.json().catch(() => null));
  if (!lote.success)
    return json(
      { error: "Lote inválido; solo se admiten contadores del contrato v1" },
      400,
    );
  let login: string | undefined;
  try {
    login = await quien(token, fetcher, now);
  } catch {
    return json(
      {
        error:
          "No se pudo comprobar la sesión con GitHub. Reintenta en unos segundos.",
      },
      503,
    );
  }
  if (!login) return json({ error: "La sesión de GitHub no es válida." }, 401);
  if (login.toLowerCase() !== lote.data.usuario.toLowerCase())
    return json({ error: "Ese lote es de otra persona." }, 403);
  const [evento, equipos] = await leerRegistro(fetcher, now);
  let usuario: string;
  try {
    usuario = validarLote(lote.data, evento, equipos, now);
  } catch (e) {
    return json({ error: (e as Error).message }, 422);
  }
  return json({
    ok: true,
    ...(await guardar(consulta, lote.data, usuario, now)),
  });
}

export const POST = (req: Request) => recibirUso(req);
