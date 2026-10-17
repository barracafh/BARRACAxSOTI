# Infra del evento

Todo parte de **`--dry-run`**: no hace peticiones ni cambios remotos. `--apply` ejecuta el plan y es una operación explícita del comité, una vez revisados los destinos y permisos. No se ha ejecutado contra servicios reales.

- [registro/](registro/README.md): repo de asignaciones, etiquetas, protección y CODEOWNERS.
- [equipos/](equipos/README.md): un repo público y un proyecto de Vercel por equipo, y el hub de `build.barraca.house`.
- [ia/](ia/README.md): una clave OpenRouter por squad, con tope y archivos privados.
- [deploy/](deploy/README.md): opciones para web y servidor; proveedor pendiente.

Los workflows de `.github/` comprueban el monorepo y preparan releases del CLI al subir tags `cli-v*`. El destino de releases que usa el CLI se configura por separado; todavía no se ha publicado ninguna.
