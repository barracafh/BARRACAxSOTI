# BARRACAxSOTI - Hack night 🌙

Una noche para construir entre todos **una plataforma de atención ciudadana**: un centro único («¿qué necesitas?») y las herramientas que lo llenan, una por squad. El reto es la fricción del día a día con la administración: trámites opacos, ayudas que nadie encuentra, PDFs ilegibles y citas imposibles.

|               |                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------- |
| **Cuándo**    | Jueves 22 de octubre de 2026, de 17:00 a 23:00                                                     |
| **Dónde**     | MAISA, València                                                                                    |
| **Quién**     | Unos 50 builders en squads de 3 a 5 personas                                                       |
| **Organizan** | BARRACA × SOTI                                                                                     |
| **Formato**   | No hay premios: se gana si la plataforma funciona. Cada squad publica su pieza antes de las 22:00. |

Este es el monorepo de la organización: CLI, web, tracks, plantilla e infra. **Cada squad construye en su propio repo**, creado desde la [plantilla común](plantilla/README.md) con `hacknight tramitar`.

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

Cada track es una herramienta de la plataforma. Cada herramienta se divide en 2–3 piezas, una por squad (el track libre tiene un único squad). **Pau valida la lista final el lunes 12/10**; este catálogo sigue pendiente de esa validación.

| Track           | Qué hace por ti                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Derechos        | Te dice a qué ayudas del Estado, la GVA o tu ayuntamiento puedes optar.            |
| Claridad        | Convierte un PDF o una notificación en una lista clara de qué hacer y para cuándo. |
| Sello + estafas | Comprueba si una web, un SMS o un correo viene de verdad de la administración.     |
| Brújula         | Le cuentas tu problema y te dice qué trámite es, los pasos y el enlace a la sede.  |
| ¿Cómo voto?     | Voto por correo, dónde votar y plazos de las generales del 29/11.                  |
| Radar           | Te avisa de los plazos que te afectan antes de que cierren. Si hay gente.          |
| Abierto         | Preguntas en lenguaje natural sobre contratos y presupuestos. Si hay gente.        |
| Track libre     | Una pieza nueva para el centro. Un solo squad, por orden de llegada.               |

Las [fichas técnicas y los paquetes por preparar](tracks/README.md) viven en `tracks/`. El detalle también está en el CLI: `hacknight tracks <track>`.

## Las reglas

Una herramienta entra en la plataforma si cumple las seis:

1. **Parte de la plantilla común.** Así trae el diseño y el componente de fuentes.
2. **Está publicada en una URL pública** antes de las 22:00.
3. **Tiene ficha:** nombre, una frase, icono, track, equipo, URL y fuentes.
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
- **Jue 22/10:** Hack night.

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

Comprueba que todo responde con `git --version`, `bun --version` y `gh auth status`. Trae también tu asistente de código de IA favorito, ya configurado.

## Prueba el CLI

```sh
git clone https://github.com/luisgonzaleznf/BARRACAxSOTI.git
cd BARRACAxSOTI
bun install --frozen-lockfile
bun run cli --registro "file://$PWD/packages/shared/registro-base" tracks
```

Ese registro local trae los tracks reales, sin equipos todavía. Para ver el recorrido completo de un squad con datos de prueba (ficha, revisión, registro, cita y pantalla), ejecuta `bun run test:flujo`.

Los trámites principales:

| Comando               | Para qué                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `hacknight`           | Tu expediente: squad, track, cuenta atrás y estado de las reglas             |
| `hacknight tracks`    | Los tracks y sus piezas                                                      |
| `hacknight tramitar`  | Arranca tu proyecto desde la plantilla, con la ficha y los datos de tu track |
| `hacknight revisar`   | Comprueba las seis reglas                                                    |
| `hacknight registrar` | Entrega tu ficha y te da el justificante de registro                         |
| `hacknight cita`      | Pide ayuda: te da un turno y el comité te llama a tu mesa                    |
| `hacknight tablon`    | Lo que está pasando en la sala                                               |

La lista completa y la configuración están en [apps/cli/README.md](apps/cli/README.md).

## Qué hay aquí

| Carpeta                                               | Contenido                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| [apps/cli/](apps/cli/)                                | `hacknight`, el CLI de participantes                                  |
| [apps/web/](apps/web/) · [apps/server/](apps/server/) | Web, proyector, administración y backend Bun/SQLite                   |
| [packages/shared/](packages/shared/)                  | Modelos, paleta, evento y registro base                               |
| [tracks/](tracks/README.md)                           | Fichas técnicas, catálogo y preparación de datos y guías              |
| [plantilla/](plantilla/README.md)                     | Punto de partida Next.js + Tailwind para el repo de cada squad        |
| [infra/](infra/README.md)                             | Registro, publicación de plantilla, claves de IA y opciones de deploy |
| [.github/workflows/](.github/workflows/)              | CI y releases del CLI                                                 |
| [test/](test/) · [scripts/](scripts/)                 | Pruebas aisladas y generación del catálogo                            |
| [docs/](docs/)                                        | Guías cortas para participantes y comité                              |

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
- **Servidor y administración:** [apps/server/README.md](apps/server/README.md); el proveedor sigue pendiente.
- **Editar un track:** cambia `tracks/<slug>/track.json` y ejecuta `bun run tracks:generar`.
- **Pendientes del comité:** validar tracks con Pau el 12/10 y asignar leads; preparar accesos y datos para el reparto del 19/10; cerrar revisión de guías antes del 20/10; elegir repos, formulario de avisos, presupuesto de IA y alojamiento. El diseño de Reforma Digital espera el OK de Samu.

El workspace se instala desde la raíz con `bun install --frozen-lockfile`. `plantilla/` es independiente: tiene su propio lockfile y se instala y compila desde su carpeta.

## Créditos

El CLI parte del [CLI de HackSpain](https://github.com/HackSpain/hackspain26) (MIT, © Asociación Exponential Fellowship), sin su marca. Los detalles están en [apps/cli/AVISO.md](apps/cli/AVISO.md).
