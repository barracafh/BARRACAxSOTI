# Build night · mensajes a participantes

Textos para enviar del lunes 19 al viernes 23. Lo que va entre `{llaves}` se rellena antes de enviar. El calendario y quién envía cada uno están en [guia-organizacion.md](guia-organizacion.md).

| Mensaje                     | Cuándo                   | A quién                                        | Por dónde                       |
| --------------------------- | ------------------------ | ---------------------------------------------- | ------------------------------- |
| 1. Tu squad                 | Lunes 19, tras el script | Cada squad, con sus miembros en «Para»         | Correo desde hola@barraca.house |
| 2. Prepárate para el jueves | Martes 20, por la mañana | Todas las personas aprobadas                   | Luma                            |
| 3. Recordatorio personal    | Miércoles 21             | Quien no ha aceptado invitaciones o confirmado | Correo o WhatsApp, uno a uno    |
| 4. Hoy es la Build night    | Jueves 22, por la mañana | Todas las personas confirmadas                 | Luma                            |
| 5. Gracias                  | Viernes 23               | Quien vino                                     | Luma                            |

La guía de participantes se enlaza como `https://github.com/barracafh/BARRACAxSOTI/blob/main/docs/guia-participantes.md`. Funciona cuando el repo sea público.

## 1. Tu squad · lunes 19

**Asunto:** Tu squad para la Build night: {nombre del squad}

¡Hola, {nombre del squad}!

Ya tenéis squad y reto para el jueves:

- **Track:** {track}. {Una frase del reto, del SETUP.md}
- **Squad:** {nombres}
- **Mesa:** {mesa}
- **Repo:** https://github.com/barracafh/build-{id}
- **Vuestra herramienta, publicada:** https://build.barraca.house/{id}
- **Referente del track:** {nombre}, que os acompaña el jueves
- **Canal del squad:** {enlace}

Tres cosas para hoy o mañana:

1. **Aceptad las dos invitaciones de GitHub** que os han llegado: la del repo del squad y la del registro del evento (`barracafh/build-registro`). Sin la primera no podéis subir código; sin la segunda no podéis entregar la ficha.
2. **Entrad en el canal** y presentaos.
3. **Leed el `SETUP.md` del repo:** el reto, la demo que esperamos y los datos que os hemos preparado.

Para la IA de vuestra herramienta, esta es la clave. Va en `.env.local` y nunca se sube al repo:

```
HELMCODE_API_KEY={clave}
HELMCODE_MODEL={modelo}
```

Todo lo demás (qué instalar, cómo arrancar el repo, cómo se entrega) está en la guía: {enlace a la guía de participantes}

Si alguien del squad no puede venir, contestad a este correo cuanto antes: hay gente en lista de espera.

¡Nos vemos el jueves!
BARRACA x SOTI

## 2. Prepárate para el jueves · martes 20

**Asunto:** Lo que hay que dejar listo antes del jueves

¡Ya queda poco!

El jueves queremos dedicar cada minuto a construir, así que os pedimos una hora antes de venir. Está todo en la guía ({enlace a la guía de participantes}); en resumen:

- **Confirma tu plaza en Luma hoy antes de las 17:00.** Si no puedes venir, libérala: alguien de la lista de espera la está esperando.
- **Acepta las dos invitaciones de GitHub:** el repo de tu squad y `barracafh/build-registro`.
- **Instala** Git, Node 22, Bun y la CLI de GitHub (`gh auth login`), y ten tu asistente de IA configurado.
- **Arranca el repo de tu squad** en tu portátil (`bun install` y `bun run dev`) y comprueba que se abre.
- **Instala el CLI del evento** y ejecuta `hacknight`: tiene que enseñarte tu squad y tu track.
- **Llegad con un plan:** qué vais a enseñar en la demo, quién hace qué y unos cuantos casos de prueba ficticios.

El jueves abrimos a las 17:00 en Flywire, València; la dirección te llega esa mañana. Se construye de 18:30 a 22:00 y cada squad enseña su herramienta en dos o tres minutos. Trae portátil, cargador y, si tienes, una regleta.

Habrá cena. **Si tienes alguna alergia o intolerancia, contesta a este mensaje.**

¿Dudas? Escríbenos a hola@barraca.house.

## 3. Recordatorio personal · miércoles 21

Uno a uno, solo a quien le falta algo. Quita la línea que no aplique.

> ¡Hola, {nombre}! Para el jueves te falta {aceptar la invitación de GitHub al repo de tu squad / aceptar la invitación al registro del evento / confirmar tu plaza en Luma}. Las invitaciones están en github.com/notifications. Sin eso no podrás {subir código / entregar la ficha} y preferimos arreglarlo hoy y no en la sala. ¿Te ayudo con algo?

## 4. Hoy es la Build night · jueves 22

**Asunto:** Hoy es la Build night: nos vemos a las 17:00

¡Hoy es el día!

- **Dónde:** Flywire, {dirección y cómo entrar}
- **Cuándo:** abrimos a las 17:00. A las 17:30, bienvenida; a las 18:30 se empieza a construir.
- **Qué traer:** portátil, cargador y regleta si tienes. El repo de tu squad, arrancado.

Si al final no puedes venir, avísanos ahora contestando a este mensaje: a las 18:15 cubrimos los huecos con quien ha venido sin equipo.

Haremos fotos durante la noche. Si prefieres no salir, dínoslo en la puerta.

¡Hasta luego!

## 5. Gracias · viernes 23

Escríbelo después del evento, con lo que haya pasado de verdad.

**Asunto:** Gracias por lo de anoche

¡Gracias por venir!

Anoche {número} squads construyeron {número} herramientas para la misma plataforma. Están todas aquí: https://build.barraca.house

{Dos o tres frases reales: algo que salió especialmente bien, algo que nos sorprendió, algo que no salió como esperábamos.}

Vuestros repos quedan en abierto, con licencia MIT, para quien quiera continuarlos. {Cuánto tiempo sigue activa la plataforma y la clave de IA.}

Las fotos, en {enlace}.

Nos vemos en la siguiente.
BARRACA x SOTI

## Avisos de la noche

Para la pantalla de la sala, con `gh issue create -R barracafh/build-registro --label aviso --title "…" --body "…"`:

| Hora  | Título                | Texto                                                                                               |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------- |
| 18:30 | Empieza el build      | Repo arrancado y `hacknight observar` abierto. Si te atascas, levanta la mano.                      |
| 19:15 | Primer push           | Todos los squads deberían verse ya en build.barraca.house. Si el vuestro no sale, levantad la mano. |
| 20:15 | Repaso a mitad        | Los referentes pasan por las mesas. Tened claro qué vais a enseñar en la demo.                      |
| 21:15 | Se congela el alcance | Lo que no esté, al README como «qué falta para producción».                                         |
| 21:45 | Registro abierto      | `hacknight revisar` y `hacknight registrar`. Cierra a las 22:00.                                    |
| 22:00 | Registro cerrado      | Se cierran los portátiles. Empiezan las demos.                                                      |
