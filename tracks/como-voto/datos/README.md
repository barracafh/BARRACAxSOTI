# Datos · ¿Cómo voto? (29N)

| Paquete necesario | Formato                             | Origen y preparación                                                                                                      | Estado    |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------- |
| Proceso electoral | Markdown/JSON curado                | JEC, BOE, INE y Correos; extracción y verificación pendientes.                                                            | pendiente |
| Calendario        | JSON con fuente y fecha de revisión | La propuesta menciona 19/11 para solicitar voto por correo: pendiente de verificar; no precargarlo como plazo confirmado. | pendiente |

Antes del 20/10: descargar, acotar, limpiar y guardar procedencia, licencia y fecha de consulta. Verificar que no contiene datos personales. Publicar el pack fuera de esta carpeta de documentación y poner URL, SHA256 y `pendiente: false` en `../track.json`; ejecutar `bun run tracks:generar` desde la raíz. [Fuentes oficiales](../README.md#fuentes-oficiales).
