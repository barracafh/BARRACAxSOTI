# Datos · Sello + estafas

| Recurso                      | Formato | Origen                                                                                                                                 | Estado  |
| ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Dominios oficiales           | JSON    | `dominios-oficiales.json`: 25 entidades y las reglas `*.gob.es` y `*.edu.es`, cada una con su fuente.                                  | listo   |
| Mensajes de prueba           | JSON    | `mensajes-ejemplo.json`: 10 casos (5 fraudes publicados por INCIBE y 5 legítimos) con el resultado esperado.                           | listo   |
| Avisos de INCIBE             | Web     | [incibe.es/ciudadania/avisos](https://www.incibe.es/ciudadania/avisos): campañas activas; la herramienta las enlaza o las consulta.    | en vivo |
| Reputación y registro de URL | API     | Google Safe Browsing v5 (clave de la organización en `SAFE_BROWSING_API_KEY`) y RDAP (`https://rdap.org/domain/<dominio>`), sin clave. | en vivo |

Los recursos «en vivo» los consulta la herramienta durante la noche: leerlos y citarlos es parte del reto. Si llega el OK de Reforma Digital, su lista de dominios se sumará a `dominios-oficiales.json`.

Cada archivo lleva su procedencia y fecha de consulta; ninguno contiene datos personales. `infra/equipos` copia esta carpeta al repo de cada squad, sin este README.
