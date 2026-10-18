import { lstat } from "node:fs/promises";
import { join } from "node:path";
import {
  equipoSchema,
  trackSchema,
  type Equipo,
  type Track,
} from "@hacknight/shared/modelo";
import { paleta } from "@hacknight/shared/paleta";
import {
  ejecutar,
  existe,
  initialCommit,
  options,
  org,
  pasosDespliegue,
  root,
  salida,
  vercel,
  type Archivos,
  type Command,
} from "../common";

const dominio = "build.barraca.house";
const hubProject = "build-hub";
// The CLI's registry: every participant needs Write there to register.
const registro = "barracafh/build-registro";
// A team's repo and Vercel project share this name.
export const proyecto = (id: string) => `build-${id}`;
// Copied to every project when set in this shell; track keys only to that track.
const claves = ["HELMCODE_API_KEY", "HELMCODE_BASE_URL", "HELMCODE_MODEL"];
const clavesTrack: Record<string, string[]> = {
  sello: ["SAFE_BROWSING_API_KEY"],
  "como-voto": ["FACTCHECK_API_KEY"],
};

// Luma exports handles as profile URLs; accept those, @handle or the bare name.
export function usuarioGitHub(valor: string) {
  const handle = valor
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(handle))
    throw new Error(`Usuario de GitHub no válido: ${JSON.stringify(valor)}`);
  return handle;
}

export async function leerTracks(): Promise<Track[]> {
  return trackSchema
    .array()
    .parse(
      await Bun.file(
        join(root, "packages/shared/registro-base/tracks.json"),
      ).json(),
    );
}

export function validarEquipos(raw: unknown, tracks: Track[]): Equipo[] {
  const equipos = equipoSchema
    .array()
    .parse(raw)
    .map((e) => ({
      ...e,
      miembros: e.miembros.map(usuarioGitHub),
      repo: e.repo || `${org}/${proyecto(e.id)}`,
    }));
  const vistos = new Set<string>();
  for (const e of equipos) {
    if (vistos.has(e.id)) throw new Error(`Equipo repetido: ${e.id}`);
    vistos.add(e.id);
    const track = tracks.find((t) => t.slug === e.herramienta);
    if (!track) throw new Error(`${e.id}: track desconocido ${e.herramienta}`);
    const cupo = track.cupo ?? 2;
    if (equipos.filter((o) => o.herramienta === e.herramienta).length > cupo)
      throw new Error(`${e.herramienta} admite ${cupo} equipo(s) como máximo.`);
    if (!e.miembros.length) throw new Error(`${e.id}: no tiene miembros.`);
  }
  const miembros = equipos.flatMap((e) =>
    e.miembros.map((m) => m.toLowerCase()),
  );
  const repetido = miembros.find((m, i) => miembros.indexOf(m) !== i);
  if (repetido) throw new Error(`${repetido} está en más de un equipo.`);
  return equipos;
}

async function versionados(carpeta: string) {
  const child = Bun.spawn(["git", "ls-files", "-z", "--", carpeta], {
    cwd: root,
    stdout: "pipe",
    stderr: "ignore",
  });
  const [lista, code] = await Promise.all([
    new Response(child.stdout).text(),
    child.exited,
  ]);
  if (code !== 0) throw new Error(`No se pudo listar ${carpeta}.`);
  return lista.split("\0").filter(Boolean);
}

