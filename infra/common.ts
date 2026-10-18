import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

export const root = resolve(import.meta.dir, "..");
export type Command = { args: string[]; input?: string };
export type Plan = { files: Record<string, string>; commands: Command[] };
export type Runner = (command: Command, cwd: string) => Promise<void>;

export function options(names: string[], args = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    strict: true,
    allowPositionals: false,
    options: {
      "dry-run": { type: "boolean" },
      apply: { type: "boolean" },
      ...Object.fromEntries(
        names.map((name) => [name, { type: "string" as const }]),
      ),
    },
  });
  if (values.apply && values["dry-run"])
    throw new Error("Elige --dry-run o --apply, no ambos.");
  const parsed: Record<string, string | boolean | undefined> = values;
  return {
    apply: values.apply === true,
    get: (name: string) =>
      typeof parsed[name] === "string" ? parsed[name] : undefined,
  };
}

export function repository(value?: string) {
  if (
    !value ||
    !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(value)
  )
    throw new Error("Indica --repo propietario/repositorio.");
  return value;
}

export const shellQuote = (value: string) =>
  "'" + value.replaceAll("'", "'\\''") + "'";

export function initialCommit(message: string): Command[] {
  return [
    { args: ["git", "init", "--initial-branch=main"] },
    { args: ["git", "add", "."] },
    {
      args: [
        "git",
        "-c",
        "user.name=Hacknight",
        "-c",
        "user.email=organizacion@example.invalid",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-m",
        message,
      ],
    },
  ];
}

export async function executePlan(
  plan: Plan,
  apply = false,
  runner: Runner = correr,
  log = console.log,
) {
  if (!apply) {
    log(
      "Simulación: no se escriben archivos ni se ejecutan comandos. Directorio de trabajo: temporal nuevo.",
    );
    for (const [path, content] of Object.entries(plan.files))
      log(`# Archivo ${path}\n${content}`);
    for (const command of plan.commands) {
      if (command.input !== undefined)
        log(`# JSON por stdin:\n${command.input}`);
      log(command.args.map(shellQuote).join(" "));
    }
    return;
  }
  const directory = await mkdtemp(join(tmpdir(), "hacknight-infra-"));
  try {
    for (const [path, content] of Object.entries(plan.files)) {
      const target = join(directory, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }
    for (const command of plan.commands) await runner(command, directory);
    log(
      "Preparación completada. Comprueba los permisos antes de dar acceso a los squads.",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export const org = "barracafh"; // GitHub organization and Vercel team
export type Archivos = Record<string, string | Uint8Array>;

export const vercel = (
  path: string,
  method = "GET",
  body?: unknown,
): Command => ({
  args: [
    "vercel",
    "api",
    `${path}${path.includes("?") ? "&" : "?"}slug=${org}`,
    "-X",
    method,
    "--raw",
    ...(body === undefined ? [] : ["--input", "-"]),
  ],
  input: body === undefined ? undefined : JSON.stringify(body),
});

export async function salida(args: string[]) {
  const child = Bun.spawn(args, { stdout: "pipe", stderr: "ignore" });
  const [texto, code] = await Promise.all([
    new Response(child.stdout).text(),
    child.exited,
  ]);
  return code === 0 ? texto : undefined;
}
export const existe = async (args: string[]) =>
  (await salida(args)) !== undefined;

// A failure shows the tool's own error, so the next run can be planned from
// what actually happened.
async function correr({ args, input }: Command, cwd: string) {
  const child = Bun.spawn(args, {
    cwd,
    stdin: input === undefined ? "ignore" : new Blob([input]),
    stdout: "ignore",
    stderr: "pipe",
  });
  const [error, code] = await Promise.all([
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0)
    throw new Error(
      `Falló ${args.slice(0, 3).join(" ")} (salida ${code}):\n${error.trim().slice(-800)}`,
    );
}

export async function ejecutar(
  titulo: string,
  files: Archivos,
  commands: Command[],
  apply: boolean,
  log: (line: string) => void,
) {
  log(`\n## ${titulo}`);
  if (!apply) {
    for (const path of Object.keys(files).sort()) log(`# Archivo ${path}`);
    for (const c of commands) {
      log(c.args.map(shellQuote).join(" "));
      if (c.input !== undefined) log(`# JSON por stdin: ${c.input}`);
    }
    return;
  }
  const dir = await mkdtemp(join(tmpdir(), "hacknight-equipo-"));
  try {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, path)), { recursive: true });
      await writeFile(join(dir, path), content);
    }
    for (const c of commands) await correr(c, dir);
    log("Hecho.");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// A project deployed from a generated folder: created if missing, its env
// upserted, deployed to production and given its domain once.
export async function pasosDespliegue(
  proyecto: string,
  dominio: string,
  apply: boolean,
  env: { key: string; value: string }[] = [],
): Promise<Command[]> {
  const commands: Command[] = [];
  if (!apply || !(await existe(vercel(`/v9/projects/${proyecto}`).args)))
    commands.push(vercel("/v11/projects", "POST", { name: proyecto }));
  for (const { key, value } of env)
    commands.push(
      vercel(`/v10/projects/${proyecto}/env?upsert=true`, "POST", {
        key,
        value,
        type: "encrypted",
        target: ["production"],
      }),
    );
  commands.push(
    { args: ["vercel", "link", "--yes", "--project", proyecto, "--team", org] },
    { args: ["vercel", "deploy", "--prod", "--yes", "--scope", org] },
  );
  if (
    !apply ||
    !(await existe(vercel(`/v9/projects/${proyecto}/domains/${dominio}`).args))
  )
    commands.push(
      vercel(`/v10/projects/${proyecto}/domains`, "POST", { name: dominio }),
    );
  return commands;
}
