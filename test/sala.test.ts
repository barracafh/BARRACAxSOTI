import { expect, test } from "bun:test";
import { join, resolve } from "node:path";
import { estado, lectorGitHub } from "../infra/sala/estado";
import { archivosSala } from "../infra/sala/publicar";

const root = resolve(import.meta.dir, "..");
const fixture = (name: string) =>
  Bun.file(join(root, "test/fixtures/registro", name)).text();

// GitHub as the registry would answer it, from the test fixture.
const github = (async (url: string | URL | Request, init?: RequestInit) => {
  expect((init?.headers as Record<string, string>).authorization).toBe(
    "Bearer synthetic-read-token",
  );
  const path = new URL(String(url)).pathname;
  const file = path.match(/\/contents\/([a-z]+\.json)$/)?.[1];
  if (file)
    return Response.json({
      content: Buffer.from(await fixture(file)).toString("base64"),
    });
  if (/\/(issues|pulls|events)$/.test(path)) return Response.json([]);
  return new Response("", { status: 404 });
}) as unknown as typeof fetch;

test("sala: el lector solo hace GET y traduce el 404 del registro", async () => {
  const lector = lectorGitHub("t", (async (url: string) => {
    expect(url).toBe("https://api.github.com/repos/o/r/contents/x.json");
    return new Response("", { status: 404 });
  }) as unknown as typeof fetch);
  await expect(
    lector(["gh", "api", "repos/o/r/contents/x.json", "--method", "GET"]),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(
    lector(["gh", "api", "repos/o/r/issues", "--method", "POST"]),
  ).rejects.toThrow("Solo lectura");
});

test("sala: el estado público sale del registro, en caché y sin miembros", async () => {
  const previo = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "synthetic-read-token";
  try {
    const res = await estado(github);
    expect(res.headers.get("cache-control")).toContain("s-maxage=30");
    const body = await res.json();
    expect(body.vistas.clasificacion).toBe(false);
    expect(body.consumo).toBeNull();
    expect(body.equipos.length).toBeGreaterThan(0);
    for (const equipo of body.equipos) expect(equipo.miembros).toBeUndefined();
  } finally {
    if (previo === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previo;
  }
});

test("sala: se publica la web estática con su función y sin administración", async () => {
  const files = await archivosSala();
  expect(files["api/estado.js"]).toContain("api.github.com");
  expect(files["index.html"]).not.toContain("{{nombre}}");
  const config = JSON.parse(files["vercel.json"] as string);
  expect(config.redirects[0]).toMatchObject({ source: "/admin" });
  expect(Object.keys(files).some((p) => p.startsWith("fonts/"))).toBe(true);
}, 30000);
