# Seguridad

`hacknight` se instala en los portátiles de los participantes, así que cualquier fallo que exponga datos, credenciales o permita ejecutar código nos importa.

## Cómo avisar

- **Preferible:** abre un aviso privado en [Security → Report a vulnerability](https://github.com/barracafh/BARRACAxSOTI/security/advisories/new).
- **Si no puedes usar GitHub:** escribe a [hola@barraca.house](mailto:hola@barraca.house) con «Seguridad» en el asunto.

No abras un issue público con los detalles. Respondemos en cuanto podamos; durante la semana del evento (22 de octubre de 2026), el mismo día.

## Qué entra

- El CLI de `apps/cli/`, su instalador (`apps/cli/install.sh`) y sus releases en [barracafh/build-registro](https://github.com/barracafh/build-registro/releases).
- La web de la sala y su API (`apps/web/`, `infra/sala/`).
- Los scripts de `infra/` y los workflows de `.github/`.

Los repos de cada squad y las herramientas que construyen son responsabilidad de cada equipo.

## Qué hace el CLI en tu máquina

Lo resume la sección [Seguridad y privacidad](README.md#seguridad-y-privacidad) del README, con enlaces al código que lo hace.
