# Datos · Sello + estafas

| Paquete necesario            | Formato       | Origen y preparación                                                                                      | Estado    |
| ---------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- | --------- |
| Dominios oficiales           | JSON          | DIR3 y sedes oficiales; curar dominios-oficiales.json. Lista de Reforma Digital pendiente del OK de Samu. | pendiente |
| Oficinas DIR3                | XLSX → JSON   | Catálogo de Servicios de Oficinas; el comité requiere descarga manual.                                    | pendiente |
| Mensajes de prueba y canales | JSON/Markdown | Ejemplos ficticios redactados desde Interior, INCIBE y Protección Civil.                                  | pendiente |

Antes del 20/10: descargar, acotar, limpiar y guardar procedencia, licencia y fecha de consulta. Verificar que no contiene datos personales. Publicar el pack fuera de esta carpeta de documentación y poner URL, SHA256 y `pendiente: false` en `../track.json`; ejecutar `bun run tracks:generar` desde la raíz. [Fuentes oficiales](../README.md#fuentes-oficiales).
