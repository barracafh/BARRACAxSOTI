import { z } from "zod";
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const repo = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
const text = z.string().trim().min(1).regex(/\S/);
export const fuenteSchema = z.object({
  nombre: text.max(120),
  url: z.url().regex(/^https:\/\//, "Debe usar https"),
});
export const fichaSchema = z.strictObject({
  nombre: text.max(80),
  frase: text.max(180),
  icono: text.max(32),
  herramienta: slug,
  equipo: slug,
  url: z.url().regex(/^https?:\/\//, "Debe ser una URL HTTP(S)"),
  fuentes: z.array(fuenteSchema).min(1),
  datos: z.enum(["reales", "simulados"]),
});
export type Ficha = z.infer<typeof fichaSchema>;
export const trackSchema = z.object({
  slug,
  nombre: text,
  frase: text,
  ciudadano: text,
  ventanilla: z.number().int().positive(),
  color: z.enum(["magenta", "cian", "acid", "after", "paper", "muted"]),
  glifo: text,
  estado: z.enum(["nucleo", "si-hay-gente", "condicional", "libre", "fuera"]),
  piezas: z.array(text).min(2).max(3),
  fuentes: z.array(fuenteSchema),
  dificultad: text,
  guias: z.array(text),
  motivo: z.string().optional(),
  cupo: z.number().int().positive().optional(),
});
export type Track = z.infer<typeof trackSchema>;
export const equipoSchema = z.object({
  id: slug,
  nombre: text,
  herramienta: slug,
  mesa: text,
  miembros: z.array(text),
  repo: repo.or(z.literal("")),
});
export type Equipo = z.infer<typeof equipoSchema>;
const zoned = z.iso.datetime({ offset: true });
export const eventoSchema = z
  .object({
    nombre: text,
    nombre_corto: text,
    organizan: text,
    inicio: zoned,
    fin: zoned,
    enlaces: z.record(z.string(), z.url()),
    registroFueraDePlazo: z.boolean(),
  })
  .refine(
    (v) => Date.parse(v.fin) > Date.parse(v.inicio),
    "El fin debe ser posterior al inicio",
  );
export type Evento = z.infer<typeof eventoSchema>;
export const issueSchema = z.object({
  numero: z.number().int().positive(),
  titulo: z.string(),
  cuerpo: z.string(),
  autor: text,
  etiquetas: z.array(z.string()),
  estado: z.enum(["open", "closed"]),
  fecha: zoned,
  url: z.string(),
});
export type Issue = z.infer<typeof issueSchema>;
export interface RegistroFicha {
  numero: number;
  fecha: string;
  ficha: Ficha;
  url: string;
  estado: "pendiente" | "integrado";
}
export interface Registro {
  tipo: "local" | "github";
  usuario(): Promise<string>;
  evento(): Promise<Evento>;
  equipos(): Promise<Equipo[]>;
  tracks(): Promise<Track[]>;
  comite(): Promise<string[]>;
  issues(): Promise<Issue[]>;
  fichas(): Promise<RegistroFicha[]>;
  registrar(ficha: Ficha, fecha: string): Promise<RegistroFicha>;
  pushes(equipos?: Equipo[]): Promise<
    {
      id: string;
      fecha: string;
      herramienta: string;
      texto: string;
      url: string;
    }[]
  >;
}
