# BARRACA x SOTI · BUILD NIGHT

Una noche para construir entre todos **una plataforma de atención ciudadana**: un centro único («¿qué necesitas?») y las herramientas que lo llenan, una por squad. El reto es la fricción del día a día con la administración: trámites opacos, ayudas que nadie encuentra, PDFs ilegibles y citas imposibles.

|               |                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------- |
| **Cuándo**    | Jueves 22 de octubre de 2026, de 17:00 a 23:00                                                     |
| **Dónde**     | Flywire, València                                                                                  |
| **Quién**     | Unos 50 builders en squads de 3 a 5 personas                                                       |
| **Organizan** | BARRACA x SOTI                                                                                     |
| **Formato**   | No hay premios: se gana si la plataforma funciona. Cada squad publica su pieza antes de las 22:00. |

**¿Participas?** Empieza por la [guía de participantes](docs/guia-participantes.md). La organización tiene la suya en [docs/guia-organizacion.md](docs/guia-organizacion.md), con los [mensajes](docs/mensajes.md) de estos días.

Este es el monorepo de la organización: CLI, web, tracks, plantilla e infra. **Cada squad construye en su propio repo**, que la organización crea desde la [plantilla común](plantilla/README.md) con [infra/equipos](infra/equipos/README.md).

## La noche

Horario provisional:

| Hora        | Qué                                                                              |
| ----------- | -------------------------------------------------------------------------------- |
| 17:00–17:30 | Check-in: acreditación, wifi y tu portátil listo (ver abajo)                     |
| 17:30–18:15 | Bienvenida, reglas y presentación de los tracks                                  |
| 18:15–18:30 | Fichajes: solo para cubrir los huecos de quien no ha venido                      |
| 18:30–22:00 | **Build.** Hay un check a mitad, sobre las 20:15, y algo de cena hacia las 20:30 |
| 22:00–22:40 | Integración en el centro y demos de 2–3 minutos por squad                        |
| 22:40–23:00 | Cierre                                                                           |

## Los tracks

Cada track es una herramienta de la plataforma. Son los seis publicados: hasta dos squads por track con el mismo reto, y uno solo en el track libre.

| Track           | Qué hace por ti                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Derechos        | Te dice a qué ayudas del Estado, la GVA o tu ayuntamiento puedes optar.            |
| Claridad        | Convierte un PDF o una notificación en una lista clara de qué hacer y para cuándo. |
| Sello + estafas | Comprueba si una web, un SMS o un correo viene de verdad de la administración.     |
| Brújula         | Le cuentas tu problema y te dice qué trámite es, los pasos y el enlace a la sede.  |
| ¿Cómo voto?     | Voto por correo, dónde votar y plazos de las generales del 29/11.                  |
| Track libre     | Una pieza nueva para el centro. Un solo squad, por orden de llegada.               |

Las [fichas técnicas y los paquetes por preparar](tracks/README.md) viven en `tracks/`. El detalle también está en el CLI: `hacknight tracks <track>`.

## Las reglas

Una herramienta entra en la plataforma si cumple las seis:

1. **Parte de la plantilla común.** Así trae el diseño y el componente de fuentes.
2. **Está publicada en una URL pública** antes de las 22:00.
3. **Tiene ficha:** nombre, una frase, icono, herramienta (el slug de su track), equipo, URL, fuentes y datos (`reales` o `simulados`).
4. **Cita sus fuentes.** Cada respuesta enlaza a la web oficial o al dato del que sale.
5. **No usa datos personales reales.** Nada de DNI, expedientes ni contraseñas: se simulan.
6. **Lleva el botón «¿Algo está mal? Avísanos».**

`hacknight revisar` comprueba las seis antes de registrar.

## Cómo se forman los equipos

Los equipos se forman **antes** de la noche. En la sala solo se tapan huecos. Plan de Íñigo del 11/10:

- **Mar 13/10:** se abre Luma con un formulario abierto; pásaselo a tus amigos y formad equipo.
- **Vie 16/10:** el comité forma los equipos que falten y manda el contexto largo de los tracks.
- **Dom 18/10:** fecha límite para formar equipo.
- **Lun 19/10:** cierre de equipos y reparto por track; cada equipo recibe su paquete de accesos y los datos de su track.
- **Jue 22/10:** Build night.

¿Vienes solo? Entras en un squad, o eliges una tarea del tablón de piezas sueltas. Los perfiles no técnicos también tienen trabajo: fuentes, contenido, diseño y pruebas.

Más detalle en [docs/equipos.md](docs/equipos.md).

## Prepara tu portátil

Hace falta **Git**, **Bun** y la **CLI de GitHub** (`gh`) con tu sesión iniciada.

macOS y Linux:

```sh
curl -fsSL https://bun.sh/install | bash   # Bun
brew install gh                             # GitHub CLI (en Linux: https://cli.github.com)
gh auth login                               # inicia sesión en GitHub
```

