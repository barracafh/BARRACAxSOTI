# barbaritat

La ventanilla de **Barbaritat Valenciana · BARRACA × SOTI**, 22 de octubre de 2026, MAISA (València). Bun + TypeScript, con GitHub como registro mediante `gh` o un directorio local. Trámites, expedientes y turnos para coordinar el hack. No almacena credenciales ni modifica herramientas de IA.

El build del evento va de **18:30 a 22:00 Europe/Madrid**. Los nueve tracks son los negociados; cada squad tiene una pieza y una mesa. Los cuatro descartados aparecen en `tracks --todos` con su motivo. El comité asigna squads, piezas y el cupo único del track libre en `equipos.json`.

## Instalar y desarrollar

Desde esta carpeta:

```sh
bun install --frozen-lockfile
bun run typecheck
bun test
bun run build:bin:host
./dist/barbaritat --help
```

El binario es autónomo. Cópialo a un directorio de tu `PATH` si quieres invocarlo como `barbaritat`. Git es necesario para tramitar/revisar; para el backend GitHub también hace falta `gh` instalado y `gh auth login`. Se usa su sesión existente, sin guardar credenciales propias.

`install.sh` y `actualizar` están **desactivados sin repo de releases**. Cuando el comité lo cree, el instalador descargará el asset de la plataforma y comprobará `SHA256SUMS`:

```sh
BARBARITAT_RELEASES=organizacion/releases sh install.sh
barbaritat actualizar --check
barbaritat actualizar
```

`actualizar` sustituye únicamente binarios compilados; nunca el ejecutable Bun de desarrollo. En Windows descarga `barbaritat-windows-x64.exe` de la release y verifica su hash. La actualización de un `.exe` conserva el anterior con sufijo `.old`. No hay publicación automática ni comprobaciones en segundo plano.

## Demo sin GitHub

```sh
./scripts/demo.sh
```

Copia `demo/registro` a un directorio temporal, arranca un servidor efímero en `127.0.0.1`, crea el proyecto stub y recorre expediente → tramitar → ficha → revisión fallida → corrección → revisión correcta → registro → cita → llamada → pantalla. Deja allí proyectos, registro y capturas; imprime la ruta. El DNI del stub es sintético y provoca un fallo deliberado. La demo permite entregas tardías en **su copia** de `evento.json` para seguir funcionando después del hack.

Para probar el binario en ese mismo recorrido:

```sh
BARBARITAT_BIN="$PWD/dist/barbaritat" ./scripts/demo.sh
```

Para explorar sin crear un proyecto:

```sh
export BARBARITAT_REGISTRO="file://$PWD/demo/registro"
barbaritat tracks
barbaritat tracks brujula
barbaritat expediente
barbaritat --usuario demo-mentor-ona ventanilla
```

Los cuatro squads y todos los handles `demo-*` son ficticios. El usuario local predeterminado es `demo-alba`; se cambia con `--usuario` o `BARBARITAT_USUARIO`. GitHub ignora esa variable y rechaza `--usuario`: la identidad procede de `gh api user`.

## Comandos

| Comando                                 | Trámite                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `barbaritat`                            | Su expediente y, solo con TTY, menú navegable.                                                 |
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

Precedencia: flag → variable de entorno → `~/.config/barbaritat/config.json` → valor por defecto. Se respeta `XDG_CONFIG_HOME`. `BARBARITAT_CONFIG` permite elegir otro archivo.

```json
{
  "registro": "barbaritat-valenciana/registro",
  "plantilla": "organizacion/plantilla",
  "releases": "organizacion/releases"
}
```

El registro por defecto es un **placeholder**. Variables equivalentes: `BARBARITAT_REGISTRO`, `BARBARITAT_PLANTILLA`, `BARBARITAT_RELEASES`. En local, `plantilla` puede ser un directorio o `file:///ruta`; si falta se copian los bytes de `demo/plantilla-stub`, incluidos dentro del binario. La plantilla real debe llevar `.barbaritat/plantilla.json` con `{"plantilla":"barbaritat","version":"1"}` y no incluir una ficha de equipo.

