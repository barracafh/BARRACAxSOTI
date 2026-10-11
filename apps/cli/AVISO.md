# Origen y cambios

Este CLI deriva de `apps/cli` de [HackSpain/hackspain26](https://github.com/HackSpain/hackspain26), commit `2865d19` (MIT, © Asociación Exponential Fellowship). Autor principal del original: Samu, `samuelcorsan`.

Se conservan la mecánica de imágenes de terminal y sus tests; se adaptan los patrones de estilo, wordmark por glifos, paneles, menú, sobre JSON, errores, pantalla con buffer alternativo y actualización con SHA256. El catálogo de comandos y el backend se sustituyen por trámites en castellano, negociados, GitHub mediante `gh` y un registro local.

Los normalizadores locales de Claude Code y Codex también se adaptan del watcher; solo extraen contadores, sin hooks. `consumo` conserva la consulta local; `observar --servidor` puede enviarlos al backend local de pruebas.

No se incluyen nombre comercial, logos, wordmark gráfico, ilustraciones ni logos de herramientas del origen. No hay Convex, dependencia del dashboard, autenticación por dispositivo, telemetría remota, receptor OTel ni instalación de hooks. Ningún comando modifica configuraciones de asistentes del usuario.

`assets/logo.png` es el slot pendiente del único logo del evento; el CLI funciona sin él. Los paquetes npm mantienen sus propias licencias. Véase `LICENSE`.
## Extensión de pruebas en directo

El backend local y su contrato de contadores son propios. Se conservan los conceptos del watcher del origen: ventana del evento, deduplicación y separación entre uso y contenido. No se incorpora su backend Convex/RawTree ni sus mecanismos de instalación de hooks.

La web propia toma como referente funcional la landing y el dashboard Insights de HackSpain, con marca, composición y código de interfaz propios. No se copian sus imágenes, fuentes, datos históricos ni componentes de terceros.

## Organización del workspace

Las extensiones del evento están separadas en `apps/web/` y `apps/server/`. Los modelos, la paleta y el registro local residen en `packages/shared/`; conservan la atribución MIT descrita aquí. El CLI de participantes y su watcher permanecen en `apps/cli/`. La web solo se incluye en el ejecutable del servidor.
