# BDNS: convocatorias de ayudas (Derechos)

- **Origen:** API pública del Sistema Nacional de Publicidad de Subvenciones y Ayudas Públicas, `https://www.infosubvenciones.es/bdnstrans/api`. Sin clave, JSON. Especificación en `raw/snpsap-api.json`.
- **Descarga:** 19/10/2026, con `bun data-backup/bdns/download.ts`. Las fechas exactas de cada respuesta están en `raw/manifest.json`.
- **Tipo:** en vivo. La BDNS tiene más de 600 000 convocatorias y cambia cada día, así que se guarda una muestra.

## Qué hay

9,8 MB, 745 respuestas:

| Contenido                                                                                                                                                                                                   | Ficheros                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Catálogos: regiones, finalidades, beneficiarios, instrumentos, actividades, objetivos, reglamentos, sectores, órganos (A, C, L y O) y el órgano del Ayuntamiento de València por su DIR3                    | `raw/catalogos/`                |
| Las tres búsquedas probadas en el SETUP (Generalitat, Estado y Ayuntamiento de València, personas físicas, desde el 1/07/2026, `pageSize=50`)                                                               | `raw/busquedas/setup-*.json`    |
| Listados completos desde el 1/01/2026: Generalitat en las regiones 54–57 (462), Estado (1420), Ayuntamiento de València, órgano 2903 (209), y entidades locales de la Comunitat (5396)                      | `raw/busquedas/2026-*.json`     |
| Últimas 100 convocatorias registradas                                                                                                                                                                       | `raw/busquedas/ultimas-p0.json` |
| Búsquedas desde el 1/07/2026 para personas físicas y autónomos (`tiposBeneficiario=1,3`): Generalitat (50), Estado (116) y entidades locales de la Comunitat (509); y todo el Ayuntamiento de València (61) | `raw/busquedas/fichas-*.json`   |
| Ficha completa (`/convocatorias?numConv=N`) de cada resultado de la fila anterior: 719                                                                                                                      | `raw/fichas/<número BDNS>.json` |

Criterio: cubre los cuatro perfiles de prueba del SETUP (también Castelló, la Safor y la madre autónoma, que el pack no cubre) y la ventana de la copia del pack. No se descargan concesiones, ayudas de Estado, minimis ni sanciones: traen datos de beneficiarios y el reto no los usa. Tampoco los PDF de bases y documentos: la ficha trae su enlace. Algunas fichas incluyen el correo de contacto que publica el órgano convocante (buzones municipales, casi siempre); se guardan tal cual.

## Uso sin internet

Con `bun data-backup/serve.ts`, la base `http://localhost:8787/www.infosubvenciones.es/bdnstrans/api` responde como la API para las URL guardadas, por ejemplo `/convocatorias?vpd=GE&numConv=930992`. Una búsqueda con otros filtros no está: filtrad en local los listados o las fichas. Las fichas también se pueden leer directamente desde `raw/fichas/`.

## Licencia y atribución

Información del sector público reutilizable (Ley 37/2007), con las condiciones del [aviso legal](https://www.infosubvenciones.es/bdnstrans/GE/es/avisolegal). Hay que citar «Origen de los datos: Intervención General de la Administración del Estado» y la fecha de consulta. La API avisa de que los datos pueden corregirse o eliminarse después de la descarga: la copia es de respaldo, no la fuente. Las [buenas prácticas de la API](https://www.infosubvenciones.es/bdnstrans/estaticos/ayuda/Buenas%20pr%C3%A1cticas%20API%20SNPSAP.pdf) fijan un máximo de 10 peticiones por segundo y piden no hacer llamadas concurrentes; el script hace menos de una por segundo, en serie.