// The team's repo: tracked starter files only, its ficha and feedback link,
// and its track's brief, data and knowledge base.
export async function archivosEquipo(
  equipo: Equipo,
  track: Track,
): Promise<Archivos> {
  const files: Archivos = {};
  for (const path of await versionados("plantilla")) {
    if (
      /(^|\/)(node_modules|\.next|out|\.git|\.vercel|\.env(?:\.[^/]*)?)(\/|$)/.test(
        path,
      ) ||
      !(await lstat(join(root, path))).isFile()
    )
      throw new Error(`La plantilla no puede exportar ${path}.`);
    files[path.slice("plantilla/".length)] = await Bun.file(
      join(root, path),
    ).bytes();
  }
  const sitio = await Bun.file(
    join(root, "plantilla/src/config/sitio.ts"),
  ).text();
  const placeholder = "https://example.invalid/formulario-de-avisos";
  if (!sitio.includes(placeholder))
    throw new Error("src/config/sitio.ts ya no trae el enlace de ejemplo.");
  files["src/config/sitio.ts"] = sitio.replace(
    placeholder,
    `https://github.com/${equipo.repo}/issues/new`,
  );
  files["ficha.json"] =
    JSON.stringify(
      {
        nombre: equipo.pieza,
        frase: track.frase,
        icono: track.glifo,
        herramienta: track.slug,
        equipo: equipo.id,
        url: `https://${dominio}/${equipo.id}`,
        fuentes: track.fuentes,
        datos: "simulados",
      },
      null,
      2,
    ) + "\n";
  files[".hacknight/plantilla.json"] =
    JSON.stringify({ plantilla: "hacknight", version: "0" }, null, 2) + "\n";
  const carpeta = join(root, "tracks", track.slug);
  if (!(await Bun.file(join(carpeta, "SETUP.md")).exists()))
    throw new Error(`tracks/${track.slug} no tiene SETUP.md.`);
  files["SETUP.md"] = await Bun.file(join(carpeta, "SETUP.md")).bytes();
  if (await Bun.file(join(carpeta, "contexto.md")).exists())
    files["contexto.md"] = await Bun.file(join(carpeta, "contexto.md")).bytes();
  // Tracked files only: a stray local file must never reach a public repo.
  // datos/README.md documents the committee's packs, not the team's data.
  const prefijo = `tracks/${track.slug}/`;
  for (const path of await versionados(`${prefijo}datos`))
    if (path !== `${prefijo}datos/README.md`)
      files[path.slice(prefijo.length)] = await Bun.file(
        join(root, path),
      ).bytes();
  return files;
}

// Secrets are read from the shell only when applying, so a dry run never prints them.
function variables(track: string, apply: boolean) {
  return [...claves, ...(clavesTrack[track] ?? [])]
    .filter((key) => process.env[key])
    .map((key) => ({
      key,
      value: apply ? process.env[key]! : `<${key}>`,
      type: "encrypted",
      target: ["production", "preview", "development"],
    }));
}

export async function pasosEquipo(
  equipo: Equipo,
  apply: boolean,
): Promise<{ nuevo: boolean; commands: Command[]; aviso?: string }> {
  const name = proyecto(equipo.id);
  // A dry run makes no requests, so it shows the plan for a team from scratch.
  const nuevo =
    !apply ||
    !(await existe(["gh", "repo", "view", equipo.repo, "--json", "name"]));
  const sinProyecto =
    !apply || !(await existe(vercel(`/v9/projects/${name}`).args));
  const commands: Command[] = [];
  if (nuevo)
    commands.push(
      ...initialCommit(`Start ${equipo.id} from the Build night template`),
      {
        args: [
          "gh",
          "repo",
          "create",
          equipo.repo,
          "--public",
          "--source=.",
          "--remote=origin",
          "--push",
          "--description",
          `${equipo.nombre} · Build night · BARRACA x SOTI`,
        ],
      },
    );
  if (sinProyecto)
    commands.push(
      vercel("/v11/projects", "POST", {
        name,
        framework: "nextjs",
        gitRepository: { type: "github", repo: equipo.repo },
      }),
    );
  // The hub proxies to the project's vercel.app domain, which the team's
  // default protection would hide behind a Vercel login.
  commands.push(
    vercel(`/v9/projects/${name}`, "PATCH", { ssoProtection: null }),
  );
  for (const env of variables(equipo.herramienta, apply))
    commands.push(vercel(`/v10/projects/${name}/env?upsert=true`, "POST", env));
  // Linking a repo deploys nothing; a push after the link deploys with its keys.
  if (nuevo)
    commands.push(
      {
        args: [
          "git",
          "-c",
          "user.name=Hacknight",
          "-c",
          "user.email=organizacion@example.invalid",
          "-c",
          "commit.gpgsign=false",
          "commit",
          "--allow-empty",
          "-m",
          "Deploy on Vercel",
        ],
      },
      { args: ["git", "push", "origin", "main"] },
    );
  for (const m of equipo.miembros)
    for (const repo of [equipo.repo, registro])
      commands.push({
        args: [
          "gh",
          "api",
          "-X",
          "PUT",
          `repos/${repo}/collaborators/${m}`,
          "-f",
          "permission=push",
        ],
      });
  const aviso =
    !nuevo && sinProyecto
      ? "El repo ya existía: el proyecto desplegará con el próximo push."
      : undefined;
  return { nuevo, commands, aviso };
}

