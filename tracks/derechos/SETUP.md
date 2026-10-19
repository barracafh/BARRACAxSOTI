# Track 1 · Buscador de ayudas

## El reto

El ciudadano cuenta su situación con sus palabras y la herramienta le dice a qué ayudas públicas (estatales, autonómicas y municipales) **podría optar** y dónde pedirlas. Hoy están repartidas entre administraciones y nadie te dice a cuáles puedes optar.

Puede haber hasta dos squads en este track, los dos con el mismo reto. Cada uno construye las piezas que le dé tiempo, en el orden que prefiera.

## Qué se espera en la demo

A partir de una descripción como «tengo 24 años, estoy en paro y vivo de alquiler en València», la herramienta devuelve varias ayudas con el motivo por el que encajan, los requisitos que hay que comprobar, su estado (abierta, cerrada o permanente) y el enlace oficial.

## Piezas

El reto se puede abordar por partes. Elegid las que os dé tiempo y en el orden que queráis:

- **Ayudas para ti.** A partir de la situación de la persona, las ayudas a las que podría optar, con sus requisitos, la fecha del dato y el enlace de solicitud. Si no hay ninguna, lo explica.
- **Compatibilidades y requisitos.** Una tabla de requisitos y compatibilidades de las ayudas del catálogo: qué se puede cobrar a la vez y qué no. Cada requisito lleva su fuente; lo no revisado sale como pendiente, sin prometer que se pueda pedir.
- **Calendario de convocatorias.** La apertura y el cierre de esas ayudas: distingue plazos cerrados, vigentes y sin fecha, con enlace al detalle oficial.

## Materiales en esta carpeta

- `catalogo-tramites-ayudas.json`: 21 entradas (8 ayudas y 13 trámites) para ciudadanía residente en València. Cada entrada incluye `frases_usuario`, `requisitos_clave`, `pasos`, `documentacion`, `plazo`, `enlace_info`, `enlace_tramite`, `fuente` y `verificado`.
  - Ayudas incluidas: Ingreso Mínimo Vital, Renta Valenciana de Inclusión, complemento de ayuda para la infancia, subsidio por desempleo, bono social eléctrico, bono alquiler joven, ayudas de comedor escolar y Xarxa Llibres.

## Fuentes oficiales

| Fuente                                                                                                       | Qué ofrece                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [API BDNS (Swagger)](https://www.infosubvenciones.es/bdnstrans/doc/swagger)                                  | Todas las convocatorias públicas de España (Estado, CCAA y entidades locales). JSON, sin clave. Base: `https://www.infosubvenciones.es/bdnstrans/api` |
| [bdns-mcp](https://lobehub.com/mcp/amorfeu86-bdns-mcp)                                                       | Servidor MCP abierto sobre la BDNS (búsqueda, detalle, últimas convocatorias)                                                                         |
| [Ficha BDNS en datos.gob.es](https://datos.gob.es/catalogo/e05250001-base-de-datos-nacional-de-subvenciones) | Descargas CSV/JSON y guía de uso de la API                                                                                                            |
| [Simulador del IMV](https://ingreso-minimo-vital.seg-social-innova.es/)                                      | Ejemplo oficial de cuestionario de elegibilidad                                                                                                       |
| [Dades Obertes GVA](https://dadesobertes.gva.es/es/dataset)                                                  | Datos abiertos de la Generalitat                                                                                                                      |

## A tener en cuenta

- La BDNS dice qué convocatorias existen, no si una persona cumple los requisitos: «podrías optar; revisa las bases», nunca «tienes derecho».
- Hay que comprobar las fechas: muchas convocatorias están cerradas. El bono alquiler joven 2026 de la GVA cerró el 11/09/2026 (dato de prensa, sin confirmar en fuente oficial).
- Tres entradas del catálogo tienen `"verificado": false` (inscripción en Labora, bono alquiler joven y Xarxa Llibres).
- La API de la BDNS es pública: conviene no hacer más de una petición por segundo.

## Perfiles de prueba

- Joven de 24 años en paro, de alquiler en València, sin hijos.
- Madre autónoma con 2 hijos en Castelló, ingresos bajos.
- Jubilado de 70 años en un pueblo de la Safor, pensión mínima, factura de la luz alta.
- Familia con 3 hijos en edad escolar en València.

## Resumen para el agente

```markdown
# Track 1 · Buscador de ayudas · Build night · BARRACA x SOTI

Objetivo: a partir del texto libre de un ciudadano, indicar a qué ayudas públicas podría optar, por qué, qué requisitos debe comprobar, su estado y el enlace oficial.
Datos: catalogo-tramites-ayudas.json (entradas con tipo "ayuda") y API BDNS https://www.infosubvenciones.es/bdnstrans/api (Swagger: /bdnstrans/doc/swagger).
Reglas: decir "podrías optar", nunca "tienes derecho"; no inventar importes, plazos ni requisitos; citar siempre el enlace oficial; no guardar datos del usuario; claves solo en servidor; la herramienta se sirve bajo /<slug> y muestra el aviso "No es un servicio oficial".
```
