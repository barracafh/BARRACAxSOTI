import { mkdtemp, cp, mkdir, appendFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { contexto } from "../src/lib/contexto";
import { RegistroLocal } from "../src/registro/local";
import { iniciarServidor, type Simulacion } from "../src/live/servidor";

const root = resolve(import.meta.dir, "..");
export async function prepararDemoLive() {
  const dir = await mkdtemp(join(tmpdir(), "barbaritat-live-"));
  const reg = join(dir, "registro");
  await cp(join(root, "demo/registro"), reg, { recursive: true });
  const evento = await Bun.file(join(reg, "evento.json")).json();
  evento.inicio = new Date(Date.now() - 30 * 60000).toISOString();
  evento.fin = new Date(Date.now() + 3.5 * 3600000).toISOString();
  await writeFile(join(reg, "evento.json"), JSON.stringify(evento, null, 2));
  const ctx = await contexto({
    registro: pathToFileURL(reg).href,
    cwd: dir,
    usuario: "demo-alba",
  });
  const equipos = await ctx.registro.equipos();
  const participants = await Promise.all(
    equipos.map(async (e, i) => {
      const project = join(dir, e.id),
        claude = join(dir, "logs", e.id, "claude"),
        codex = join(dir, "logs", e.id, "codex");
      await Promise.all([
        mkdir(project, { recursive: true }),
        mkdir(claude, { recursive: true }),
        mkdir(codex, { recursive: true }),
      ]);
      await writeFile(
        join(codex, "sesion.jsonl"),
        JSON.stringify({
          type: "session_meta",
          payload: { id: `demo-codex-${i}`, cwd: project },
        }) + "\n",
      );
      return {
        usuario: e.miembros[0]!,
        equipo: e.id,
        project,
        claude,
        codex,
        sequence: 0,
        input: 0,
        output: 0,
        cache: 0,
      };
    }),
  );
  async function generar(
    index: number,
    scale = 1,
    fecha = new Date().toISOString(),
  ) {
    const p = participants[index]!;
    const sequence = ++p.sequence;
    const amount = (1000 + ((sequence + index * 7) % 11) * 450) * scale;
    await appendFile(
      join(p.claude, "sesion.jsonl"),
      JSON.stringify({
        type: "assistant",
        sessionId: `demo-claude-${index}`,
        timestamp: fecha,
        cwd: p.project,
        message: {
          id: `mensaje-${sequence}`,
          model: "claude-demo",
          content: [
            { text: "Texto ficticio que nunca debe viajar al backend." },
          ],
          usage: {
            input_tokens: amount,
            output_tokens: Math.floor(amount / 2),
            cache_read_input_tokens: amount * 3,
            cache_creation_input_tokens: 100,
          },
        },
      }) + "\n",
    );
    p.input += amount * 2;
    p.output += amount;
    p.cache += amount;
    await appendFile(
      join(p.codex, "sesion.jsonl"),
      JSON.stringify({
        timestamp: fecha,
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: p.input,
              output_tokens: p.output,
              cached_input_tokens: p.cache,
            },
            last_token_usage: {
              input_tokens: amount * 2,
              output_tokens: amount,
              cached_input_tokens: amount,
            },
          },
        },
      }) + "\n",
    );
  }
  for (let j = 0; j < 6; j++)
    for (let i = 0; i < participants.length; i++)
      await generar(
        i,
        i + 1,
        new Date(Date.now() - (25 - j * 4) * 60000).toISOString(),
      );
  for (const [i, e] of equipos.entries()) {
    if (i > 1) break;
    await new RegistroLocal(reg, e.miembros[0]).crearIssue(
      "Ayuda de demo",
      JSON.stringify({
        tipo: "cita",
        squad: e.id,
        herramienta: e.herramienta,
        mesa: e.mesa,
        motivo: i
          ? "Revisar las fuentes del PDF"
          : "Conectar la pieza al centro",
        estado: i ? "espera" : "llamado",
      }),
      ["ventanilla"],
    );
  }
  await new RegistroLocal(reg, "demo-mentor-ona").crearIssue(
    "Ensayo general",
    "Bona vesprada. Las ventanillas están abiertas: construimos una plataforma entre todos.",
    ["aviso"],
  );
  await new RegistroLocal(reg, "demo-gala").crearIssue(
    "Avance de Segell",
    "Ya tenemos la lista de dominios oficiales. Siguiente paso: comprobar los avisos sospechosos.",
    ["tablon"],
  );
  return { dir, reg, ctx, participants, generar };
}

export async function arrancarDemoLive(puerto = 4310, auto = true) {
  const f = await prepararDemoLive();
  let automatica = auto,
    closed = false,
    pending: Promise<unknown> | undefined;
  const simulacion: Simulacion = {
    estado: () => ({ automatica }),
    accion: async (action) => {
      if (action === "pausar") {
        automatica = false;
        await pending;
      } else if (action === "reanudar") automatica = true;
      else {
        await pending;
        await f.generar(0, 150);
      }
    },
  };
  const server = await iniciarServidor(f.ctx, {
    puerto,
    db: join(f.dir, "uso.sqlite"),
    demo: true,
    simulacion,
  });
  const children: ReturnType<typeof Bun.spawn>[] = [];
  const logs: Promise<unknown>[] = [];
  const cli = process.env.BARBARITAT_BIN
    ? [resolve(process.env.BARBARITAT_BIN)]
    : [process.execPath, join(root, "src/index.ts")];
  const command = (i: number) => [
    ...cli,
    "--registro",
    pathToFileURL(f.reg).href,
    "--usuario",
    f.participants[i]!.usuario,
    "--cwd",
    f.participants[i]!.project,
    "observar",
    "--servidor",
    server.url,
    "--intervalo",
    "1",
  ];
  const watcherEnv = (i: number) => ({
    ...process.env,
    BARBARITAT_CLAUDE_DIR: f.participants[i]!.claude,
    BARBARITAT_CODEX_DIR: f.participants[i]!.codex,
  });
  function spawnWatcher(i: number) {
    const p = Bun.spawn([...command(i), "--json"], {
      env: watcherEnv(i),
      stdout: "pipe",
      stderr: "pipe",
    });
    logs.push(
      Promise.all([
        new Response(p.stdout).text(),
        new Response(p.stderr).text(),
      ]).then(([out, err]) =>
        writeFile(join(f.dir, `watcher-${i}-${p.pid}.txt`), out + err),
      ),
    );
    children.push(p);
    return p;
  }
  for (let i = 0; i < f.participants.length; i++) spawnWatcher(i);
  const timer = setInterval(() => {
    if (!automatica || closed || pending) return;
    pending = Promise.all(f.participants.map((_, i) => f.generar(i)))
      .catch((e) => {
        automatica = false;
        console.error(
          "La simulación se ha detenido:",
          e instanceof Error ? e.message : "Error de escritura",
        );
      })
      .finally(() => {
        pending = undefined;
      });
  }, 2500);
  return {
    ...f,
    ...server,
    simulacion,
    command,
    watcherEnv,
    spawnWatcher,
    children,
    close: async () => {
      closed = true;
      clearInterval(timer);
      await pending;
      for (const p of children) if (p.exitCode === null) p.kill("SIGTERM");
      const force = setTimeout(() => {
        for (const p of children) if (p.exitCode === null) p.kill("SIGKILL");
      }, 7000);
      await Promise.all(children.map((p) => p.exited));
      clearTimeout(force);
      await Promise.all(logs);
      await server.close();
    },
  };
}
