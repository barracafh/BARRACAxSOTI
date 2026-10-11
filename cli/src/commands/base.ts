import type {Contexto} from '../lib/contexto';
import {identidad} from '../lib/contexto';
import {CliError} from '../lib/errors';
import {salida} from '../lib/output';
import {panel,trackLabel,terminalText} from '../lib/estilo';
import {banner} from '../lib/banner';
import {cuentaAtras} from '../lib/tiempo';
export async function tracks(ctx:Contexto,slug?:string,todos=false){
 const ts=await ctx.registro.tracks();const chosen=slug?ts.filter(t=>t.slug===slug):ts.filter(t=>todos||t.estado!=='fuera');
 if(!chosen.length)throw new CliError('NOT_FOUND','No existe ese negociado.','Usa barbaritat tracks --todos.',4);
 const teams=await ctx.registro.equipos();const data=chosen.map(t=>({...t,squads:teams.filter(s=>s.herramienta===t.slug)}));
 const text=data.map(t=>trackLabel(t)+'\n'+panel(`track ${t.slug} · ${t.estado}`,[t.frase,...(slug?[t.ciudadano,`Lead: ${t.lead} · Dificultad: ${t.dificultad}`,...t.piezas.map(p=>`Pieza: ${p}`),...t.paquetes.map(p=>`Datos: ${p.id} · ${p.pendiente?'PENDIENTE':p.url}`),...t.fuentes.map(f=>`Fuente: ${f.nombre} · ${f.url}`),...t.guias,...t.squads.map(s=>`Squad: ${s.nombre} · Mesa ${s.mesa} · ${s.pieza}`)]:[]),...(t.cupo?[`Cupo: ${t.cupo} · por orden de llegada; lo asigna el comité`]:[]),...(t.motivo?[`Motivo: ${t.motivo}`]:[])])).join('\n\n');
 salida(data,text,ctx.opts.json);
}
export async function expediente(ctx:Contexto){
 const [{usuario,equipo},evento,tracks,issues]=await Promise.all([identidad(ctx),ctx.registro.evento(),ctx.registro.tracks(),ctx.registro.issues()]);
 const track=tracks.find(t=>t.slug===equipo?.herramienta);const reloj=cuentaAtras(evento.fin);
 const turno=issues.find(i=>i.estado==='open'&&i.etiquetas.includes('ventanilla')&&i.autor.toLowerCase()===usuario.toLowerCase());
 const reglas=['Plantilla común','URL pública responde','Ficha completa','Fuentes citadas','Sin datos personales','Botón de aviso'].map(nombre=>({nombre,estado:'pendiente de revisar'}));
 const data={usuario,equipo:equipo??null,track:track??null,cuentaAtras:reloj,reglas,turno:turno??null};
 salida(data,banner()+'\n'+(track?trackLabel(track)+'\n':'')+panel('Su expediente',[
 `Bona vesprada, @${terminalText(usuario)}`,equipo?`Squad: ${equipo.nombre} · Mesa ${equipo.mesa}`:'Squad: pendiente de asignación',`Track: ${track?.slug??'pendiente'} · Pieza: ${equipo?.pieza??'pendiente'}`,`Fin del build: ${evento.fin} · Quedan ${reloj.texto}`,...reglas.map((r,i)=>`${i+1}. [pendiente] ${r.nombre}`),turno?`Ventanilla: ${turno.titulo}`:'Ventanilla: sin turno',`Parodia del hack · No es una sede oficial.`,`Siguiente trámite: barbaritat revisar`]),ctx.opts.json);
}
