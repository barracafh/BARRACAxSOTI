# Repos de equipo y hub

Un repo público por equipo en `barracafh`, conectado a su proyecto de Vercel, y el hub de `build.barraca.house`, que sirve cada herramienta en `/<id>`. Desde la raíz:

```sh
bun infra/equipos/preparar.ts --equipos /ruta/equipos.json --dry-run
```

`equipos.json` usa el formato del registro del CLI: `id`, `nombre`, `herramienta`, `mesa`, `miembros` y `repo`. El `id` es la ruta (`derechos-a`, `derechos-b`… y `libre`); la herramienta empieza con el nombre del track. `miembros` acepta los usuarios de GitHub tal como los exporta Luma (`https://github.com/usuario/`). Con `repo` vacío se usa `barracafh/build-<id>`. El archivo sale del reparto y no se sube a ningún repo.

Para cada equipo, el script:

1. Crea el repo público con los archivos versionados de `plantilla/`, su ficha, el botón de avisos apuntando a sus issues y, de `tracks/<track>/`, `SETUP.md`, `datos/` y `contexto.md`, con los ficheros de `tracks/comun/` que cita su track en `comun/`. Los enlaces a material que el repo no lleva apuntan al monorepo público.
2. Crea el proyecto `build-<id>` en Vercel, conectado al repo y sin protección de despliegue: el hub lo lee por su dominio `vercel.app`.
3. Copia las variables de tu shell: `HELMCODE_API_KEY`, `HELMCODE_BASE_URL` y `HELMCODE_MODEL` a todos; `SAFE_BROWSING_API_KEY` solo a Sello y `FACTCHECK_API_KEY` solo a ¿Cómo voto?. `--apply` no empieza si falta alguna de las que usan sus equipos (`HELMCODE_BASE_URL` es opcional).
4. Hace un push para el primer despliegue.

Después publica el hub (`build-hub`): una portada con los equipos y una regla de reenvío por ruta. Al final invita a cada miembro con permiso de escritura a su repo y al registro: GitHub limita las invitaciones por repo y día, y si rechaza alguna, los repos y el hub ya están hechos. Con `--apply`, un usuario que no existe en GitHub no se invita: sale un aviso con el comando para invitarlo a mano cuando se corrija.

Se puede repetir. Lo que ya existe se salta y lo demás se actualiza: variables, invitaciones y hub. Una variable nueva entra en el siguiente despliegue del equipo. Quien sale de un equipo no se retira solo: `gh api -X DELETE repos/<repo>/collaborators/<usuario>`. `--equipo <id>` limita los repos a uno; el hub se regenera siempre con todos.

Hace falta `git`, Bun, `gh auth login` con permiso para crear repos en `barracafh` y `vercel login` con acceso al team `barracafh`. `--apply` reescribe `equipos.json` con los repos y usuarios normalizados, listo para el registro del CLI. Antes del reparto real, ensaya con un equipo de prueba y un push desde una cuenta que no sea del team de Vercel.
