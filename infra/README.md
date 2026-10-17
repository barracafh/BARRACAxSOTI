# Infra del evento

Todo parte de **`--dry-run`**: no hace peticiones ni cambios remotos. `--apply` ejecuta el plan y es una operación explícita del comité, una vez revisados los destinos y permisos.

- [registro/](registro/README.md): repo de asignaciones, etiquetas, protección y CODEOWNERS.
- [equipos/](equipos/README.md): un repo público y un proyecto de Vercel por equipo, y el hub de `build.barraca.house`.
- [sala/](sala/README.md): la web del evento y el proyector en `sala.build.barraca.house`, leyendo el registro.

Las claves (HelmCode, Google, el token de lectura de la sala) viven en `.local-secrets/build-night.env`, fuera de Git; carga ese archivo en el shell antes de un `--apply`.

Los workflows de `.github/` comprueban el monorepo y preparan releases del CLI al subir tags `cli-v*`. El destino de releases que usa el CLI se configura por separado; todavía no se ha publicado ninguna.
