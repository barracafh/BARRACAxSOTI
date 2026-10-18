import { z } from "zod";
import { ejecutar, type Runner } from "../lib/proceso";
import { CliError } from "@hacknight/shared/errors";
import {
  eventoSchema,
  equipoSchema,
  trackSchema,
  repo,
  fichaSchema,
  type Registro,
  type Issue,
  type Ficha,
  type RegistroFicha,
  type Equipo,
} from "@hacknight/shared/modelo";
const ghIssue = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  user: z.object({ login: z.string() }),
  labels: z.array(z.object({ name: z.string() })),
  state: z.enum(["open", "closed"]),
  created_at: z.string(),
  html_url: z.string(),
  pull_request: z.unknown().optional(),
});
type GhIssue = z.infer<typeof ghIssue>;
const issue = (i: GhIssue): Issue => ({
  numero: i.number,
  titulo: i.title,
  cuerpo: i.body ?? "",
  autor: i.user.login,
  etiquetas: i.labels.map((l) => l.name),
  estado: i.state,
  fecha: i.created_at,
  url: i.html_url,
});
export class RegistroGitHub implements Registro {
  readonly tipo = "github" as const;
  constructor(
    public nombre: string,
    private run: Runner = ejecutar,
    // Committee notices live where squads have no Write: with it they could
    // edit a notice and still show it under a committee handle.
    private avisos = nombre,
  ) {
    if (!repo.safeParse(nombre).success || !repo.safeParse(avisos).success)
      throw new CliError(
        "CONFIG",
        "Registro debe ser propietario/repo o file:///ruta.",
        "Revisa --registro.",
        2,
      );
  }
  async api<T>(
    path: string,
    schema: z.ZodType<T>,
    method = "GET",
    body?: unknown,
    repositorio = this.nombre,
  ): Promise<T> {
    const args = [
      "gh",
      "api",
      `repos/${repositorio}/${path}`,
      "--method",
      method,
    ];
    if (body !== undefined) args.push("--input", "-");
    const raw = await this.run(args, body);
    try {
      return schema.parse(JSON.parse(raw));
    } catch {
      throw new CliError(
        "GITHUB",
        "GitHub devolvió datos inesperados.",
        "Comprueba el formato del registro.",
        5,
      );
    }
  }
  async usuario() {
    try {
      await this.run(["gh", "auth", "status"]);
    } catch (e) {
      if (e instanceof CliError && e.code === "DEPENDENCY") throw e;
      throw new CliError(
        "UNAUTHENTICATED",
        "No hay sesión de GitHub disponible.",
        "Ejecuta gh auth login.",
        3,
      );
    }
    return z
      .object({ login: z.string() })
      .parse(JSON.parse(await this.run(["gh", "api", "user"]))).login;
  }
  async archivo<T>(path: string, schema: z.ZodType<T>, ref?: string) {
    const data = await this.api(
      `contents/${path}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
      z.object({ content: z.string() }),
    );
    try {
      return schema.parse(
        JSON.parse(Buffer.from(data.content, "base64").toString()),
      );
    } catch {
      throw new CliError(
        "CONFIG",
        `JSON inválido en ${path}.`,
        "El comité debe corregir el registro.",
        2,
      );
    }
  }
  evento = () => this.archivo("evento.json", eventoSchema);
  equipos = () => this.archivo("equipos.json", z.array(equipoSchema));
  tracks = () => this.archivo("tracks.json", z.array(trackSchema));
  comite = () => this.archivo("comite.json", z.array(z.string()));
  async paginas<T>(
    path: string,
    schema: z.ZodType<T>,
    repositorio = this.nombre,
  ): Promise<T[]> {
    const all: T[] = [];
    for (let page = 1; ; page++) {
      const rows = await this.api(
        `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
        z.array(schema),
        "GET",
        undefined,
        repositorio,
      );
      all.push(...rows);
      if (rows.length < 100) return all;
    }
  }
  async issues() {
    return (await this.paginas("issues?state=all", ghIssue, this.avisos))
      .filter((i) => !i.pull_request)
      .map(issue);
  }
  async fichas(): Promise<RegistroFicha[]> {
    const prs = await this.paginas(
      "pulls?state=all",
      z.object({
        number: z.number(),
        updated_at: z.string(),
        html_url: z.string(),
        state: z.string(),
        merged_at: z.string().nullable(),
        head: z.object({ ref: z.string(), sha: z.string() }),
      }),
    );
    const result: RegistroFicha[] = [];
    for (const p of prs.filter(
      (p) =>
        p.head.ref.startsWith("hacknight/ficha-") &&
        (p.state === "open" || p.merged_at),
    )) {
      const id = p.head.ref.slice("hacknight/ficha-".length);
      if (!/^[a-z0-9-]+$/.test(id)) continue;
      try {
        const ficha = await this.archivo(
          `fichas/${id}.json`,
          fichaSchema,
          p.head.sha,
        );
        result.push({
          numero: p.number,
          fecha: p.updated_at,
          url: p.html_url,
          estado: p.merged_at ? "integrado" : "pendiente",
          ficha,
        });
      } catch (e) {
        if (e instanceof CliError && e.code === "NOT_FOUND") continue;
        throw e;
      }
    }
    return result.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
  async registrar(ficha: Ficha, fecha: string): Promise<RegistroFicha> {
    const branch = `hacknight/ficha-${ficha.equipo}`;
    const path = `fichas/${ficha.equipo}.json`;
    const meta = await this.api("", z.object({ default_branch: z.string() }));
    let branchExists = true;
    try {
      await this.api(
        `git/ref/heads/${branch}`,
        z.object({ object: z.object({ sha: z.string() }) }),
      );
    } catch (e) {
      if (!(e instanceof CliError) || e.code !== "NOT_FOUND") throw e;
      branchExists = false;
    }
    if (!branchExists) {
      const base = await this.api(
        `git/ref/heads/${meta.default_branch}`,
        z.object({ object: z.object({ sha: z.string() }) }),
      );
      await this.api("git/refs", z.unknown(), "POST", {
        ref: `refs/heads/${branch}`,
        sha: base.object.sha,
      });
    }
    let sha: string | undefined;
    try {
      sha = (
        await this.api(
          `contents/${path}?ref=${encodeURIComponent(branch)}`,
          z.object({ sha: z.string() }),
        )
      ).sha;
    } catch (e) {
      if (!(e instanceof CliError) || e.code !== "NOT_FOUND") throw e;
    }
    await this.api(`contents/${path}`, z.unknown(), "PUT", {
      message: `Register ${ficha.equipo}`,
      content: Buffer.from(JSON.stringify(ficha, null, 2) + "\n").toString(
        "base64",
      ),
      branch,
      sha,
    });
    const prs = await this.api(
      `pulls?state=open&head=${encodeURIComponent(this.nombre.split("/")[0] + ":" + branch)}`,
      z.array(z.object({ number: z.number(), html_url: z.string() })),
    );
    const p =
      prs[0] ??
      (await this.api(
        "pulls",
        z.object({ number: z.number(), html_url: z.string() }),
        "POST",
        {
          title: `Ficha: ${ficha.nombre}`,
          head: branch,
          base: meta.default_branch,
          body: `Registro de ${ficha.equipo} · track ${ficha.herramienta}\n\n${fecha}\n\nRevisado con hacknight. Pendiente de integración por el comité.`,
        },
      ));
    return {
      numero: p.number,
      fecha,
      url: p.html_url,
      ficha,
      estado: "pendiente",
    };
  }
  private pushCache?: {
    at: number;
    items: {
      id: string;
      fecha: string;
      herramienta: string;
      texto: string;
      url: string;
    }[];
  };
  async pushes(equipos?: Equipo[]) {
    if (this.pushCache && Date.now() - this.pushCache.at < 180000)
      return this.pushCache.items;
    const out: {
      id: string;
      fecha: string;
      herramienta: string;
      texto: string;
      url: string;
    }[] = [];
    for (const team of (equipos ?? (await this.equipos())).filter(
      (t) => t.repo,
    )) {
      let raw: string;
      try {
        raw = await this.run([
          "gh",
          "api",
          `repos/${team.repo}/events?per_page=30`,
        ]);
      } catch (e) {
        // El squad puede estar configurado antes de que infra/equipos cree su repositorio.
        if (e instanceof CliError && e.code === "NOT_FOUND") continue;
        throw e;
      }
      const rows = z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
            created_at: z.string(),
            actor: z.object({ login: z.string() }),
          }),
        )
        .parse(JSON.parse(raw));
      for (const e of rows.filter((e) => e.type === "PushEvent"))
        out.push({
          id: e.id,
          fecha: e.created_at,
          herramienta: team.herramienta,
          texto: `${e.actor.login} ha subido cambios a ${team.nombre}`,
          url: `https://github.com/${team.repo}/commits`,
        });
    }
    this.pushCache = { at: Date.now(), items: out };
    return out;
  }
}
