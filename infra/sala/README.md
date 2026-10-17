# Web del evento en Vercel

Publica `apps/web` en `sala.build.barraca.house`, con el proyector en `/pantalla`. Desde la raíz:

```sh
bun infra/sala/publicar.ts --dry-run
```

Son archivos estáticos y dos funciones en Frankfurt (`fra1`):

- **`api/estado`** lee el registro `barracafh/build-registro` y el ranking de la base de datos, y responde lo mismo que `/api/estado` del servidor local. Vercel guarda esa respuesta 30 segundos, así que todas las pantallas de la sala comparten una consulta cada medio minuto.
- **`api/uso`** recibe los contadores de `hacknight observar`. Solo acepta lotes firmados con una sesión de GitHub cuyo usuario coincida con el del lote y esté en `equipos.json`. Se queda con el contador mayor de cada petición, como el servidor local.

Variables del proyecto:

- `GITHUB_TOKEN` (en el shell al aplicar): token de grano fino con acceso de solo lectura a repositorios públicos. Sin él, GitHub limita a 60 consultas por hora.
- `DATABASE_URL`: la pone la integración de Neon (plan gratuito, `fra1`). Sin ella, la web funciona y el ranking se queda apagado.

El ranking muestra squads, tracks, herramientas y evolución, sin personas (`vistas` en `estado.ts`). Solo cuenta Claude Code y Codex, que son los asistentes cuyos logs locales sabe leer el CLI. No hay administración: `/admin` lleva al repo del registro, donde los cambios entran por PR.

Repite el `--apply` después de cambiar `apps/web`, `infra/sala/` o el nombre del evento.
