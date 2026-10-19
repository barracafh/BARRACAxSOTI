# Track libre

## El reto

Una herramienta más para la plataforma, con un problema y una solución bien definidos. Las plazas se asignan por orden de llegada.

Equipo: `libre`, uno solo.

## Qué hay que enviar antes del miércoles 21/10 a las 20:00

Abrid un issue en vuestro repo con estos cuatro puntos; la organización lo valida antes del jueves.

1. **Problema ciudadano:** concreto, diciendo quién lo sufre y cuándo.
2. **Fuente de datos:** con el enlace ya probado.
3. **Demo de 3 minutos:** qué se verá funcionar.
4. **Encaje:** por qué no se solapa con los otros cinco tracks.

## Piezas

Las dos piezas son entregas sucesivas del mismo squad, no dos squads.

| Pieza                           | Alcance en unas 4 h                                                               | Hecho cuando…                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Propuesta de utilidad ciudadana | Acotar un problema y construir un único recorrido con datos públicos o simulados. | La organización valida alcance y fuentes; una persona puede completar la tarea de ejemplo.    |
| Integración en el centro        | Publicar e integrar la misma herramienta con ficha, fuentes y botón de aviso.     | URL pública y `buildnight revisar` sin bloqueos; el README explica qué falta para producción. |

## Fuera de alcance

- **Nada que oriente el voto:** ni recomendaciones, ni tests de afinidad del tipo «¿a quién voto?», ni resúmenes de programas, candidatos, encuestas o proyecciones. Lo electoral está en ¿Cómo voto? y solo trata cómo se vota. La organización rechaza las propuestas que no cumplan esto.
- Lo que ya hacen los otros cinco tracks.
- Reservas o citas automáticas, y cualquier herramienta que pida o guarde datos personales reales.

## Recursos reutilizables de otros tracks

- Catálogo de trámites y ayudas: `datos/catalogo-tramites-ayudas.json`
- Dominios oficiales de la administración: `datos/dominios-oficiales.json`

## Requisitos comunes

Ver `AGENTS.md`:

- Cada respuesta enlaza a la fuente oficial de la que sale.
- Nada de datos personales reales: se simulan. No se guarda lo que escribe el ciudadano.
- Muestra el aviso «No es un servicio oficial».
- La herramienta se sirve bajo `/<equipo>` (campo `equipo` de `ficha.json`) y las claves van solo en el servidor.

## Resumen para el agente

```markdown
# Track libre · Build night · BARRACA x SOTI

Problema:
Usuario:
Fuente de datos (URL probada):
Demo de 3 minutos:
Fuera de alcance: nada que oriente el voto (ni «¿a quién voto?», ni programas, candidatos, encuestas o proyecciones); lo que ya hacen los otros cinco tracks.
Reglas: cada respuesta enlaza su fuente oficial; datos personales simulados, nunca reales; no guardar datos del usuario; claves solo en servidor; la herramienta se sirve bajo /<equipo> (campo equipo de ficha.json) y muestra el aviso "No es un servicio oficial".
```
