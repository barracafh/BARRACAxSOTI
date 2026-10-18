# Track 3 · Verificador de webs y mensajes

## El reto

Comprueba si una web, un SMS o un aviso es oficial de verdad y, si no lo es, te dice cuál es la buena. Antiphishing contra las estafas que suplantan a la DGT, a Hacienda y a otros organismos.

Puede haber hasta dos squads en este track, los dos con el mismo reto. Cada uno construye las piezas que le dé tiempo, en el orden que prefiera.

## Qué se espera en la demo

Pegar un mensaje o una URL y obtener un veredicto (oficial, sospechoso o fraude), el motivo y la web oficial correcta.

## Piezas

El reto se puede abordar por partes. Elegid las que os dé tiempo y en el orden que queráis:

- **¿Esta web es oficial?** El dominio se compara con la lista oficial sin visitar la URL: distingue coincidencia exacta, subdominio válido y desconocido, y lo desconocido no se da por fraude.
- **Las citas son gratis.** Ante un caso sintético de reventa de citas, las señales que la delatan y la ruta oficial y gratuita para pedir la cita, con enlace a Interior. No consulta ni reserva citas.
- **¿Este aviso es oficial?** Avisos sintéticos contrastados con los canales de Protección Civil, GVA 112 y AEMET: qué se pudo comprobar y qué no, con su fuente. No sustituye a las alertas de emergencia.

## Materiales en esta carpeta

- `dominios-oficiales.json`
  - 25 entidades (AEAT, DGT, Seguridad Social, SEPE, Correos, INCIBE, Cl@ve, DEHú, GVA, Ajuntament de València, etc.) con sus dominios oficiales y la fuente de cada uno.
  - La regla `*.gob.es`: este dominio está reservado a las Administraciones Públicas españolas (Orden ITC/1542/2005).
- `mensajes-ejemplo.json`: 10 mensajes de prueba, cada uno con `esperado`, `pistas` y `web_oficial_correcta`.
  - 5 fraudes reales, con el texto literal publicado por INCIBE (AEAT, DGT por SMS y por email, Correos y Seguridad Social). INCIBE no publica las URL maliciosas, así que cada uno incluye una `url_prueba_sintetica` inventada y desactivada (`hxxps://…[.]top`).
  - 5 mensajes legítimos de redacción propia, basados en el formato que describe la fuente oficial.

## Fuentes

| Fuente                                                                     | Qué ofrece                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [INCIBE · Avisos a la ciudadanía](https://www.incibe.es/ciudadania/avisos) | Campañas activas de phishing y smishing                                                                                                                                                                                                   |
| Línea 017 de INCIBE                                                        | Ayuda gratuita en ciberseguridad para la ciudadanía                                                                                                                                                                                       |
| [Google Safe Browsing](https://developers.google.com/safe-browsing)        | Reputación de URL. Clave gratuita, solo para uso no comercial. La v4 está obsoleta: hay que usar la v5, que exige avisos claros al usuario y atribuir el resultado a Google. La clave la pone la organización en `SAFE_BROWSING_API_KEY`. |
| RDAP (`https://rdap.org/domain/<dominio>`)                                 | Fecha de registro y titular del dominio                                                                                                                                                                                                   |

## A tener en cuenta

- El peor error es decir «oficial» de algo que no lo es. Ante la duda, la respuesta es «no puedo confirmarlo; entra tú por la web oficial».
- Ojo con las trampas de dominio: `dgt.es.multas-pago.com` no es `dgt.es`.
- No hay que abrir ni descargar las URL sospechosas.
- Algunos dominios de la lista se confirmaron solo con resultados de búsqueda (Labora, cita previa DNI, Banco de España): revisad el campo `fuente` de cada uno.

## Resumen para el agente

```markdown
# Track 3 · Verificador de webs y mensajes · Build night · BARRACA x SOTI

Objetivo: a partir de un SMS, un email o una URL que dice ser de un organismo público, dar un veredicto (oficial, sospechoso o fraude), el motivo y la web oficial correcta.
Datos: dominios-oficiales.json (lista blanca + regla \*.gob.es) y mensajes-ejemplo.json (10 casos de prueba con el resultado esperado).
Fuentes: avisos de INCIBE, Google Safe Browsing v5 (clave en SAFE_BROWSING_API_KEY) y RDAP.
Reglas: ante la duda, "no puedo confirmarlo"; no abrir las URL analizadas; recomendar la línea 017 de INCIBE en casos sospechosos; no guardar datos del usuario; claves solo en servidor; la herramienta se sirve bajo /<slug> y muestra el aviso "No es un servicio oficial".
```
