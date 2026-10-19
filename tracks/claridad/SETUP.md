# Track 2 · Traductor de documentos

## El reto

Le pasas el PDF o la notificación de turno y te lo traduce a lenguaje humano, con un checklist de qué tienes que hacer y para cuándo. **Sin guardar nada.**

Puede haber hasta dos squads en este track, los dos con el mismo reto. Cada uno construye las piezas que le dé tiempo, en el orden de abajo.

## Qué se espera en la demo

Subir uno de los documentos de prueba y obtener: qué dice (en pocas frases y sin jerga), qué hay que hacer y la fecha límite, junto con lo que pasa si no se hace nada.

## Piezas

El reto se puede abordar por partes. Haced las que os dé tiempo. Empezad por «PDF a checklist»: las otras dos trabajan sobre los documentos que saca de cada notificación.

- **PDF a checklist.** De un documento de prueba, los pasos y las fechas en una checklist. Cada punto remite al fragmento del que sale; lo ambiguo se marca como pendiente.
- **¿Qué me piden y qué no pueden pedirme?** De los documentos que pide una notificación, cuáles puede consultar la propia administración (no hay que aportarlos), cuáles no y cuáles son privados, con su fuente y sus excepciones. Sin inventar derechos.
- **Dónde descargar cada documento.** Cada documento de los ejemplos, enlazado a su descarga oficial (carpetas de la AGE, la GVA o València) o marcado como pendiente. No se almacena nada.

## Materiales (`datos/documentos/`)

Nueve notificaciones **ficticias**, con marca de agua y datos inventados, que imitan documentos reales, más una foto de móvil para probar la lectura de imágenes:

| Archivo                                              | Tipo                                                 | Plazo                                  | Fecha límite esperada |
| ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- | --------------------- |
| 01-aeat-requerimiento-irpf.pdf                       | Requerimiento de documentación (AEAT)                | 10 días hábiles                        | 2026-10-20            |
| 02-aeat-propuesta-liquidacion.pdf                    | Propuesta de liquidación y alegaciones (AEAT)        | 10 días hábiles                        | 2026-10-22            |
| 03-dgt-denuncia-velocidad.pdf · 03b-…-foto-movil.jpg | Multa de tráfico (DGT)                               | 20 días naturales                      | 2026-10-28            |
| 04-aeat-providencia-apremio.pdf                      | Providencia de apremio (AEAT)                        | art. 62.5 LGT                          | 2026-10-20            |
| 05-sepe-requerimiento-prestacion.pdf                 | Subsanación de la solicitud de paro (SEPE)           | 10 días hábiles                        | 2026-10-23            |
| 06-gva-rvi-denegacion-valencia.pdf                   | Denegación de la Renta Valenciana, **en valenciano** | Recurso de alzada, 1 mes               | 2026-11-09            |
| 07-ajuntament-baja-padron.pdf                        | Audiencia por baja en el padrón (Ajuntament)         | 15 días hábiles                        | 2026-10-26            |
| 08-jez-miembro-mesa-29N.pdf                          | Designación como miembro de mesa el 29-N             | 7 días (naturales, plazos electorales) | 2026-11-10            |
| 09-inss-imv-requerimiento.pdf                        | Requerimiento del Ingreso Mínimo Vital (INSS)        | 10 días hábiles                        | 2026-10-21            |

`indice.json` recoge esta misma información en formato máquina, para usarla como batería de pruebas.

Las fechas esperadas se han calculado excluyendo sábados, domingos, el 9/10 (Comunitat Valenciana) y el 12/10 (fiesta nacional). Son material de prueba, no asesoramiento legal.

## Referencias

- **Cómputo de plazos:** Ley 39/2015, art. 30.
  - Los días hábiles excluyen sábados, domingos y festivos.
  - Los plazos en meses vencen el mismo día del mes siguiente.
  - Si el último día es inhábil, el plazo pasa al siguiente día hábil.
- **Lectura Fácil:** norma UNE 153101:2018 EX, para el criterio de «lenguaje humano».

## A tener en cuenta

- El error más grave es calcular mal un plazo (hábiles frente a naturales, o festivos locales). Conviene mostrar siempre la frase original del documento de la que sale cada plazo.
- «Sin guardar nada»: ni el archivo ni su contenido se almacenan ni se registran. Hay que avisar al usuario si el documento se envía a un proveedor de LLM.
- En la demo, solo los documentos ficticios de esta carpeta. Nunca documentos reales de personas.

## Resumen para el agente

```markdown
# Track 2 · Traductor de documentos · Build night · BARRACA x SOTI

Objetivo: a partir de un PDF o una foto de una notificación administrativa, explicar qué dice en lenguaje claro, qué hay que hacer y la fecha límite, y qué pasa si no se hace nada.
Datos de prueba: datos/documentos/ (9 PDF ficticios + 1 foto); datos/documentos/indice.json contiene la fecha límite esperada de cada uno.
Reglas: no guardar ni registrar el documento ni su contenido; mostrar el texto original del que sale cada plazo; plazos según la Ley 39/2015, art. 30 (festivos de 2026: nacionales, Comunitat Valenciana y locales de València); responder en el idioma del documento o en el que pida el usuario; claves solo en servidor; la herramienta se sirve bajo /<slug> y muestra el aviso "No es un servicio oficial".
```