Windows (PowerShell):

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
winget install --id GitHub.cli
gh auth login
```

El instalador deja Bun en `~/.bun/bin` y lo añade al PATH de tu shell: si `bun` no responde, abre una terminal nueva. En macOS también vale `brew install oven-sh/bun/bun`. Más opciones en [bun.sh/docs/installation](https://bun.sh/docs/installation).

Comprueba que todo responde con `git --version`, `bun --version` y `gh auth status`. Trae también tu asistente de código de IA favorito, ya configurado.

## Prueba el CLI

```sh
git clone https://github.com/barracafh/BARRACAxSOTI.git
cd BARRACAxSOTI
bun install --frozen-lockfile
bun run cli --registro "file://$PWD/packages/shared/registro-base" tracks
```

Ese registro local trae los tracks reales, sin equipos todavía. Para ver el recorrido completo de un squad con datos de prueba (ficha, revisión y registro), ejecuta `bun run test:flujo`.

Los trámites principales:

| Comando               | Para qué                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `hacknight`           | Tu expediente: squad, track, cuenta atrás y estado de las reglas |
| `hacknight tracks`    | Los tracks y sus piezas                                          |
| `hacknight revisar`   | Comprueba las seis reglas                                        |
| `hacknight registrar` | Entrega tu ficha y te da el justificante de registro             |
| `hacknight tablon`    | Lo que está pasando en la sala                                   |

La lista completa y la configuración están en [apps/cli/README.md](apps/cli/README.md).

## Qué hay aquí

| Carpeta                                               | Contenido                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| [apps/cli/](apps/cli/)                                | `hacknight`, el CLI de participantes                              |
| [apps/web/](apps/web/) · [apps/server/](apps/server/) | Web, proyector, administración y backend Bun/SQLite               |
| [packages/shared/](packages/shared/)                  | Modelos, paleta, evento y registro base                           |
| [tracks/](tracks/README.md)                           | Fichas técnicas, catálogo y preparación de datos y guías          |
| [tracks/comun/](tracks/comun/README.md)               | Marco de conocimiento común; cada track tiene su `contexto.md`    |
| [tracks/index.html](tracks/index.html)                | Índice visual de las infografías del marco de conocimiento        |
| [plantilla/](plantilla/README.md)                     | Punto de partida Next.js + Tailwind para el repo de cada squad    |
| [infra/](infra/README.md)                             | Registro, repos de equipo, hub y web del evento en Vercel         |
| [.github/workflows/](.github/workflows/)              | CI y releases del CLI                                             |
| [test/](test/) · [e2e/](e2e/)                         | Pruebas aisladas y regresiones de navegador con Playwright        |
| [scripts/](scripts/)                                  | Catálogo de tracks, índice de infografías, `test:live` y releases |
| [docs/](docs/)                                        | Guías cortas para participantes y comité                          |

El nombre del evento está en un solo sitio: [`packages/shared/registro-base/evento.json`](packages/shared/registro-base/evento.json).

## Para el comité y quien desarrolle

```sh
bun run start           # web y administración en http://127.0.0.1:4310
bun run check           # tipos, tests y formato
bun run test:browser    # regresiones de la web y del admin en Chromium
bun run build:bin:host  # binarios apps/cli/dist/hacknight y apps/server/dist/hacknight-server
```

Para ejecutar las pruebas de navegador, instala Chromium una vez con `bunx playwright install chromium`. Usan una instancia temporal y participantes ficticios; no consultan historiales personales.

GitHub Actions comprueba tipos, tests y formato en cada push y pull request, ejecuta los circuitos `test:flujo` y `test:live`, las regresiones de navegador y los flujos con los binarios compilados, y compila la plantilla.

- **Registro y plantilla remotos:** planes en [infra/](infra/README.md), con `--dry-run` por defecto.
- **Servidor y administración:** [apps/server/README.md](apps/server/README.md) en local; en el evento, la web se publica en Vercel con [infra/sala/](infra/sala/README.md).
- **Editar un track:** cambia `tracks/<slug>/track.json` y ejecuta `bun run tracks:generar`.
- **Editar el marco de conocimiento:** si cambias `tracks/comun/*.md` o un `contexto.md`, actualiza en el mismo commit su infografía (el `.html` con el mismo nombre) y `tracks/index.html` si cambia el resumen; después, `bun run infografia:indice`.
- **Pendientes del comité:** asignar leads; cerrar el reparto del 19/10 y lanzar `infra/equipos`; revisar las guías antes del 20/10. El diseño de Reforma Digital espera el OK de Samu.

El workspace se instala desde la raíz con `bun install --frozen-lockfile`. `plantilla/` es independiente: tiene su propio lockfile y se instala y compila desde su carpeta.

### Trabajar con agentes de código

Empieza por [AGENTS.md](AGENTS.md): recoge los límites del workspace y las comprobaciones según el cambio. Para reproducir CI, usa **Bun 1.3.11 y Node.js 22**, además de Git. Para instalar esa versión exacta de Bun: `curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.11"` (macOS y Linux) o `iex "& {$(irm https://bun.sh/install.ps1)} -Version 1.3.11"` (PowerShell). **GitHub es necesario para colaborar**: necesitas cuenta, acceso al repo y `gh auth login`; allí gestionamos código, PRs, CI y releases. Los tests locales usan datos ficticios y no necesitan claves de proveedores de IA.

**No hace falta ningún MCP.** Un agente con acceso a archivos y terminal puede arrancar el servidor y ejecutar los comandos anteriores. Para cambios de integración, ejecuta también `bun run test:flujo` y `bun run test:live`.

Integraciones opcionales, configuradas en el agente:

- **Navegador:** usa el navegador integrado de tu agente o [Playwright MCP](https://github.com/microsoft/playwright-mcp) para explorar la web y depurar interacciones. `bun run test:browser` ejecuta las regresiones sin MCP.
- **GitHub:** [GitHub MCP](https://github.com/github/github-mcp-server) permite gestionar issues y PRs si prefieres esa integración; `gh` ya cubre el flujo de este repo.

## Créditos

El CLI parte del [CLI de HackSpain](https://github.com/HackSpain/hackspain26) (MIT, © Asociación Exponential Fellowship), sin su marca. Los detalles están en [apps/cli/AVISO.md](apps/cli/AVISO.md).
