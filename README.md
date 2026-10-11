# BARRACAxSOTI - Hack night 🌙

Una noche para construir entre todos **una plataforma de atención ciudadana**: un centro único («¿qué necesitas?») y las herramientas que lo llenan, una por squad. El reto es la fricción del día a día con la administración: trámites opacos, ayudas que nadie encuentra, PDFs ilegibles y citas imposibles.

|               |                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------- |
| **Cuándo**    | Jueves 22 de octubre de 2026, de 17:00 a 23:00                                                     |
| **Dónde**     | MAISA, València                                                                                    |
| **Quién**     | Unos 50 builders en squads de 3 a 5 personas                                                       |
| **Organizan** | BARRACA × SOTI                                                                                     |
| **Formato**   | No hay premios: se gana si la plataforma funciona. Cada squad publica su pieza antes de las 22:00. |

Este repo tiene el **CLI de participantes** (`hacknight`), la **web del evento** (leaderboard, proyector y administración) y esta guía.

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

Cada track es una herramienta de la plataforma. Cada herramienta se divide en 2–3 piezas, una por squad.

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

El detalle de cada uno (piezas, datos y fuentes) está en el CLI: `hacknight tracks <track>`.

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

Los equipos se forman **antes** de la noche, con lo que contestas al inscribirte. En la sala solo se tapan huecos.

- Al inscribirte en Luma eliges tus tres tracks favoritos, dices qué se te da mejor y si vienes con equipo o solo.
- El comité arma los squads el **lunes 19/10** y los anuncia el **martes 20/10**, junto con el pre-read.
- Si te toca algo que no te motiva, puedes cambiar hasta el **miércoles 21/10**.
- ¿Vienes solo? Entras en un squad, o eliges una tarea del tablón de piezas sueltas.

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
bun install
bun run cli --registro "file://$PWD/shared/registro-base" tracks
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

La lista completa y la configuración están en [cli/README.md](cli/README.md).

## Qué hay aquí

| Carpeta                               | Contenido                                                                |
| ------------------------------------- | ------------------------------------------------------------------------ |
| [cli/](cli/)                          | `hacknight`, el CLI de participantes                                     |
| [web/](web/) · [server/](server/)     | La web del evento (leaderboard, proyector y administración) y su backend |
| [shared/](shared/)                    | Lo común: modelos, tracks, paleta y el nombre del evento                 |
| [test/](test/) · [scripts/](scripts/) | Pruebas de integración y el circuito completo con datos aislados         |
| [docs/](docs/)                        | Guías cortas para participantes y comité                                 |

El nombre del evento está en un solo sitio: [`shared/registro-base/evento.json`](shared/registro-base/evento.json).

## Para el comité y quien desarrolle

```sh
bun run start           # web y administración en http://127.0.0.1:4310
bun run check           # tipos, tests y formato
bun run test:browser    # regresiones de la web y del admin en Chromium
bun run build:bin:host  # binarios cli/dist/hacknight y server/dist/hacknight-server
```

Para ejecutar las pruebas de navegador, instala Chromium una vez con `bunx playwright install chromium`. Usan una instancia temporal y participantes ficticios; no consultan historiales personales. La configuración sigue las [opciones de Playwright](https://playwright.dev/docs/test-configuration).

GitHub Actions comprueba tipos, tests y formato en cada push y pull request. También ejecuta los circuitos `test:flujo` y `test:live`, las regresiones de navegador y los flujos con los binarios compilados. Chromium y sus dependencias se preparan según la [guía de CI de Playwright](https://playwright.dev/docs/ci-intro).

- **Montar el registro de la noche:** [cli/README.md](cli/README.md#montar-el-registro-guía-del-comité).
- **Servidor y administración:** [server/README.md](server/README.md).
- **Pendiente antes del 22/10:**
  - crear el repo del registro y el de releases;
  - conectar la plantilla real;
  - preparar los paquetes de datos;
  - asignar los track leads.

## Créditos

El CLI parte del [CLI de HackSpain](https://github.com/HackSpain/hackspain26) (MIT, © Asociación Exponential Fellowship), sin su marca. Los detalles están en [cli/AVISO.md](cli/AVISO.md).
