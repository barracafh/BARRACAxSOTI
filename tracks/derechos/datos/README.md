# Datos · Derechos

| Paquete necesario             | Formato                 | Origen y preparación                                                     | Estado    |
| ----------------------------- | ----------------------- | ------------------------------------------------------------------------ | --------- |
| Convocatorias BDNS            | JSON → JSON/CSV acotado | BDNS; API pública descrita en la propuesta. Descargar, limpiar y fechar. | pendiente |
| Ayudas de la GVA              | CSV                     | Dades obertes; separar concesiones de convocatorias.                     | pendiente |
| Requisitos y compatibilidades | JSON/Markdown curado    | Normas de las ayudas seleccionadas; selección pendiente.                 | pendiente |

Antes del 20/10: descargar, acotar, limpiar y guardar procedencia, licencia y fecha de consulta. Verificar que no contiene datos personales. Publicar el pack fuera de esta carpeta de documentación y poner URL, SHA256 y `pendiente: false` en `../track.json`; ejecutar `bun run tracks:generar` desde la raíz. [Fuentes oficiales](../README.md#fuentes-oficiales).
