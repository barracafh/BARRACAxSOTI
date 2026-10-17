# BARRACA x SOTI · BUILD NIGHT

Este monorepo contiene lo que pone la organización. **Los squads construyen en sus propios repos**, que crea `infra/equipos/` desde `plantilla/`; no añadas sus herramientas al workspace. Las decisiones y el contexto del comité viven en el repo privado `luisgonzaleznf/barrahack`, de solo lectura en esta tarea.

| Dónde                                         | Qué se cambia                                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/cli/`                                   | CLI de participantes, watcher, esquema de ficha y binarios                                                                   |
| `apps/web/` · `apps/server/`                  | Interfaz del evento, administración, HTTP y SQLite                                                                           |
| `packages/shared/`                            | Contratos, modelos, persistencia compartida y paleta                                                                         |
| `packages/shared/registro-base/evento.json`   | Único lugar para cambiar el nombre del evento                                                                                |
| `tracks/<slug>/track.json`                    | Fuente de verdad del catálogo: los seis tracks publicados                                                                    |
| `tracks/<slug>/`                              | Ficha técnica, datos y guías que completa el track lead                                                                      |
| `tracks/<slug>/contexto.md` · `tracks/comun/` | Marco de conocimiento verificado (del track y común) con su infografía `.html` al lado; índice visual en `tracks/index.html` |
| `plantilla/`                                  | Starter independiente de los squads; copia los tokens de paleta, no importa el workspace                                     |
| `infra/` · `.github/workflows/`               | Scripts de preparación (registro, repos de equipo, hub y sala), CI y releases                                                |
| `docs/`                                       | Guías cortas; calendario de equipos en `docs/equipos.md` y README raíz                                                       |
| `test/` · `apps/cli/test/`                    | Pruebas y fixtures ficticios; el stub con fallos vive en `apps/cli/test/fixtures/`                                           |

- Workspace Bun en `apps/*` y `packages/*`, con un único lockfile raíz: `bun install --frozen-lockfile`. `apps/web/` son assets sin paquete propio.
- `plantilla/` queda **fuera** del workspace y tiene su propio `package.json` y `bun.lock`: instalar y compilar desde esa carpeta. Mantenerla utilizable como repo independiente.
- Después de editar tracks, `bun run tracks:generar`; no editar a mano `packages/shared/registro-base/tracks.json`. `bun run check` detecta si está desactualizado.
- El marco de conocimiento son los Markdown de `tracks/comun/` (comunes a todos los tracks) y el `contexto.md` de cada track. Todo cambio en uno de ellos debe actualizar en el mismo commit su infografía, el `.html` con el mismo nombre en la misma carpeta (cifras, esquemas y tooltips), y `tracks/index.html` si cambian datos del resumen. Después, `bun run infografia:indice` regenera el índice de apartados que enlaza cada bloque con el Markdown; no editar a mano `tracks/comun/infografia/indice.js`. `bun run check` detecta si está desactualizado.
- Antes de cada commit, `bun run check` (tipos, tests y Prettier) debe salir en verde. Cambios del starter requieren además `bun run build` dentro de `plantilla/`; cambios de integración, `test:flujo` y `test:live`.
- Infra es `--dry-run` por defecto. No ejecutar `--apply` contra servicios reales sin una instrucción expresa; nunca imprimir claves ni versionar `.local-secrets/`.
- Textos, docs y mensajes al usuario en castellano. Código y commits en inglés.
- Nada de datos personales reales: pruebas con fixtures ficticios. Mantener breves las guías; no crear páginas en `docs/` sin necesidad.
- Los tracks son los seis publicados; un track descartado se borra, no se archiva. El calendario de equipos vigente es el de Íñigo del 11/10; no recuperar el reparto antiguo del 20/10.