## Montar el registro: guía del comité

Luis y el comité deben crear y configurar el repo central. Este encargo **no crea repos, issues, PRs ni releases reales**. Copia los JSON de `demo/registro`, sustituye los handles ficticios y los placeholders, y revisa los tracks antes de abrir el evento.

| Ruta                  | Formato                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evento.json`         | Objeto: `nombre`, `inicio`, `fin` ISO con offset, `enlaces` (mapa nombre→URL) y `registroFueraDePlazo` booleano.                                                                                                 |
| `equipos.json`        | Array de `{id,nombre,herramienta,pieza,mesa,miembros,repo}`. `id` y `herramienta` son slugs; `mesa` es texto; `miembros` son handles sin `@`; `repo` es `owner/repo` (vacío solo en demo). Un usuario, un squad. |
| `tracks.json`         | Array descrito abajo; es la autoridad de los slugs válidos.                                                                                                                                                      |
| `comite.json`         | Array de handles con permiso de ventanilla y autoría de avisos.                                                                                                                                                  |
| `fichas/<squad>.json` | Ficha validada; llega por PR, el comité la revisa e integra.                                                                                                                                                     |

Ejemplo de evento (las fechas llevan el offset de Madrid del día del hack):

```json
{
  "nombre": "Barbaritat Valenciana",
  "inicio": "2026-10-22T18:30:00+02:00",
  "fin": "2026-10-22T22:00:00+02:00",
  "enlaces": { "centro": "https://example.invalid/pendiente" },
  "registroFueraDePlazo": false
}
```

Cada track contiene `slug`, `nombre`, `frase`, `ciudadano`, `ventanilla` (número), `color` (token de la paleta), `glifo`, `prefijo` de turno, `estado`, `lead`, `piezas` (2–3 textos), `paquetes`, `fuentes`, `dificultad` y `guias`. `cupo` y `motivo` son opcionales; el track libre tiene cupo 1 y los descartados explican su motivo. Estados: `nucleo`, `si-hay-gente`, `condicional`, `libre` y `fuera`. Los leads siguen «por asignar»; Jesús, Iban, Pau y Alex todavía no tienen reparto. Véase el [catálogo completo](demo/registro/tracks.json).

Un paquete es `{"id":"derechos-base","nombre":"BDNS","url":"https://…/datos.zip","sha256":"64 caracteres hexadecimales","pendiente":false}`. Mientras no se prepare, `pendiente:true`, URL `example.invalid` y SHA `PENDIENTE`. `tramitar` deja esos paquetes pendientes visibles; `datos <id>` los rechaza. En pruebas locales se aceptan URLs `file:`; en GitHub solo HTTPS. Se guardan como archivos, **sin extraer ZIPs ni ejecutar contenido**.

La ficha tiene `nombre`, `frase`, `icono`, `herramienta`, `equipo`, `url`, `fuentes:[{nombre,url}]` y `datos:"reales"|"simulados"`. «Reales» significa datos públicos, nunca personales. El centro puede usar [esquemas/ficha.schema.json](esquemas/ficha.schema.json). El esquema se genera desde `fichaSchema` con `bun run schema`; una prueba evita que diverjan. La existencia del slug se valida adicionalmente contra `tracks.json`.

### Etiquetas y permisos en GitHub

Crea las etiquetas **`ventanilla`**, **`aviso`**, **`tablon`** antes del evento. No se crean automáticamente. Los turnos son issues con un cuerpo JSON `{tipo:"cita",squad,herramienta,mesa,motivo,estado}`. El CLI ignora turnos con autor ajeno al squad y toma la mesa del registro. Estados: `espera`, `llamado`, `atendido`, `anulado`; los dos últimos cierran el issue. Las publicaciones tienen `{texto,herramienta}`; los avisos pueden escribirse como texto normal por un handle de `comite.json`. Avisos de otros autores se ignoran.

Esta primera implementación usa **ramas en el registro central**, `barbaritat/ficha-<squad>`, y Contents/PR API de GitHub. Los participantes necesitan permiso **Write** en ese repo para crear la rama, actualizar su ficha y etiquetar issues. No se crean forks automáticamente. Protege la rama principal: sin pushes directos, con revisión del comité; protege también los JSON de asignación y permisos mediante CODEOWNERS/revisión. El CLI valida identidad y asignación, pero **no sustituye los controles de GitHub** frente a alguien que escriba directamente con la API. Si el comité no quiere dar Write a squads, deberá decidir un flujo por forks o un bot antes del uso real.

El comité necesita Write para llamar/cerrar turnos de otros. Recomendación operativa: un despachador por negociado para no llamar simultáneamente al mismo issue; GitHub Issues no ofrece una transacción de cola entre dos terminales. Las operaciones locales se guardan bajo lock de directorio y escritura atómica. `.estado.json` conserva numeración/cola/recibos locales; no se sube a GitHub. Un lock huérfano exige comprobar que no queda otro proceso antes de retirarlo.

El número `RE-2026-22O-0042` usa el número de PR (GitHub) o el contador local compartido con issues. Actualizar un PR abierto conserva número. Un PR nuevo tras cerrar/integrar puede recibir otro. El hash corto permite detectar cambios en ficha/fecha/número; **no es una firma criptográfica ni un CSV oficial**. El justificante distingue `pendiente` (PR) de `integrado` (merge o escritura local). El tablón consulta los eventos públicos de cada repo de squad (caché de tres minutos mientras corre pantalla); GitHub puede retrasarlos.

### Qué revisa y qué no puede acreditar

`revisar` exige marcador, URL 2xx con timeout, ficha válida, fuentes HTTPS, ausencia de indicios personales y texto/componente del botón en código versionado. Analiza los **archivos actuales que Git tiene versionados**, incluidas altas con `git add`, sin recorrer historial. También analiza `ficha.json` aunque aún no esté versionada, porque se envía al registro. Detecta DNI/NIE con letra válida, IBAN ES con checksum, teléfonos españoles, emails salvo dominios de ejemplo, `.env` y prefijos de claves. Nunca imprime valores detectados. Los enlaces simbólicos sin analizar bloquean; no se siguen fuera del proyecto.

Es una heurística: puede producir falsos positivos y no extrae texto de imágenes/PDFs ni demuestra que la web renderiza el botón. Los binarios se señalan para revisión humana. Las fuentes no oficiales y comprobaciones de Sello, Claridad y ¿Cómo voto? son avisos, no bloqueos. Antes de integrar, el comité revisa contenido, fuentes y datos. Una revisión satisfactoria no prueba ausencia de toda información personal.

En GitHub la URL debe resolver a una red pública; cada redirección se comprueba y la petición tiene timeout. El backend local admite loopback para la demo. Citar GVA, BOE u otras fuentes oficiales no presenta ninguna URL de esas instituciones como propia del evento.

## Consumo local (extra)

`barbaritat consumo` lee contadores existentes de Claude Code y Codex, los filtra por directorio del proyecto (incluidos subdirectorios) y por la ventana de build, y muestra la contribución local al squad. No es el total de otras máquinas del equipo. No lee prompts para mostrarlos, no persiste historiales y no envía métricas; solo salen contadores agregados. El justificante añade «Tasa abonada: N tokens» cuando hay consumo atribuible.

Es una consulta puntual. Para lectura continua usa `observar` (alias oculto `watch`): sin `--servidor` mantiene todo local; con un servidor HTTP en loopback comparte los contadores de este proyecto durante el build. `--once` hace un único ciclo; `--intervalo 5` fija la cadencia; `p` pausa y `q` sale en TTY. También admite `--plain` y `--json` (un documento al terminar; progreso en stderr).

### Backend de pruebas en directo

```sh
bun src/index.ts --registro file:///ruta/registro servidor --puerto 4310 --db /tmp/barbaritat-uso.sqlite
bun src/index.ts --registro file:///ruta/registro --cwd /ruta/proyecto --usuario demo-alba observar --servidor http://127.0.0.1:4310
```

El backend local persiste en SQLite y deduplica cada evento por ventana, persona e ID: se puede reintentar o reiniciar sin sumar dos veces. El total incluye entrada, salida y caché, con desglose separado. Solo acepta miembros del registro, y el periodo es `[inicio, fin)`. Los IDs de eventos salen como hashes; no se envían conversaciones, rutas ni nombres de proyectos. El watcher vuelve a leer el historial retenido en cada ciclo y recupera envíos fallidos mientras esos archivos existan.

La identidad `--usuario` es de pruebas: no equivale a autenticar a una persona. El servidor escucha exclusivamente en `127.0.0.1` y el watcher solo admite destinos locales. **TODO producción:** elegir y provisionar infraestructura propia, autenticar usuarios, autorizar el squad en el servidor, acordar visibilidad/retención de métricas, HTTPS, límites y copias de seguridad. No se transporta consumo mediante GitHub ni se ha desplegado ningún servicio.

Rutas de lectura: `~/.claude/projects` (respeta `CLAUDE_CONFIG_DIR`) y `~/.codex/sessions` (respeta `CODEX_HOME`). Para un directorio de pruebas o una copia local usa `BARBARITAT_CLAUDE_DIR` y `BARBARITAT_CODEX_DIR`; esas variables no cambian ninguna configuración de los asistentes. Las líneas malformadas se ignoran; errores de lectura producen avisos de total parcial. Bloques repetidos de Claude y contadores acumulativos de Codex se deduplican; el razonamiento ya incluido en salida no se suma dos veces.

Cursor queda sin recolector: el origen necesitaba instalar hooks para obtener contadores. Se respeta la prohibición de modificar configuraciones del usuario. Tampoco se incorporan OTel ni otros proveedores. La compatibilidad se valida con fixtures de los formatos del commit fijado; formatos futuros pueden requerir adaptación.

## Marca y releases

Todos los colores están en [src/lib/estilo.ts](src/lib/estilo.ts). Los badges de track usan fondo propio y tinta clara/oscura de la misma paleta: el significado también lleva glifo, nombre y ventanilla. No hay banderas, escudos ni logos de terceros.

El único slot de logo es `assets/logo.png`, todavía ausente. Cuando llegue:

```sh
bun run embed-logo
bun run build:bin:host
```

El script aplana el PNG sobre blanco e incrusta una tarjeta para Kitty/Ghostty/WezTerm/iTerm2/VS Code. La prueba usa un PNG generado en un directorio temporal y no lo sube. Sin logo se muestra el wordmark (77 columnas); en terminal estrecho, marca pequeña.

`scripts/build-all.sh` compila macOS/Linux x64/arm64 y Windows x64; produce `dist/SHA256SUMS`. `--host` solo compila esta máquina. No publica. Las releases deben usar tags `cli-vX.Y.Z`, assets `barbaritat-<os>-<arch>[.exe]` y `SHA256SUMS`. Ajusta `package.json` y `src/version.ts` juntos antes de versionar.

## Pendiente para el evento

- Crear registro y repo de releases, decidir organización y permisos, proteger ramas.
- Conectar la plantilla real; la stub es únicamente de ensayo.
- Sustituir personas/squads/repos/enlaces ficticios por los del comité.
- Asignar track leads, activar o descartar Siguiente y adjudicar el cupo libre.
- Preparar los packs oficiales, sus hashes y contenido editorial; verificar los plazos de ¿Cómo voto? con sus fuentes.
- Recibir el PNG final y validar la marca con Rubén y Marcos.
- Ensayar en la terminal y proyector del venue; no se ha publicado ni probado contra un registro GitHub real.

## Créditos

Fork de la infraestructura de terminal de `apps/cli` de HackSpain/hackspain26, commit `2865d19`, MIT, © Asociación Exponential Fellowship; autor principal Samu (`samuelcorsan`). Adaptación para Barbaritat Valenciana por Luis González y colaboradores. Véanse [AVISO.md](AVISO.md) y [LICENSE](LICENSE). No se reutilizan marcas ni ilustraciones del origen.
