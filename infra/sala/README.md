# Web del evento en Vercel

Publica `apps/web` en `sala.build.barraca.house`, con el proyector en `/pantalla`. Desde la raíz:

```sh
bun infra/sala/publicar.ts --dry-run
```

Son archivos estáticos y una función, `api/estado`, que lee el registro `barracafh/build-registro` y responde lo mismo que `/api/estado` del servidor local. Vercel guarda esa respuesta 30 segundos, así que todas las pantallas de la sala comparten una consulta a GitHub cada medio minuto.

- `GITHUB_TOKEN` (en el shell al aplicar): un token de grano fino con acceso de solo lectura a repositorios públicos. Sin él, GitHub limita a 60 consultas por hora.
- Se muestra todo menos el ranking de tokens, que necesita su propio almacén (`vistas` en `estado.ts`).
- No hay administración: `/admin` lleva al repo del registro, donde los cambios entran por PR.

Repite el `--apply` después de cambiar `apps/web`, `estado.ts` o el nombre del evento.
