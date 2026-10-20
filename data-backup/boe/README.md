# BOE: textos legales citados (Claridad y ¿Cómo voto?)

- **Origen:** API de datos abiertos del BOE, `https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/<id>` (XML con metadatos, análisis y texto consolidado), y la página del diario para el real decreto de convocatoria, que no se consolida.
- **Descarga:** 19/10/2026, con `bun data-backup/boe/download.ts`. 1,8 MB.
- **Tipo:** finita: tres documentos.

| Fichero                     | Documento                                                                        | Track       |
| --------------------------- | -------------------------------------------------------------------------------- | ----------- |
| `raw/BOE-A-2015-10565.xml`  | Ley 39/2015, del Procedimiento Administrativo Común (art. 30, cómputo de plazos) | Claridad    |
| `raw/BOE-A-1985-11672.xml`  | Ley Orgánica 5/1985, del Régimen Electoral General (LOREG)                       | ¿Cómo voto? |
| `raw/BOE-A-2026-20742.html` | Real Decreto 806/2026, de convocatoria de las elecciones del 29-N                | ¿Cómo voto? |

## Uso sin internet

En el XML, cada artículo es un `<bloque id="a30">` (art. 30) con sus `<version>` por fecha de vigencia: usad la última. Con `bun data-backup/serve.ts`, `http://localhost:8787/www.boe.es/datosabiertos/api/legislacion-consolidada/id/BOE-A-2015-10565` devuelve el XML guardado. El texto consolidado no tiene valor jurídico: la herramienta enlaza siempre la ficha del BOE (`https://www.boe.es/buscar/act.php?id=<id>`).

## Licencia y atribución

[Condiciones de reutilización del BOE](https://www.boe.es/informacion/aviso_legal/index.php#reutilizacion) (licencia tipo de 27/06/2024, Ley 37/2007): reutilización libre citando la fuente, la Agencia Estatal Boletín Oficial del Estado, y la fecha de la versión, sin desnaturalizar el contenido.
