# Build night · guía de la organización

Cómo llevar la Build night del jueves 22 de octubre de 2026 en Flywire, de hoy al viernes 23. La guía de los participantes es [guia-participantes.md](guia-participantes.md); los mensajes listos para enviar están en [mensajes.md](mensajes.md). Cómo se formaron los equipos está en [equipos.md](equipos.md).

## Principios

- **La sala es pequeña: la ayuda va a la mesa.** Quien se atasca levanta la mano y se acerca el referente de su track o quien esté libre. No hay turnos ni colas.
- **Sin premio ni jurado.** No se puntúa nada. El ranking de tokens es un juego para la pantalla.
- **Todo se monta antes del jueves.** Repos, despliegues, claves e invitaciones quedan listos el lunes. El jueves nadie de la organización debería estar configurando nada.
- **Publicar pronto.** Insistid en el primer push a las 19:15: un squad que publica temprano llega a la demo; uno que publica a las 21:50, no.

## Roles

Una persona puede llevar más de un rol, salvo en las demos: quien presenta no lleva también la infra.

| Rol                    | Qué hace                                                                                                                                 | Quién |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **Presentación**       | Lleva la bienvenida, los tiempos y las demos. Avisa a las 20:15, 21:15, 21:45 y 22:00                                                    |       |
| **Referente de track** | Uno por track (el libre lo atiende quien esté libre). Se sabe el `SETUP.md`, recorre sus mesas, hace el repaso de las 20:15 y desbloquea |       |
| **Registro**           | Revisa y mergea en `barracafh/build-registro` las PR de las fichas en cuanto llegan, y publica los avisos                                |       |
| **Infra de guardia**   | Vercel, el hub, la sala, la clave de IA e invitaciones de GitHub. Tiene `.local-secrets/` y acceso al team de Vercel                     |       |
| **Puerta y sala**      | Check-in en Luma, wifi, regletas, mesas numeradas, cena y fichajes de 18:15                                                              |       |
| **Fotos**              | Fotos con el móvil durante la noche, respetando a quien no quiera salir                                                                  |       |

## Antes del jueves

### Domingo 18 (hoy)

