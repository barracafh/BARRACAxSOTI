import { join } from "node:path";
import { mkdir, rm, readFile } from "node:fs/promises";
import { z } from "zod";
import { leer, guardar, esAusente } from "../lib/io";
import { CliError } from "../lib/errors";
import { leerGestion } from "./gestion";
import {
  eventoSchema,
  equipoSchema,
  trackSchema,
  issueSchema,
  fichaSchema,
  type Registro,
  type Issue,
  type RegistroFicha,
  type Ficha,
} from "../lib/modelo";
const stateSchema = z.object({
  siguiente: z.number().int().positive(),
  issues: z.array(issueSchema),
  registros: z.array(
    z.object({
      numero: z.number(),
      fecha: z.string(),
      ficha: fichaSchema,
      url: z.string(),
      estado: z.enum(["pendiente", "integrado"]),
    }),
  ),
});
export class RegistroLocal implements Registro {
  readonly tipo = "local" as const;
  constructor(
    public dir: string,
    private login = process.env.BARBARITAT_USUARIO ?? "",
  ) {}
  usuario = async () => {
    if (!this.login)
      throw new CliError(
        "USAGE",
        "Falta tu identidad local.",
        "Indica --usuario <handle> o BARBARITAT_USUARIO.",
        2,
      );
    return this.login;
  };
  evento = async () =>
    (await leerGestion(this.dir))?.evento ??
    leer(join(this.dir, "evento.json"), eventoSchema);
  equipos = async () =>
    (await leerGestion(this.dir))?.equipos ??
    leer(join(this.dir, "equipos.json"), z.array(equipoSchema));
  tracks = () => leer(join(this.dir, "tracks.json"), z.array(trackSchema));
  comite = async () =>
    (await leerGestion(this.dir))?.comite ??
    leer(join(this.dir, "comite.json"), z.array(z.string().min(1)));
  private async state() {
    try {
      return stateSchema.parse(
        JSON.parse(await readFile(join(this.dir, ".estado.json"), "utf8")),
      );
    } catch (e) {
      if (esAusente(e)) return { siguiente: 1, issues: [], registros: [] };
      throw new CliError(
        "CONFIG",
        "Estado local inválido.",
        "Revisa .estado.json; no se ha sobrescrito.",
        2,
      );
    }
  }
  private async mutate<T>(
    fn: (s: z.infer<typeof stateSchema>) => Promise<T> | T,
  ): Promise<T> {
    const lock = join(this.dir, ".lock");
    try {
      await mkdir(lock);
    } catch {
      throw new CliError(
        "LOCKED",
        "El registro local está ocupado.",
        "Reintenta; si se interrumpió un proceso, revisa .lock.",
        1,
      );
    }
    try {
      const s = await this.state();
      const result = await fn(s);
      await guardar(join(this.dir, ".estado.json"), s);
      return result;
    } finally {
      await rm(lock, { recursive: true });
    }
  }
  issues = async () => (await this.state()).issues;
  crearIssue = (titulo: string, cuerpo: string, etiquetas: string[]) =>
    this.mutate(async (s) => {
      const numero = s.siguiente++;
      const issue: Issue = {
        numero,
        titulo,
        cuerpo,
        etiquetas,
        autor: await this.usuario(),
        estado: "open",
        fecha: new Date().toISOString(),
        url: `local:issue/${numero}`,
      };
      s.issues.push(issue);
      return issue;
    });
  editarIssue = (
    numero: number,
    cambios: { estado?: "open" | "closed"; cuerpo?: string; titulo?: string },
  ) =>
    this.mutate((s) => {
      const i = s.issues.find((i) => i.numero === numero);
      if (!i)
        throw new CliError(
          "NOT_FOUND",
          "Turno no encontrado.",
          "Consulta cita estado.",
          4,
        );
      Object.assign(i, cambios);
      return i;
    });
  fichas = async (): Promise<RegistroFicha[]> => (await this.state()).registros;
  registrar = (ficha: Ficha, fecha: string) =>
    this.mutate(async (s) => {
      const previo = s.registros.find((r) => r.ficha.equipo === ficha.equipo);
      const entry: RegistroFicha = {
        numero: previo?.numero ?? s.siguiente++,
        fecha,
        ficha,
        url: `local:fichas/${ficha.equipo}.json`,
        estado: "integrado",
      };
      if (previo) Object.assign(previo, entry);
      else s.registros.push(entry);
      await guardar(join(this.dir, "fichas", `${ficha.equipo}.json`), ficha);
      return entry;
    });
  pushes = async () => [];
}
