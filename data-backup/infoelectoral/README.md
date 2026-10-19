# Infoelectoral: generales del 23-J de 2023 (¿Cómo voto?)

- **Origen:** área de descargas de Infoelectoral (Ministerio del Interior), paquete municipal del Congreso de julio de 2023: `https://infoelectoral.interior.gob.es/estaticos/docxl/apliextr/02202307_MUNI.zip` (última modificación del servidor: 27/12/2023).
- **Descarga:** 19/10/2026, con `bun data-backup/infoelectoral/download.ts`. 856 KB.
- **Tipo:** finita. Es el paquete oficial completo del que salen los CSV de `tracks/como-voto/datos/`, que se generaron desde un espejo porque el portal no respondía.

## Uso sin internet

`raw/02202307_MUNI.zip` contiene los `.DAT` de ancho fijo en ISO-8859-1 (01 control, 02 identificación, 03 candidaturas, 05 y 06 municipios, 07 y 08 ámbitos superiores) y el diseño de registro oficial (`FICHEROS.doc` y `.rtf`). El procesado del pack está en [`tracks/como-voto/datos/FUENTES.md`](../../tracks/como-voto/datos/FUENTES.md). Sirve para comprobar los CSV del pack contra el original. Los sha256 de `FUENTES.md` no coinciden con estos `.DAT` porque el espejo usado tiene finales de línea CRLF y el original LF; sin los `\r`, 03 y 07 son idénticos byte a byte (comprobado el 19/10/2026).

## Licencia y atribución

Información del sector público reutilizable (Ley 37/2007 y RD 1495/2011; [aviso legal](https://www.interior.gob.es/opencms/es/aviso-legal/)). Citar «Origen de los datos: Ministerio del Interior», no desnaturalizar los datos ni dar a entender que el Ministerio patrocina el uso.
