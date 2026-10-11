import type {Contexto} from '../lib/contexto';
import {entradas,obtenerCola} from './social';
import {renderPantalla,startScreen,type EstadoPantalla} from '../lib/screen';
import {salida} from '../lib/output';
export async function snapshot(ctx:Contexto):Promise<EstadoPantalla>{const [evento,tracks,equipos,registros,cola,feed]=await Promise.all([ctx.registro.evento(),ctx.registro.tracks(),ctx.registro.equipos(),ctx.registro.fichas(),obtenerCola(ctx),entradas(ctx)]);return {evento,tracks,equipos,registros:registros.sort((a,b)=>b.fecha.localeCompare(a.fecha)),cola,entradas:feed};}
export async function pantalla(ctx:Contexto,once=false){
 let state=await snapshot(ctx);
 if(once||ctx.opts.json||ctx.opts.plain||!process.stdin.isTTY||!process.stdout.isTTY){salida(state,renderPantalla(state,Date.now(),process.stdout.columns??80).join('\n'),ctx.opts.json);return;}
 let pending=false,closed=false;let quit:()=>void=()=>{};const done=new Promise<void>(r=>{quit=r;});const screen=startScreen(()=>state,quit,()=>{state.pausa=!state.pausa;});
 const timer=setInterval(async()=>{if(pending||state.pausa||closed)return;pending=true;try{const updated=await snapshot(ctx);if(!closed&&!state.pausa)state=updated;}catch{state.error='Silencio administrativo (sentido negativo). Reintentando…';}finally{pending=false;}},15000);
 process.once('SIGINT',quit);process.once('SIGTERM',quit);
 try{await done;}finally{closed=true;clearInterval(timer);screen.stop();process.off('SIGINT',quit);process.off('SIGTERM',quit);}
}
