import { mkdtemp, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const root = resolve(import.meta.dir, "../..");
const dir = await mkdtemp(join(tmpdir(), "barbaritat-demo-"));
const registro = join(dir, "registro"),
  project = join(dir, "squad-taronja");
await cp(join(root, "test/fixtures/registro"), registro, { recursive: true });
const evento = await Bun.file(join(registro, "evento.json")).json();
evento.registroFueraDePlazo = true;
await writeFile(join(registro, "evento.json"), JSON.stringify(evento, null, 2));
const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  fetch: () =>
    new Response("<h1>Demo local</h1>", {
      headers: { "Content-Type": "text/html" },
    }),
});
const cmd = process.env.BARBARITAT_BIN
  ? [resolve(process.env.BARBARITAT_BIN)]
  : [process.execPath, join(root, "cli/src/index.ts")];
async function run(
  name: string,
  args: string[],
  cwd = dir,
  expect = 0,
  user = "demo-alba",
) {
  const p = Bun.spawn(
    [
      ...cmd,
      "--registro",
      pathToFileURL(registro).href,
      "--usuario",
      user,
      "--cwd",
      cwd,
      ...args,
    ],
    {
      env: {
        ...process.env,
        NO_COLOR: "1",
        BARBARITAT_CLAUDE_DIR: join(dir, "sin-historiales"),
        BARBARITAT_CODEX_DIR: join(dir, "sin-historiales"),
      },
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [out, err, status] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  process.stdout.write(`\n>>> ${name}\n${out}${err}`);
  await writeFile(join(dir, `${name}.txt`), out + err);
  if (status !== expect)
    throw new Error(`${name}: código ${status}, esperado ${expect}`);
}
try {
  await run("expediente", ["expediente"]);
  await run("tramitar", ["tramitar"]);
  const ficha = await Bun.file(join(project, "ficha.json")).json();
  ficha.url = server.url.href;
  await writeFile(
    join(dir, "ficha-completa.json"),
    JSON.stringify(ficha, null, 2),
  );
  await run(
    "ficha",
    ["ficha", "--desde", join(dir, "ficha-completa.json")],
    project,
  );
  await run("revisar-falla", ["revisar"], project, 2);
  const html = await Bun.file(join(project, "index.html")).text();
  await writeFile(
    join(project, "index.html"),
    html
      .replace("12345678Z", "DOCUMENTO_SIMULADO")
      .replace(
        "</body>",
        '<a href="mailto:aviso@example.org">¿Algo está mal? Avísanos</a>\n</body>',
      ),
  );
  await run("revisar", ["revisar"], project);
  await run("registrar", ["registrar"], project);
  await run("expediente-final", ["expediente"], project);
  await run(
    "cita",
    ["cita", "--motivo", "Conectar la pieza al centro"],
    project,
  );
  await run(
    "ventanilla-llamar",
    ["ventanilla", "llamar"],
    project,
    0,
    "demo-mentor-ona",
  );
  await run("pantalla", ["pantalla", "--once", "--plain"], project);
  console.log(`\nDemo completa. Registro, proyecto y capturas: ${dir}`);
} finally {
  await server.stop(true);
}
