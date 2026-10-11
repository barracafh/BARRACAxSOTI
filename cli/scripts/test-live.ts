import { strict as assert } from "node:assert";
import { join } from "node:path";
import { arrancarDemoLive } from "./live-fixture";
import { consumoLocal } from "../src/consumo/local";
import { iniciarServidor } from "../src/live/servidor";

const demo = await arrancarDemoLive(0, false);
const estado = async (base = demo.url) => {
  const res = await fetch(new URL("/api/estado", base));
  assert.equal(res.status, 200);
  return await res.json();
};
async function esperar(total: number) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const s = await estado();
    if (s.consumo.total === total) return s;
    await Bun.sleep(150);
  }
  throw new Error(
    `La clasificación no alcanzó ${total}: ${(await estado()).consumo.total}`,
  );
}
async function esperado() {
  const event = await demo.ctx.registro.evento();
  return (
    await Promise.all(
      demo.participants.map((p) =>
        consumoLocal(p.project, event.inicio, event.fin, {
          claude: p.claude,
          codex: p.codex,
        }),
      ),
    )
  ).reduce((s, r) => s + r.total, 0);
}
async function once(i: number) {
  const p = Bun.spawn([...demo.command(i), "--once", "--json"], {
    env: demo.watcherEnv(i),
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(p.stdout).text();
  const err = await new Response(p.stderr).text();
  assert.equal(await p.exited, 0, err);
  return JSON.parse(text);
}
let finalTotal = 0;
try {
  const initial = await esperado();
  const initialState = await esperar(initial);
  assert.equal(initialState.consumo.activos, 4);
  assert.equal(
    initialState.consumo.squads.filter((s: any) => s.total > 0).length,
    4,
  );
  assert.equal(
    initialState.consumo.herramientas.filter((h: any) => h.total > 0).length,
    2,
  );
  console.log(
    `PASS: 4 watchers → HTTP → SQLite → 4 squads; ${initial} tokens exactos.`,
  );
  await once(0);
  await once(0);
  assert.equal((await estado()).consumo.total, initial);
  console.log("PASS: dos reenvíos completos no duplican tokens.");
  const stopped = demo.children[0]!;
  stopped.kill("SIGTERM");
  await stopped.exited;
  await demo.generar(0, 80);
  assert.equal((await estado()).consumo.total, initial);
  demo.spawnWatcher(0);
  const caughtUp = await esperar(await esperado());
  assert(caughtUp.consumo.total > initial);
  assert.equal(caughtUp.consumo.squads[0].id, "squad-taronja");
  console.log("PASS: reinicio recupera uso pendiente y cambia el líder.");
  const res = await fetch(new URL("/api/demo", demo.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "impulso" }),
  });
  assert.equal(res.status, 200);
  finalTotal = await esperado();
  const final = await esperar(finalTotal);
  assert(finalTotal > caughtUp.consumo.total);
  assert(!JSON.stringify(final).includes("Texto ficticio"));
  assert(!JSON.stringify(final).includes(demo.dir));
  console.log(
    "PASS: botón de demo → logs → watcher → clasificación, sin contenido ni rutas.",
  );
  const issue = (await demo.ctx.registro.issues()).find((i) =>
    i.etiquetas.includes("ventanilla"),
  )!;
  await demo.ctx.registro.editarIssue(issue.numero, { estado: "closed" });
  assert.equal((await estado()).cola.length, 1);
  console.log("PASS: cambios de ventanilla del registro llegan a la web.");
  for (const path of [
    "/",
    "/pantalla",
    "/app.js",
    "/style.css",
    "/paleta.css",
  ]) {
    const response = await fetch(new URL(path, demo.url));
    assert.equal(response.status, 200);
    const body = await response.text();
    assert(body.length > 100);
    if (path === "/") assert(body.includes("<!doctype html>"));
  }
  console.log("PASS: web, proyector y recursos completos por HTTP.");
} finally {
  await demo.close();
}
const restarted = await iniciarServidor(demo.ctx, {
  puerto: 0,
  db: join(demo.dir, "uso.sqlite"),
});
try {
  assert.equal((await estado(restarted.url)).consumo.total, finalTotal);
  const noDemo = await fetch(new URL("/api/demo", restarted.url), {
    method: "POST",
    body: '{"accion":"impulso"}',
  });
  assert.equal(noDemo.status, 404);
  console.log(
    "PASS: reinicio del backend conserva totales y servidor normal no expone controles de simulación.",
  );
} finally {
  await restarted.close();
}
console.log(`Circuito live completo. Archivos de prueba: ${demo.dir}`);

// El comando servidor debe servir los assets también desde el binario autónomo.
const cli = process.env.BARBARITAT_BIN
  ? [process.env.BARBARITAT_BIN]
  : [process.execPath, join(import.meta.dir, "../src/index.ts")];
const serverProcess = Bun.spawn(
  [
    ...cli,
    "--registro",
    `file://${demo.reg}`,
    "--json",
    "servidor",
    "--puerto",
    "0",
    "--db",
    join(demo.dir, "uso.sqlite"),
  ],
  { stdout: "pipe", stderr: "pipe" },
);
const killTimer = setTimeout(() => serverProcess.kill("SIGKILL"), 10000);
try {
  const reader = serverProcess.stderr.getReader();
  let ready = "",
    url: string | undefined;
  try {
    while (!url) {
      const { value, done } = await reader.read();
      if (done) throw new Error(`Servidor no disponible: ${ready}`);
      ready += new TextDecoder().decode(value);
      url = ready.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
    }
  } finally {
    reader.releaseLock();
  }
  const home = await fetch(url);
  assert((await home.text()).includes("<!doctype html>"));
  assert(
    (await (await fetch(new URL("/app.js", url))).text()).includes(
      "renderRanking",
    ),
  );
  assert.equal((await estado(url)).consumo.total, finalTotal);
  serverProcess.kill("SIGTERM");
  assert.equal(await serverProcess.exited, 0);
  const output = JSON.parse(await new Response(serverProcess.stdout).text());
  assert.equal(output.ok, true);
  assert.equal(output.data.detenido, true);
  console.log(
    "PASS: comando servidor sirve assets embebidos y emite un único JSON al cerrar.",
  );
} finally {
  clearTimeout(killTimer);
  if (serverProcess.exitCode === null) serverProcess.kill("SIGKILL");
  await serverProcess.exited;
}
