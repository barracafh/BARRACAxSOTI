import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {z} from 'zod';
import {CliError} from './errors';
export async function leer<T>(path:string,schema:z.ZodType<T>):Promise<T> {
 try {return schema.parse(JSON.parse(await readFile(path,'utf8')));} catch(e) {throw new CliError('CONFIG',`No se pudo leer o validar ${path}.`,'Comprueba el formato JSON y sus campos.',2);}
}
export async function guardar(path:string,value:unknown) {await mkdir(dirname(path),{recursive:true}); const tmp=`${path}.${crypto.randomUUID()}.tmp`;await writeFile(tmp,JSON.stringify(value,null,2)+'\n');await rename(tmp,path);}
export const esAusente=(e:unknown)=>e instanceof Error && 'code' in e && e.code==='ENOENT';
