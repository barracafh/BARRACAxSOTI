import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { rutaConfig } from "../lib/config";

// The "Build night" OAuth App of barracafh. The device flow asks for no scopes,
// so the token only proves who you are to the room's server.
export const CLIENT_ID =
  process.env.HACKNIGHT_GITHUB_CLIENT_ID ?? "Ov23lifK0IfDbZCDoTPX";
const archivo = () => join(dirname(rutaConfig()), "sesion.json");
const pausa = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

export async function olvidarSesion() {
  await rm(archivo(), { force: true });
}

export async function sesion(
  avisar: (texto: string) => void,
  fetcher: typeof fetch = fetch,
  esperar = pausa,
): Promise<string> {
  try {
    const { token } = JSON.parse(await readFile(archivo(), "utf8"));
    if (typeof token === "string" && token) return token;
  } catch {}
  const pedir = async (url: string, campos: Record<string, string>) => {
    const res = await fetcher(url, {
      method: "POST",
      headers: { accept: "application/json" },
      body: new URLSearchParams({ client_id: CLIENT_ID, ...campos }),
    });
    if (!res.ok) throw new Error(`GitHub respondió ${res.status}.`);
    return (await res.json()) as Record<string, string | number | undefined>;
  };
  const codigo = await pedir("https://github.com/login/device/code", {
    scope: "",
  });
  avisar(
    `Para enviar tus tokens a la sala, abre ${codigo.verification_uri} y escribe ${codigo.user_code}. Solo confirma quién eres: no da acceso a nada.`,
  );
  let intervalo = Number(codigo.interval ?? 5);
  for (;;) {
    await esperar(intervalo);
    const r = await pedir("https://github.com/login/oauth/access_token", {
      device_code: String(codigo.device_code),
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });
    if (typeof r.access_token === "string") {
      await mkdir(dirname(archivo()), { recursive: true, mode: 0o700 });
      await writeFile(archivo(), JSON.stringify({ token: r.access_token }), {
        mode: 0o600,
      });
      await chmod(archivo(), 0o600);
      return r.access_token;
    }
    if (r.error === "slow_down") intervalo += 5;
    else if (r.error !== "authorization_pending")
      throw new Error(
        "No se pudo confirmar tu cuenta de GitHub. Repite observar.",
      );
  }
}
