import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { fichaSchema } from "@hacknight/shared/modelo";
import {
  archivosEquipo,
  enlazar,
  archivosHub,
  leerTracks,
  preparar,
  usuarioGitHub,
  validarEquipos,
} from "../infra/equipos/preparar";
import { contexto } from "../apps/cli/src/lib/contexto";
import { revisar } from "../apps/cli/src/lib/revision";
import { ejecutar } from "../apps/cli/src/lib/proceso";

const root = resolve(import.meta.dir, "..");
const equipo = (id: string, herramienta: string, miembros: string[]) => ({
  id,
  nombre: `Squad ${id}`,
  herramienta,
  pieza: "Pieza de prueba",
  mesa: "1",
  miembros,
  repo: "",
});
const seis = [
  equipo("derechos-a", "derechos", ["https://github.com/demo-alba/"]),
  equipo("claridad-a", "claridad", ["@demo-bruno"]),
  equipo("sello-a", "sello", ["demo-carla"]),
  equipo("brujula-a", "brujula", ["github.com/demo-dario"]),
  equipo("como-voto-a", "como-voto", ["demo-elena"]),
  equipo("libre", "libre", ["demo-fede"]),
];

test("equipos: normaliza usuarios de Luma y rechaza repartos imposibles", async () => {
  expect(usuarioGitHub("https://github.com/demo-alba/")).toBe("demo-alba");
  expect(usuarioGitHub("@Demo-Bruno")).toBe("Demo-Bruno");
  for (const malo of ["", "https://github.com/a/b", "-demo", "demo--x"])
    expect(() => usuarioGitHub(malo)).toThrow();
  const tracks = await leerTracks();
  const [primero] = validarEquipos(seis, tracks);
  expect(primero).toMatchObject({
    miembros: ["demo-alba"],
    repo: "barracafh/build-derechos-a",
  });
  const mal = [
    [...seis, equipo("libre-b", "libre", ["demo-gala"])],
    [
      ...seis,
      equipo("derechos-b", "derechos", ["demo-gala"]),
      equipo("derechos-c", "derechos", ["demo-hugo"]),
    ],
    [...seis, equipo("radar-a", "inventado", ["demo-gala"])],
    [...seis, equipo("derechos-b", "derechos", ["DEMO-ALBA"])],
    [...seis, equipo("derechos-a", "derechos", ["demo-gala"])],
  ];
  for (const raw of mal) expect(() => validarEquipos(raw, tracks)).toThrow();
});

