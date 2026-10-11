import {CliError} from './errors';
export type Runner = (args:string[],input?:unknown,cwd?:string)=>Promise<string>;
export const ejecutar:Runner=async(args,input,cwd)=>{
 try {
 const p=Bun.spawn(args,{cwd,stdin:input===undefined?'ignore':new Blob([JSON.stringify(input)]),stdout:'pipe',stderr:'pipe',env:{...process.env,GH_PROMPT_DISABLED:'1',GIT_TERMINAL_PROMPT:'0'}});
 const timer=setTimeout(()=>p.kill(),30000);
 try {const [out,err,code]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);
 if(code!==0) {const status=err.match(/HTTP (\d+)/)?.[1];throw new CliError(status==='404'?'NOT_FOUND':status==='403'?'NOT_ALLOWED':'PROCESS',`No se pudo completar ${args[0]}${status?` (HTTP ${status})`:''}.`,'Comprueba permisos, conectividad y gh auth status.',status==='403'?4:5);}
 return out;}finally{clearTimeout(timer);}
 }catch(e){if(e instanceof CliError)throw e;throw new CliError('DEPENDENCY',`No se pudo ejecutar ${args[0]}.`,`Instala ${args[0]} y comprueba que está en PATH.`,2);}
};
