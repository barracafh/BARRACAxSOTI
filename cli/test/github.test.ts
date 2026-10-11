import { test, expect } from "bun:test";
import { RegistroGitHub } from "../src/registro/github";
import { CliError } from "@barbaritat/shared/errors";
import type { Runner } from "../src/lib/proceso";
import type { Ficha } from "@barbaritat/shared/modelo";
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
    if (path.includes("git/ref/heads/barbaritat"))
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
    branch: "barbaritat/ficha-demo",
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
    title: "Cita",
    body: "{}",
    user: { login: "demo" },
    labels: [{ name: "ventanilla" }],
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
