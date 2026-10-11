import {z} from 'zod';
import type {Issue,Equipo,Track} from './modelo';
export const citaSchema=z.object({tipo:z.literal('cita'),squad:z.string(),herramienta:z.string(),mesa:z.string(),motivo:z.string().min(1).max(160),estado:z.enum(['espera','llamado','atendido','anulado'])});
export type Cita=z.infer<typeof citaSchema>&{numero:number;turno:string;autor:string;fecha:string;url:string};
export function cola(issues:Issue[],equipos:Equipo[],tracks:Track[]):Cita[]{
 const out:Cita[]=[];
 for(const i of issues.filter(i=>i.etiquetas.includes('ventanilla')&&i.estado==='open')){
 let parsed;try{parsed=citaSchema.safeParse(JSON.parse(i.cuerpo));}catch{continue;}if(!parsed.success)continue;
 const c=parsed.data;const team=equipos.find(t=>t.id===c.squad&&t.herramienta===c.herramienta&&t.miembros.some(m=>m.toLowerCase()===i.autor.toLowerCase()));const track=tracks.find(t=>t.slug===c.herramienta);if(!team||!track||!['espera','llamado'].includes(c.estado))continue;
 out.push({...c,mesa:team.mesa,numero:i.numero,turno:`${track.prefijo}-${String(i.numero).padStart(3,'0')}`,autor:i.autor,fecha:i.fecha,url:i.url});
 }return out.sort((a,b)=>a.numero-b.numero);
}
export function citaBody(c:Cita,estado:z.infer<typeof citaSchema>['estado']){return JSON.stringify(citaSchema.parse({...c,estado}),null,2);}
