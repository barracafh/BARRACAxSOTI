import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { hash, ventanaId, type Lote } from "@hacknight/shared/contrato-uso";
import { eventoSchema } from "@hacknight/shared/modelo";
import { estado } from "../infra/sala/estado";
import { recibirUso } from "../infra/sala/uso";
import type { Consulta } from "../infra/sala/almacen";
import { escanear, servidorDestino } from "../apps/cli/src/watcher/cliente";
import { sesion } from "../apps/cli/src/watcher/sesion";

const root = resolve(import.meta.dir, "..");
const fixture = (name: string) =>
  Bun.file(join(root, "test/fixtures/registro", name)).text();
const evento = eventoSchema.parse(JSON.parse(await fixture("evento.json")));
const enElBuild = Date.parse(evento.inicio) + 60_000;

// GitHub as the room would see it: the fixture registry and one login per token.
function github(logins: Record<string, string>, llamadas: string[] = []) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(url)).pathname;
    llamadas.push(path);
    if (path === "/user") {
      const token = (init?.headers as Record<string, string>).authorization;
      const login = logins[token?.replace("Bearer ", "") ?? ""];
      return login
        ? Response.json({ login })
        : new Response("", { status: 401 });
    }
    const file = path.match(/\/contents\/([a-z]+\.json)$/)?.[1];
    if (file)
      return Response.json({
        content: Buffer.from(await fixture(file)).toString("base64"),
      });
    if (/\/(issues|pulls|events)$/.test(path)) return Response.json([]);
    return new Response("", { status: 404 });
  }) as unknown as typeof fetch;
}

// Postgres stand-in: records every statement and answers the two reads.
function baseDeDatos() {
  const sentencias: { texto: string; params: unknown[] }[] = [];
  const consulta: Consulta = async (texto, params = []) => {
    sentencias.push({ texto, params });
    if (texto.includes("RETURNING 1"))
      return (params[2] as string[]).map(() => ({}));
    if (texto.includes("FROM usos"))
      return [
        {
          usuario: "demo-alba",
          herramienta: "claude-code",
          tramo: 0,
          input: 100,
          output: 20,
          cacheRead: 0,
          cacheWrite: 0,
          peticiones: 2,
        },
      ];
    if (texto.includes("FROM watchers"))
      return [{ usuario: "demo-alba", ultima: enElBuild }];
    return [];
  };
  return { consulta, sentencias };
}

const lote = (usuario: string): Lote => ({
  version: 1,
  ventana: ventanaId(evento),
  usuario,
  cliente: hash("portatil"),
  eventos: [
    {
      id: hash("peticion"),
      herramienta: "claude-code",
      fecha: new Date(enElBuild - 30_000).toISOString(),
      input: 100,
      output: 20,
      cacheRead: 0,
      cacheWrite: 0,
    },
  ],
});
const enviar = (body: unknown, token?: string) =>
  new Request("https://sala.example/api/uso", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });

test("ranking: la sala solo cuenta lotes de quien firma con su sesión de GitHub", async () => {
  const llamadas: string[] = [];
  const fetcher = github(
    { "token-alba": "demo-alba", "token-fuera": "alguien-mas" },
    llamadas,
  );
  const { consulta, sentencias } = baseDeDatos();
  const deps = { fetcher, consulta, now: enElBuild };
  expect((await recibirUso(enviar(lote("demo-alba")), deps)).status).toBe(401);
  expect(
    (await recibirUso(enviar(lote("demo-alba"), "token-falso"), deps)).status,
  ).toBe(401);
  expect(
    (await recibirUso(enviar(lote("demo-bruno"), "token-alba"), deps)).status,
  ).toBe(403);
  expect(
    (await recibirUso(enviar(lote("alguien-mas"), "token-fuera"), deps)).status,
  ).toBe(422);
  expect(
    (await recibirUso(enviar({ version: 2 }, "token-alba"), deps)).status,
  ).toBe(400);
  const ok = await recibirUso(enviar(lote("demo-alba"), "token-alba"), deps);
  expect(await ok.json()).toEqual({ ok: true, recibidos: 1, cambios: 1 });
  const insert = sentencias.find((s) => s.texto.includes("INSERT INTO usos"))!;
  expect(insert.params.slice(0, 2)).toEqual([ventanaId(evento), "demo-alba"]);
  // The second batch of the same session reuses the cached login.
  const antes = llamadas.filter((p) => p === "/user").length;
  await recibirUso(enviar(lote("demo-alba"), "token-alba"), deps);
  expect(llamadas.filter((p) => p === "/user").length).toBe(antes);
});

test("ranking: el estado público suma por squad y no lista a las personas", async () => {
  const { consulta } = baseDeDatos();
  const res = await estado(github({}), consulta);
  const body = await res.json();
  expect(body.vistas.clasificacion).toBe(true);
  expect(body.consumo.total).toBe(120);
  expect(body.consumo.peticiones).toBe(2);
  expect(body.consumo.squads[0]).toMatchObject({
    id: "squad-taronja",
    total: 120,
  });
  expect(body.consumo.personas).toEqual([]);
  expect(JSON.stringify(body)).not.toContain("demo-alba");
});

