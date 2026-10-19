# Web de Build night

Web del evento y dashboard local, servidos por [apps/server/](../server) (`bun run start` desde la raíz del repo). HTML, CSS y JavaScript sin dependencias de navegador ni servicios externos. Los assets se incluyen en `apps/server/dist/buildnight-server`; el CLI no los incorpora. Usa la marca de BARRACA: la paleta llega de `packages/shared/src/paleta.ts` mediante `/paleta.css` (el token `nit` da el fondo a la web, el admin y el proyector) y Syne y Space Mono se sirven desde `fonts/` (licencia OFL), sin peticiones externas. El logo gráfico sigue pendiente: se muestra la marca tipográfica con la luna.

Los títulos, metadatos y cabeceras se renderizan con el evento del registro; `marca.js` los actualiza tras las consultas o al guardar desde el admin. No hay un nombre de evento duplicado en el HTML.

- `/`: evento, negociados, clasificación, evolución y tablón.
- `/pantalla`: vista del proyector con cuenta atrás, ranking y tablón.
- `GET /api/estado`: registro y clasificación, consultados cada 2 s.
- `POST /api/uso`: contrato v1 del watcher. Deduplicación y persistencia en SQLite.
- `/admin`: acceso local, evento, equipos, participantes y visibilidad de vistas.
- `POST/DELETE /api/admin/sesion`: inicio/cierre de sesión local con clave; cookie HttpOnly/SameSite.
- `GET/PUT /api/admin`: configuración con revisión, validación y escritura atómica.

La instancia empieza vacía y nunca arranca watchers. Los fixtures y logs sintéticos viven en `../../test/`; no hay generador ni endpoint de simulación en la aplicación. Las vistas deshabilitadas se filtran en la API, y el proyector apagado devuelve 403. Las asignaciones y ajustes persisten en `.gestion.json`, compartido por web y CLI. La clave `.admin-key` se guarda con permisos 0600; las sesiones caducan al reiniciar.

El referente funcional es la web del evento y la sección Insights del dashboard de HackSpain `2865d19`. Esta interfaz está adaptada desde cero a la marca de BARRACA; no copia sus assets, signup, cuentas ni backend. MIT y atribución: [LICENSE](../../LICENSE) y [AVISO.md](../cli/AVISO.md).

## En el evento

[infra/sala/](../../infra/sala/README.md) publica esta web en Vercel: archivos estáticos, `/api/estado`, que lee el registro de GitHub, y `/api/uso`, que recibe los contadores de `buildnight observar` autenticados con GitHub y los guarda en Postgres. No tiene administración: el comité trabaja en el registro.

El backend local de [apps/server/](../server) es para desarrollo y ensayo: escucha solo en `127.0.0.1`, con identidad declarada por el cliente y una clave local del comité. El contrato mantiene separadas las métricas del contenido: no acepta prompts, respuestas, rutas ni metadatos arbitrarios.
