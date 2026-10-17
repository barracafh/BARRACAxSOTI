# hacknight

La ventanilla de **BARRACA x SOTI · BUILD NIGHT**, 22 de octubre de 2026, Flywire (València). Bun + TypeScript, con GitHub como registro mediante `gh` o un directorio local. Trámites, expedientes y turnos para coordinar el hack. No guarda tokens de GitHub ni modifica herramientas de IA.

El build del evento va de **18:30 a 22:00 Europe/Madrid**. Los seis tracks son los negociados; cada squad tiene una pieza y una mesa. El comité asigna squads, piezas y el cupo único del track libre en `equipos.json`.

## Instalar y desarrollar

Desde la raíz del repo (un único workspace Bun y lockfile):

```sh
bun install --frozen-lockfile
bun run check
bun run --cwd apps/cli build:bin:host
./apps/cli/dist/hacknight --help
```

El binario es autónomo. Cópialo a un directorio de tu `PATH` si quieres invocarlo como `hacknight`. Git es necesario para tramitar/revisar; para el backend GitHub también hace falta `gh` instalado y `gh auth login`. Se usa su sesión existente, sin guardar credenciales propias.

`install.sh` y `actualizar` están **desactivados sin repo de releases**. Cuando el comité configure el destino de las releases, el instalador descargará el asset de la plataforma y comprobará `SHA256SUMS`:

```sh
HACKNIGHT_RELEASES=organizacion/releases sh apps/cli/install.sh
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

Los participantes ficticios y los generadores de logs están **solo en `test/fixtures` y `test/support`**. `test:live` levanta sockets locales y procesos watcher con historiales sintéticos, comprueba sus totales y cierra todos sus procesos. No consulta tus historiales de IA ni llama a proveedores. `test:flujo` recorre expediente → tramitar → ficha → revisión fallida → corrección → registro → cita → llamada → pantalla, con el DNI sintético deliberado del stub. `apps/cli/scripts/demo.sh` se conserva como alias de ese test de flujo.

Para comprobar el ejecutable autónomo:

```sh
bun run build:bin:host
HACKNIGHT_BIN="$PWD/apps/cli/dist/hacknight" HACKNIGHT_SERVER_BIN="$PWD/apps/server/dist/hacknight-server" bun run test:live
HACKNIGHT_BIN="$PWD/apps/cli/dist/hacknight" bun run test:flujo
```

No hay identidad local predeterminada. Indica `--usuario <tu-handle>` o `HACKNIGHT_USUARIO`. GitHub ignora esa variable y rechaza `--usuario`: allí la identidad procede de `gh api user`.

## Comandos

| Comando                                 | Trámite                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `hacknight`                             | Su expediente y, solo con TTY, menú navegable.                                                 |
| `expediente`                            | Identidad, squad, mesa, track, pieza, cuenta atrás, seis reglas y turno; nunca abre menú.      |
| `tracks [slug]` / `negociados`          | Tarjetas o detalle: piezas, datos, fuentes, guías y squads. `--todos` incluye los descartados. |
| `tramitar [--destino ruta] [--dry-run]` | Crea desde plantilla, clona, rellena ficha y descarga los datos preparados del track.          |
| `ficha`                                 | Editor interactivo. Sin TTY: `ficha --desde archivo.json`.                                     |
| `ficha validar`                         | Valida `ficha.json` y el slug contra los tracks activos.                                       |
| `revisar`                               | Las seis reglas y avisos propios del negociado. Código 2 si falta algo.                        |
| `registrar`                             | Repite revisar, comprueba asignación y plazo, escribe ficha local o abre/actualiza PR.         |
| `cita --motivo "texto"`                 | Pide un turno por squad, con prefijo del negociado y posición en su cola.                      |
| `cita estado` / `cita anular`           | Consulta o cancela el turno del squad.                                                         |
| `ventanilla [--track slug]`             | Cola del comité.                                                                               |
| `ventanilla llamar [--track slug]`      | Llama al siguiente en espera.                                                                  |
| `ventanilla atendido [numero]`          | Cierra un turno llamado; número de issue, sin prefijo.                                         |
| `tablon [-n 20]`                        | Publicaciones, avisos del comité, registros y pushes de squads.                                |
| `publicar "texto"`                      | Hasta 500 caracteres, con confirmación pública.                                                |
| `datos [paquete] [--track slug]`        | Lista o descarga a `./datos/`, verificando SHA256 antes de escribir.                           |
| `pantalla [--once] [--plain]`           | Proyector: cuenta atrás, turnos, negociados, registros, avisos y ticker. `p` pausa, `q` sale.  |
| `actualizar [--check]`                  | Releases configurables, con SHA256. Desactivado por defecto.                                   |

Alias en inglés ocultos: `status`, `init`, `check`, `submit`, `help-me`, `feed`, `tv`. Todos los comandos aceptan `--json`, `--registro`, `--cwd` y `--plain`. Sin TTY no hay prompts ni bucles de pantalla; se emite una captura. En TTY pequeño, pantalla rota paneles cada ocho segundos; `--once --plain` los imprime completos.

Crear el repo de squad y publicar texto requieren confirmación explícita. Sin TTY o con JSON, añade `--confirmar`; sin esa opción se rechazan antes de escribir. `tramitar --dry-run` muestra repo, destino y paquetes sin crear nada. No sobrescribe un directorio existente. En GitHub crea un repo **público**, siempre desde la plantilla configurada.

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
  "plantilla": "organizacion/plantilla",
  "releases": "organizacion/releases"
}
```

