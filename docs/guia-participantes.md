# Build night · guía para participantes

Jueves 22 de octubre de 2026 en Flywire, València. Unas 50 personas en squads de 3 a 5 construyen entre todos **una plataforma de atención ciudadana**: cada squad hace una herramienta y todas acaban publicadas en [build.barraca.house](https://build.barraca.house). No hay premio ni jurado. La noche sale bien si al final la plataforma funciona.

Esta guía es todo lo que necesitas: qué hacer antes del jueves, cómo se trabaja en la sala y cómo se entrega.

## Resumen

1. **Antes del jueves:** confirma tu plaza, acepta las dos invitaciones de GitHub, instala las herramientas y arranca el repo de tu squad en tu portátil.
2. **El jueves:** llega a las 17:00. Se construye de 18:30 a 22:00.
3. **Publica pronto.** Cada push a `main` sale solo en `build.barraca.house/<vuestro-equipo>`.
4. **Entrega antes de las 22:00** con `hacknight registrar`. Después, cada squad hace una demo de 2 a 3 minutos.

## Antes del jueves

Cuando el lunes 19 recibas el mensaje de tu squad, haz esto en orden. Calcula una hora.

- [ ] **Confirma tu plaza en Luma** antes del martes 20 a las 17:00. Si no puedes venir, libérala: hay lista de espera.
- [ ] **Acepta las dos invitaciones de GitHub.** Llegan al correo de tu cuenta y también están en [github.com/notifications](https://github.com/notifications):
  - el repo de tu squad, `barracafh/build-<equipo>`, donde vais a construir;
  - el registro del evento, `barracafh/build-registro`, donde se entrega la ficha.
- [ ] **Instala las herramientas** ([ver abajo](#instalar-las-herramientas)).
- [ ] **Clona el repo de tu squad y arráncalo** ([ver abajo](#vuestro-repo)). Si ves la página en `http://localhost:3000/<equipo>`, estás listo.
- [ ] **Instala el CLI del evento y ejecuta `hacknight`.** Debe enseñarte tu squad, tu track y tu mesa. Si dice que no tienes squad, avísanos.
- [ ] **Lee el `SETUP.md` de vuestro repo:** el reto, la demo que se espera, los datos y los riesgos. El `contexto.md` es largo; no hace falta leerlo entero, buscad en él (o pedídselo a vuestro asistente de IA).
- [ ] **Hablad como squad** en vuestro canal y llegad con un plan:
  - qué flujo vais a enseñar en la demo, en una frase;
  - quién hace qué (interfaz, IA y datos, fuentes y contenido, despliegue);
  - tres a cinco casos de prueba ficticios, como los perfiles del `SETUP.md`.

No hace falta llegar con código escrito: con el plan claro, la tarde da para mucho.

## Instalar las herramientas

Necesitas **Git**, **Node 22 o superior**, **Bun**, la **CLI de GitHub** (`gh`) con tu sesión iniciada y tu **asistente de código de IA**, ya configurado.

macOS:

```sh
brew install git node gh
curl -fsSL https://bun.sh/install | bash
gh auth login
```

Linux: instala Git, Node 22 y [gh](https://cli.github.com) con tu gestor de paquetes, y después:

```sh
curl -fsSL https://bun.sh/install | bash
gh auth login
```

Windows (PowerShell):

```powershell
winget install --id Git.Git
winget install --id OpenJS.NodeJS.LTS
winget install --id GitHub.cli
powershell -c "irm bun.sh/install.ps1 | iex"
gh auth login
```

Abre una terminal nueva y comprueba que todo responde:

```sh
git --version && node --version && bun --version && gh auth status
```

**El asistente de IA es cosa tuya:** Claude Code, Codex, Cursor o el que uses, ya instalado y con tu cuenta. La IA que usa vuestra herramienta (la que responde al ciudadano) la pone la organización: no necesitas pagar nada para eso.

## Vuestro repo

Cada squad tiene un repo público en GitHub creado desde la plantilla común. Ya trae la ficha de vuestra herramienta, los datos de vuestro track y la conexión con su despliegue.

```sh
gh repo clone barracafh/build-<equipo>
cd build-<equipo>
bun install --frozen-lockfile
bun run dev
```

Abre `http://localhost:3000/<equipo>`. Qué hay dentro:

| Archivo                   | Para qué                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `SETUP.md`                | El reto de vuestro track, la demo esperada, los datos y lo que hay que tener en cuenta |
| `contexto.md`             | Marco de conocimiento verificado del track. Largo: buscad en él                        |
| `datos/`                  | Datos preparados por la organización. No los editéis; los vuestros, en `src/datos/`    |
| `ficha.json`              | Lo que se ve de vuestra herramienta en la plataforma. No cambiéis `equipo`             |
| `src/app/page.tsx`        | La página de ejemplo. Empezad por aquí                                                 |
| `src/lib/ia.ts`           | La llamada a la IA, solo desde el servidor. Ejemplo en `src/app/api/ia/route.ts`       |
| `AGENTS.md` y `CLAUDE.md` | Las reglas y el contexto que lee vuestro asistente de IA                               |

**La clave de la IA** llega con el mensaje de vuestro squad. En local va en `.env.local`, que nunca se sube a GitHub:

```sh
HELMCODE_API_KEY=...
HELMCODE_MODEL=...
```

En la versión publicada ya está puesta: no hay que tocar Vercel. Sello usa además `SAFE_BROWSING_API_KEY` y ¿Cómo voto?, `FACTCHECK_API_KEY`; también llegan con el mensaje.

## El CLI del evento

`hacknight` revisa las seis reglas, entrega vuestra ficha y suma vuestros tokens al ranking de la sala. Su código está en [este repo](../apps/cli), por si quieres revisarlo antes de instalarlo.

macOS y Linux:

```sh
curl -fsSL https://build.barraca.house/instalar.sh | sh
```

El instalador descarga la última versión, comprueba su SHA256 y la deja en `~/.local/bin/hacknight`. Si `hacknight` no responde, añade ese directorio a tu `PATH`. En Windows, descarga `hacknight-windows-x64.exe` de la [última release](https://github.com/barracafh/build-registro/releases/latest).

| Comando                    | Qué hace                                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| `hacknight`                | Tu expediente: squad, track, mesa, cuenta atrás y estado de las seis reglas |
| `hacknight tracks [track]` | Los tracks, sus piezas y sus fuentes                                        |
| `hacknight ficha`          | Edita `ficha.json`. `hacknight ficha validar` solo la comprueba             |
| `hacknight revisar`        | Comprueba las seis reglas en vuestro proyecto                               |
| `hacknight registrar`      | Entrega la ficha al registro del evento                                     |
| `hacknight tablon`         | Avisos del comité, entregas y pushes de los squads                          |
| `hacknight observar`       | Déjalo abierto mientras construyes: suma vuestros tokens al ranking         |

Todos se ejecutan **desde la carpeta de vuestro repo**. `observar` cuenta los tokens de Claude Code, Codex y Pi usados en esa carpeta durante el build. A la sala solo envía tu usuario de GitHub y, por cada petición, la herramienta, la hora y los contadores de tokens: nada de lo que escribes, ni respuestas, ni rutas, ni código. La primera vez te pide confirmar tu cuenta en `github.com/login/device`; ese permiso no da acceso a nada. Puedes hacerlo antes del jueves con `hacknight observar --once`.

## Las seis reglas

Una herramienta entra en la plataforma si cumple las seis. `hacknight revisar` las comprueba.

1. **Parte de la plantilla común.** Conservad `.hacknight/plantilla.json`.
2. **Está publicada en una URL pública** antes de las 22:00: `https://build.barraca.house/<equipo>`.
3. **Tiene ficha** válida en `ficha.json`.
4. **Cita sus fuentes.** Cada respuesta enlaza, con `<Fuentes />`, a la página oficial concreta que la sostiene.
5. **No usa datos personales reales.** Ni DNI, ni expedientes, ni contraseñas, ni tus propios datos. Se simulan.
6. **Lleva el aviso «Herramienta experimental. No es un servicio oficial.» y el botón «¿Algo está mal? Avísanos».**

Y dos más que no comprueba ninguna máquina: si la herramienta no está segura, dice que no puede confirmarlo y enlaza la sede oficial; y no guarda lo que escribe el ciudadano.

## La noche

| Hora        | Qué pasa                                                                |
| ----------- | ----------------------------------------------------------------------- |
| 17:00–17:30 | Check-in: acreditación, wifi y tu portátil listo                        |
| 17:30–18:15 | Bienvenida, reglas y presentación de los tracks                         |
| 18:15–18:30 | Fichajes: solo para cubrir los huecos de quien no ha venido             |
| 18:30–22:00 | **Build**                                                               |
| 22:00–22:40 | Demos: cada squad enseña su herramienta, ya publicada, en 2 o 3 minutos |
| 22:40–23:00 | Cierre                                                                  |

Trae portátil, cargador y, si tienes, una regleta. Hay cena y bebida. En la sala se habla castellano.

### Cómo avanzar

Tres horas y media pasan rápido. Este es el ritmo que funciona:

| Cuándo    | Objetivo                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **18:30** | Repo arrancado en todos los portátiles, `hacknight observar` abierto y el plan repasado en cinco minutos                    |
| **19:15** | **Primer push a `main`**, aunque sea la plantilla con vuestro título. Comprobad que se ve en `build.barraca.house/<equipo>` |
| **20:15** | Repaso a mitad con el referente de vuestro track: el flujo principal ya funciona de punta a punta, aunque sea feo           |
| **21:15** | Se congela el alcance. Lo que no esté, va al README como «qué falta para producción»                                        |
| **21:30** | `hacknight revisar` en verde, README con media página (problema, usuario, qué hace, qué falta) y la demo ensayada           |
| **21:45** | `hacknight registrar`. Se puede repetir hasta las 22:00 para actualizar la ficha                                            |
| **22:00** | Cierra el registro. Se acabó el código                                                                                      |

### Cómo trabajar en el squad

- **Trabajad sobre `main`**, con `git pull --rebase` antes de cada push. Las ramas no tienen vista previa que podáis abrir.
- **Commits pequeños y push a menudo.** Cada push publica en unos minutos. Si `bun run build` falla en local, tampoco se publica: compruébalo antes de subir.
- **Repartid por capas que no se pisen:** una persona en la interfaz, otra en la ruta de IA y los datos, otra en fuentes, textos y casos de prueba. Juntaos cada hora para integrar.
- **Una demo que funciona vale más que tres a medias.** Elegid un solo recorrido del ciudadano y hacedlo bien.
- **La IA se llama solo desde el servidor:** rutas de `src/app/api/` o Server Actions. Ninguna clave en el navegador ni en variables `NEXT_PUBLIC_*`.
- **Si hay dos squads en vuestro track**, tenéis el mismo reto. Hablad entre vosotros: compartir hallazgos sobre los datos ahorra tiempo a los dos.

### Si te atascas

**Levanta la mano.** La sala es pequeña: el referente de tu track o alguien de la organización se acerca. Los avisos generales salen en la pantalla de la sala y en `hacknight tablon`.

## Entrega y demo

1. Pon en `ficha.json` la URL pública, `https://build.barraca.house/<equipo>`, y las fuentes que habéis usado.
2. `git add .` y `hacknight revisar`. Tiene que salir en verde.
3. `hacknight registrar`. Te devuelve un justificante con número de registro. Lo puede hacer cualquier persona del squad.

**La demo dura 2 o 3 minutos** y se hace desde la plataforma, en el portátil de la organización, para no perder tiempo cambiando de pantalla. Prepara:

- el problema en una frase, con una persona concreta («Lucía tiene 24 años, está en paro y vive de alquiler»);
- la herramienta resolviendo ese caso, en directo;
- qué falta para que sirva de verdad.

Que lo cuente una sola persona y que el caso de prueba esté copiado y listo para pegar.

## Después

Vuestro repo sigue siendo vuestro y queda en abierto, con licencia MIT, para quien quiera continuarlo. Os avisaremos de cuánto tiempo siguen activas la plataforma y la clave de IA del evento.

## Preguntas frecuentes

**¿Puedo cambiar de squad?** Hasta el domingo 18, sí. Desde el lunes los equipos están cerrados; en la sala solo se cubren huecos, de 18:15 a 18:30.

**No me ha llegado la invitación de GitHub.** Revisa [github.com/notifications](https://github.com/notifications) y que el usuario que diste en Luma es el tuyo. Si no está, escríbenos: GitHub limita las invitaciones y conviene resolverlo antes del jueves.

**Uso Windows.** Todo funciona en Windows. Si algo se resiste, WSL es la vía más segura.

**No tengo asistente de IA de pago.** Se puede construir sin él, y en el squad seguro que hay alguien con uno. Solo los tokens de Claude Code, Codex y Pi suman al ranking, que es un juego y no cuenta para nada.

**No programo.** Hay trabajo de verdad: encontrar y comprobar las fuentes oficiales (es una de las seis reglas), escribir los textos, diseñar el recorrido y probar la herramienta con casos ficticios.

**¿Puedo traer código hecho?** Traed el plan, no el producto: la gracia es construirlo en la sala. Las librerías y los componentes abiertos, por supuesto, sí.
