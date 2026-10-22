import { test, expect } from "bun:test";
import { RegistroGitHub } from "../src/registro/github";
import { CliError } from "@buildnight/shared/errors";
import type { Runner } from "../src/lib/proceso";
import type { Equipo, Ficha } from "@buildnight/shared/modelo";
import { snapshot } from "@buildnight/shared/actividad";
const f: Ficha = {
  nombre: "Demo",
  frase: "Texto",
  icono: "+",
  herramienta: "derechos",
  equipo: "demo",
  url: "https://example.org",
  fuentes: [{ nombre: "BOE", url: "https://www.boe.es/" }],
  datos: "simulados",
};
test("GitHub toma la identidad exclusivamente de gh", async () => {
  const calls: string[][] = [];
  const r = new RegistroGitHub("owner/registry", async (args) => {
    calls.push(args);
    return args[1] === "auth" ? "" : JSON.stringify({ login: "alba" });
  });
  expect(await r.usuario()).toBe("alba");
  expect(calls).toEqual([
    ["gh", "auth", "status"],
    ["gh", "api", "user"],
  ]);
});
test("GitHub explica cómo iniciar sesión", async () => {
  const r = new RegistroGitHub("owner/registry", async () => {
    throw new Error("bad auth");
  });
  await expect(r.usuario()).rejects.toMatchObject({
    code: "UNAUTHENTICATED",
    hint: "Ejecuta gh auth login.",
  });
});
test("GitHub registra en una rama y reutiliza un PR abierto", async () => {
  const bodies: unknown[] = [];
  const paths: string[] = [];
  const run: Runner = async (args, body) => {
    const path = args[2]!;
    paths.push(path);
    if (body) bodies.push(body);
    if (path.endsWith("/")) return JSON.stringify({ default_branch: "main" });
    if (path.includes("git/ref/heads/buildnight"))
      return JSON.stringify({ object: { sha: "branch" } });
    if (path.includes("contents/"))
      return JSON.stringify(
        args.includes("PUT") ? { commit: { sha: "new" } } : { sha: "file" },
      );
    if (path.includes("pulls?"))
      return JSON.stringify([
        { number: 42, html_url: "https://github.com/owner/registry/pull/42" },
      ]);
    throw new Error(path);
  };
  const r = new RegistroGitHub("owner/registry", run);
  const result = await r.registrar(f, "2026-10-22T19:00:00Z");
  expect(result.numero).toBe(42);
  expect(result.estado).toBe("pendiente");
  expect(paths.some((p) => p.endsWith("/pulls"))).toBe(false);
  expect(bodies[0]).toMatchObject({
    branch: "buildnight/ficha-demo",
    sha: "file",
  });
});
test("GitHub no convierte errores de permisos en una rama inexistente", async () => {
  const r = new RegistroGitHub("owner/registry", async (args) => {
    if (args[2]!.endsWith("/")) return '{"default_branch":"main"}';
    throw new CliError("NOT_ALLOWED", "No.", "", 4);
  });
  await expect(r.registrar(f, new Date().toISOString())).rejects.toMatchObject({
    code: "NOT_ALLOWED",
  });
});
test("GitHub pagina las issues sin mezclar PRs", async () => {
  let count = 0;
  const item = {
    number: 1,
    title: "Hola",
    body: "{}",
    user: { login: "demo" },
    labels: [{ name: "aviso" }],
    state: "open",
    created_at: "2026-10-22T19:00:00Z",
    html_url: "https://example.org",
  };
  const r = new RegistroGitHub("owner/registry", async () =>
    JSON.stringify(
      ++count === 1
        ? Array.from({ length: 100 }, (_, i) => ({ ...item, number: i + 1 }))
        : [{ ...item, number: 101, pull_request: {} }],
    ),
  );
  expect(await r.issues()).toHaveLength(100);
  expect(count).toBe(2);
});

test("GitHub lee los avisos del repo del comité y las fichas del registro", async () => {
  const paths: string[] = [];
  const r = new RegistroGitHub(
    "owner/registry",
    async (args) => {
      paths.push(args[2]!);
      return "[]";
    },
    "owner/comite",
  );
  await r.issues();
  await r.fichas();
  expect(paths).toEqual([
    "repos/owner/comite/issues?state=all&per_page=100&page=1",
    "repos/owner/registry/pulls?state=all&per_page=100&page=1",
  ]);
});

test("GitHub conserva la pantalla cuando un squad todavía no ha creado su repo", async () => {
  const files: Record<string, unknown> = {};
  for (const name of [
    "evento.json",
    "tracks.json",
    "equipos.json",
    "comite.json",
  ])
    files[name] = await Bun.file(
      new URL(`../../../test/fixtures/registro/${name}`, import.meta.url),
    ).json();
  const teams = (files["equipos.json"] as Equipo[]).map((team, index) => ({
    ...team,
    repo: index === 0 ? "owner/pending" : index === 1 ? "owner/ready" : "",
  }));
  files["equipos.json"] = teams;
  const reg = new RegistroGitHub("owner/registry", async (args) => {
    const path = args[2]!;
    if (path.includes("/contents/"))
      return JSON.stringify({
        content: Buffer.from(
          JSON.stringify(files[path.split("/contents/")[1]!]),
        ).toString("base64"),
      });
    if (path.includes("/issues?") || path.includes("/pulls?")) return "[]";
    if (path === "repos/owner/pending/commits?per_page=30")
      throw new CliError("NOT_FOUND", "No existe el repo.", "", 5);
    if (path === "repos/owner/ready/commits?per_page=30")
      return JSON.stringify([
        {
          sha: "abc123",
          commit: { committer: { date: "2026-10-22T19:00:00Z" } },
          author: { login: teams[1]!.miembros[0] },
        },
        {
          sha: "def456",
          commit: { committer: { date: "2026-10-22T19:05:00Z" } },
          author: null,
        },
      ]);
    throw new Error(path);
  });
  const state = await snapshot(reg);
  expect(state.equipos).toHaveLength(teams.length);
  expect(state.entradas).toHaveLength(2);
  expect(state.entradas[0]).toMatchObject({
    tipo: "push",
    herramienta: teams[1]!.herramienta,
    texto: `Alguien ha subido cambios a ${teams[1]!.nombre}`,
  });
  expect(state.entradas[1]).toMatchObject({
    tipo: "push",
    texto: `${teams[1]!.miembros[0]} ha subido cambios a ${teams[1]!.nombre}`,
    url: "https://github.com/owner/ready/commits",
  });
});

for (const code of ["UNAUTHENTICATED", "NOT_ALLOWED", "NETWORK"])
  test(`GitHub no oculta ${code} al consultar pushes`, async () => {
    const teams: Equipo[] = await Bun.file(
      new URL("../../../test/fixtures/registro/equipos.json", import.meta.url),
    ).json();
    const failure = new CliError(code, "Fallo simulado.", "", 5);
    const reg = new RegistroGitHub("owner/registry", async (args) => {
      expect(args[2]).toBe("repos/owner/ready/commits?per_page=30");
      throw failure;
    });
    await expect(
      reg.pushes([{ ...teams[0]!, repo: "owner/ready" }]),
    ).rejects.toBe(failure);
  });