- [ ] Cerrar el reparto: revisar la propuesta de `.reparto/` y exportar `equipos.json` con la herramienta de reparto ([PR #9](https://github.com/barracafh/BARRACAxSOTI/pull/9)). Cada squad lleva `id`, `nombre`, `herramienta`, `pieza`, `mesa` y `miembros`.
- [ ] Decidir el referente de cada track.
- [ ] Hacer público este repo, para que los participantes puedan revisar el CLI antes de instalarlo.

### Lunes 19

- [ ] **Crear repos, despliegues y hub.** Primero el plan, después aplicarlo con las claves cargadas:

  ```sh
  bun infra/equipos/preparar.ts --equipos /ruta/equipos.json --dry-run
  set -a; . ./.local-secrets/build-night.env; set +a
  bun infra/equipos/preparar.ts --equipos /ruta/equipos.json --apply
  ```

  Crea `barracafh/build-<id>` para cada squad, su proyecto de Vercel con las claves, el primer despliegue, las invitaciones al repo y al registro, y el hub de `build.barraca.house`. Si la clave de HelmCode aún no ha llegado, se puede repetir cuando llegue: lo que existe se salta y las variables se actualizan en el siguiente despliegue.

- [ ] **Subir `equipos.json` al registro** con una PR a `barracafh/build-registro`. Necesita la aprobación de alguien del comité. Hasta que se mergea, `hacknight` dice a cada participante que no tiene squad.
- [ ] Comprobar en `build.barraca.house` que salen todos los squads y que cada `/<id>` abre la plantilla.
- [ ] **Enviar el mensaje «Tu squad»** a cada squad (mensaje 1 de [mensajes.md](mensajes.md)).

### Martes 20

- [ ] **Enviar «Prepárate para el jueves»** a todos (mensaje 2).
- [ ] A las 17:00 cierra la confirmación de 48 horas. Liberar las plazas sin confirmar y avisar a la lista de espera en Luma.
- [ ] Cada persona que entra desde la lista de espera necesita squad e invitaciones: añadirla a `equipos.json`, repetir el script con `--equipo <id>` y actualizar el registro. Ojo: GitHub admite 50 invitaciones por repo cada 24 horas, y el registro ya gastó casi todas el lunes.

### Miércoles 21

- [ ] **Invitaciones pendientes.** Quien no las ha aceptado no puede hacer push ni registrar:

  ```sh
  gh api repos/barracafh/build-registro/invitations --jq '.[].invitee.login'
  gh api repos/barracafh/build-<id>/invitations --jq '.[].invitee.login'
  ```

  Escribir a cada persona pendiente (mensaje 3).

- [ ] **Ensayo general** con una cuenta de prueba en un squad de prueba: clonar, `bun run dev`, una respuesta de la IA en local y publicada, `hacknight observar` sumando en la sala y `hacknight registrar` abriendo su PR.
- [ ] Saldo de HelmCode y límite de gasto de Vercel revisados. Los builds bajo demanda se quedan apagados: si hay cola, se espera.
- [ ] Imprimir o preparar: lista de squads con su mesa, wifi en grande para la pantalla y carteles de mesa.

### Jueves 22, por la mañana

- [ ] **Enviar «Hoy es la Build night»** con la dirección (mensaje 4).
- [ ] Repasar bajas de última hora y preparar los fichajes de las 18:15.

## El jueves

### Montaje (desde las 15:30)

- [ ] Mesas numeradas igual que el campo `mesa` de `equipos.json`, con el nombre del squad y su URL.
- [ ] Una regleta por mesa.
- [ ] Wifi probado desde dos portátiles y con la clave visible.
- [ ] **Proyector:** `https://sala.build.barraca.house/pantalla` a pantalla completa en un portátil que no se toca en toda la noche.
- [ ] **Portátil de demos:** con `build.barraca.house` abierto, sesión de nada más y sonido apagado. Es el que se conecta para las demos.
- [ ] La infra de guardia con el panel de Vercel, la sala y el registro abiertos.

### Minuto a minuto

| Hora            | Qué pasa                    | Qué hace la organización                                                                                                                                 |
| --------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **17:00–17:30** | Check-in                    | Check-in en Luma, wifi y mesa. Quien no tenga el repo arrancado, a su mesa a terminar de instalar                                                        |
| **17:30–18:15** | Bienvenida, reglas y tracks | [Guion de la bienvenida](#guion-de-la-bienvenida)                                                                                                        |
| **18:15–18:30** | Fichajes                    | Completar squads con quien ha venido sin equipo. Un squad con menos de 3 se fusiona con el otro de su track. Desde las 18:30 no hay cambios              |
| **18:30**       | Empieza el build            | Los referentes pasan por sus mesas: repo arrancado y `hacknight observar` abierto                                                                        |
| **19:15**       | Primer push                 | Aviso: «todos los squads deberían verse ya en `build.barraca.house`». La infra revisa qué rutas siguen en la plantilla y los referentes van a esas mesas |
| **20:15**       | Repaso a mitad              | Cada referente pasa por sus squads (5 minutos cada uno): qué demo van a enseñar, qué funciona ya, qué se corta                                           |
| **20:30**       | Cena                        | Se come en la mesa; el build no se para                                                                                                                  |
| **21:15**       | Se congela el alcance       | Aviso: «lo que no esté, al README como qué falta para producción»                                                                                        |
| **21:45**       | Registro abierto            | Aviso: «`hacknight revisar` y `hacknight registrar`». El registro mergea las PR según llegan                                                             |
| **22:00**       | Cierra el registro          | El CLI deja de aceptar entregas. Se cierran portátiles                                                                                                   |
| **22:00–22:40** | Demos                       | [Cómo van las demos](#las-demos)                                                                                                                         |
| **22:40–23:00** | Cierre                      | Gracias, qué pasa con lo construido y foto de grupo                                                                                                      |

### Guion de la bienvenida

Cuarenta y cinco minutos, con la pantalla de la sala proyectada.

1. **Por qué estamos aquí (5 min).** Una plataforma de atención ciudadana construida por toda la sala en una noche. Cada squad, una herramienta. Sin premio: sale bien si funciona.
2. **Cómo va la noche (5 min).** El horario, la cena a las 20:30, el cierre del registro a las 22:00 y las demos.
3. **Las seis reglas (5 min).** Fuentes en cada respuesta, nada de datos personales reales y el aviso de que no es un servicio oficial. Si la herramienta no está segura, lo dice y enlaza la sede.
4. **Los tracks (15 min).** Cada referente, dos o tres minutos: el reto, la demo que esperamos y la trampa más habitual de su `SETUP.md`.
5. **Cómo se trabaja (10 min).** Push a `main` publica solo; primer push a las 19:15; `hacknight revisar` y `registrar`; `observar` para el ranking; la ayuda se pide levantando la mano; los avisos salen en esta pantalla.
6. **Preguntas y fichajes (5 min).**

### Avisos

Los avisos salen en la pantalla de la sala y en `hacknight tablon`. Los publica cualquier persona del comité (los handles de `comite.json` del registro) con un issue con la etiqueta `aviso`:

```sh
gh issue create -R barracafh/build-registro --label aviso \
  --title "Primer push" --body "Todos los squads deberían verse ya en build.barraca.house."
```

La pantalla se actualiza cada medio minuto. Un aviso de otra cuenta no se muestra.

### El registro de fichas

`hacknight registrar` abre una PR en `barracafh/build-registro` con la ficha del squad. Quien lleva el registro la revisa en un minuto y la mergea:

- la URL abre la herramienta en `build.barraca.house/<id>`;
- las fuentes son oficiales y llevan a páginas concretas;
- no hay datos personales en la ficha.

Una PR mergeada pasa de «pendiente» a «integrado» en la pantalla. Si alguien no puede registrar (no aceptó la invitación al registro, por ejemplo), lo hace otra persona de su squad.

### Las demos

- **Todas desde el portátil de demos**, abriendo `build.barraca.house/<id>`. Nadie conecta su portátil.
- Orden por track, para que los dos squads del mismo reto vayan seguidos.
- **Tres minutos como máximo**, con un cronómetro visible. Con unos diez squads son treinta minutos más los cambios.
- Una persona por squad cuenta el problema, enseña un caso en directo y dice qué falta.
- Si algo falla en directo, se enseña el README y se sigue. No se repite ninguna demo.

### Cierre

Gracias a Flywire, a SOTI y a los partners de la noche. Qué pasa con lo construido: los repos quedan en abierto con licencia MIT y la plataforma sigue publicada el tiempo que se decida. Foto de grupo.

## Si algo falla

| Problema                                 | Qué hacer                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Un push no se publica                    | Casi siempre es `bun run build` fallando: que lo ejecuten en local. Si hay cola en Vercel, se espera; los builds bajo demanda solo se activan si la cola se alarga mucho |
| La IA no responde                        | Saldo y estado de HelmCode. Si se cae para todos, aviso en pantalla y que sigan con respuestas simuladas para la demo                                                    |
| Alguien no puede hacer push              | No aceptó la invitación al repo de su squad. Si caducó, repetir el script con `--equipo <id>`                                                                            |
| `hacknight` dice que no tienes squad     | Su usuario no está en `equipos.json` del registro o lo escribió distinto en Luma. Corregirlo con una PR al registro                                                      |
| `hacknight registrar` falla con permiso  | No aceptó la invitación al registro: que registre otra persona del squad                                                                                                 |
| Se cae el wifi                           | Compartir datos desde un móvil para la infra y la pantalla; los squads pueden seguir en local y subir después                                                            |
| Un squad usa datos personales reales     | Se quitan antes de publicar. Es una de las seis reglas y `hacknight revisar` lo detecta en parte, no del todo                                                            |
| Un squad se queda con una o dos personas | Se fusiona con el otro squad de su track, o se une a otro squad con una pieza pequeña                                                                                    |
| GitHub se cae                            | Se sigue en local. Las demos se hacen desde `localhost` en el portátil del squad, como excepción                                                                         |

## Después

### Viernes 23

- [ ] Enviar «Gracias» con el enlace a la plataforma y a los repos (mensaje 5).
- [ ] Mergear las PR de fichas que hayan quedado abiertas.
- [ ] Revisar el gasto de Vercel y HelmCode.

### La semana siguiente

- [ ] Decidir cuánto tiempo siguen activas la plataforma y la clave de IA, avisarlo y revocar la clave en esa fecha.
- [ ] Retro del comité: qué repetir y qué quitar para la siguiente.

## Decisiones pendientes

Afectan a lo que se envía estos días. Esta guía y los mensajes asumen la opción indicada; si se decide otra, hay que cambiarlos.

| Decisión                                                         | Se asume                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Clave de HelmCode: una o una por squad, modelo, URL base y saldo | Una para todos, enviada en el mensaje de cada squad                       |
| Canal de cada squad                                              | Un grupo de WhatsApp por squad que abre la organización, con su referente |
| Referente de cada track                                          | Pendiente de nombres                                                      |
| Idea del track libre                                             | Neutral respecto al track electoral                                       |
| Cuándo se envía la dirección                                     | El jueves por la mañana; antes, solo «Flywire, València»                  |
| Demos                                                            | Desde el portátil de la organización, tres minutos como máximo            |
| Alergias e intolerancias                                         | Se preguntan en el mensaje del martes                                     |
