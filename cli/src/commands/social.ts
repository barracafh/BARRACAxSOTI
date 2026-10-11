import {text,isCancel} from '@clack/prompts';
import {z} from 'zod';
import type {Contexto} from '../lib/contexto';
import {miEquipo} from '../lib/contexto';
import {CliError,usage} from '../lib/errors';
import {salida} from '../lib/output';
import {panel,trackLabel,terminalText,wrap} from '../lib/estilo';
import {cola,citaBody,type Cita} from '../lib/cola';
import {confirmar} from '../lib/confirmacion';
export async function obtenerCola(ctx:Contexto){const [issues,teams,tracks]=await Promise.all([ctx.registro.issues(),ctx.registro.equipos(),ctx.registro.tracks()]);return cola(issues,teams,tracks);}
export async function cita(ctx:Contexto,accion?:string,motivo?:string){
 const {equipo,track}=await miEquipo(ctx);const q=await obtenerCola(ctx);const actual=q.find(c=>c.squad===equipo.id);
 if(accion==='estado'){salida({cita:actual??null,posicion:actual?q.filter(c=>c.herramienta===track.slug).indexOf(actual)+1:null},actual?panel('Su turno',[`${actual.turno} · Mesa ${actual.mesa}`,actual.estado,`Posición en ${track.nombre}: ${q.filter(c=>c.herramienta===track.slug).indexOf(actual)+1}`,actual.motivo]):'No tiene cita pendiente.',ctx.opts.json);return;}
 if(accion==='anular'){if(!actual)throw new CliError('NOT_FOUND','No hay cita pendiente.','Usa cita para pedir ayuda.',4);await ctx.registro.editarIssue(actual.numero,{estado:'closed',cuerpo:citaBody(actual,'anulado')});salida({turno:actual.turno,estado:'anulado'},`Turno ${actual.turno} anulado.`,ctx.opts.json);return;}
 if(actual){salida({cita:actual,posicion:q.filter(c=>c.herramienta===track.slug).indexOf(actual)+1},`Ya tienes el turno ${actual.turno} · ${actual.estado}.`,ctx.opts.json);return;}
 let reason=motivo??accion;
 if(!reason&&process.stdin.isTTY&&process.stdout.isTTY&&!ctx.opts.json){const answer=await text({message:'Motivo de la consulta (máximo 160 caracteres)'});if(isCancel(answer))throw new CliError('CANCELLED','Cita cancelada.','Puedes retomarla.',130);reason=answer;}
 if(!reason?.trim()||[...reason].length>160)throw usage('Indica un motivo entre 1 y 160 caracteres.','Usa cita --motivo "No funciona el despliegue".');
 const issue=await ctx.registro.crearIssue(`Ayuda · ${equipo.nombre} · Mesa ${equipo.mesa}`,JSON.stringify({tipo:'cita',squad:equipo.id,herramienta:track.slug,mesa:equipo.mesa,motivo:reason.trim(),estado:'espera'}),['ventanilla']);
 const turno=`${track.prefijo}-${String(issue.numero).padStart(3,'0')}`;const posicion=q.filter(c=>c.herramienta===track.slug).length+1;
 salida({turno,numero:issue.numero,posicion,herramienta:track.slug,mesa:equipo.mesa,url:issue.url},trackLabel(track)+'\n'+panel('Cita de ventanilla',[`Turno ${turno} · Mesa ${equipo.mesa}`,`Posición en este negociado: ${posicion}`,reason]),ctx.opts.json);
}
export async function ventanilla(ctx:Contexto,accion?:string,numero?:string,track?:string){
 const usuario=await ctx.registro.usuario();if(!(await ctx.registro.comite()).some(m=>m.toLowerCase()===usuario.toLowerCase()))throw new CliError('NOT_ADMIN','Ventanilla está reservada al comité.','El comité gestiona los permisos en comite.json.',4);
 let q=await obtenerCola(ctx);if(track)q=q.filter(c=>c.herramienta===track);
 if(!accion){salida(q,panel('Ventanilla · cola por negociado',q.length?q.map(c=>`${c.herramienta} · ${c.turno} → Mesa ${c.mesa} · ${c.estado}\n${c.motivo}`):['Sin turnos pendientes.']),ctx.opts.json);return;}
 if(!['llamar','atendido'].includes(accion))throw usage('Trámite de ventanilla desconocido.','Usa llamar o atendido [número].');
 let c:Cita|undefined;
 if(accion==='llamar')c=q.find(c=>c.estado==='espera');else {if(numero&&!/^\d+$/.test(numero))throw usage('El número debe ser el número de issue.');const called=q.filter(c=>c.estado==='llamado');if(!numero&&called.length>1)throw usage('Hay varios turnos llamados.','Indica ventanilla atendido <número>.');c=numero?q.find(c=>c.numero===Number(numero)&&c.estado==='llamado'):called[0];}
 if(!c)throw new CliError('NOT_FOUND',accion==='llamar'?'No hay turnos en espera.':'No se encontró un turno llamado.','Consulta barbaritat ventanilla.',4);
 const estado=accion==='llamar'?'llamado':'atendido';await ctx.registro.editarIssue(c.numero,{cuerpo:citaBody(c,estado),...(estado==='atendido'?{estado:'closed' as const}:{})});
 salida({...c,estado},panel(estado==='llamado'?'Pase a ventanilla':'Atención completada',[`Turno ${c.turno} · Mesa ${c.mesa}`,`track ${c.herramienta}`,c.motivo]),ctx.opts.json);
}
export interface Entrada {id:string;tipo:string;fecha:string;herramienta:string|null;glifo:string;texto:string;url:string;}
export async function entradas(ctx:Contexto):Promise<Entrada[]>{
 const [issues,comite,registros,pushes,tracks,teams]=await Promise.all([ctx.registro.issues(),ctx.registro.comite(),ctx.registro.fichas(),ctx.registro.pushes(),ctx.registro.tracks(),ctx.registro.equipos()]);
 const out:Entrada[]=[];const glifo=(slug:string|null)=>tracks.find(t=>t.slug===slug)?.glifo??'·';
 for(const i of issues){const aviso=i.etiquetas.includes('aviso')&&comite.some(c=>c.toLowerCase()===i.autor.toLowerCase());if(i.etiquetas.includes('aviso')&&!aviso)continue;if(!aviso&&!i.etiquetas.includes('tablon'))continue;const track=teams.find(t=>t.miembros.some(m=>m.toLowerCase()===i.autor.toLowerCase()))?.herramienta??null;let texto=i.cuerpo||i.titulo;
 try{const parsed=z.object({texto:z.string()}).safeParse(JSON.parse(i.cuerpo));if(parsed.success)texto=parsed.data.texto;}catch{}
 out.push({id:`issue-${i.numero}`,tipo:aviso?'aviso':'publicacion',fecha:i.fecha,herramienta:track,glifo:glifo(track),texto:`@${i.autor}: ${texto}`,url:i.url});}
 for(const r of registros)out.push({id:`registro-${r.numero}`,tipo:'registro',fecha:r.fecha,herramienta:r.ficha.herramienta,glifo:glifo(r.ficha.herramienta),texto:`Registro ${r.ficha.nombre} · ${r.estado}`,url:r.ficha.url});
 for(const p of pushes)out.push({id:`push-${p.id}`,tipo:'push',fecha:p.fecha,herramienta:p.herramienta,glifo:glifo(p.herramienta),texto:p.texto,url:p.url});
 return out.sort((a,b)=>b.fecha.localeCompare(a.fecha));
}
export async function tablon(ctx:Contexto,n=20){if(!Number.isInteger(n)||n<1||n>100)throw usage('-n debe ser un entero entre 1 y 100.');const items=(await entradas(ctx)).slice(0,n);salida(items,items.length?items.map(e=>wrap(`${e.glifo} [${e.tipo}] ${e.herramienta??'comité'} · ${terminalText(e.texto)}\n  ${terminalText(e.url)}`,Math.max(20,Math.min(80,process.stdout.columns??80))).join('\n')).join('\n\n'):'El tablón está esperando su primera publicación.',ctx.opts.json);}
export async function publicar(ctx:Contexto,texto:string){if(!texto.trim()||[...texto].length>500)throw usage('La publicación debe tener entre 1 y 500 caracteres.');const {track}=await miEquipo(ctx);await confirmar(ctx,`Publicar en el tablón público: «${terminalText(texto)}»`);const issue=await ctx.registro.crearIssue(texto.slice(0,80),JSON.stringify({texto,herramienta:track.slug}),['tablon']);salida({numero:issue.numero,url:issue.url},'Publicación registrada. Xe, quina barbaritat.\n'+issue.url,ctx.opts.json);}
