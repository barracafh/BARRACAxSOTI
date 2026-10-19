# Tracks

Aquí edita el comité el material de cada herramienta. Los squads construyen en sus propios repos, que la organización crea desde `plantilla/` con `infra/equipos/`.

Son los seis tracks publicados en barraca.house:

| Track       | Herramienta                                | Carpeta      |
| ----------- | ------------------------------------------ | ------------ |
| Derechos    | Buscador de ayudas                         | `derechos/`  |
| Claridad    | Traductor de documentos                    | `claridad/`  |
| Sello       | Verificador de webs y mensajes             | `sello/`     |
| Brújula     | Asistente de trámites                      | `brujula/`   |
| ¿Cómo voto? | Guía de las elecciones generales 2026      | `como-voto/` |
| Libre       | Track libre: la propuesta de un solo squad | `libre/`     |

- `<slug>/track.json`: fuente de verdad del catálogo del CLI y el servidor.
- `<slug>/SETUP.md`: el reto, las piezas con su criterio de hecho y el resumen para el agente. Se copia al repo de cada squad.
- `<slug>/README.md`: ficha breve del track para el comité.
- `<slug>/datos/`: el pack de datos que se copia a cada squad, sin su README, que dice qué trae y qué fuentes se consultan en vivo.
- `<slug>/contexto.md`: marco de conocimiento verificado del track, con su infografía `contexto.html` al lado. También se copia al repo de cada squad, junto con los ficheros comunes que cita, en `comun/`: 00 y 00b a todos los tracks y 04b a Brújula, Claridad y Sello. Libre no tiene `contexto.md`: recibe solo 00 y 00b.
- [comun/](comun/README.md): la parte del marco común a todos los tracks (territorio, competencias y plataformas de sede), con el índice y las convenciones de todo el marco. No es un track: no lleva `track.json` y el generador lo ignora.
- [index.html](index.html): índice visual del marco, que enlaza la infografía de cada fichero.

## Editar un track

1. Cambia su `track.json`, su `SETUP.md` y su ficha. Las piezas de `track.json` y las de `SETUP.md` deben coincidir. Conserva el slug si ya tiene equipos asignados. Para descartar uno, borra su carpeta.
2. Mantén 2–3 piezas: cada squad del track construye las que le dé tiempo. Si una pieza necesita a otra, indica el orden en `SETUP.md`; si no, cada squad elige el suyo. El track libre tiene una excepción explícita: un solo squad completa sus dos entregas.
3. Ejecuta `bun run tracks:generar` y `bun run check`. Incluye también el JSON generado en el commit; **no edites a mano** `packages/shared/registro-base/tracks.json`. El test exige que esté al día.

El generador valida rutas, esquema y que no se repitan ni el slug ni la ventanilla. `bun run tracks:comprobar` solo comprueba, sin escribir.

## Datos en el pack y datos en vivo

Cada pack trae lo que la herramienta necesita para funcionar y probarse sin depender de la red. Las fuentes vivas (API de la BDNS, Safe Browsing, RDAP, avisos de INCIBE, buscador del PAG y, opcional en ¿Cómo voto?, Google Fact Check Tools) no se copian: leerlas y citarlas desde el origen es parte del reto, y el `datos/README.md` de cada track dice cuáles son.

No son guías legales: ante un ciudadano, la herramienta cita siempre la fuente oficial. Hasta el 29/11, especial cuidado con contenido electoral, extranjería y DANA.
