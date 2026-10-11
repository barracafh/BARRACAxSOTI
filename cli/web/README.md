# Web de Barbaritat

Web del evento y dashboard local, servidos por `barbaritat servidor` y `bun run demo:live` desde `cli/`. HTML, CSS y JavaScript sin dependencias de navegador ni servicios externos. Los assets se incluyen en el binario. La paleta llega de `src/lib/estilo.ts` mediante `/paleta.css`.

- `/`: evento, negociados, clasificación, evolución, ventanilla y tablón.
- `/pantalla`: vista del proyector con cuenta atrás, ranking y turnos.
- `GET /api/estado`: registro y clasificación, consultados cada 2 s.
- `POST /api/uso`: contrato v1 del watcher. Deduplicación y persistencia en SQLite.
- `POST /api/demo`: controles de datos ficticios, disponibles solo en `demo:live`.

El referente funcional es la web del evento y la sección Insights del dashboard de HackSpain `2865d19`. Esta interfaz está adaptada desde cero a «Azulejo y ventanilla»; no copia sus assets, signup, cuentas ni backend. MIT y atribución: `../LICENSE` y `../AVISO.md`.

## TODO antes de alojarlo

Luis ha confirmado que puede usarse infraestructura propia. Elegir el proveedor y provisionarlo queda pendiente. El backend actual es para pruebas en una máquina y escucha solo en loopback.

1. Autenticación real y asociación de usuario/squad validada por servidor; reemplazar la identidad de demo.
2. Base de datos del servicio, migraciones, copias y retención; acordar si el ranking público incluye personas o solo squads.
3. Transporte HTTPS, acceso de varias máquinas, límites por usuario y observabilidad.
4. Recolección incremental y cola duradera de envíos para historiales grandes; ahora se releen los logs retenidos y se reintentan sin duplicar.
5. Conectar registro, plantilla, releases y marca definitiva. Formulario de inscripción, si el comité lo necesita.

No hay despliegue, infraestructura provisionada ni envío de consumo mediante GitHub. El contrato mantiene separadas las métricas del contenido: no acepta prompts, respuestas, rutas o metadatos arbitrarios.
