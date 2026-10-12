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
export const runCommand: Runner = async ({ args, input }, cwd) => {
  const child = Bun.spawn(args, {
    cwd,
    stdin: input === undefined ? "ignore" : new Blob([input]),
    stdout: "ignore",
    stderr: "ignore",
  });
  const code = await child.exited;
  if (code !== 0)
    throw new Error(
      `Falló ${args[0]} ${args[1]} (salida ${code}). Revisa permisos y estado remoto antes de repetir.`,
    );
};

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
  runner: Runner = runCommand,
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