test("equipos: cada repo trae su ficha y su track, y pasa revisar salvo la URL publicada", async () => {
  const tracks = await leerTracks();
  const dir = await mkdtemp(join(tmpdir(), "hacknight-equipos-"));
  try {
    for (const e of validarEquipos(seis, tracks)) {
      const files = await archivosEquipo(
        e,
        tracks.find((t) => t.slug === e.herramienta)!,
      );
      const text = (path: string) => {
        const f = files[path]!;
        return typeof f === "string" ? f : new TextDecoder().decode(f);
      };
      const ficha = fichaSchema.parse(JSON.parse(text("ficha.json")));
      expect(ficha).toMatchObject({
        equipo: e.id,
        herramienta: e.herramienta,
        url: `https://build.barraca.house/${e.id}`,
      });
      expect(text("src/config/sitio.ts")).toContain(
        `https://github.com/barracafh/build-${e.id}/issues/new`,
      );
      expect(files["SETUP.md"]).toBeDefined();
      expect(files["AGENTS.md"]).toBeDefined();
      expect(files["datos/README.md"]).toBeUndefined();
      expect(files["comun/00-territorio.md"]).toBeDefined();
      expect(files["comun/04b-gestores-expedientes.md"] !== undefined).toBe(
        ["brujula", "claridad", "sello"].includes(e.herramienta),
      );
      // Every relative link in the committee's Markdown resolves in the repo.
      for (const md of Object.keys(files).filter((p) =>
        /^(?:comun\/.*|contexto|SETUP)\.md$/.test(p),
      ))
        for (const [, href] of text(md).matchAll(/\]\(([^)\s#]+)[^)]*\)/g))
          if (!/^[a-z][a-z\d+.-]*:/i.test(href!))
            expect(files[posix.join(posix.dirname(md), href!)]).toBeDefined();
      expect(
        Object.keys(files).some((p) => /node_modules|^\.next/.test(p)),
      ).toBe(false);

      const project = join(dir, e.id);
      for (const [path, content] of Object.entries(files)) {
        await mkdir(dirname(join(project, path)), { recursive: true });
        await writeFile(join(project, path), content);
      }
      await ejecutar(["git", "init"], undefined, project);
      await ejecutar(["git", "add", "."], undefined, project);
      const ctx = await contexto({
        registro: pathToFileURL(join(root, "test/fixtures/registro")).href,
        cwd: project,
        usuario: "demo-alba",
      });
      const report = await revisar(ctx, (async () => {
        throw new Error("Sin publicar");
      }) as unknown as typeof fetch);
      expect([e.id, report.hallazgos]).toEqual([e.id, []]);
      expect(report.reglas.filter((r) => !r.ok).map((r) => r.numero)).toEqual([
        2,
      ]);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);

test("equipos: el hub reenvía cada ruta a su proyecto y escapa los nombres", async () => {
  const tracks = await leerTracks();
  const equipos = validarEquipos(
    [{ ...seis[0]!, nombre: "<script>alert(1)</script>" }],
    tracks,
  );
  const files = await archivosHub(equipos, tracks, {
    "derechos-a": "build-derechos-a-x.vercel.app",
  });
  expect(JSON.parse(files["vercel.json"] as string).rewrites).toEqual([
    {
      source: "/derechos-a",
      destination: "https://build-derechos-a-x.vercel.app/derechos-a",
    },
    {
      source: "/derechos-a/:path*",
      destination: "https://build-derechos-a-x.vercel.app/derechos-a/:path*",
    },
  ]);
  expect(files["index.html"]).toContain("&lt;script&gt;");
  expect(files["index.html"]).not.toContain("<script>");
});

test("equipos: sin reparto, el hub se publica vacío", async () => {
  const tracks = await leerTracks();
  const files = await archivosHub(validarEquipos([], tracks), tracks, {});
  expect(files["instalar.sh"]).toContain("barracafh/build-registro");
  expect(JSON.parse(files["vercel.json"] as string).rewrites).toEqual([]);
  expect(files["index.html"]).toContain("cuando cada equipo publica la suya");
});

test("equipos: la simulación no ejecuta nada ni imprime claves", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-equipos-dry-"));
  const previa = process.env.HELMCODE_API_KEY;
  process.env.HELMCODE_API_KEY = "synthetic-helmcode-value";
  try {
    const path = join(dir, "equipos.json");
    await Bun.write(path, JSON.stringify(seis));
    const logs: string[] = [];
    await preparar({ equipos: path, log: (l) => logs.push(l) });
    const out = logs.join("\n");
    expect(out).toContain("Simulación");
    expect(out).toContain("'gh' 'repo' 'create' 'barracafh/build-sello-a'");
    expect(out).toContain("<HELMCODE_API_KEY>");
    expect(out).not.toContain("synthetic-helmcode-value");
    // A dry run leaves the organizer's file untouched.
    expect(await Bun.file(path).json()).toEqual(seis);
  } finally {
    if (previa === undefined) delete process.env.HELMCODE_API_KEY;
    else process.env.HELMCODE_API_KEY = previa;
    await rm(dir, { recursive: true, force: true });
  }
});

test("equipos: los enlaces del material siguen funcionando en el repo del equipo", () => {
  const copias = new Map([
    ["tracks/sello/contexto.md", "contexto.md"],
    ["tracks/comun/00-territorio.md", "comun/00-territorio.md"],
  ]);
  expect(
    enlazar(
      "[00](../comun/00-territorio.md#2-niveles) [Claridad](../claridad/contexto.md) [BOE](https://www.boe.es/) [arriba](#indice)",
      "tracks/sello/contexto.md",
      "contexto.md",
      copias,
    ),
  ).toBe(
    "[00](comun/00-territorio.md#2-niveles) [Claridad](https://github.com/barracafh/BARRACAxSOTI/blob/main/tracks/claridad/contexto.md) [BOE](https://www.boe.es/) [arriba](#indice)",
  );
  expect(
    enlazar(
      "[Sello](../sello/contexto.md)",
      "tracks/comun/00-territorio.md",
      "comun/00-territorio.md",
      copias,
    ),
  ).toBe("[Sello](../contexto.md)");
});
