# Publicar el repo plantilla

`plantilla/` es independiente del workspace y ya tiene lockfile propio. El repo remoto todavía está pendiente.

```sh
bun infra/plantilla/publicar.ts --repo organizacion/plantilla --dry-run
```

El plan exporta **solo archivos versionados** de `plantilla/` a la raíz de un repo nuevo, conserva los archivos ocultos y el lockfile, añade el botón de Vercel con la URL elegida y muestra `gh repo create` y `gh repo edit --template`. No exporta el resto del monorepo. Rechaza enlaces simbólicos y artefactos o `.env` versionados.

Antes de aplicar: guarda los cambios de la plantilla, ejecuta `bun install --frozen-lockfile && bun run build` dentro de ella y `bun run check` en la raíz. Confirma el formulario de avisos. Necesitas Git, Bun, `gh auth login`, permiso para crear un repo público y administración para marcarlo como plantilla. Luego el comité puede sustituir `--dry-run` por `--apply`.

Es una publicación inicial; no sobreescribe un repo existente. Si falla a mitad, revisa el repo y completa el paso pendiente. Las futuras actualizaciones se revisan por PR en el repo plantilla, exportando únicamente este directorio; no se sincronizan automáticamente.

Configura `HACKNIGHT_PLANTILLA=organizacion/plantilla` en el CLI. Ensaya que `hacknight tramitar` crea el repo del squad y sustituye la ficha de ejemplo. El formulario, el destino remoto y el diseño definitivo (OK de Samu para Reforma Digital) siguen pendientes.

Referencias: [repos plantilla en GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository) y [botón Vercel](https://vercel.com/docs/deploy-button). [Guía del squad](../../plantilla/README.md).
