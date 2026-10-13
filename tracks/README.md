# Tracks

Aquí edita cada track lead el material de su herramienta. Los squads construyen en sus propios repos, creados desde `plantilla/` con `hacknight tramitar`.

- `<slug>/track.json`: fuente de verdad del catálogo del CLI y el servidor.
- `<slug>/README.md`: ficha técnica breve, piezas propuestas y pendientes.
- `<slug>/datos/`: formatos y fuentes de los paquetes por preparar.
- `<slug>/guias/`: guías que redacta la IA y revisa una persona antes del 20/10.
- [fuera/](fuera/README.md): descartados y motivos; se conservan para `hacknight tracks --todos`.
- [comun/](comun/README.md): marco de conocimiento común y verificado (territorio, competencias, normativa, plataformas y fuentes oficiales) para todos los tracks y sus agentes. No es un track: no lleva `track.json` y el generador lo ignora.

## Editar un track

1. Cambia su `track.json` y su ficha. Conserva el slug si ya tiene equipos asignados. Para descartar uno, mueve su carpeta a `fuera/`, usa estado `fuera` y escribe el motivo.
2. Mantén 2–3 piezas, una por squad. El track libre tiene una excepción explícita: un solo squad completa sus dos entregas.
3. Ejecuta `bun run tracks:generar` y `bun run check`. Incluye también el JSON generado en el commit; **no edites a mano** `packages/shared/registro-base/tracks.json`. El test exige que esté al día.

El generador ordena por ventanilla y valida rutas, esquema y unicidad de slug, ventanilla y prefijo. `bun run tracks:comprobar` solo comprueba, sin escribir.

## Material de partida

Las fichas resumen la propuesta técnica, las piezas rescatadas, la investigación de dolores/datos y el brief del comité del 07/10/2026, conservados en su repo privado de contexto. Los enlaces públicos están en cada ficha. No son guías legales terminadas: datasets, fechas, trámites concretos y revisión editorial siguen pendientes. Hasta el 29/11, especial cuidado con contenido electoral, extranjería y DANA. Siguiente requiere a Samu o Leo; Radar y Abierto se activan si hay gente.