El registro por defecto es `barracafh/build-registro`. Variables equivalentes: `HACKNIGHT_REGISTRO`, `HACKNIGHT_PLANTILLA`, `HACKNIGHT_RELEASES`. En local, `plantilla` puede ser un directorio o `file:///ruta`; si falta se copian los bytes de `test/fixtures/plantilla-stub`, incluidos dentro del binario. La [plantilla real](../../plantilla/README.md) lleva `.hacknight/plantilla.json` y una ficha de ejemplo. `tramitar` solo sustituye una ficha con equipo `squad-ejemplo`, URL `https://example.invalid/pendiente` y marcador `exampleFicha: true`; después consume ese permiso. Las fichas de equipos existentes se rechazan. En copias locales se excluyen dependencias, builds y archivos `.env`. Para probarla, indica `--plantilla /ruta/al/monorepo/plantilla`.

## Montar el registro: guía del comité

Luis y el comité deben crear y configurar el repo central; el [script de infra](../../infra/registro/README.md) muestra el plan con `--dry-run`. El CLI de participantes no provisiona esos repos ni sus releases. Copia los JSON de `packages/shared/registro-base`, añade los equipos y handles del comité, sustituye los placeholders, y revisa los tracks antes de abrir el evento.

| Ruta                  | Formato                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evento.json`         | Objeto: `nombre`, `nombre_corto`, `organizan`, `inicio`, `fin` ISO con offset, `enlaces` (mapa nombre→URL) y `registroFueraDePlazo` booleano.                                                                                                 |
| `equipos.json`        | Array de `{id,nombre,herramienta,pieza,mesa,miembros,repo}`. `id` y `herramienta` son slugs; `mesa` es texto; `miembros` son handles sin `@`; `repo` es `owner/repo` (puede estar vacío mientras se prepara el equipo). Un usuario, un squad. |
| `tracks.json`         | Array descrito abajo; es la autoridad de los slugs válidos.                                                                                                                                                                                   |
| `comite.json`         | Array de handles con permiso de ventanilla y autoría de avisos.                                                                                                                                                                               |
| `fichas/<squad>.json` | Ficha validada; llega por PR, el comité la revisa e integra.                                                                                                                                                                                  |

Ejemplo de evento (las fechas llevan el offset de Madrid del día del hack):

```json
{
  "nombre": "BARRACA x SOTI · BUILD NIGHT",
  "nombre_corto": "Build night",
  "organizan": "BARRACA x SOTI",
  "inicio": "2026-10-22T18:30:00+02:00",
  "fin": "2026-10-22T22:00:00+02:00",
  "enlaces": { "centro": "https://example.invalid/pendiente" },
  "registroFueraDePlazo": false
}
```

Cada track contiene `slug`, `nombre`, `frase`, `ciudadano`, `ventanilla` (número), `color` (token de la paleta), `glifo`, `prefijo` de turno, `estado`, `lead`, `piezas` (2–3 textos), `paquetes`, `fuentes`, `dificultad` y `guias`. `cupo` es opcional; el track libre tiene cupo 1. Estados: `nucleo` y `libre`. Los leads siguen «por asignar»; Jesús, Iban, Pau y Alex todavía no tienen reparto. El catálogo se edita en [tracks/](../../tracks/README.md); el [JSON generado](../../packages/shared/registro-base/tracks.json) se incluye en el registro base.

Un paquete es `{"id":"derechos-base","nombre":"BDNS","url":"https://…/datos.zip","sha256":"64 caracteres hexadecimales","pendiente":false}`. Mientras no se prepare, `pendiente:true`, URL `example.invalid` y SHA `PENDIENTE`. `tramitar` deja esos paquetes pendientes visibles; `datos <id>` los rechaza. En pruebas locales se aceptan URLs `file:`; en GitHub solo HTTPS. Se guardan como archivos, **sin extraer ZIPs ni ejecutar contenido**.

La ficha tiene `nombre`, `frase`, `icono`, `herramienta`, `equipo`, `url`, `fuentes:[{nombre,url}]` y `datos:"reales"|"simulados"`. «Reales» significa datos públicos, nunca personales. El centro puede usar [esquemas/ficha.schema.json](esquemas/ficha.schema.json). El esquema se genera desde `fichaSchema` con `bun run --cwd apps/cli schema`; una prueba evita que diverjan. La existencia del slug se valida adicionalmente contra `tracks.json`.

### Etiquetas y permisos en GitHub

Prepara las etiquetas **`ventanilla`**, **`aviso`**, **`tablon`** con el script de infra antes del evento; el CLI no las crea al usarlas. Los turnos son issues con un cuerpo JSON `{tipo:"cita",squad,herramienta,mesa,motivo,estado}`. El CLI ignora turnos con autor ajeno al squad y toma la mesa del registro. Estados: `espera`, `llamado`, `atendido`, `anulado`; los dos últimos cierran el issue. Las publicaciones tienen `{texto,herramienta}`; los avisos pueden escribirse como texto normal por un handle de `comite.json`. Avisos de otros autores se ignoran.

Esta primera implementación usa **ramas en el registro central**, `hacknight/ficha-<squad>`, y Contents/PR API de GitHub. Los participantes necesitan permiso **Write** en ese repo para crear la rama, actualizar su ficha y etiquetar issues. No se crean forks automáticamente. Protege la rama principal: sin pushes directos, con revisión del comité; protege también los JSON de asignación y permisos mediante CODEOWNERS/revisión. El CLI valida identidad y asignación, pero **no sustituye los controles de GitHub** frente a alguien que escriba directamente con la API. Si el comité no quiere dar Write a squads, deberá decidir un flujo por forks o un bot antes del uso real.

El comité necesita Write para llamar/cerrar turnos de otros. Recomendación operativa: un despachador por negociado para no llamar simultáneamente al mismo issue; GitHub Issues no ofrece una transacción de cola entre dos terminales. Las operaciones locales se guardan bajo lock de directorio y escritura atómica. `.estado.json` conserva numeración/cola/recibos locales; no se sube a GitHub. Un lock huérfano exige comprobar que no queda otro proceso antes de retirarlo.

El número `RE-2026-22O-0042` usa el número de PR (GitHub) o el contador local compartido con issues. Actualizar un PR abierto conserva número. Un PR nuevo tras cerrar/integrar puede recibir otro. El hash corto permite detectar cambios en ficha/fecha/número; **no es una firma criptográfica ni un CSV oficial**. El justificante distingue `pendiente` (PR) de `integrado` (merge o escritura local). El tablón consulta los eventos públicos de cada repo de squad (caché de tres minutos mientras corre pantalla); GitHub puede retrasarlos.

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

La web muestra clasificación por squads, personas (si se habilita) y tracks, desglose de entrada/salida/caché, herramientas y evolución. La ventanilla y el tablón consultan el mismo registro que el CLI; `/pantalla` es el proyector. Sin logs del proyecto en la ventana configurada, el contador permanece en cero. El watcher cuenta actividad existente dentro de esa ventana, además de la que se produzca a partir de su arranque.

`p` pausa el watcher y `q` o `Ctrl+C` lo cierra. El watcher y el servidor son procesos independientes: cerrar uno no cierra el otro. No se instalan servicios de fondo. Infraestructura compartida entre máquinas queda pendiente.

### Consulta puntual

`hacknight consumo` lee contadores existentes de Claude Code y Codex, los filtra por directorio del proyecto (incluidos subdirectorios) y por la ventana de build, y muestra la contribución local al squad. No es el total de otras máquinas del equipo. No lee prompts para mostrarlos, no persiste historiales y no envía métricas; solo salen contadores agregados. El justificante añade «Tasa abonada: N tokens» cuando hay consumo atribuible.

Es una consulta puntual. Para lectura continua usa `observar` (alias oculto `watch`): sin `--servidor` mantiene todo local; con un servidor HTTP en loopback comparte los contadores de este proyecto durante el build. `--once` hace un único ciclo; `--intervalo 5` fija la cadencia; `p` pausa y `q` sale en TTY. También admite `--plain` y `--json` (un documento al terminar; progreso en stderr).

El backend guarda y deduplica contadores por ventana, usuario e ID. Solo se envían campos del [contrato compartido](../../packages/shared/src/contrato-uso.ts), sin conversaciones ni rutas. Los detalles de persistencia y los requisitos de producción están en [apps/server/README.md](../server/README.md#contadores-y-persistencia).

Rutas de lectura: `~/.claude/projects` (respeta `CLAUDE_CONFIG_DIR`) y `~/.codex/sessions` (respeta `CODEX_HOME`). Para un directorio de pruebas o una copia local usa `HACKNIGHT_CLAUDE_DIR` y `HACKNIGHT_CODEX_DIR`; esas variables no cambian ninguna configuración de los asistentes. Las líneas malformadas se ignoran; errores de lectura producen avisos de total parcial. Bloques repetidos de Claude y contadores acumulativos de Codex se deduplican; el razonamiento ya incluido en salida no se suma dos veces.

Cursor queda sin recolector: el origen necesitaba instalar hooks para obtener contadores. Se respeta la prohibición de modificar configuraciones del usuario. Tampoco se incorporan OTel ni otros proveedores. La compatibilidad se valida con fixtures de los formatos del commit fijado; formatos futuros pueden requerir adaptación.

## Marca y releases

La marca por defecto se define en [packages/shared/registro-base/evento.json](../../packages/shared/registro-base/evento.json): `nombre` es el nombre oficial; `nombre_corto`, la marca de terminal y web; `organizan`, la firma del comité. El CLI y el servidor importan esos datos mediante `@hacknight/shared/evento`; las vistas leen el evento del registro activo. Cambiar el nombre oficial solo requiere editar `nombre`, sin buscar cadenas en el código. En instancias ya creadas, edita su `evento.json` o los campos de `/admin` si existe `.gestion.json`.

La paleta común está en [packages/shared/src/paleta.ts](../../packages/shared/src/paleta.ts); [src/lib/estilo.ts](src/lib/estilo.ts) la aplica al terminal. Los badges de track usan fondo propio y tinta clara/oscura de la misma paleta: el significado también lleva glifo, nombre y ventanilla. No hay banderas, escudos ni logos de terceros.

El único slot de logo es `assets/logo.png`, todavía ausente. Cuando llegue, desde `apps/cli/`:

```sh
bun run embed-logo
bun run build:bin:host
```

El script aplana el PNG sobre blanco e incrusta una tarjeta para Kitty/Ghostty/WezTerm/iTerm2/VS Code. La prueba usa un PNG generado en un directorio temporal y no lo sube. Sin logo se muestra el wordmark (77 columnas); en terminal estrecho, `☾ build night`. Dentro de cajas se usa `☾` para mantener la alineación. El proyector usa el fondo `nit` de la paleta común; `--plain` produce una captura de texto y `NO_COLOR` desactiva el color.

`scripts/build-all.sh` compila macOS/Linux x64/arm64 y Windows x64; produce `dist/SHA256SUMS`. `--host` solo compila esta máquina y `--target bun-<os>-<arch>` compila una plataforma de la matriz. El script no publica; [release-cli.yml](../../.github/workflows/release-cli.yml) publica al subir un tag válido, después de comprobar la versión y compilar los cinco targets. Las releases deben usar tags `cli-vX.Y.Z`, assets `hacknight-<os>-<arch>[.exe]` y `SHA256SUMS`. Ajusta `package.json` y `src/version.ts` juntos antes de versionar.

## Pendiente para el evento

- Publicar el registro, decidir organización y permisos, y proteger ramas; configurar el destino de releases (el workflow publica en este monorepo).
- Publicar la [plantilla real](../../plantilla/README.md) como repo GitHub y configurar su formulario; la stub de fixtures es únicamente de ensayo.
- Introducir equipos y participantes reales, sus repos y enlaces. La instancia arranca vacía.
- Asignar track leads y adjudicar el cupo libre.
- Preparar los packs oficiales, sus hashes y contenido editorial; verificar los plazos de ¿Cómo voto? con sus fuentes.
- Recibir el PNG final y validar la marca con Rubén y Marcos.
- Ensayar en la terminal y proyector del venue; no se ha publicado ni probado contra un registro GitHub real.

## Créditos

Fork de la infraestructura de terminal de `apps/cli` de HackSpain/hackspain26, commit `2865d19`, MIT, © Asociación Exponential Fellowship; autor principal Samu (`samuelcorsan`). Adaptación para Build night por Luis González y colaboradores. Véanse [AVISO.md](AVISO.md) y [LICENSE](LICENSE). No se reutilizan marcas ni ilustraciones del origen.
