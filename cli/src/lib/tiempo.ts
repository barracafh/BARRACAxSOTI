export function cuentaAtras(fin:string,ahora=Date.now()) {
 const segundos=Math.max(0,Math.ceil((Date.parse(fin)-ahora)/1000));
 return {segundos, texto:[Math.floor(segundos/3600),Math.floor(segundos/60)%60,segundos%60].map(v=>String(v).padStart(2,'0')).join(':'),cerrado:ahora>Date.parse(fin)};
}
export const fechaMadrid=(iso:string)=>new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',dateStyle:'short',timeStyle:'medium'}).format(new Date(iso));
