# Datos · Radar

| Paquete necesario       | Formato                      | Origen y preparación                                                        | Estado    |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------- | --------- |
| Convocatorias y cierres | JSON compartido con Derechos | BDNS; usar fechaFinSolicitud y revisar casos sin fecha.                     | pendiente |
| Casos de calendario     | JSON sintético               | Crear fixtures de cierre, prórroga, fecha desconocida y zona Europe/Madrid. | pendiente |

Antes del 20/10: descargar, acotar, limpiar y guardar procedencia, licencia y fecha de consulta. Verificar que no contiene datos personales. Publicar el pack fuera de esta carpeta de documentación y poner URL, SHA256 y `pendiente: false` en `../track.json`; ejecutar `bun run tracks:generar` desde la raíz. [Fuentes oficiales](../README.md#fuentes-oficiales).
