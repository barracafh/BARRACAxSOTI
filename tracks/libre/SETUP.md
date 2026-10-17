# Track 6 · Libre

## El reto

Una herramienta más para la plataforma, con un problema y una solución bien definidos. Las plazas se asignan por orden de llegada.

Equipo: `libre`, uno solo.

## Qué hay que enviar a la organización antes del jueves

1. **Problema ciudadano:** concreto, diciendo quién lo sufre y cuándo.
2. **Fuente de datos:** con el enlace ya probado.
3. **Demo de 3 minutos:** qué se verá funcionar.
4. **Encaje:** por qué no se solapa con los tracks 1 a 5.

## Recursos reutilizables de otros tracks

- Catálogo de trámites y ayudas: `datos/catalogo-tramites-ayudas.json`
- Dominios oficiales de la administración: `datos/dominios-oficiales.json`
- Datos electorales: los CSV y el calendario de `datos/`, con su origen en `datos/FUENTES.md`

## Requisitos comunes

Ver `AGENTS.md`: la herramienta se sirve bajo `/<slug>`, las claves van solo en el servidor, no guarda datos del usuario y muestra el aviso «No es un servicio oficial».

## Resumen para el agente

```markdown
# Track 6 · Libre · Build night · BARRACA x SOTI

Problema:
Usuario:
Fuente de datos (URL probada):
Demo de 3 minutos:
Fuera de alcance:
Reglas: no guardar datos del usuario; citar fuentes oficiales; claves solo en servidor; la herramienta se sirve bajo /<slug> y muestra el aviso "No es un servicio oficial".
```
