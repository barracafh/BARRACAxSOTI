import { RegistroLocal } from "@buildnight/shared/registro/local";
import { publicarUso, servidorLocal } from "../apps/cli/src/watcher/cliente";
import { test, expect, afterEach } from "bun:test";
import { mkdtemp, cp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { AlmacenUso } from "../apps/server/src/almacen";
import {
  hash,
  loteSchema,
  ventanaId,
  type Lote,
} from "@buildnight/shared/contrato-uso";
import { contexto } from "../apps/cli/src/lib/contexto";
import { crearHandler } from "../apps/server/src/servidor";
import { leerConsumo } from "../apps/cli/src/consumo/local";

const directories: string[] = [];
afterEach(async () => {
  for (const dir of directories.splice(0))
    await rm(dir, { recursive: true, force: true });
});

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "buildnight-live-test-"));
  directories.push(dir);
  const reg = join(dir, "registro");
  await cp(join(import.meta.dir, "./fixtures/registro"), reg, {
    recursive: true,
  });
  const ctx = await contexto({
    registro: pathToFileURL(reg).href,
    usuario: "demo-alba",
    cwd: dir,
  });
  const evento = await ctx.registro.evento();
  evento.inicio = new Date(Date.now() - 60000).toISOString();
  evento.fin = new Date(Date.now() + 3600000).toISOString();
  await writeFile(join(reg, "evento.json"), JSON.stringify(evento));
  const equipos = await ctx.registro.equipos(),
    tracks = await ctx.registro.tracks();
  const db = join(dir, "uso.sqlite");
  const almacen = new AlmacenUso(db);
  const lote: Lote = {
    version: 1,
    ventana: ventanaId(evento),
    usuario: "demo-alba",
    cliente: hash("client"),
    eventos: [
      {
        id: hash("event"),
        herramienta: "claude-code",
        fecha: new Date().toISOString(),
        input: 20,
        output: 10,
        cacheRead: 7,
        cacheWrite: 3,
      },
    ],
  };
  return { dir, ctx, evento, equipos, tracks, db, almacen, lote };
}

test("los reintentos, reinicios y dos watchers no inflan la clasificación", async () => {
  const f = await fixture();
  expect(f.almacen.recibir(f.lote, f.evento, f.equipos).cambios).toBe(1);
  expect(
    f.almacen.recibir(
      { ...f.lote, cliente: hash("second") },
      f.evento,
      f.equipos,
    ).cambios,
  ).toBe(0);
  f.almacen.close();
  const db = new AlmacenUso(f.db);
  try {
    expect(db.recibir(f.lote, f.evento, f.equipos).cambios).toBe(0);
    const more = {
      ...f.lote,
      // Un bloque posterior de la misma respuesta puede tener otra fecha.
      eventos: f.lote.eventos.map((e) => ({
        ...e,
        fecha: new Date(Date.parse(e.fecha) + 1).toISOString(),
        output: 30,
      })),
    };
    db.recibir(more, f.evento, f.equipos);
    db.recibir(f.lote, f.evento, f.equipos);
    db.recibir({ ...f.lote, usuario: "demo-dalia" }, f.evento, f.equipos);
    const estado = db.clasificacion(f.evento, f.equipos, f.tracks);
    expect(estado.total).toBe(100);
    expect(estado.peticiones).toBe(2);
    expect(estado.activos).toBe(2);
    expect(estado.squads[0]).toMatchObject({ id: "squad-taronja", total: 60 });
    expect(estado.tracks.find((t) => t.slug === "claridad")?.total).toBe(40);
    expect(estado.herramientas[0]?.total).toBe(100);
    expect(estado.evolucion.reduce((s, b) => s + b.total, 0)).toBe(100);
    expect(
      db.clasificacion(f.evento, f.equipos, f.tracks, Date.now() + 100000)
        .activos,
    ).toBe(0);
  } finally {
    db.close();
  }
});

