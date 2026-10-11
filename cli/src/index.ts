#!/usr/bin/env bun
import {Command,CommanderError} from 'commander';
import {select,isCancel} from '@clack/prompts';
import {contexto,type Contexto} from './lib/contexto';
import {setPlain} from './lib/estilo';
import {fallo,salida,tramitando} from './lib/output';
import {CliError} from './lib/errors';
import {tracks,expediente} from './commands/base';
const program=new Command().name('barbaritat').description('Azulejo y ventanilla · BARRACA × SOTI').version('0.1.0')
 .option('--json','Un documento JSON; sin interacción').option('--registro <repo|file-url>','Registro central')
 .option('--cwd <directorio>','Directorio del proyecto').option('--usuario <handle>','Identidad de demo (solo local)')
 .option('--plantilla <repo|directorio>','Plantilla del squad').option('--releases <repo>','Repositorio de releases')
 .option('--confirmar','Confirmación explícita de una acción pública').option('--plain','Texto plano');
const json=process.argv.includes('--json');
program.configureOutput({writeErr:()=>{},writeOut:s=>{if(!json)process.stdout.write(s);}}).exitOverride();
const run=(fn:(ctx:Contexto)=>Promise<unknown>)=>async()=>{const opts=program.opts();setPlain(Boolean(opts.json||opts.plain));const ctx=await contexto(opts);await tramitando('Consultando el registro…',opts.json,()=>fn(ctx));};
program.command('tracks [slug]').alias('negociados').description('Negociados y piezas').option('--todos','Incluye los descartados').action(async(slug,opts)=>run(ctx=>tracks(ctx,slug,opts.todos))());
program.command('expediente').description('Su expediente; sin menú').action(run(expediente));
program.command('status',{hidden:true}).action(run(expediente));
program.command('vuelva-usted-mañana',{hidden:true}).action(()=>salida({cita:'Vuelva usted mañana.',autor:'Mariano José de Larra',obra:'Vuelva usted mañana (1833)'},'«Vuelva usted mañana.» — Mariano José de Larra, 1833',json));
program.action(run(async ctx=>{
 await expediente(ctx);
 if(ctx.opts.json||!process.stdin.isTTY||!process.stdout.isTTY)return;
 for(;;){const choice=await select({message:'Seleccione un trámite',options:[{value:'tracks',label:'Negociados · tracks'},{value:'expediente',label:'Su expediente'},{value:'salir',label:'Salir · Apa!'}]});if(isCancel(choice)||choice==='salir')return;if(choice==='tracks')await tracks(ctx);else await expediente(ctx);}
}));
try{await program.parseAsync();}catch(e){if(e instanceof CommanderError&&e.exitCode===0){if(json)salida({ayuda:program.helpInformation()},'',true);}else fallo(e instanceof CommanderError?new CliError('USAGE',e.message,'Usa barbaritat --help.',2):e,json);}
