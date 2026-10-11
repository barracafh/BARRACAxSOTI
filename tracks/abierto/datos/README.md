# Datos · Abierto

| Paquete necesario      | Formato                                     | Origen y preparación                                                                  | Estado    |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- | --------- |
| Contratos GVA          | CSV anual → CSV/JSON limpio                 | Dades obertes; el comité encontró CSV 2020–2026. Seleccionar año y columnas.          | pendiente |
| Presupuestos           | Tablas CSV; formato de origen por confirmar | GVA y València; conversión y validación pendientes.                                   | pendiente |
| Dato oficial, opcional | JSON con códigos de serie y definiciones    | API INE; la propuesta plantea 30 indicadores fijos, mapeados a mano. Caché pendiente. | pendiente |

Antes del 20/10: descargar, acotar, limpiar y guardar procedencia, licencia y fecha de consulta. Verificar que no contiene datos personales. Publicar el pack fuera de esta carpeta de documentación y poner URL, SHA256 y `pendiente: false` en `../track.json`; ejecutar `bun run tracks:generar` desde la raíz. [Fuentes oficiales](../README.md#fuentes-oficiales).
