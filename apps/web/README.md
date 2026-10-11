# Web de Hack night

Web del evento y dashboard local, servidos por [apps/server/](../server) (`bun run start` desde la raíz del repo). HTML, CSS y JavaScript sin dependencias de navegador ni servicios externos. Los assets se incluyen en `apps/server/dist/hacknight-server`; el CLI no los incorpora. La paleta llega de `packages/shared/src/paleta.ts` mediante `/paleta.css`; el token `noche` da el fondo a la web, el admin y el proyector. El logo gráfico sigue pendiente: se muestra la marca tipográfica con la luna.

Los títulos, metadatos y cabeceras se renderizan con el evento del registro; `marca.js` los actualiza tras las consultas o al guardar desde el admin. No hay un nombre de evento duplicado en el HTML.

- `/`: evento, negociados, clasificación, evolución, ventanilla y tablón.
- `/pantalla`: vista del proyector con cuenta atrás, ranking y turnos.
- `GET /api/estado`: registro y clasificación, consultados cada 2 s.
- `POST /api/uso`: contrato v1 del watcher. Deduplicación y persistencia en SQLite.
- `/admin`: acceso local, evento, equipos, participantes y visibilidad de vistas.
- `POST/DELETE /api/admin/sesion`: inicio/cierre de sesión local con clave; cookie HttpOnly/SameSite.
- `GET/PUT /api/admin`: configuración con revisión, validación y escritura atómica.

La instancia empieza vacía y nunca arranca watchers. Los fixtures y logs sintéticos viven en `../../test/`; no hay generador ni endpoint de simulación en la aplicación. Las vistas deshabilitadas se filtran en la API, y el proyector apagado devuelve 403. Las asignaciones y ajustes persisten en `.gestion.json`, compartido por web y CLI. La clave `.admin-key` se guarda con permisos 0600; las sesiones caducan al reiniciar.

El referente funcional es la web del evento y la sección Insights del dashboard de HackSpain `2865d19`. Esta interfaz está adaptada desde cero a «Azulejo y ventanilla»; no copia sus assets, signup, cuentas ni backend. MIT y atribución: [LICENSE](../cli/LICENSE) y [AVISO.md](../cli/AVISO.md).

## TODO antes de alojarlo

Luis ha confirmado que puede usarse infraestructura propia. Elegir el proveedor y provisionarlo queda pendiente. El backend actual es para pruebas en una máquina y escucha solo en loopback.

1. Autenticación real y asociación de usuario/squad validada por servidor; reemplazar la identidad local declarada y la clave compartida del comité.
2. Base de datos del servicio, migraciones, copias y retención; acordar si el ranking público incluye personas o solo squads.
3. Transporte HTTPS, acceso de varias máquinas, límites por usuario y observabilidad.
4. Recolección incremental y cola duradera de envíos para historiales grandes; ahora se releen los logs retenidos y se reintentan sin duplicar.
5. Conectar registro, plantilla, releases y marca definitiva. Formulario de inscripción, si el comité lo necesita.

No hay despliegue, infraestructura provisionada ni envío de consumo mediante GitHub. El contrato mantiene separadas las métricas del contenido: no acepta prompts, respuestas, rutas o metadatos arbitrarios.
