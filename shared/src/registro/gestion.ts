import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { guardar, esAusente } from "../io";
import { eventoSchema, equipoSchema, type Track } from "../modelo";
import type { RegistroLocal } from "./local";
import eventoBase from "../../registro-base/evento.json";
import tracksBase from "../../registro-base/tracks.json";

export const vistasIniciales = {
  clasificacion: true,
  personas: false,
  negociados: true,
  ventanilla: true,
  tablon: true,
  pantalla: true,
};
export const handle = z
  .string()
  .regex(
    /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i,
    "Usa un handle de GitHub sin @",
  );
export const gestionSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  evento: eventoSchema,
  equipos: z
    .array(equipoSchema.extend({ miembros: z.array(handle).max(5) }).strict())
    .max(100),
  comite: z.array(handle).max(50),
  vistas: z.strictObject({
    clasificacion: z.boolean(),
    personas: z.boolean(),
    negociados: z.boolean(),
    ventanilla: z.boolean(),
    tablon: z.boolean(),
    pantalla: z.boolean(),
  }),
});
export type Gestion = z.infer<typeof gestionSchema>;
export class ErrorGestion extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function leerGestion(dir: string): Promise<Gestion | undefined> {
  try {
    return gestionSchema.parse(
      JSON.parse(await readFile(join(dir, ".gestion.json"), "utf8")),
    );
  } catch (e) {
    if (esAusente(e)) return undefined;
    throw e;
  }
}
export async function administracion(reg: RegistroLocal): Promise<Gestion> {
  const saved = await leerGestion(reg.dir);
  if (saved) return saved;
  const [evento, equipos, comite] = await Promise.all([
    reg.evento(),
    reg.equipos(),
    reg.comite(),
  ]);
  return {
    revision: 0,
    evento,
    equipos,
    comite,
    vistas: { ...vistasIniciales },
  };
}
export function validarAsignaciones(data: Gestion, tracks: Track[]) {
  const ids = new Set<string>(),
    usuarios = new Set<string>();
  for (const e of data.equipos) {
    if (ids.has(e.id)) throw new ErrorGestion(`El id ${e.id} está repetido.`);
    ids.add(e.id);
    const track = tracks.find(
      (t) => t.slug === e.herramienta && t.estado !== "fuera",
    );
    if (!track)
      throw new ErrorGestion(`El track de ${e.nombre} no está disponible.`);
    if (
      track.cupo &&
      data.equipos.filter((s) => s.herramienta === track.slug).length >
        track.cupo
    )
      throw new ErrorGestion(
        `El track ${track.nombre} tiene cupo ${track.cupo}.`,
      );
    for (const u of e.miembros) {
      if (usuarios.has(u.toLowerCase()))
        throw new ErrorGestion(`@${u} está asignado más de una vez.`);
      usuarios.add(u.toLowerCase());
    }
  }
  if (
    new Set(data.comite.map((u) => u.toLowerCase())).size !== data.comite.length
  )
    throw new ErrorGestion("Hay miembros del comité repetidos.");
}
export async function guardarGestion(reg: RegistroLocal, raw: unknown) {
  const parsed = gestionSchema.safeParse(raw);
  if (!parsed.success)
    throw new ErrorGestion(
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  validarAsignaciones(parsed.data, await reg.tracks());
  const lock = join(reg.dir, ".admin-lock");
  try {
    await mkdir(lock);
  } catch {
    throw new ErrorGestion("Otra edición está guardándose. Reintenta.", 409);
  }
  try {
    const previo = await administracion(reg);
    if (previo.revision !== parsed.data.revision)
      throw new ErrorGestion(
        "El registro ha cambiado en otra ventana. Recarga antes de guardar.",
        409,
      );
    const next = { ...parsed.data, revision: previo.revision + 1 };
    await guardar(join(reg.dir, ".gestion.json"), next);
    return next;
  } finally {
    await rm(lock, { recursive: true });
  }
}
// Solo valores reales del evento y el catálogo. Nunca crea personas, consumo o procesos.
export async function inicializarRegistro(dir: string) {
  await mkdir(dir, { recursive: true });
  for (const [name, data] of Object.entries({
    evento: eventoBase,
    tracks: tracksBase,
    equipos: [],
    comite: [],
  })) {
    try {
      await writeFile(
        join(dir, `${name}.json`),
        JSON.stringify(data, null, 2) + "\n",
        { flag: "wx" },
      );
    } catch (e) {
      if (!(e instanceof Error && "code" in e && e.code === "EEXIST")) throw e;
    }
  }
}
