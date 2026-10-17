# Build night · BARRACA x SOTI

Este repo es la herramienta de un equipo para la plataforma de atención ciudadana del Build night (jueves 22 de octubre de 2026, València). Antes de escribir código, lee `SETUP.md`: el reto del track, la demo esperada, los riesgos y los archivos de `datos/`. `contexto.md` es el marco de conocimiento verificado del track; es largo, así que busca en él en vez de leerlo entero.

## Cómo está montado

- Next.js (App Router) y Tailwind, con Bun: `bun install`, `bun run dev`, `bun run build`.
- La app vive en `/<equipo>`, el campo `equipo` de `ficha.json`: en local, `http://localhost:3000/<equipo>`; publicada, `https://build.barraca.house/<equipo>`. No cambies `equipo`: de él salen la ruta y el sitio en la plataforma.
- `<Link>` y `next/image` añaden esa ruta solos; `fetch` y los archivos de `public/` no. Usa `ruta()` de `src/config/sitio.ts`: `fetch(ruta("/api/ia"))`.
- Cada push a `main` se publica solo. Trabajad sobre `main`, con `git pull --rebase` antes de cada push: las ramas no tienen vista previa que podáis abrir.
- `bun run build` tiene que pasar antes de cada push. Si falla, no se publica.

## IA y claves

- La IA es de HelmCode, compatible con la API de OpenAI. `src/lib/ia.ts` la llama y `src/app/api/ia/route.ts` es un ejemplo completo.
- Llámala solo desde el servidor: rutas de `src/app/api/` o Server Actions. Ninguna clave lleva el prefijo `NEXT_PUBLIC_`.
- En local, las claves van en `.env.local`, que nunca se sube: `HELMCODE_API_KEY`, `HELMCODE_MODEL` y, si os la dan, `HELMCODE_BASE_URL`. Sello usa además `SAFE_BROWSING_API_KEY` y ¿Cómo voto?, `FACTCHECK_API_KEY`. En la versión publicada ya están puestas.

## Reglas de la plataforma

1. Cada respuesta cita su fuente oficial con `<Fuentes />`, enlazando la página concreta que la sostiene.
2. Nada de datos personales reales: ni DNI, ni expedientes, ni contraseñas. Se simulan.
3. No se guarda lo que escribe el ciudadano: ni base de datos ni logs con su texto.
4. Ante la duda, la herramienta dice que no puede confirmarlo y enlaza la sede oficial. Nunca inventa importes, plazos ni requisitos.
5. Se conservan el aviso «Herramienta experimental. No es un servicio oficial.» y el botón «¿Algo está mal? Avísanos».
6. `ficha.json` describe la herramienta: nombre, frase, icono, fuentes y `datos` (`simulados`, o `reales` si son datos públicos).
7. `datos/`, `contexto.md` y `SETUP.md` son material de la organización: no los editéis. Vuestros datos van en otra carpeta, por ejemplo `src/datos/`.
