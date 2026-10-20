# RDAP: registro de dominios (Sello)

- **Origen:** `https://rdap.org/domain/<dominio>`, que redirige al servidor RDAP del registro de cada dominio de primer nivel.
- **Descarga:** 19/10/2026, con `bun data-backup/rdap/download.ts`.
- **Tipo:** en vivo, una consulta por dominio. No tiene sentido copiarlo entero: se guardan muestras del formato de respuesta de cada registro.

## Qué hay

Once respuestas en `raw/domain/<dominio>.json`: `correos.com` (el único dominio no `.es` de `dominios-oficiales.json`), los reservados `example.com`, `example.net` y `example.org`, los dominios del propio registro de `.top`, `.xyz`, `.info`, `.shop` y `.online` (TLD frecuentes en smishing) y dos 404: `dgt.es` (rdap.org no cubre `.es`) y `europa.eu` (tampoco `.eu`). No se consulta ninguna URL sospechosa de los mensajes de prueba: el SETUP pide no conectar con ellas y sus dominios son inventados.

## Uso sin internet

Sirven de fixtures para el parser: fecha de registro en `events` (`eventAction: "registration"`), registrador en `entities` y avisos de uso en `notices`. Con `bun data-backup/serve.ts`, `http://localhost:8787/rdap.org/domain/correos.com` devuelve la respuesta guardada; un dominio que no esté devuelve 404, como haría rdap.org con `.es`, y la herramienta debe decir «no disponible».

## Términos

Cada respuesta trae en `notices` los términos de uso de su registro: datos informativos, solo para fines lícitos y sin consultas masivas. rdap.org limita a 10 peticiones cada 10 segundos por IP; el script espera 3 s entre consultas.
