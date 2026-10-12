# Código compartido de Build night

Paquete interno `@hacknight/shared`, consumido por el CLI y el backend a través del workspace Bun. No depende de ninguna aplicación ni de SQLite.

- `src/evento.ts`: exporta la marca por defecto desde `registro-base/evento.json` (`nombre`, `nombre_corto`, `organizan`).
- `src/modelo.ts`: esquemas y tipos de evento, tracks, equipos, fichas e interfaz `Registro`.
- `src/registro/`: persistencia del registro local, validación de equipos y configuración del comité.
- `src/actividad.ts` y `src/cola.ts`: estado del evento, tablón y turnos para terminal y web.
- `src/contrato-uso.ts`: contrato v1 de los contadores y ventana del build.
- `src/paleta.ts`: tokens de color de BARRACA, comunes a web, CLI y plantilla.
- `registro-base/`: horario y catálogo generado desde `tracks/**/track.json`; equipos y comité vacíos. No edites `registro-base/tracks.json`: ejecuta `bun run tracks:generar` después de editar el track. Los participantes de prueba están en `test/fixtures/` en la raíz.

El esquema JSON de la ficha permanece en `apps/cli/esquemas/ficha.schema.json`, generado desde este modelo para que el centro pueda reutilizarlo. Desde la raíz: `bun run --cwd apps/cli schema`.

Instalación, tipos y tests: `bun install --frozen-lockfile` y `bun run check` desde la raíz. Licencia MIT y atribución: [LICENSE](../../apps/cli/LICENSE) y [AVISO.md](../../apps/cli/AVISO.md).