test("API valida identidad de demo, ventana, cuerpo y origen sin guardar contenido arbitrario", async () => {
  const f = await fixture();
  const handler = crearHandler(f.ctx.registro as RegistroLocal, f.almacen);
  const post = (data: unknown, headers: Record<string, string> = {}) =>
    handler(
      new Request("http://127.0.0.1:4310/api/uso", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(data),
      }),
    );
  try {
    expect((await post({ ...f.lote, prompt: "NO GUARDAR" })).status).toBe(400);
    expect((await post({ ...f.lote, usuario: "intruso" })).status).toBe(422);
    expect((await post({ ...f.lote, ventana: hash("otra") })).status).toBe(422);
    expect(
      (
        await post({
          ...f.lote,
          eventos: [{ ...f.lote.eventos[0], fecha: f.evento.fin }],
        })
      ).status,
    ).toBe(422);
    expect(
      (await post(f.lote, { Origin: "https://otro.example" })).status,
    ).toBe(403);
    expect((await post({ padding: "x".repeat(256001) })).status).toBe(413);
    expect(
      (await handler(new Request("http://host.example/api/estado"))).status,
    ).toBe(403);
    expect((await post(f.lote)).status).toBe(200);
    const estado = await (
      await handler(new Request("http://127.0.0.1:4310/api/estado"))
    ).json();
    expect(estado.vistas.clasificacion).toBe(true);
    expect(estado.consumo.personas).toEqual([]);
    expect(estado.consumo.total).toBe(40);
    expect(JSON.stringify(estado)).not.toContain("NO GUARDAR");
    expect(
      loteSchema.safeParse({
        ...f.lote,
        eventos: [{ ...f.lote.eventos[0], input: -1 }],
      }).success,
    ).toBe(false);
    expect(servidorLocal("http://localhost:4310").hostname).toBe("localhost");
    for (const url of [
      "https://example.com",
      "http://localhost/x",
      "http://a:b@localhost",
      "http://127.0.0.1/?x=1",
    ])
      expect(() => servidorLocal(url)).toThrow();
  } finally {
    f.almacen.close();
  }
});

test("del historial al servidor solo salen contadores; el instante de cierre queda fuera", async () => {
  const f = await fixture();
  const logs = join(f.dir, "logs");
  await mkdir(logs);
  const record = (id: string, timestamp: string) => ({
    type: "assistant",
    sessionId: "sesion-privada",
    cwd: f.dir,
    timestamp,
    message: {
      id,
      model: "modelo",
      content: [{ text: "NO ENVIAR ESTE PROMPT" }],
      usage: { input_tokens: 50, output_tokens: 20 },
    },
  });
  await writeFile(
    join(logs, "s.jsonl"),
    [record("msg", new Date().toISOString()), record("fin", f.evento.fin)]
      .map((r) => JSON.stringify(r))
      .join("\n"),
  );
  try {
    const { usos } = await leerConsumo(
      f.dir,
      f.evento.inicio,
      f.evento.fin,
      { claude: logs, codex: join(f.dir, "vacio") },
      Date.parse(f.evento.fin) + 1,
    );
    expect(usos).toHaveLength(1);
    const eventos = usos.map(publicarUso);
    const wire = JSON.stringify(eventos);
    for (const privateText of [f.dir, "sesion-privada", "NO ENVIAR", "modelo"])
      expect(wire).not.toContain(privateText);
    f.almacen.recibir({ ...f.lote, eventos }, f.evento, f.equipos);
    expect(f.almacen.clasificacion(f.evento, f.equipos, f.tracks).total).toBe(
      70,
    );
  } finally {
    f.almacen.close();
  }
});

test("observar --once --json funciona sin servidor, sin leer logs del usuario", async () => {
  const f = await fixture();
  f.almacen.close();
  const p = Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, "../apps/cli/src/index.ts"),
      "--registro",
      pathToFileURL(join(f.dir, "registro")).href,
      "--json",
      "observar",
      "--once",
    ],
    {
      env: {
        ...process.env,
        BUILDNIGHT_USUARIO: "demo-alba",
        BUILDNIGHT_CLAUDE_DIR: join(f.dir, "empty"),
        BUILDNIGHT_CODEX_DIR: join(f.dir, "empty"),
        BUILDNIGHT_PI_DIR: join(f.dir, "empty"),
      },
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const data = JSON.parse(await new Response(p.stdout).text());
  expect(await p.exited).toBe(0);
  expect(data).toMatchObject({
    ok: true,
    data: { total: 0, sincronizado: false, ciclos: 1 },
  });
});
