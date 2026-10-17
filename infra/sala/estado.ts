import { estadoPublico, snapshot } from "@hacknight/shared/actividad";
import { CliError } from "@hacknight/shared/errors";
import { RegistroGitHub } from "../../apps/cli/src/registro/github";

export const registro = "barracafh/build-registro";
// Everything but the token ranking, which needs its own store first.
export const vistas = {
  clasificacion: false,
  personas: false,
  negociados: true,
  ventanilla: true,
  tablon: true,
  pantalla: true,
};

// RegistroGitHub speaks `gh api`; here the same reads go through fetch with a
// read-only token. This function never writes to the registry.
export const lectorGitHub =
  (token: string | undefined, fetcher: typeof fetch = fetch) =>
  async (args: string[]) => {
    const [cmd, sub, path, , method = "GET"] = args;
    if (cmd !== "gh" || sub !== "api" || !path || method !== "GET")
      throw new CliError("PROCESS", "Solo lectura.", "", 5);
    const res = await fetcher(`https://api.github.com/${path}`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "build-night-sala",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok)
      throw new CliError(
        res.status === 404 ? "NOT_FOUND" : "PROCESS",
        `GitHub respondió ${res.status}.`,
        "",
        5,
      );
    return res.text();
  };

export async function estado(fetcher: typeof fetch = fetch) {
  const lector = lectorGitHub(process.env.GITHUB_TOKEN, fetcher);
  const actual = await snapshot(new RegistroGitHub(registro, lector));
  // The CDN serves one answer every 30 s to every screen in the room, which
  // keeps the GitHub API well under its hourly limit.
  return Response.json(estadoPublico(actual, vistas, null), {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const GET = () => estado();
