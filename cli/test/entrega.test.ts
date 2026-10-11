import { test, expect } from "bun:test";
import { mkdtemp, mkdir, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { dniValido, ibanValido, detectar } from "../src/lib/detectores";
import { RegistroLocal } from "../src/registro/local";
import { fichaSchema, type Ficha } from "../src/lib/modelo";
import { numeroRegistro, justificante, sello } from "../src/lib/justificante";
import { revisar, comprobarUrl, direccionPublica } from "../src/lib/revision";
import { validarFicha } from "../src/lib/ficha";
import schema from "../esquemas/ficha.schema.json";
export const fichaPrueba: Ficha = {
  nombre: "Ayudas de prueba",
  frase: "Encuentra ayudas.",
  icono: "+",
  herramienta: "derechos",
  equipo: "squad-taronja",
  url: "http://127.0.0.1:1234",
  fuentes: [{ nombre: "BOE", url: "https://www.boe.es/" }],
  datos: "simulados",
};
for (const [v, ok] of [
  ["12345678Z", true],
  ["12345678A", false],
  ["X1234567L", true],
  ["Y1234567X", true],
  ["Z1234567R", true],
  ["X1234567A", false],
  ["1234567Z", false],
] as const)
  test(`DNI/NIE: ${v}`, () => expect(dniValido(v)).toBe(ok));
test("IBAN checksum válido e inválido", () => {
  expect(ibanValido("ES91 2100 0418 4502 0005 1332")).toBe(true);
  expect(ibanValido("ES90 2100 0418 4502 0005 1332")).toBe(false);
});
test("detección sin filtrar valores ni falsos positivos de ejemplo", () => {
  const text =
    "12345678Z\nX1234567L\nES91 2100 0418 4502 0005 1332\n+34 612 345 678\nreal@dominio.es\nsk-proj-" +
    "a".repeat(30);
  const hits = detectar(text, "src/app.ts");
  expect(hits.map((h) => h.tipo)).toEqual([
    "DNI",
    "NIE",
    "IBAN",
    "teléfono",
    "email",
    "clave",
  ]);
  expect(hits[1]?.linea).toBe(2);
  expect(JSON.stringify(hits)).not.toContain("12345678Z");
  expect(
    detectar(
      "12345678A test@example.com foo@demo.test 2026-10-22T22:00:00+02:00 a1234567890 sha612345678aa",
      "x",
    ),
  ).toEqual([]);
  expect(detectar("", "config/.env")).toHaveLength(1);
});
test("esquema compartido y slug activo", async () => {
  expect<unknown>(schema).toEqual(
    z.toJSONSchema(fichaSchema, { unrepresentable: "any" }),
  );
  const tracks = await new RegistroLocal(
    join(import.meta.dir, "../demo/registro"),
  ).tracks();
  expect(validarFicha(fichaPrueba, tracks)).toEqual(fichaPrueba);
  expect(() =>
    validarFicha({ ...fichaPrueba, herramienta: "carpeta" }, tracks),
  ).toThrow();
  expect(() =>
    validarFicha(
      { ...fichaPrueba, fuentes: [{ nombre: "x", url: "http://www.boe.es" }] },
      tracks,
    ),
  ).toThrow();
});
test("número y justificante deterministas", async () => {
  const track = (
    await new RegistroLocal(join(import.meta.dir, "../demo/registro")).tracks()
  )[0]!;
  const r = {
    numero: 42,
    fecha: "2026-10-22T19:00:00Z",
    ficha: fichaPrueba,
    url: "local:ficha",
    estado: "integrado" as const,
  };
  expect(numeroRegistro(42)).toBe("RE-2026-22O-0042");
  expect(justificante(r, track, false)).toEqual(justificante(r, track, false));
  expect(justificante(r, track, false).csv).toHaveLength(16);
  expect(sello()).toContain("REGISTRO DE ENTRADA");
  expect(sello()).toContain("22 OCT 2026");
});
test("local actualiza una ficha y conserva el número", async () => {
  const dir = await mkdtemp(join(tmpdir(), "barbaritat-reg-"));
  await mkdir(join(dir, "fichas"));
  const r = new RegistroLocal(dir);
  const a = await r.registrar(fichaPrueba, "2026-10-22T19:00:00Z");
  const b = await r.registrar(
    { ...fichaPrueba, nombre: "Actualizado" },
    "2026-10-22T19:30:00Z",
  );
  expect(b.numero).toBe(a.numero);
  expect(await r.fichas()).toHaveLength(1);
  expect(
    (await Bun.file(join(dir, "fichas/squad-taronja.json")).json()).nombre,
  ).toBe("Actualizado");
});
for (const host of [
  "localhost",
  "127.0.0.1",
  "192.168.0.1",
  "10.1.2.3",
  "172.16.2.3",
  "::1",
  "::ffff:127.0.0.1",
  "fd00::1",
])
  test(`URL privada bloqueada: ${host}`, () =>
    expect(direccionPublica(host)).toBe(false));
test("URL con timeout da error", async () => {
  const f = (async () => {
    throw new DOMException("timeout", "TimeoutError");
  }) as unknown as typeof fetch;
  await expect(comprobarUrl("http://localhost", true, f)).rejects.toThrow();
});
test("revisión falla por DNI y botón, y se subsana", async () => {
  const dir = await mkdtemp(join(tmpdir(), "barbaritat-revision-"));
  await mkdir(join(dir, ".barbaritat"));
  await writeFile(
    join(dir, ".barbaritat/plantilla.json"),
    JSON.stringify({ plantilla: "barbaritat", version: "demo" }),
  );
  await writeFile(join(dir, "ficha.json"), JSON.stringify(fichaPrueba));
  await writeFile(join(dir, "app.ts"), 'const dni="12345678Z"');
  for (const args of [
    ["git", "init"],
    ["git", "add", "."],
  ]) {
    const p = Bun.spawn(args, { cwd: dir, stdout: "pipe", stderr: "pipe" });
    expect(await p.exited).toBe(0);
  }
  const r = new RegistroLocal(join(import.meta.dir, "../demo/registro"));
  const ctx = {
    opts: {},
    registro: r,
    cwd: dir,
    config: { registro: "local", plantilla: undefined, releases: undefined },
  };
  const f = (async () => new Response("ok")) as unknown as typeof fetch;
  const before = await revisar(ctx, f);
  expect(before.ok).toBe(false);
  expect(before.hallazgos[0]?.valor).toBe("[DNI oculto]");
  await writeFile(
    join(dir, "app.ts"),
    'const button="¿Algo está mal? Avísanos"',
  );
  expect((await revisar(ctx, f)).ok).toBe(true);
  const source = join(import.meta.dir, "../src/index.ts");
  for (const cmd of [
    ["ficha", "validar"],
    ["ficha", "--desde", "ficha.json"],
    ["revisar"],
    ["registrar"],
    ["check"],
    ["submit"],
  ]) {
    const p = Bun.spawn(
      [
        process.execPath,
        source,
        "--registro",
        pathToFileURL(r.dir).href,
        "--cwd",
        dir,
        "--json",
        ...cmd,
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    const data = JSON.parse(await new Response(p.stdout).text());
    expect(typeof data.ok).toBe("boolean");
    if (cmd[0] === "ficha") expect(data.ok).toBe(true);
    else {
      expect(data.ok).toBe(false);
      expect(data.code).toBe("VALIDATION");
    }
    await p.exited;
  }
});

test("la ficha que se publicará se escanea aunque todavía no esté versionada", async () => {
  const dir = await mkdtemp(join(tmpdir(), "barbaritat-untracked-"));
  await writeFile(join(dir, "app.ts"), "<BotonAviso />");
  for (const args of [
    ["git", "init"],
    ["git", "add", "app.ts"],
  ]) {
    const p = Bun.spawn(args, { cwd: dir, stdout: "pipe", stderr: "pipe" });
    expect(await p.exited).toBe(0);
  }
  await writeFile(
    join(dir, "ficha.json"),
    JSON.stringify({ ...fichaPrueba, nombre: "Persona 12345678Z" }),
  );
  const r = new RegistroLocal(join(import.meta.dir, "../demo/registro"));
  const ctx = {
    opts: {},
    registro: r,
    cwd: dir,
    config: { registro: "local", plantilla: undefined, releases: undefined },
  };
  const f = (async () => new Response("ok")) as unknown as typeof fetch;
  const result = await revisar(ctx, f);
  expect(result.hallazgos).toContainEqual({
    archivo: "ficha.json",
    linea: 1,
    tipo: "DNI",
    valor: "[DNI oculto]",
  });
});
