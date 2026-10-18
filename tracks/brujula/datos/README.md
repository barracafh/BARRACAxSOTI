# Datos · Brújula (GVA y València)

| Paquete necesario     | Formato                                                   | Origen y preparación                                                                                                        | Estado    |
| --------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| Trámites y plazos     | JSON curado                                               | `catalogo-tramites-ayudas.json`: 21 entradas (13 trámites y 8 ayudas), cada una con su fuente. Ver [SETUP.md](../SETUP.md). | listo     |
| Alternativas sin cita | 8 fichas Markdown propuestas                              | DNI, TIE/NIE, SEPE, INSS/TGSS, DGT, AEAT, PROP y padrón; revisión jurídica pendiente.                                       | pendiente |
| Oficinas y canales    | DIR3 XLSX, PROP CSV, equipamientos municipales CSV → JSON | Descarga y limpieza; los equipamientos municipales del contexto no traen horarios.                                          | pendiente |

Antes del 20/10, para lo pendiente: descargar, acotar, limpiar y guardar procedencia, licencia y fecha de consulta. Verificar que no contiene datos personales. Dejar los archivos en esta carpeta: `infra/equipos` la copia al repo de cada squad, sin este README. [Fuentes oficiales](../README.md#fuentes-oficiales).
