# INCIBE: avisos a la ciudadanía (Sello)

- **Origen:** `https://www.incibe.es/ciudadania/avisos`, su RSS `…/avisos/feed` y, como contexto, los feeds del blog de ciudadanía y de avisos a empresas.
- **Descarga:** 19/10/2026, con `bun data-backup/incibe/download.ts` (unos 2 minutos, 15 MB).
- **Tipo:** en vivo. El RSS solo trae los 10 últimos avisos y no pagina, así que se guardan también las 5 primeras páginas del listado y la página de cada aviso enlazado: 45 avisos, del 22/10/2024 al 14/10/2026.

## No está en git

El repo es público y el [aviso legal de INCIBE](https://www.incibe.es/incibe/aviso-legal) solo autoriza reproducir sus contenidos íntegros, citando la fuente y sin uso comercial, y prohíbe expresamente su distribución y comunicación pública sin autorización previa. Por eso `raw/` está en `.gitignore`: la copia se genera con el script en la máquina que la necesite y se comparte solo dentro del evento con los squads de Sello, para su uso durante la noche.

## Uso sin internet

`raw/ciudadania_avisos_feed-….xml` es el RSS tal cual: cada `<item>` trae `title`, `link`, `pubDate` y el HTML completo del aviso en `description`. Las páginas de los avisos están en `raw/avisos/<slug>.html`. Con `bun data-backup/serve.ts`, `http://localhost:8787/www.incibe.es/ciudadania/avisos/feed` sirve el RSS guardado.

## Atribución

Citar a INCIBE como fuente y enlazar el aviso original. La herramienta no debe presentar estos textos como suyos ni modificarlos.
