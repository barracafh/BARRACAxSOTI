import { mkdtemp, mkdir, appendFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { strict as assert } from "node:assert";
import { inicializarRegistro } from "@hacknight/shared/registro/gestion";
import { contexto } from "../../apps/cli/src/lib/contexto";
import { RegistroLocal } from "@hacknight/shared/registro/local";
import { iniciarServidor } from "../../apps/server/src/servidor";

const root = resolve(import.meta.dir, "../..");
export async function prepararPruebaLive() {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-live-"));
  const reg = join(dir, "registro");
  await inicializarRegistro(reg);
  const evento = await Bun.file(join(reg, "evento.json")).json();
  evento.inicio = new Date(Date.now() - 30 * 60000).toISOString();
  evento.fin = new Date(Date.now() + 3.5 * 3600000).toISOString();
  await writeFile(join(reg, "evento.json"), JSON.stringify(evento, null, 2));
  const ctx = await contexto({
    registro: pathToFileURL(reg).href,
    cwd: dir,
    usuario: "demo-alba",
  });
  const equipos: Awaited<ReturnType<RegistroLocal["equipos"]>> = await Bun.file(
    join(root, "test/fixtures/registro/equipos.json"),
  ).json();
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
  await new RegistroLocal(reg, "demo-mentor-ona").crearIssue(
    "Ensayo general",
    "Bona vesprada. Las ventanillas están abiertas: construimos una plataforma entre todos.",
    ["aviso"],
  );
  return { dir, reg, ctx, equipos, participants, generar };
}

export async function arrancarPruebaLive(puerto = 0) {
  const f = await prepararPruebaLive();
  const server = await iniciarServidor(f.ctx.registro as RegistroLocal, {
    puerto,
    db: join(f.dir, "uso.sqlite"),
  });
  const initial = await (
    await fetch(new URL("/api/estado", server.url))
  ).json();
  assert.equal(initial.consumo.total, 0);
  assert.deepEqual(initial.equipos, []);
  const auth = await fetch(new URL("/api/admin/sesion", server.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clave: (await Bun.file(server.clavePath).text()).trim(),
    }),
  });
  assert.equal(auth.status, 200);
  const cookie = auth.headers.get("set-cookie")!.split(";")[0]!;
  async function admin(config?: unknown) {
    const res = await fetch(new URL("/api/admin", server.url), {
      method: config ? "PUT" : "GET",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(config ? { body: JSON.stringify(config) } : {}),
    });
    assert.equal(res.status, 200);
    return res.json();
  }
  const { tracks, ...config } = await admin();
  await admin({
    ...config,
    equipos: f.equipos,
    comite: ["demo-mentor-ona", "demo-mentor-pau"],
  });
  console.log(
    "PASS: instancia vacía → login admin → crear equipos → registro compartido con CLI.",
  );
  const children: ReturnType<typeof Bun.spawn>[] = [];
  const logs: Promise<unknown>[] = [];
  const cli = process.env.HACKNIGHT_BIN
    ? [resolve(process.env.HACKNIGHT_BIN)]
    : [process.execPath, join(root, "apps/cli/src/index.ts")];
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
    HACKNIGHT_CLAUDE_DIR: f.participants[i]!.claude,
    HACKNIGHT_CODEX_DIR: f.participants[i]!.codex,
    HACKNIGHT_PI_DIR: f.participants[i]!.codex,
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
  return {
    ...f,
    ...server,
    admin,
    command,
    watcherEnv,
    spawnWatcher,
    children,
    close: async () => {
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
