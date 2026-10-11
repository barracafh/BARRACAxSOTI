import { z } from 'zod';
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const repo = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
const text = z.string().trim().min(1);
export const fuenteSchema = z.object({ nombre: text.max(120), url: z.url().refine(v => v.startsWith('https://'), 'Debe usar https') });
export const fichaSchema = z.strictObject({
  nombre: text.max(80), frase: text.max(180), icono: text.max(32), herramienta: slug,
  equipo: slug, url: z.url().refine(v => /^https?:\/\//.test(v), 'Debe ser una URL HTTP(S)'),
  fuentes: z.array(fuenteSchema).min(1), datos: z.enum(['reales','simulados'])
});
export type Ficha = z.infer<typeof fichaSchema>;
export const paqueteSchema = z.object({ id: slug, nombre: text, url: z.string(), sha256: z.string(), pendiente: z.boolean().default(false) });
export type Paquete = z.infer<typeof paqueteSchema>;
export const trackSchema = z.object({
  slug, nombre: text, frase: text, ciudadano: text, ventanilla: z.number().int().positive(),
  color: z.enum(['roig','tinta','cal','cobalto','taronja','horta','arena']), glifo: text, prefijo: z.string().regex(/^[A-Z]{1,2}$/),
  estado: z.enum(['nucleo','si-hay-gente','condicional','libre','fuera']), lead: text,
  piezas: z.array(text).min(2).max(3), paquetes: z.array(paqueteSchema), fuentes: z.array(fuenteSchema),
  dificultad: text, guias: z.array(text), motivo: z.string().optional(), cupo: z.number().int().positive().optional()
});
export type Track = z.infer<typeof trackSchema>;
export const equipoSchema = z.object({ id: slug, nombre: text, herramienta: slug, pieza: text, mesa: text, miembros: z.array(text), repo: repo.or(z.literal('')) });
export type Equipo = z.infer<typeof equipoSchema>;
const zoned = z.iso.datetime({offset:true});
export const eventoSchema = z.object({ nombre: text, inicio: zoned, fin: zoned, enlaces: z.record(z.string(),z.url()), registroFueraDePlazo: z.boolean() }).refine(v=>Date.parse(v.fin)>Date.parse(v.inicio),'El fin debe ser posterior al inicio');
export type Evento = z.infer<typeof eventoSchema>;
export const issueSchema = z.object({ numero: z.number().int().positive(), titulo: z.string(), cuerpo: z.string(), autor: text, etiquetas: z.array(z.string()), estado: z.enum(['open','closed']), fecha: zoned, url: z.string() });
export type Issue = z.infer<typeof issueSchema>;
export interface RegistroFicha { numero: number; fecha: string; ficha: Ficha; url: string; estado: 'pendiente'|'integrado'; }
export interface Registro {
  tipo: 'local'|'github';
  usuario(): Promise<string>;
  evento(): Promise<Evento>;
  equipos(): Promise<Equipo[]>;
  tracks(): Promise<Track[]>;
  comite(): Promise<string[]>;
  issues(): Promise<Issue[]>;
  crearIssue(titulo:string,cuerpo:string,etiquetas:string[]): Promise<Issue>;
  editarIssue(numero:number, cambios: {estado?:'open'|'closed'; cuerpo?:string; titulo?:string}): Promise<Issue>;
  fichas(): Promise<RegistroFicha[]>;
  registrar(ficha:Ficha, fecha:string): Promise<RegistroFicha>;
  pushes(): Promise<{id:string; fecha:string; herramienta:string; texto:string; url:string}[]>;
}