const escapar = (texto: string) =>
  texto.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export async function archivosHub(
  equipos: Equipo[],
  tracks: Track[],
  dominios: Record<string, string>,
): Promise<Archivos> {
  const rewrites = equipos.flatMap((e) => [
    { source: `/${e.id}`, destination: `https://${dominios[e.id]}/${e.id}` },
    {
      source: `/${e.id}/:path*`,
      destination: `https://${dominios[e.id]}/${e.id}/:path*`,
    },
  ]);
  const secciones = tracks
    .filter((t) => equipos.some((e) => e.herramienta === t.slug))
    .map(
      (t) => `<section>
<h2>${escapar(t.nombre)}</h2>
<p>${escapar(t.ciudadano)}</p>
<ul>
${equipos
  .filter((e) => e.herramienta === t.slug)
  .map(
    (e) =>
      `<li><a href="/${e.id}">${escapar(e.nombre)}</a> <a class="codigo" href="https://github.com/${e.repo}">código</a></li>`,
  )
  .join("\n")}
</ul>
</section>`,
    )
    .join("\n");
  const tokens = Object.entries(paleta)
    .map(([k, v]) => `--${k}:${v}`)
    .join(";");
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Build night · BARRACA x SOTI</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap">
<style>
:root{${tokens}}
*{box-sizing:border-box}
body{margin:0;background:var(--nit);color:var(--paper);font:15px/1.6 "Space Mono",monospace}
main{max-width:64rem;margin:0 auto;padding:3rem 1rem 4rem}
.aviso{margin:0;padding:.5rem 1rem;border-bottom:1px solid color-mix(in srgb,var(--paper) 15%,transparent);color:var(--muted);font-size:.7rem;letter-spacing:.16em;text-align:center;text-transform:uppercase}
.ticket{color:var(--acid);font-size:.7rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase}
h1,h2{font-family:Syne,sans-serif;font-weight:800;line-height:.95;text-transform:uppercase;letter-spacing:-.01em}
h1{font-size:clamp(2.5rem,10vw,5rem);margin:.5rem 0 1rem}
.lead{max-width:40ch;font-family:Syne,sans-serif;font-size:1.15rem;font-weight:700;line-height:1.3}
.pronto{margin-top:3rem;color:var(--muted)}
.tracks{display:grid;gap:1rem;margin-top:3rem;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))}
section{border:1px solid color-mix(in srgb,var(--paper) 15%,transparent);background:var(--nit-2);padding:1.5rem}
h2{font-size:1.5rem;margin:0 0 .5rem}
section p{margin:0;color:var(--muted);font-size:.85rem}
ul{list-style:none;margin:1.25rem 0 0;padding:0}
li{display:flex;flex-wrap:wrap;gap:.25rem 1rem;align-items:baseline;padding:.5rem 0;border-top:1px dashed color-mix(in srgb,var(--paper) 25%,transparent)}
a{color:var(--acid);font-weight:700;text-underline-offset:4px}
a.codigo{color:var(--muted);font-weight:400;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase}
a:focus-visible{outline:2px solid var(--cian);outline-offset:3px}
.cli{margin-top:3rem}
pre{margin:1rem 0;overflow-x:auto;padding:1rem;border:1px dashed color-mix(in srgb,var(--paper) 25%,transparent)}
code{font-family:inherit;color:var(--acid)}
</style>
</head>
<body>
<p class="aviso" role="note">Herramientas experimentales. No son servicios oficiales.</p>
<main>
<p class="ticket">BARRACA x SOTI · Build night · València</p>
<h1>Build night</h1>
<p class="lead">Un punto de atención ciudadana, construido entre toda la sala en una noche.</p>
${
  secciones
    ? `<div class="tracks">\n${secciones}\n</div>`
    : `<p class="pronto">Las herramientas aparecen aquí cuando cada equipo publica la suya.</p>`
}
<section class="cli">
<h2>El CLI del evento</h2>
<p>Vuestra ficha, la revisión de las seis reglas y el tablón. Con <code>gh auth login</code> hecho, en macOS o Linux:</p>
<pre><code>curl -fsSL https://${dominio}/instalar.sh | sh</code></pre>
<p>En Windows, descarga <code>hacknight-windows-x64.exe</code> de la <a href="https://github.com/${registro}/releases/latest">última release</a>.</p>
</section>
</main>
</body>
</html>
`;
  return {
    "index.html": html,
    "instalar.sh": await Bun.file(join(root, "apps/cli/install.sh")).text(),
    "vercel.json": JSON.stringify({ rewrites }, null, 2) + "\n",
  };
}

async function dominioDe(name: string) {
  const texto = await salida(vercel(`/v9/projects/${name}/domains`).args);
  const nombre = texto
    ? (JSON.parse(texto).domains as { name: string }[])
        .map((d) => d.name)
        .find((d) => d.endsWith(".vercel.app"))
    : undefined;
  if (!nombre)
    throw new Error(
      `${name} aún no tiene dominio vercel.app; repite cuando haya desplegado.`,
    );
  return nombre;
}

// ponytail: never removes a collaborator who leaves a team; do that by hand
// with `gh api -X DELETE repos/<repo>/collaborators/<handle>`.
export async function preparar(config: {
  equipos: string;
  solo?: string;
  apply?: boolean;
  log?: (line: string) => void;
}) {
  const { apply = false, log = console.log } = config;
  const tracks = await leerTracks();
  const raw = await Bun.file(config.equipos).json();
  const equipos = validarEquipos(raw, tracks);
  const elegidos = config.solo
    ? equipos.filter((e) => e.id === config.solo)
    : equipos;
  if (config.solo && !elegidos.length)
    throw new Error(`No hay equipo ${config.solo}.`);
  // Build every repo before touching anything remote, so a bad track fails early.
  const archivos = await Promise.all(
    elegidos.map((e) =>
      archivosEquipo(e, tracks.find((t) => t.slug === e.herramienta)!),
    ),
  );
  log(
    apply
      ? "Aplicando: crea o actualiza repos, proyectos, variables e invitaciones."
      : "Simulación: no se hacen peticiones ni cambios. Usa --apply para ejecutar.",
  );
  for (const [i, equipo] of elegidos.entries()) {
    const { nuevo, commands, aviso } = await pasosEquipo(equipo, apply);
    await ejecutar(
      `${equipo.id} · ${equipo.repo} · https://${dominio}/${equipo.id}`,
      nuevo ? archivos[i]! : {},
      commands,
      apply,
      log,
    );
    if (aviso) log(aviso);
  }
  const dominios: Record<string, string> = {};
  for (const e of equipos)
    dominios[e.id] = apply
      ? await dominioDe(proyecto(e.id))
      : `${proyecto(e.id)}.vercel.app`;
  await ejecutar(
    `hub · https://${dominio}`,
    await archivosHub(equipos, tracks, dominios),
    await pasosDespliegue(hubProject, dominio, apply),
    apply,
    log,
  );
  // The CLI's registry needs each team's repo, so the defaults are written back.
  if (apply && JSON.stringify(raw) !== JSON.stringify(equipos)) {
    await Bun.write(config.equipos, JSON.stringify(equipos, null, 2) + "\n");
    log(
      `\n${config.equipos} actualizado con los repos y usuarios normalizados.`,
    );
  }
}

if (import.meta.main) {
  const args = options(["equipos", "equipo"]);
  const equipos = args.get("equipos");
  if (!equipos) throw new Error("Indica --equipos ruta/equipos.json.");
  await preparar({ equipos, solo: args.get("equipo"), apply: args.apply });
}
