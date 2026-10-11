# BARRACAxSOTI - Hack night

Código del evento: el CLI de participantes (`apps/cli/`), la web y su servidor (`apps/web/`, `apps/server/`) y lo común (`packages/shared/`). Las decisiones y el contexto del comité viven en otro repo, privado (`luisgonzaleznf/barrahack`).

- Workspace Bun con un único lockfile en la raíz: `bun install --frozen-lockfile`.
- Antes de cada commit, `bun run check` (tipos, tests y prettier) tiene que salir en verde.
- El nombre del evento solo se cambia en `packages/shared/registro-base/evento.json`.
- Textos, docs y mensajes al usuario en castellano. Código y commits en inglés.
- Nada de datos personales reales: las pruebas usan los ficticios de `test/fixtures` y `test/support`.
