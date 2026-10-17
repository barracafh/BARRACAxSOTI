# Track 5 · Guía de las elecciones generales 2026

## El reto

Todo lo que necesitas para votar el 29 de noviembre, con fuentes oficiales: el voto por correo, los plazos, los programas oficiales y qué es la ley D'Hondt o qué significan el voto nulo y la abstención. Y un verificador que contrasta los bulos sobre cómo se vota con la fuente oficial, sin juicios sobre partidos ni candidatos.

Equipos: `como-voto-a` y `como-voto-b`, con el mismo reto.

## Qué se espera en la demo

Por ejemplo, alguna de estas tres cosas:

- Responder «vivo en València y el día 29 no estoy» con los pasos y las fechas del voto por correo.
- Contrastar un bulo sobre cómo se vota con la fuente oficial que lo confirma o lo desmiente.
- Mostrar cómo se reparten los escaños de una provincia con los datos reales de 2023.

## Materiales en esta carpeta

| Archivo                                            | Contenido                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resultados_congreso_2023_provincias.csv`          | Elecciones al Congreso del 23-J de 2023: 550 filas (provincia × candidatura), 52 circunscripciones y 350 escaños. Incluye censo, votantes, votos válidos, en blanco y nulos, y votos y escaños por candidatura. La columna `partido_agrupado` permite sumar totales nacionales |
| `resultados_congreso_2023_municipios_valencia.csv` | 266 municipios de la provincia de Valencia. No incluye el voto CERA (residentes en el extranjero)                                                                                                                                                                              |
| `calendario_29N_2026.json`                         | 14 fechas clave con su fuente                                                                                                                                                                                                                                                  |
| `FUENTES.md`                                       | Origen de los datos, comprobaciones y condiciones de reutilización. Hay que citar «Origen de los datos: Ministerio del Interior»                                                                                                                                               |

**Fechas clave**

| Fecha          | Hito                                                    |
| -------------- | ------------------------------------------------------- |
| 6/10           | Convocatoria                                            |
| 21–26/10       | Presentación de candidaturas                            |
| 13–27/11       | Campaña electoral                                       |
| hasta el 19/11 | Solicitud del voto por correo                           |
| hasta el 25/11 | Depósito del voto por correo (una fuente dice el 26/11) |
| 28/11          | Jornada de reflexión                                    |
| 29/11          | Votación                                                |

Comprobación útil: aplicando D'Hondt con un umbral del 3 % sobre los votos válidos (blancos incluidos) se reproducen los escaños oficiales de 2023 en las 52 circunscripciones.

## Fuentes oficiales

| Fuente                                                                                                                             | Qué ofrece                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Infoelectoral (Ministerio del Interior)](https://infoelectoral.interior.gob.es)                                                   | Resultados históricos oficiales (área de descargas)                                                 |
| Junta Electoral Central                                                                                                            | Acuerdos e instrucciones del proceso                                                                |
| INE · Oficina del Censo Electoral                                                                                                  | Consulta del censo y voto CERA                                                                      |
| Correos                                                                                                                            | Solicitud y depósito del voto por correo                                                            |
| BOE                                                                                                                                | Real Decreto de convocatoria (6/10/2026)                                                            |
| [Google Fact Check Tools](https://developers.google.com/fact-check-tools)                                                          | Verificaciones ya publicadas (ClaimReview). La clave la pone la organización en `FACTCHECK_API_KEY` |
| [Maldita · fuentes electorales](https://maldita.es/malditateexplica/20230717/herramientas-datos-fuentes-elecciones-generales-23j/) | Mapa de fuentes oficiales elaborado por verificadores                                               |

## A tener en cuenta

- **Neutralidad estricta:**
  - Ni recomendaciones de voto ni valoraciones de partidos o candidatos.
  - Los programas se enlazan en su versión oficial, sin resumirlos con opinión.
- **Sin fuentes no hay veredicto:** el verificador responde «no verificable».
- **Plazos:** las fechas deben salir del calendario oficial, no del conocimiento del modelo.

## Resumen para el agente

```markdown
# Track 5 · Elecciones generales 29-N 2026 · Build night · BARRACA x SOTI

Objetivo: ayudar a votar el 29/11/2026 (voto por correo, plazos, D'Hondt, voto nulo y en blanco) con fuentes oficiales, y/o contrastar bulos sobre cómo se vota (nunca sobre partidos o candidatos).
Datos: resultados_congreso_2023_provincias.csv, resultados_congreso_2023_municipios_valencia.csv, calendario_29N_2026.json; origen en FUENTES.md (citar "Origen de los datos: Ministerio del Interior").
Fuentes: infoelectoral.interior.gob.es, JEC, INE, Correos, BOE, Google Fact Check Tools (clave en FACTCHECK_API_KEY).
Reglas: neutralidad estricta (sin recomendaciones de voto ni juicios sobre partidos); las fechas salen de calendario_29N_2026.json; sin fuentes, "no verificable"; no guardar datos del usuario; claves solo en servidor; la herramienta se sirve bajo /<slug> y muestra el aviso "No es un servicio oficial".
```
