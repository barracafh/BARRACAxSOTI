# Tracks

Aquí edita el comité el material de cada herramienta. Los squads construyen en sus propios repos, que la organización crea desde `plantilla/` con `infra/equipos/`.

- `<slug>/track.json`: fuente de verdad del catálogo del CLI y el servidor.
- `<slug>/README.md`: ficha técnica breve, piezas propuestas y pendientes.
- `<slug>/datos/`: el pack de datos que se copia a cada squad; su README dice qué está listo y qué falta.
- `<slug>/guias/`: guías que redacta la IA y revisa una persona antes del 20/10.
- `<slug>/contexto.md`: marco de conocimiento verificado del track, con su infografía `contexto.html` al lado.
- [comun/](comun/README.md): la parte del marco común a todos los tracks (territorio, competencias y plataformas de sede), con el índice y las convenciones de todo el marco. No es un track: no lleva `track.json` y el generador lo ignora.
- [index.html](index.html): índice visual del marco, que enlaza la infografía de cada fichero.

## Editar un track

1. Cambia su `track.json` y su ficha. Conserva el slug si ya tiene equipos asignados. Para descartar uno, borra su carpeta.
2. Mantén 2–3 piezas: cada squad del track construye las que le dé tiempo. Si una pieza necesita a otra, indica el orden en `SETUP.md` y en la ficha; si no, cada squad elige el suyo. El track libre tiene una excepción explícita: un solo squad completa sus dos entregas.
3. Ejecuta `bun run tracks:generar` y `bun run check`. Incluye también el JSON generado en el commit; **no edites a mano** `packages/shared/registro-base/tracks.json`. El test exige que esté al día.

El generador ordena por ventanilla y valida rutas, esquema y unicidad de slug y ventanilla. `bun run tracks:comprobar` solo comprueba, sin escribir.

## Material de partida

Las fichas resumen la propuesta técnica, las piezas rescatadas, la investigación de dolores/datos y el brief del comité del 07/10/2026. Los enlaces públicos están en cada ficha. No son guías legales terminadas: la revisión editorial y algunos datasets siguen pendientes (el `datos/README.md` de cada track dice cuáles). Hasta el 29/11, especial cuidado con contenido electoral, extranjería y DANA.
