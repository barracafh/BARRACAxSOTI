# Servidor local de Build night

Backend del evento, independiente del CLI de participantes: HTTP, administración y SQLite. Sirve los assets de [apps/web/](../web) y utiliza los modelos de [packages/shared/](../../packages/shared). El ejecutable no importa código de `apps/cli/`.

## Arranque local vacío

Desde la raíz del repo, con Bun instalado:

```sh
bun install --frozen-lockfile
bun run start
```

Web: **http://127.0.0.1:4310/**. Administración: **http://127.0.0.1:4310/admin**. El primer arranque crea `.hacknight-live/registro/` con los tracks reales, el horario del evento y **cero equipos, participantes, avisos o consumo**. Reiniciar conserva los datos. No arranca watchers ni genera tokens.

La terminal indica dónde está `.admin-key`; introduce el contenido de ese archivo en el formulario de administración. Es una clave local, creada con permisos `0600`; no se imprime, no se sube a GitHub y no se guarda en el navegador. La sesión usa una cookie HttpOnly/SameSite y caduca en ocho horas o al reiniciar el servidor. `Cerrar sesión` la revoca.

Después de `bun run build:bin:host` desde la raíz, también funciona desde su propio binario, sin Bun ni archivos web externos:

```sh
./apps/server/dist/hacknight-server
./apps/server/dist/hacknight-server --directorio /ruta/instancia --puerto 4320
```

Para un registro local que ya existe: `bun run start --directorio /ruta/registro`. `--directorio` crea o abre una instancia; nunca sobreescribe los JSON existentes. `--db` permite elegir la SQLite (por defecto, `uso.sqlite` dentro del registro). `Ctrl+C` cierra el servidor.

## Administración del evento

En `/admin` el comité puede:

- Editar nombre oficial, nombre corto, organizadores, inicio y fin del build, entregas tardías y handles del comité. Los campos de fecha muestran la zona horaria del navegador; la web pública siempre presenta la hora de València.
- Crear, editar y quitar equipos; asignarles un negociado, pieza, mesa, repo y hasta cinco handles de GitHub. Se admiten equipos vacíos durante la preparación. Se rechazan participantes repetidos, tracks fuera del hack y cupos excedidos.
- Habilitar tokenmaxxing, ranking individual, catálogo de negociados, tablón y proyector. El ranking individual empieza deshabilitado. Las vistas apagadas tampoco entregan sus datos desde la API. Los avisos identifican a sus autores aunque el ranking individual esté oculto.

Los equipos se editan en un borrador. **Guardar configuración** aplica el conjunto de cambios, con control de revisión para impedir que dos pestañas se sobreescriban. La web los recoge en su siguiente consulta, cada dos segundos. Los permisos de vistas son globales para esta web; no sustituyen los permisos de GitHub ni deshabilitan los comandos del CLI.

La administración guarda un único `.gestion.json` de forma atómica. Desde el primer guardado, ese archivo es la fuente de evento, equipos, comité y vistas para **la web y el CLI local**; los cuatro JSON iniciales quedan como base, y `tracks.json` sigue siendo el catálogo de esa instancia. El catálogo de origen del monorepo se edita en `tracks/**/track.json` y se genera con `bun run tracks:generar`; las instancias existentes no se actualizan automáticamente. Para transportar la configuración a un registro GitHub, exporta las propiedades `evento`, `equipos` y `comite` de `.gestion.json` a sus JSON respectivos; no copies la clave ni la SQLite. La administración web actual edita solo instancias locales.

Los contadores siguen al handle: reasignarlo cambia el squad al que se atribuye su consumo; retirarlo lo excluye del ranking, conservando el historial. Cambiar los instantes de inicio/fin abre otra ventana de consumo. Recuperar el horario anterior recupera sus cifras; cambiar solo el formato de zona horaria no las reinicia.

### Recuperación de bloqueos

Las escrituras de administración y del CLI usan reclamaciones por proceso en `.admin-lock.claims/` y `.lock.claims/`. Una operación nueva recupera automáticamente las reclamaciones de procesos que ya no existen, incluso después de una caída. Nunca se retira el bloqueo de un proceso vivo ni se decide por su antigüedad. Si el sistema no permite comprobar al propietario, se conserva el bloqueo; un PID reutilizado también se trata como vivo por precaución.

Las versiones antiguas creaban los directorios `.admin-lock/` y `.lock/` sin identificar al propietario. Si aparece el aviso de bloqueo antiguo, primero detén el servidor y todos los comandos CLI que usan esa instancia. Solo entonces retira manualmente el directorio `.admin-lock` o `.lock` señalado dentro del registro y vuelve a arrancar. No lo borres mientras pueda quedar algún proceso escribiendo; reintentar o reiniciar por sí solo no elimina estos bloqueos heredados. No ejecutes versiones antiguas y nuevas simultáneamente sobre el mismo registro.

## Contadores y persistencia

```sh
bun run start --directorio /ruta/registro --puerto 4310 --db /tmp/hacknight-uso.sqlite
bun run cli --registro file:///ruta/registro --cwd /ruta/proyecto --usuario TU_HANDLE observar --servidor http://127.0.0.1:4310
```

El backend local persiste en SQLite y deduplica cada evento por ventana, persona e ID: se puede reintentar o reiniciar sin sumar dos veces. El total incluye entrada, salida y caché, con desglose separado. Solo acepta miembros del registro, y el periodo es `[inicio, fin)`. Los IDs de eventos salen como hashes; no se envían conversaciones, rutas ni nombres de proyectos. El watcher vuelve a leer el historial retenido en cada ciclo y recupera envíos fallidos mientras esos archivos existan.

La identidad local `--usuario` es declarada por el cliente: no equivale a autenticar a una persona. El servidor escucha exclusivamente en `127.0.0.1` y el watcher solo admite destinos locales. Es un servidor de desarrollo y ensayo. En el evento, la web y el ranking los sirve la [sala en Vercel](../../infra/sala/README.md), que comprueba con GitHub quién envía cada lote.

## Desarrollo y pruebas

La instalación y el lockfile son comunes, en la raíz del workspace. `bun run start` arranca solo el backend; el watcher se ejecuta explícitamente con el CLI, como describe [su README](../cli/README.md#probar-web--watcher--leaderboard-con-uso-real).

Desde la raíz:

```sh
bun run check
bun run test:live
bun run build:bin:host
HACKNIGHT_BIN="$PWD/apps/cli/dist/hacknight" HACKNIGHT_SERVER_BIN="$PWD/apps/server/dist/hacknight-server" bun run test:live
```

`test:live` prueba administración, watcher, clasificación, privacidad del payload, controles de vistas, reintentos y reinicio con persistencia; cierra todos sus procesos. Los participantes ficticios solo existen en los fixtures de `test/`.

Licencia MIT y créditos: [LICENSE](../../LICENSE) y [AVISO.md](../cli/AVISO.md).
