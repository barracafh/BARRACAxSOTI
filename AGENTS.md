# BARRACAxSOTI - Hack night

Este monorepo contiene lo que pone la organización. **Los squads construyen en sus propios repos**, creados desde `plantilla/` con `hacknight tramitar`; no añadas sus herramientas al workspace. Las decisiones y el contexto del comité viven en el repo privado `luisgonzaleznf/barrahack`, de solo lectura en esta tarea.

| Dónde                                       | Qué se cambia                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/cli/`                                 | CLI de participantes, watcher, esquema de ficha y binarios                               |
| `apps/web/` · `apps/server/`                | Interfaz del evento, administración, HTTP y SQLite                                       |
| `packages/shared/`                          | Contratos, modelos, persistencia compartida y paleta                                     |
| `packages/shared/registro-base/evento.json` | Único lugar para cambiar el nombre del evento                                            |
| `tracks/<slug>/track.json`                  | Fuente de verdad del catálogo; los descartados viven en `tracks/fuera/`                  |
| `tracks/<slug>/`                            | Ficha técnica, datos y guías que completa el track lead                                  |
| `plantilla/`                                | Starter independiente de los squads; copia los tokens de paleta, no importa el workspace |
| `infra/` · `.github/workflows/`             | Scripts de preparación, opciones de deploy, CI y releases                                |
| `docs/`                                     | Guías cortas; calendario de equipos en `docs/equipos.md` y README raíz                   |
| `test/` · `apps/cli/test/`                  | Pruebas y fixtures ficticios; el stub con fallos vive en `apps/cli/test/fixtures/`       |

- Workspace Bun en `apps/*` y `packages/*`, con un único lockfile raíz: `bun install --frozen-lockfile`. `apps/web/` son assets sin paquete propio.
- `plantilla/` queda **fuera** del workspace y tiene su propio `package.json` y `bun.lock`: instalar y compilar desde esa carpeta. Mantenerla utilizable como repo independiente.
- Después de editar tracks, `bun run tracks:generar`; no editar a mano `packages/shared/registro-base/tracks.json`. `bun run check` detecta si está desactualizado.
- Antes de cada commit, `bun run check` (tipos, tests y Prettier) debe salir en verde. Cambios del starter requieren además `bun run build` dentro de `plantilla/`; cambios de integración, `test:flujo` y `test:live`.
- Infra es `--dry-run` por defecto. No ejecutar `--apply` contra servicios reales sin una instrucción expresa; nunca imprimir claves ni versionar `.local-secrets/`.
- Textos, docs y mensajes al usuario en castellano. Código y commits en inglés.
- Nada de datos personales reales: pruebas con fixtures ficticios. Mantener breves las guías; no crear páginas en `docs/` sin necesidad.
- La lista final de tracks espera validación de Pau el 12/10. El calendario de equipos vigente es el de Íñigo del 11/10; no recuperar el reparto antiguo del 20/10.
