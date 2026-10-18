# Track 4 · Asistente de trámites

## El reto

Le cuentas tu problema con tus palabras y te dice qué trámite es, los pasos y el enlace directo a la sede. La necesidad es humana («me han echado», «me empadrono») y la sede habla en organigramas.

Equipos: `brujula-a` y `brujula-b`: mismo reto, una pieza cada uno.

## Qué se espera en la demo

A partir de una frase como «me han echado del trabajo», la herramienta identifica el trámite (en este caso, la prestación por desempleo), da los pasos en orden, la documentación y el plazo, y enlaza a la sede correspondiente.

## Piezas

| Pieza                | Alcance en unas 4 h                                                                                                | Hecho cuando…                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Qué trámite necesito | Resolver frases libres, en castellano o en valenciano, sobre el catálogo del pack.                                 | Devuelve trámite, organismo, pasos, documentación, plazo y sede; fuera del catálogo lo dice y enlaza al buscador del PAG. |
| Y después, ¿qué?     | Encadenar los trámites de una situación (del despido a Labora y al paro, por ejemplo) con el campo `relacionados`. | Propone el siguiente trámite con su enlace y su fuente, y avisa si una entrada tiene `verificado: false`.                 |

## Materiales en esta carpeta

- `catalogo-tramites-ayudas.json`: 21 entradas (13 trámites y 8 ayudas), el mismo catálogo que el track 1.
  - Cada entrada incluye `frases_usuario` (cómo lo pide la gente, con una frase en valenciano), `pasos`, `documentacion`, `plazo`, `enlace_info`, `enlace_tramite`, `fuente`, `verificado` y `relacionados`.
  - Trámites incluidos: prestación y subsidio por desempleo, inscripción en Labora, alta y certificado de padrón en València, cambio de domicilio en la DGT, renovación del DNI, vida laboral, identificación digital (Cl@ve y certificado), declaración de la renta, tarjeta sanitaria SIP, cita médica de la GVA, voto por correo del 29-N y multas de la DGT.

## Fuentes oficiales

| Fuente                                                                                                                                  | Qué ofrece                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [Buscador de trámites del PAG (SIA)](https://administracion.gob.es/tramites-electronicos/resultados-actuaciones)                        | Procedimientos estatales con código SIA y enlace a la sede. No hay API ni descarga masiva |
| [Qué es el SIA](https://administracion.gob.es/pag_Home/espanaAdmon/SIA.html)                                                            | Estructura de una ficha de procedimiento                                                  |
| [Ajuntament de València · tràmits](https://www.valencia.es/val/participacio/juntes-municipals-de-districte/tramits-gestions-i-servicis) | Trámites municipales                                                                      |
| [Sede electrónica de València](https://sede.valencia.es)                                                                                | Sede municipal                                                                            |

## A tener en cuenta

- No hay que inventar pasos, plazos ni enlaces: si no están en una fuente, no se dan.
- Si el trámite no está en el catálogo, hay que decirlo y remitir al buscador del PAG.
- Las 21 entradas están comprobadas en la sede, el BOE o el DOGV a 18/10/2026. Si se añaden entradas sin comprobar, van con `"verificado": false`.
- Plazo del paro: el BOE confirma 15 días; la nota de la entrada explica la duda sobre si son hábiles.

## Resumen para el agente

```markdown
# Track 4 · Asistente de trámites · Build night · BARRACA x SOTI

Objetivo: a partir de la frase libre de un ciudadano (en castellano o valenciano), identificar el trámite o trámites que le corresponden y dar los pasos, la documentación, el plazo y el enlace a la sede.
Datos: catalogo-tramites-ayudas.json (entradas con tipo "tramite"; el campo relacionados encadena trámites).
Fuentes para ampliar: buscador del PAG https://administracion.gob.es/tramites-electronicos/resultados-actuaciones
Reglas: no inventar pasos, plazos ni enlaces; avisar cuando una entrada tenga verificado=false; sin coincidencia, decirlo y enlazar el buscador del PAG; no guardar datos del usuario; claves solo en servidor; la herramienta se sirve bajo /<slug> y muestra el aviso "No es un servicio oficial".
```
