# hacknight

La ventanilla de **BARRACA x SOTI · BUILD NIGHT**, 22 de octubre de 2026, Flywire (València). Bun + TypeScript, con GitHub como registro mediante `gh` o un directorio local. Trámites y expedientes para coordinar el hack. Usa tu sesión de `gh` sin guardar su token y no modifica herramientas de IA; qué lee y qué envía está en [Seguridad y privacidad](../../README.md#seguridad-y-privacidad).

El build del evento va de **17:40 a 22:00 Europe/Madrid**. Los seis tracks son los negociados; cada squad tiene una pieza y una mesa. El comité asigna squads, piezas y el cupo único del track libre en `equipos.json`.

## Instalar y desarrollar

Desde la raíz del repo (un único workspace Bun y lockfile):

```sh
bun install --frozen-lockfile
bun run check
bun run --cwd apps/cli build:bin:host
./apps/cli/dist/hacknight --help
```

El binario es autónomo. Cópialo a un directorio de tu `PATH` si quieres invocarlo como `hacknight`. Git es necesario para revisar; para el backend GitHub también hace falta `gh` instalado y `gh auth login`. Se usa su sesión existente, sin guardar credenciales propias.

Las releases se publican en el registro público, `barracafh/build-registro`, con `bun infra/cli/publicar.ts`. El instalador descarga el asset de la plataforma y comprueba `SHA256SUMS`; `HACKNIGHT_RELEASES` cambia el repo:

```sh
curl -fsSL https://build.barraca.house/instalar.sh | sh
hacknight actualizar --check
hacknight actualizar
```

`actualizar` sustituye únicamente binarios compilados; nunca el ejecutable Bun de desarrollo. En Windows descarga `hacknight-windows-x64.exe` de la release y verifica su hash. La actualización de un `.exe` conserva el anterior con sufijo `.old`. No hay publicación automática ni comprobaciones en segundo plano.

## Web y administración

Viven fuera de este paquete: [apps/web/](../web) contiene la interfaz y [apps/server/](../server) el backend local con administración, SQLite y proyector web. Desde la raíz del repo, `bun run start` abre una instancia vacía. El servidor tiene su propio ejecutable, `apps/server/dist/hacknight-server`.

El CLI local lee las mismas asignaciones guardadas desde `/admin`. La configuración, la clave de administración y el control de vistas se explican en [apps/server/README.md](../server/README.md). Para conectar el watcher, consulta [el circuito con uso real](#probar-web--watcher--leaderboard-con-uso-real).

## Pruebas aisladas

Desde la raíz del repo:

```sh
bun run check
bun run test:live
bun run test:flujo
```

Los participantes ficticios y los generadores de logs están **solo en `test/fixtures` y `test/support`**. `test:live` levanta sockets locales y procesos watcher con historiales sintéticos, comprueba sus totales y cierra todos sus procesos. No consulta tus historiales de IA ni llama a proveedores. `test:flujo` recorre expediente → ficha → revisión fallida → corrección → registro, con el DNI sintético deliberado del stub. `apps/cli/scripts/demo.sh` se conserva como alias de ese test de flujo.

Para comprobar el ejecutable autónomo:

```sh
bun run build:bin:host
HACKNIGHT_BIN="$PWD/apps/cli/dist/hacknight" HACKNIGHT_SERVER_BIN="$PWD/apps/server/dist/hacknight-server" bun run test:live
HACKNIGHT_BIN="$PWD/apps/cli/dist/hacknight" bun run test:flujo
```

No hay identidad local predeterminada. Indica `--usuario <tu-handle>` o `HACKNIGHT_USUARIO`. GitHub ignora esa variable y rechaza `--usuario`: allí la identidad procede de `gh api user`.

## Comandos

| Comando                        | Trámite                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `hacknight`                    | Su expediente y, solo con TTY, menú navegable.                                          |
| `expediente`                   | Identidad, squad, mesa, track, pieza, cuenta atrás y seis reglas; nunca abre menú.      |
| `tracks [slug]` / `negociados` | Tarjetas o detalle: piezas, fuentes, guías y squads. `--todos` incluye los descartados. |
| `ficha`                        | Editor interactivo. Sin TTY: `ficha --desde archivo.json`.                              |
| `ficha validar`                | Valida `ficha.json` y el slug contra los tracks activos.                                |
| `revisar`                      | Las seis reglas y avisos propios del negociado. Código 2 si falta algo.                 |
| `registrar`                    | Repite revisar, comprueba asignación y plazo, escribe ficha local o abre/actualiza PR.  |
| `tablon [-n 20]`               | Avisos del comité, registros y pushes de squads.                                        |
| `actualizar [--check]`         | Releases configurables, con SHA256. Desactivado por defecto.                            |

Alias en inglés ocultos: `status`, `check`, `submit`, `feed`. Todos los comandos aceptan `--json`, `--registro`, `--cwd` y `--plain`. Sin TTY no hay prompts.

Con `--json` stdout contiene exactamente un objeto:

```json
{ "ok": true, "data": {} }
```

Un error devuelve `ok:false`, `code`, `message`, `hint`, `exitCode` y, si aplica, `data` con el informe. No hay ANSI, imágenes ni prompts. `NO_COLOR` (incluso vacío), terminal `dumb` y salida sin TTY desactivan color. Los glifos, nombres y estados conservan el significado sin color ni emoji.

| Salida | Significado                                                |
| -----: | ---------------------------------------------------------- |
|      0 | Trámite completado.                                        |
|      1 | Error general o bloqueo local.                             |
|      2 | Uso, configuración, esquema, checksum o subsanación.       |
|      3 | Falta sesión de `gh`.                                      |
|      4 | Sin squad, sin permiso, recurso pendiente o plazo cerrado. |
|      5 | Red, API o proceso externo fallido.                        |
|    130 | Cancelado.                                                 |

## Configuración

Precedencia: flag → variable de entorno → `~/.config/hacknight/config.json` → valor por defecto. Se respeta `XDG_CONFIG_HOME`. `HACKNIGHT_CONFIG` permite elegir otro archivo.

```json
{
  "registro": "barracafh/build-registro",
  "releases": "barracafh/build-registro"
}
```

El registro por defecto es `barracafh/build-registro`. Variables equivalentes: `HACKNIGHT_REGISTRO` y `HACKNIGHT_RELEASES`. Los repos de los squads los crea `infra/equipos` desde la [plantilla real](../../plantilla/README.md), con su ficha y el marcador `.hacknight/plantilla.json` que exige `revisar`.

## Montar el registro: guía del comité

El comité crea y configura el repo central; el [script de infra](../../infra/registro/README.md) muestra el plan con `--dry-run`. El CLI de participantes no provisiona esos repos ni sus releases. Copia los JSON de `packages/shared/registro-base`, añade los equipos y handles del comité, sustituye los placeholders, y revisa los tracks antes de abrir el evento.

| Ruta                  | Formato                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evento.json`         | Objeto: `nombre`, `nombre_corto`, `organizan`, `inicio`, `fin` ISO con offset, `enlaces` (mapa nombre→URL) y `registroFueraDePlazo` booleano.                                                                                                 |
| `equipos.json`        | Array de `{id,nombre,herramienta,pieza,mesa,miembros,repo}`. `id` y `herramienta` son slugs; `mesa` es texto; `miembros` son handles sin `@`; `repo` es `owner/repo` (puede estar vacío mientras se prepara el equipo). Un usuario, un squad. |
| `tracks.json`         | Array descrito abajo; es la autoridad de los slugs válidos.                                                                                                                                                                                   |
| `comite.json`         | Array de handles con autoría de avisos.                                                                                                                                                                                                       |
| `fichas/<squad>.json` | Ficha validada; llega por PR, el comité la revisa e integra.                                                                                                                                                                                  |

Ejemplo de evento (las fechas llevan el offset de Madrid del día del hack):

```json
{
  "nombre": "BARRACA x SOTI · BUILD NIGHT",
  "nombre_corto": "Build night",
  "organizan": "BARRACA x SOTI",
  "inicio": "2026-10-22T17:40:00+02:00",
  "fin": "2026-10-22T22:00:00+02:00",
  "enlaces": { "centro": "https://example.invalid/pendiente" },
  "registroFueraDePlazo": false
}
```

Cada track contiene `slug`, `nombre`, `frase`, `ciudadano`, `ventanilla` (número), `color` (token de la paleta), `glifo`, `estado`, `lead`, `piezas` (2–3 textos), `fuentes`, `dificultad` y `guias`. `cupo` es opcional; el track libre tiene cupo 1. Estados: `nucleo` y `libre`. El catálogo se edita en [tracks/](../../tracks/README.md); el [JSON generado](../../packages/shared/registro-base/tracks.json) se incluye en el registro base.

La ficha tiene `nombre`, `frase`, `icono`, `herramienta`, `equipo`, `url`, `fuentes:[{nombre,url}]` y `datos:"reales"|"simulados"`. «Reales» significa datos públicos, nunca personales. El centro puede usar [esquemas/ficha.schema.json](esquemas/ficha.schema.json). El esquema se genera desde `fichaSchema` con `bun run --cwd apps/cli schema`; una prueba evita que diverjan. La existencia del slug se valida adicionalmente contra `tracks.json`.

### Etiquetas y permisos en GitHub

Prepara la etiqueta **`aviso`** con el script de infra antes del evento. Los avisos son issues de texto normal con esa etiqueta, escritos por un handle de `comite.json`; los de otros autores se ignoran.

El CLI usa **ramas en el registro central**, `hacknight/ficha-<squad>`, y Contents/PR API de GitHub. Los participantes necesitan permiso **Write** en ese repo para crear la rama y actualizar su ficha. No se crean forks automáticamente. Protege la rama principal: sin pushes directos, con revisión del comité; protege también los JSON de asignación y permisos mediante CODEOWNERS/revisión. El CLI valida identidad y asignación, pero **no sustituye los controles de GitHub** frente a alguien que escriba directamente con la API.

Las operaciones locales se guardan bajo lock de directorio y escritura atómica. `.estado.json` conserva numeración/recibos locales; no se sube a GitHub. Un lock huérfano exige comprobar que no queda otro proceso antes de retirarlo.

El número `RE-2026-22O-0042` usa el número de PR (GitHub) o el contador local compartido con issues. Actualizar un PR abierto conserva número. Un PR nuevo tras cerrar/integrar puede recibir otro. El hash corto permite detectar cambios en ficha/fecha/número; **no es una firma criptográfica ni un CSV oficial**. El justificante distingue `pendiente` (PR) de `integrado` (merge o escritura local). El tablón consulta los eventos públicos de cada repo de squad, con una caché de tres minutos; GitHub puede retrasarlos.

### Qué revisa y qué no puede acreditar

`revisar` exige marcador, URL 2xx con timeout, ficha válida, fuentes HTTPS, ausencia de indicios personales y texto/componente del botón en código versionado. Analiza los **archivos actuales que Git tiene versionados**, incluidas altas con `git add`, sin recorrer historial. También analiza `ficha.json` aunque aún no esté versionada, porque se envía al registro. Detecta DNI/NIE con letra válida, IBAN ES con checksum, teléfonos españoles, emails salvo dominios de ejemplo, `.env` y prefijos de claves. Nunca imprime valores detectados. Los enlaces simbólicos sin analizar bloquean; no se siguen fuera del proyecto.

Es una heurística: puede producir falsos positivos y no extrae texto de imágenes/PDFs ni demuestra que la web renderiza el botón. Los binarios se señalan para revisión humana. Las fuentes no oficiales y comprobaciones de Sello, Claridad y ¿Cómo voto? son avisos, no bloqueos. Antes de integrar, el comité revisa contenido, fuentes y datos. Una revisión satisfactoria no prueba ausencia de toda información personal.

En GitHub la URL debe resolver a una red pública; cada redirección se comprueba y la petición tiene timeout. El backend local admite loopback para la demo. Citar GVA, BOE u otras fuentes oficiales no presenta ninguna URL de esas instituciones como propia del evento.

## Consumo local (extra)

### Probar web + watcher + leaderboard con uso real

1. Desde la raíz del repo, ejecuta `bun run start` y entra en `/admin`.
2. Crea tu equipo con **tu handle real** y el track. Ajusta la ventana del build si pruebas antes del evento; guarda la configuración.
3. Desde otra terminal, ejecuta explícitamente el watcher para tu proyecto:

```sh
hacknight --registro file:///ruta/instancia --usuario TU_HANDLE --cwd /ruta/proyecto observar --servidor http://127.0.0.1:4310
```

Usa la URL `file://` del registro que imprime el servidor. Si aún no instalaste el binario, sustituye `hacknight` por `bun /ruta/a/apps/cli/src/index.ts`.

La web muestra clasificación por squads, personas (si se habilita) y tracks, desglose de entrada/salida/caché, herramientas y evolución. El tablón consulta el mismo registro que el CLI; `/pantalla` es el proyector. Sin logs del proyecto en la ventana configurada, el contador permanece en cero. El watcher cuenta actividad existente dentro de esa ventana, además de la que se produzca a partir de su arranque.

`p` pausa el watcher y `q` o `Ctrl+C` lo cierra. El watcher y el servidor son procesos independientes: cerrar uno no cierra el otro. No se instalan servicios de fondo.

En el evento, con el registro de GitHub, `hacknight observar` envía por defecto a la sala (`enlaces.sala` de `evento.json`, [infra/sala](../../infra/sala/README.md)). La primera vez pide confirmar tu cuenta en `github.com/login/device`: el token no tiene permisos, solo prueba quién eres, y se guarda con permisos `0600` junto a la configuración. Después solo envía lo que ha cambiado, una vez por minuto.

### Consulta puntual

`hacknight consumo` lee contadores existentes de Claude Code, Codex y Pi, los filtra por directorio del proyecto (incluidos subdirectorios) y por la ventana de build, y muestra la contribución local al squad. No es el total de otras máquinas del equipo. No lee prompts para mostrarlos, no persiste historiales y no envía métricas; solo salen contadores agregados. El justificante añade «Tasa abonada: N tokens» cuando hay consumo atribuible.

Es una consulta puntual. Para lectura continua usa `observar` (alias oculto `watch`): con el registro de GitHub envía a la sala; `--servidor` acepta otra URL HTTPS o un servidor HTTP en loopback, y con un registro local sin `--servidor` todo queda en local. `--once` hace un único ciclo; `--intervalo 60` (por defecto) fija la cadencia; `p` pausa y `q` sale en TTY. También admite `--plain` y `--json` (un documento al terminar; progreso en stderr).

El backend guarda y deduplica contadores por ventana, usuario e ID. Solo se envían campos del [contrato compartido](../../packages/shared/src/contrato-uso.ts), sin conversaciones ni rutas. Los detalles de persistencia y los requisitos de producción están en [apps/server/README.md](../server/README.md#contadores-y-persistencia).

Rutas de lectura: `~/.claude/projects` (respeta `CLAUDE_CONFIG_DIR`), `~/.codex/sessions` (respeta `CODEX_HOME`) y `~/.pi/agent/sessions` (respeta `PI_CODING_AGENT_DIR`). Para un directorio de pruebas o una copia local usa `HACKNIGHT_CLAUDE_DIR`, `HACKNIGHT_CODEX_DIR` y `HACKNIGHT_PI_DIR`; esas variables no cambian ninguna configuración de los asistentes. Las líneas malformadas se ignoran; errores de lectura producen avisos de total parcial. Bloques repetidos de Claude, contadores acumulativos de Codex y mensajes copiados en sesiones bifurcadas de Pi se deduplican; el razonamiento ya incluido en salida no se suma dos veces.

Cursor queda sin recolector: el origen necesitaba instalar hooks para obtener contadores. Se respeta la prohibición de modificar configuraciones del usuario. Tampoco se incorporan OTel ni otros proveedores. La compatibilidad se valida con fixtures de los formatos del commit fijado; formatos futuros pueden requerir adaptación.

## Marca y releases

La marca por defecto se define en [packages/shared/registro-base/evento.json](../../packages/shared/registro-base/evento.json): `nombre` es el nombre oficial; `nombre_corto`, la marca de terminal y web; `organizan`, la firma del comité. El CLI y el servidor importan esos datos mediante `@hacknight/shared/evento`; las vistas leen el evento del registro activo. Cambiar el nombre oficial solo requiere editar `nombre`, sin buscar cadenas en el código. En instancias ya creadas, edita su `evento.json` o los campos de `/admin` si existe `.gestion.json`.

La paleta común está en [packages/shared/src/paleta.ts](../../packages/shared/src/paleta.ts); [src/lib/estilo.ts](src/lib/estilo.ts) la aplica al terminal. Los badges de track usan fondo propio y tinta clara/oscura de la misma paleta: el significado también lleva glifo, nombre y ventanilla. No hay banderas, escudos ni logos de terceros.

El CLI no lleva logo: muestra el wordmark (77 columnas) y, en terminal estrecho, `☾ build night`. Dentro de cajas se usa `☾` para mantener la alineación. `NO_COLOR` desactiva el color.

`scripts/build-all.sh` compila macOS/Linux x64/arm64 y Windows x64; produce `dist/SHA256SUMS`. `--host` solo compila esta máquina y `--target bun-<os>-<arch>` compila una plataforma de la matriz. El script no publica; [release-cli.yml](../../.github/workflows/release-cli.yml) comprueba la versión y compila los cinco targets al subir un tag, y `infra/cli/publicar.ts` publica la release en el registro. Las releases deben usar tags `cli-vX.Y.Z`, assets `hacknight-<os>-<arch>[.exe]` y `SHA256SUMS`. Ajusta `package.json` y `src/version.ts` juntos antes de versionar.

## Créditos

Fork de la infraestructura de terminal de `apps/cli` de HackSpain/hackspain26, commit `2865d19`, MIT, © Asociación Exponential Fellowship; autor principal Samu (`samuelcorsan`). Adaptación para Build night por Luis González y colaboradores. Véanse [AVISO.md](AVISO.md) y [LICENSE](../../LICENSE). No se reutilizan marcas ni ilustraciones del origen.