test("ranking: un fallo de GitHub se puede reintentar con la misma sesión", async () => {
  const fallos = [
    ...[403, 429, 502, 503].map((status) => () => new Response("", { status })),
    () => {
      throw new Error("Sin conexión");
    },
    () => new Response("JSON inválido"),
    () => Response.json({}),
  ];
  for (const [i, fallo] of fallos.entries()) {
    const token = `token-reintento-${i}`;
    const { consulta, sentencias } = baseDeDatos();
    const req = () => enviar(lote("demo-alba"), token);
    const failed = await recibirUso(req(), {
      consulta,
      now: enElBuild,
      fetcher: (async () => fallo()) as unknown as typeof fetch,
    });
    expect([i, failed.status]).toEqual([i, 503]);
    expect(sentencias).toHaveLength(0);
    const retry = await recibirUso(req(), {
      consulta,
      now: enElBuild,
      fetcher: github({ [token]: "demo-alba" }),
    });
    expect(retry.status).toBe(200);
  }
});

test("ranking: el watcher se identifica una vez y luego solo envía lo nuevo", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-ranking-"));
  const previas = {
    config: process.env.HACKNIGHT_CONFIG,
    claude: process.env.HACKNIGHT_CLAUDE_DIR,
    codex: process.env.HACKNIGHT_CODEX_DIR,
    pi: process.env.HACKNIGHT_PI_DIR,
  };
  try {
    process.env.HACKNIGHT_CONFIG = join(dir, "config", "config.json");
    const pasos: number[] = [];
    const respuestas = [
      {
        device_code: "d",
        user_code: "ABCD-1234",
        verification_uri: "https://github.com/login/device",
        interval: 5,
      },
      { error: "authorization_pending" },
      { error: "slow_down" },
      { access_token: "token-alba" },
    ];
    const avisos: string[] = [];
    const token = await sesion(
      (t) => avisos.push(t),
      (async () =>
        Response.json(respuestas.shift())) as unknown as typeof fetch,
      async (s) => void pasos.push(s),
    );
    expect(token).toBe("token-alba");
    expect(pasos).toEqual([5, 5, 10]);
    expect(avisos.join()).toContain("ABCD-1234");
    const guardada = join(dir, "config", "sesion.json");
    expect((await stat(guardada)).mode & 0o777).toBe(0o600);
    expect(
      await sesion(() => {}, (async () => {
        throw new Error("No debe volver a pedirla");
      }) as unknown as typeof fetch),
    ).toBe("token-alba");

    const logs = join(dir, "logs");
    await mkdir(logs);
    await writeFile(
      join(logs, "s.jsonl"),
      JSON.stringify({
        type: "assistant",
        sessionId: "s",
        cwd: dir,
        timestamp: new Date().toISOString(),
        message: {
          id: "m",
          model: "x",
          usage: { input_tokens: 50, output_tokens: 20 },
        },
      }),
    );
    process.env.HACKNIGHT_CLAUDE_DIR = logs;
    process.env.HACKNIGHT_CODEX_DIR = join(dir, "vacio");
    process.env.HACKNIGHT_PI_DIR = join(dir, "vacio");
    const recibidos: {
      auth: string | null;
      eventos: number;
      ventana: string;
    }[] = [];
    const servidor = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      async fetch(req) {
        const body = (await req.json()) as Lote;
        recibidos.push({
          auth: req.headers.get("authorization"),
          eventos: body.eventos.length,
          ventana: body.ventana,
        });
        return Response.json({
          ok: true,
          recibidos: body.eventos.length,
          cambios: body.eventos.length,
        });
      },
    });
    try {
      const ahora = new Date();
      const ventana = {
        ...evento,
        inicio: new Date(ahora.getTime() - 3600_000).toISOString(),
        fin: new Date(ahora.getTime() + 3600_000).toISOString(),
      };
      const enviados = new Map<string, number>();
      const nuevaVentana = {
        ...ventana,
        fin: new Date(ahora.getTime() + 7200_000).toISOString(),
      };
      for (const horario of [ventana, ventana, nuevaVentana, nuevaVentana])
        await escanear({
          cwd: dir,
          usuario: "demo-alba",
          evento: horario,
          servidor: servidor.url.href,
          token,
          enviados,
        });
      expect(recibidos).toEqual([
        { auth: "Bearer token-alba", eventos: 1, ventana: ventanaId(ventana) },
        { auth: "Bearer token-alba", eventos: 0, ventana: ventanaId(ventana) },
        {
          auth: "Bearer token-alba",
          eventos: 1,
          ventana: ventanaId(nuevaVentana),
        },
        {
          auth: "Bearer token-alba",
          eventos: 0,
          ventana: ventanaId(nuevaVentana),
        },
      ]);
    } finally {
      servidor.stop(true);
    }
    expect(servidorDestino("https://sala.build.barraca.house").host).toBe(
      "sala.build.barraca.house",
    );
    for (const url of [
      "https://a.example/x",
      "https://u:p@a.example",
      "http://a.example",
    ])
      expect(() => servidorDestino(url)).toThrow();
  } finally {
    for (const [k, v] of Object.entries({
      HACKNIGHT_CONFIG: previas.config,
      HACKNIGHT_CLAUDE_DIR: previas.claude,
      HACKNIGHT_CODEX_DIR: previas.codex,
      HACKNIGHT_PI_DIR: previas.pi,
    }))
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    await rm(dir, { recursive: true, force: true });
  }
});
