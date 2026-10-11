import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { join, resolve, relative, isAbsolute } from "node:path";
import { homedir } from "node:os";
import {
  normalizarClaude,
  normalizarCodex,
  type EstadoCodex,
  type Uso,
} from "./colectores";
export interface Consumo {
  total: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  peticiones: number;
  porHerramienta: Record<string, number>;
  desde: string;
  hasta: string;
  alcance: string;
  avisos: string[];
}
export interface RutasConsumo {
  claude: string;
  codex: string;
}
async function archivos(
  root: string,
  avisos: string[],
  label: string,
): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") return [];
    avisos.push(`${label}: no se pudo leer parte del historial local.`);
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const path = join(root, e.name);
    if (e.isDirectory()) out.push(...(await archivos(path, avisos, label)));
    else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(path);
  }
  return out;
}
export async function consumoLocal(
  cwd: string,
  inicio: string,
  fin: string,
  rutas: RutasConsumo = {
    claude:
      process.env.BARBARITAT_CLAUDE_DIR ??
      join(
        process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude"),
        "projects",
      ),
    codex:
      process.env.BARBARITAT_CODEX_DIR ??
      join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "sessions"),
  },
  now = Date.now(),
): Promise<Consumo> {
  const since = Date.parse(inicio),
    until = Math.min(Date.parse(fin), now);
  const sum: Consumo = {
    total: 0,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    peticiones: 0,
    porHerramienta: {},
    desde: inicio,
    hasta: new Date(until).toISOString(),
    alcance:
      "Contribución local de este proyecto al squad; no incluye otras máquinas.",
    avisos: [],
  };
  if (now < since) return sum;
  const seen = new Map<string, Uso>();
  for (const [kind, root] of Object.entries(rutas)) {
    for (const path of await archivos(root, sum.avisos, kind)) {
      try {
        const state: EstadoCodex = { session: path, linea: 0 };
        const stream = createReadStream(path, { encoding: "utf8" });
        const lines = createInterface({ input: stream, crlfDelay: Infinity });
        try {
          for await (const line of lines) {
            let raw: unknown;
            try {
              raw = JSON.parse(line);
            } catch {
              continue;
            }
            const e =
              kind === "claude"
                ? normalizarClaude(raw)
                : normalizarCodex(raw, state);
            if (!e || !e.cwd || e.fecha < since || e.fecha > until) continue;
            const rel = relative(resolve(cwd), resolve(e.cwd));
            if (
              rel === ".." ||
              rel.startsWith(
                ".." + (process.platform === "win32" ? "\\" : "/"),
              ) ||
              isAbsolute(rel)
            )
              continue;
            const old = seen.get(e.id);
            if (
              !old ||
              e.input + e.output + e.cacheRead + e.cacheWrite >
                old.input + old.output + old.cacheRead + old.cacheWrite
            )
              seen.set(e.id, e);
          }
        } finally {
          lines.close();
          stream.destroy();
        }
      } catch {
        sum.avisos.push(
          `${kind}: un historial no se pudo leer; el total es parcial.`,
        );
      }
    }
  }
  for (const e of seen.values()) {
    sum.input += e.input;
    sum.output += e.output;
    sum.cacheRead += e.cacheRead;
    sum.cacheWrite += e.cacheWrite;
    sum.peticiones++;
    const total = e.input + e.output + e.cacheRead + e.cacheWrite;
    sum.total += total;
    sum.porHerramienta[e.herramienta] =
      (sum.porHerramienta[e.herramienta] ?? 0) + total;
  }
  return sum;
}
