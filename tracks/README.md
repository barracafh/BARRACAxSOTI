# Tracks

Aquí edita cada track lead el material de su herramienta. Los squads construyen en sus propios repos, que la organización crea desde `plantilla/` con `infra/equipos/`.

- `<slug>/track.json`: fuente de verdad del catálogo del CLI y el servidor.
- `<slug>/README.md`: ficha técnica breve, piezas propuestas y pendientes.
- `<slug>/datos/`: formatos y fuentes de los paquetes por preparar.
- `<slug>/guias/`: guías que redacta la IA y revisa una persona antes del 20/10.
- `<slug>/contexto.md`: marco de conocimiento verificado del track, con su infografía `contexto.html` al lado.
- [comun/](comun/README.md): la parte del marco común a todos los tracks (territorio, competencias y plataformas de sede), con el índice y las convenciones de todo el marco. No es un track: no lleva `track.json` y el generador lo ignora.
- [index.html](index.html): índice visual del marco, que enlaza la infografía de cada fichero.

## Editar un track

1. Cambia su `track.json` y su ficha. Conserva el slug si ya tiene equipos asignados. Para descartar uno, borra su carpeta.
2. Mantén 2–3 piezas, una por squad. El track libre tiene una excepción explícita: un solo squad completa sus dos entregas.
3. Ejecuta `bun run tracks:generar` y `bun run check`. Incluye también el JSON generado en el commit; **no edites a mano** `packages/shared/registro-base/tracks.json`. El test exige que esté al día.

El generador ordena por ventanilla y valida rutas, esquema y unicidad de slug y ventanilla. `bun run tracks:comprobar` solo comprueba, sin escribir.

## Material de partida

Las fichas resumen la propuesta técnica, las piezas rescatadas, la investigación de dolores/datos y el brief del comité del 07/10/2026, conservados en su repo privado de contexto. Los enlaces públicos están en cada ficha. No son guías legales terminadas: datasets, fechas, trámites concretos y revisión editorial siguen pendientes. Hasta el 29/11, especial cuidado con contenido electoral, extranjería y DANA.
