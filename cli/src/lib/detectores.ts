export interface Hallazgo {archivo:string;linea:number;tipo:string;valor:string;}
const letras='TRWAGMYFPDXBNJZSQVHLCKE';
export function dniValido(input:string){const v=input.toUpperCase();if(!/^(?:\d{8}|[XYZ]\d{7})[A-Z]$/.test(v))return false;const digits=v.slice(0,-1).replace(/^[XYZ]/,s=>String('XYZ'.indexOf(s)));return letras[Number(digits)%23]===v.at(-1);}
export function ibanValido(input:string){const v=input.replace(/\s/g,'').toUpperCase();if(!/^ES\d{22}$/.test(v))return false;const n=v.slice(4)+'1428'+v.slice(2,4);let mod=0;for(const d of n)mod=(mod*10+Number(d))%97;return mod===1;}
export function detectar(texto:string,archivo:string):Hallazgo[]{
 const out:Hallazgo[]=[];
 const add=(linea:number,tipo:string)=>{if(!out.some(h=>h.linea===linea&&h.tipo===tipo))out.push({archivo,linea,tipo,valor:`[${tipo} oculto]`});};
 if(/(^|\/)\.env(?:\..*)?$/.test(archivo))add(1,'.env versionado');
 for(const [i,line] of texto.split(/\r?\n/).entries()){
 for(const m of line.matchAll(/\b(?:\d{8}|[XYZ]\d{7})[A-Z]\b/gi))if(dniValido(m[0]))add(i+1,/^[XYZ]/i.test(m[0])?'NIE':'DNI');
 for(const m of line.matchAll(/\bES\d{2}(?:[ ]?\d{4}){5}\b/gi))if(ibanValido(m[0]))add(i+1,'IBAN');
 if(/(?<![\w\d])(?:\+34[ .-]?)?[6789](?:[ .-]?\d){8}(?![\w\d])/.test(line))add(i+1,'teléfono');
 for(const m of line.matchAll(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi))if(!/(^|\.)(example\.(com|org|net)|example|test|invalid|localhost)$/i.test(m[1]!))add(i+1,'email');
 if(/\b(?:sk-(?:or-|proj-|ant-)?[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/.test(line))add(i+1,'clave');
 }return out;
}
