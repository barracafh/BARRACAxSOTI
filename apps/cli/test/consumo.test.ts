import { afterEach, test, expect } from "bun:test";
import { mkdtemp, mkdir, writeFile, cp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import {
  normalizarClaude,
  normalizarCodex,
  normalizarPi,
  type EstadoCodex,
} from "../src/consumo/colectores";
import { consumoLocal } from "../src/consumo/local";
import { proyectoDePrueba } from "./proyecto";
const tempDirs: string[] = [];
afterEach(async () => {
  for (const dir of tempDirs.splice(0))
    await rm(dir, { recursive: true, force: true });
});
const claude = (cwd: string, fecha: string, id = "msg1") => ({
  type: "assistant",
  sessionId: "s1",
  timestamp: fecha,
  cwd,
  message: {
    id,
    model: "claude-example",
    content: [{ text: "PRIVADO NO MOSTRAR" }],
    usage: {
      input_tokens: 20,
      output_tokens: 10,
      cache_creation_input_tokens: 3,
      cache_read_input_tokens: 7,
    },
  },
});
const count = (fecha: string, input: number, output: number, cached = 0) => ({
  timestamp: fecha,
  type: "event_msg",
  payload: {
    type: "token_count",
    info: {
      total_token_usage: {
        input_tokens: input,
        output_tokens: output,
        cached_input_tokens: cached,
      },
      last_token_usage: {
        input_tokens: input,
        output_tokens: output,
        cached_input_tokens: cached,
      },
    },
  },
});
test("Claude solo conserva contadores y descarta cancelaciones", () => {
  const data = claude("/demo", "2026-10-22T19:00:00Z");
  const normalized = normalizarClaude(data);
  expect(normalized).toMatchObject({
    input: 20,
    output: 10,
    cacheRead: 7,
    cacheWrite: 3,
  });
  expect(JSON.stringify(normalized)).not.toContain("PRIVADO");
  data.message.model = "<synthetic>";
  expect(normalizarClaude(data)).toBeNull();
});
test("Codex deduplica contadores acumulados y resta la caché del input", () => {
  const s: EstadoCodex = { session: "demo", linea: 0 };
  const first = count("2026-10-22T19:00:00Z", 100, 20, 30);
  expect(normalizarCodex(first, s)).toMatchObject({
    input: 70,
    output: 20,
    cacheRead: 30,
  });
  expect(normalizarCodex(first, s)).toBeNull();
  expect(
    normalizarCodex(count("2026-10-22T19:01:00Z", 150, 25, 40), s),
  ).toMatchObject({ input: 40, output: 5, cacheRead: 10 });
});
test("Pi toma el cwd de la cabecera, cuenta una vez las sesiones bifurcadas y descarta mensajes sin uso", () => {
  const s: { cwd?: string } = {};
  expect(
    normalizarPi({ type: "session", id: "s", cwd: "/proyecto" }, s),
  ).toBeNull();
  const mensaje = (usage: Record<string, number>) => ({
    type: "message",
    timestamp: "2026-10-22T17:00:00.000Z",
    message: {
      role: "assistant",
      model: "modelo",
      responseId: "resp-1",
      timestamp: Date.parse("2026-10-22T17:00:00Z"),
      content: [{ type: "text", text: "NO ENVIAR" }],
      usage: { input: 10, output: 5, cacheRead: 100, cacheWrite: 2, ...usage },
    },
  });
  const uso = normalizarPi(mensaje({}), s);
  expect(uso).toEqual({
    id: "pi:resp-1",
    herramienta: "pi",
    fecha: Date.parse("2026-10-22T17:00:00Z"),
    cwd: "/proyecto",
    input: 10,
    output: 5,
    cacheRead: 100,
    cacheWrite: 2,
  });
  // The same message copied into a fork keeps its key.
  expect(normalizarPi(mensaje({}), { cwd: "/proyecto" })?.id).toBe(uso!.id);
  expect(
    normalizarPi(
      mensaje({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }),
      s,
    ),
  ).toBeNull();
  expect(
    normalizarPi(
      { type: "message", timestamp: "x", message: { role: "user" } },
      s,
    ),
  ).toBeNull();
});

test("consumo filtra ventana y proyecto, deduplica bloques y nunca devuelve prompts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "buildnight-consumo-"));
  tempDirs.push(dir);
  const rutas = { claude: join(dir, "claude"), codex: join(dir, "codex") };
  await mkdir(rutas.claude);
  await mkdir(rutas.codex);
  const project = join(dir, "project");
  const start = "2026-10-22T16:30:00Z",
    end = "2026-10-22T20:00:00Z";
  await writeFile(
    join(rutas.claude, "session.jsonl"),
    [
      claude(project, start),
      claude(project, start),
      claude(project, "2026-10-22T16:00:00Z", "old"),
      claude(project + "-other", start, "other"),
      claude(project, "2026-10-22T21:00:00Z", "late"),
    ]
      .map((x) => JSON.stringify(x))
      .join("\n") + "\n{bad\n",
  );
  await writeFile(
    join(rutas.codex, "rollout.jsonl"),
    [
      { type: "session_meta", payload: { id: "codex1", cwd: project } },
      count("2026-10-22T16:00:00Z", 100, 20, 30),
      count("2026-10-22T18:00:00Z", 150, 25, 40),
      count("2026-10-22T18:00:00Z", 150, 25, 40),
    ]
      .map((x) => JSON.stringify(x))
      .join("\n"),
  );
  const report = await consumoLocal(
    project,
    start,
    end,
    rutas,
    Date.parse(end),
  );
  expect(report.total).toBe(95);
  expect(report.peticiones).toBe(2);
  expect(report.porHerramienta).toEqual({ "claude-code": 40, codex: 55 });
  expect(JSON.stringify(report)).not.toContain("PRIVADO");
  expect(JSON.stringify(report)).not.toContain(project);
});
test("consumo --json y tasa en justificante con historiales sintéticos", async () => {
  const dir = await mkdtemp(join(tmpdir(), "buildnight-tasa-"));
  tempDirs.push(dir);
  const reg = join(dir, "registro");
  await cp(join(import.meta.dir, "../../../test/fixtures/registro"), reg, {
    recursive: true,
  });
  const logs = join(dir, "logs");
  await mkdir(logs);
  const empty = join(dir, "sin-logs");
  const pre = join(dir, "fetch.js");
  await writeFile(pre, 'globalThis.fetch = async () => new Response("OK");');
  const ev = await Bun.file(join(reg, "evento.json")).json();
  ev.inicio = new Date(Date.now() - 3600000).toISOString();
  ev.fin = new Date(Date.now() + 3600000).toISOString();
  await writeFile(join(reg, "evento.json"), JSON.stringify(ev));
  async function cli(args: string[], cwd = dir) {
    const p = Bun.spawn(
      [
        process.execPath,
        "--preload",
        pre,
        join(import.meta.dir, "../src/index.ts"),
        "--registro",
        pathToFileURL(reg).href,
        "--cwd",
        cwd,
        "--json",
        ...args,
      ],
      {
        env: {
          ...process.env,
          BUILDNIGHT_USUARIO: "demo-alba",
          BUILDNIGHT_CLAUDE_DIR: logs,
          BUILDNIGHT_CODEX_DIR: empty,
          BUILDNIGHT_PI_DIR: empty,
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const data = JSON.parse(await new Response(p.stdout).text());
    expect(await p.exited).toBe(0);
    return data;
  }
  const project = await proyectoDePrueba(dir);
  await writeFile(
    join(logs, "session.jsonl"),
    JSON.stringify(claude(project, new Date().toISOString())) + "\n",
  );
  const usage = await cli(["consumo"], project);
  expect(usage.data.total).toBe(40);
  expect(usage.data.equipo).toBe("squad-taronja");
  expect(JSON.stringify(usage)).not.toContain("PRIVADO");
  const ficha = await Bun.file(join(project, "ficha.json")).json();
  ficha.url = "http://localhost:1234";
  await writeFile(join(project, "ficha.json"), JSON.stringify(ficha));
  await writeFile(
    join(project, "index.html"),
    "<button>¿Algo está mal? Avísanos</button>",
  );
  expect((await cli(["registrar"], project)).data.tasaTokens).toBe(40);
});
