import { expect, test } from "bun:test";
import { snapshot } from "@hacknight/shared/actividad";
import { RegistroGitHub } from "../apps/cli/src/registro/github";
import type { Ficha } from "@hacknight/shared/modelo";
import evento from "./fixtures/registro/evento.json";
import equipos from "./fixtures/registro/equipos.json";
import tracks from "./fixtures/registro/tracks.json";
import comite from "./fixtures/registro/comite.json";

test("cada captura reutiliza las lecturas de GitHub sin conservar datos viejos", async () => {
  const docs: Record<string, unknown> = {
    "evento.json": { ...evento },
    "equipos.json": equipos,
    "tracks.json": tracks,
    "comite.json": comite,
  };
  const ficha: Ficha = {
    nombre: "Pieza ficticia",
    frase: "Una demo",
    icono: "+",
    herramienta: equipos[0]!.herramienta,
    equipo: equipos[0]!.id,
    url: "https://example.org",
    fuentes: [{ nombre: "BOE", url: "https://www.boe.es/" }],
    datos: "simulados",
  };
  const prs = Array.from({ length: 5 }, (_, i) => ({
    number: i + 1,
    updated_at: "2026-10-22T19:00:00Z",
    html_url: `https://example.org/pull/${i + 1}`,
    state: "open",
    merged_at: null,
    head: {
      ref: `hacknight/ficha-demo-${i}`,
      sha: `sha-${i}`,
      repo: { full_name: "demo/registro" },
    },
  }));
  const calls: string[] = [];
  const registro = new RegistroGitHub("demo/registro", async (args) => {
    const path = args[2]!.slice("repos/demo/registro/".length);
    calls.push(path);
    if (path.startsWith("contents/")) {
      const name = path.slice("contents/".length);
      const content = name.startsWith("fichas/") ? ficha : docs[name];
      if (!content) throw new Error(`Lectura inesperada: ${path}`);
      return JSON.stringify({
        content: Buffer.from(JSON.stringify(content)).toString("base64"),
      });
    }
    if (path.startsWith("issues?")) return "[]";
    if (path.startsWith("pulls?")) return JSON.stringify(prs);
    throw new Error(`Petición inesperada: ${path}`);
  });

  const first = await snapshot(registro);
  expect(first.registros).toHaveLength(5);
  expect(first.entradas.filter((e) => e.tipo === "registro")).toHaveLength(5);
  // Seis documentos/listados y cinco fichas; nada se pide dos veces.
  expect(calls).toHaveLength(11);
  expect(new Set(calls).size).toBe(calls.length);

  calls.length = 0;
  docs["evento.json"] = { ...evento, nombre: "Evento de prueba actualizado" };
  ficha.nombre = "Pieza ficticia actualizada";
  const next = await snapshot(registro);
  expect(next.evento.nombre).toBe("Evento de prueba actualizado");
  expect(next.registros[0]!.ficha.nombre).toBe(ficha.nombre);
  expect(next.entradas[0]!.texto).toContain(ficha.nombre);
  expect(calls).toHaveLength(11);
  expect(new Set(calls).size).toBe(calls.length);
});

test("el tablón ignora fichas de forks y fichas rotas", async () => {
  const pr = (number: number, repo: string | null) => ({
    number,
    updated_at: "2026-10-22T19:00:00Z",
    html_url: `https://example.org/pull/${number}`,
    state: "open",
    merged_at: null,
    head: {
      ref: `hacknight/ficha-demo-${number}`,
      sha: `sha-${number}`,
      repo: repo && { full_name: repo },
    },
  });
  const ficha: Ficha = {
    nombre: "Pieza ficticia",
    frase: "Una demo",
    icono: "+",
    herramienta: equipos[0]!.herramienta,
    equipo: equipos[0]!.id,
    url: "https://example.org",
    fuentes: [{ nombre: "BOE", url: "https://www.boe.es/" }],
    datos: "simulados",
  };
  const contenido: Record<string, unknown> = {
    "sha-1": ficha,
    "sha-2": ficha,
    "sha-3": ficha,
    "sha-4": { nombre: "Sin el resto de campos" },
  };
  const registro = new RegistroGitHub("demo/registro", async (args) => {
    const path = args[2]!.slice("repos/demo/registro/".length);
    if (path.startsWith("pulls?"))
      return JSON.stringify([
        pr(1, "demo/registro"),
        pr(2, "desconocido/registro"),
        pr(3, null),
        pr(4, "demo/registro"),
      ]);
    const sha = new URL(path, "https://x/").searchParams.get("ref")!;
    return JSON.stringify({
      content: Buffer.from(JSON.stringify(contenido[sha])).toString("base64"),
    });
  });
  expect((await registro.fichas()).map((r) => r.numero)).toEqual([1]);
});
