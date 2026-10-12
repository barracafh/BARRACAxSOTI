# Tu herramienta, lista para empezar

Plantilla v0 para un squad: Next.js, Tailwind y exportación estática. **Trabajad en vuestro propio repo**, creado desde esta plantilla con `hacknight tramitar`. Este directorio tiene su propio `package.json` y `bun.lock`; no depende del workspace del evento.

## Arrancar

Con Bun y Node 22 o superior, dentro del repo de vuestro squad:

```sh
bun install --frozen-lockfile
bun run dev
```

Abre `http://localhost:3000`. Cambia el ejemplo en `src/app/page.tsx`; los metadatos salen de `ficha.json`. `bun run build` genera `out/`, listo para un alojamiento estático.

- Pon `<Fuentes fuentes={[{ nombre: "Fuente oficial", url: "https://www.boe.es/" }]} />` debajo de **cada respuesta**. Cita la página concreta que sostiene la respuesta.
- Conserva `<BotonAviso />` y configura la URL del formulario **solo en `src/config/sitio.ts`**. El placeholder `example.invalid` no funciona: hay que sustituirlo antes de publicar.
- No incluyas datos personales reales ni claves. Esta plantilla estática no trae backend para IA; una clave en el navegador o en `NEXT_PUBLIC_*` sería pública. El acceso a IA necesita una solución del comité aún pendiente.

## Publicar en Vercel

En [Vercel → nuevo proyecto](https://vercel.com/new), importa el repo del squad y pulsa **Deploy**: `vercel.json` ya configura instalación, build y salida `out`. No necesitas una base de datos. Comprueba la página, las fuentes y el botón de aviso en la URL resultante.

Cuando el comité publique el repo plantilla, añadirá aquí su [botón de despliegue en un clic](https://vercel.com/docs/deploy-button). El script de `infra/plantilla/` del monorepo lo incorpora con la URL real; el repo remoto está pendiente de crear.

## Ficha y entrega

`ficha.json` trae un ejemplo válido: cambia nombre, frase, icono, track (`herramienta`), equipo, URL pública y fuentes. `datos` indica `simulados` o datos públicos `reales`, nunca personales. `tramitar` sustituye la ficha de ejemplo por la asignación del registro y consume el marcador `exampleFicha`; no sobrescribe fichas de otros equipos.

```sh
git add .
hacknight ficha validar
hacknight revisar
```

Antes de publicar, la regla de URL pública fallará: es normal mientras tenga el placeholder. Las otras cinco deben pasar. La revisión analiza archivos versionados; no acredita la exactitud del contenido. Incluid en vuestro README media página con problema, usuario, qué habéis hecho y qué falta para producción. Entregad con `hacknight registrar`.

El contrato es `apps/cli/esquemas/ficha.schema.json` en el monorepo del evento. Conservad `.hacknight/plantilla.json`.

## Diseño pendiente

La plantilla lleva la marca de BARRACA: `src/styles/paleta.css` copia los tokens comunes del evento (no los importa) y `next/font` sirve Syne y Space Mono desde el propio sitio. Ese archivo y `src/components/` son el punto de sustitución del diseño de Reforma Digital, **pendiente del OK de Samu**. Todavía no se ha importado ningún componente ni asset de ese repo.

Referencias: [exportación estática de Next.js](https://nextjs.org/docs/app/guides/static-exports) y [Tailwind con Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
