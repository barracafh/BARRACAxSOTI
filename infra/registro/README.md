# Preparar el registro

Desde la raíz, revisa el plan (no necesita sesión ni hace llamadas a GitHub):

```sh
bun infra/registro/preparar.ts --repo organizacion/registro --owners '@organizacion/comite' --dry-run
```

Copia `evento.json`, `equipos.json`, `tracks.json` y `comite.json` desde `packages/shared/registro-base/`, sin inventar equipos. Prepara un repo **nuevo y público**, rama `main`, y muestra los comandos `gh` que crearían las etiquetas `ventanilla`, `aviso`, `tablon` y la protección de rama. CODEOWNERS cubre los cuatro JSON y su propio archivo. Requiere una revisión y la del code owner en esos archivos; descarta aprobaciones antiguas, impide force-push/borrado y aplica a administradores.

## Aplicación por el comité

1. Actualiza y revisa los JSON de base (tracks se generan con `bun run tracks:generar`); no subas claves ni datos personales.
2. Decide propietario y repo. Ten `git`, Bun, `gh` y `gh auth login`; necesitas permiso para crear repos y administración del repo para proteger ramas, además de Contents e Issues Write. Un token limitado debe cubrir esas operaciones; no se guarda aquí.
3. El usuario o equipo de `--owners` debe existir y tener Write explícito en el registro. GitHub no pide revisión a un owner sin acceso. El script no concede acceso a participantes ni al comité: configúralo y verifica CODEOWNERS antes de abrir el evento.
4. Solo tras revisar el plan, sustituye `--dry-run` por `--apply`. El script usa un directorio temporal nuevo; no modifica tu checkout. Es de arranque, **no de actualización**: si el repo ya existe, falla. Si falla después de crearlo, inspecciona lo aplicado y completa manualmente los comandos pendientes; no borres el repo para repetir.
5. Comprueba etiquetas, rama y protección en GitHub. Configura `HACKNIGHT_REGISTRO=organizacion/registro` para el CLI.

El CLI actual necesita Write para que los squads envíen fichas por ramas/PR y etiqueten issues. Decidir ese permiso o cambiar a forks/bot sigue pendiente. El comité también necesita Write para gestionar turnos. CODEOWNERS no concede permisos y una heurística del CLI no sustituye las revisiones.

Referencia: [protección de ramas de GitHub](https://docs.github.com/en/rest/branches/branch-protection). Más contexto en [el README del CLI](../../apps/cli/README.md#etiquetas-y-permisos-en-github).
