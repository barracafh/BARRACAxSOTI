import type {RegistroFicha,Track} from './modelo';
import {fechaMadrid} from './tiempo';
import {paint,trackLabel,panel} from './estilo';
export const numeroRegistro=(n:number)=>`RE-2026-22O-${String(n).padStart(4,'0')}`;
export function justificante(registro:RegistroFicha,track:Track,fueraDePlazo:boolean){
 const numero=numeroRegistro(registro.numero);const csv=new Bun.CryptoHasher('sha256').update(JSON.stringify({numero,fecha:registro.fecha,ficha:registro.ficha})).digest('hex').slice(0,16).toUpperCase();
 return {numero,fecha:registro.fecha,csv,negociado:track.nombre,ventanilla:track.ventanilla,herramienta:track.slug,fueraDePlazo,url:registro.url,estado:registro.estado};
}
export const sello=()=>paint('roig',[
'     .------------------------------------.',
'    / REGISTRO DE ENTRADA                  /',
'   / BARBARITAT VALENCIANA                /',
'  / 22 OCT 2026                         /',
'  \'------------------------------------\''
].join('\n'));
export function justificanteTexto(j:ReturnType<typeof justificante>,track:Track){return panel('Justificante de registro',[j.numero,fechaMadrid(j.fecha)+' · Europe/Madrid',`Código seguro de verificación: ${j.csv}`,`${j.fueraDePlazo?'Presentado fuera de plazo':'Presentado dentro de plazo'} · ${j.estado}`,j.url])+'\n'+trackLabel(track)+'\n'+sello();}
