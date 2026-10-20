# Copia offline de las fuentes de datos

Respuestas en crudo de las fuentes de datos de terceros que consultan los tracks, para seguir con el reto si una API cae o falla la red durante la build night. No sustituye a la fuente: la herramienta sigue citando el origen y la fecha de consulta.

| Fuente                               | Track                  | En git | Tipo                        | README                                    |
| ------------------------------------ | ---------------------- | ------ | --------------------------- | ----------------------------------------- |
| API de la BDNS (infosubvenciones.es) | Derechos               | Sí     | En vivo: muestra            | [bdns/](bdns/README.md)                   |
| Avisos de INCIBE (RSS y web)         | Sello                  | No     | En vivo: muestra            | [incibe/](incibe/README.md)               |
| RDAP (rdap.org)                      | Sello                  | Sí     | En vivo: muestra de formato | [rdap/](rdap/README.md)                   |
| Infoelectoral, 23-J 2023             | ¿Cómo voto?            | Sí     | Finita: completa            | [infoelectoral/](infoelectoral/README.md) |
| BOE, API de datos abiertos           | Claridad y ¿Cómo voto? | Sí     | Finita: textos citados      | [boe/](boe/README.md)                     |

Fuera de la copia, y por qué:

- **Google Safe Browsing v5** (Sello) y **Google Fact Check Tools** (¿Cómo voto?): exigen clave y sus términos no permiten guardar copias permanentes de las respuestas. Sin clave, las herramientas ya dicen «reputación no consultada» o usan su corpus propio.
- **Buscador del PAG** (Brújula): no tiene API ni descarga masiva; la herramienta solo enlaza a él.
- **Dades Obertes GVA** (Derechos): el único conjunto de ayudas trae nombres de beneficiarios y el SETUP pide no usarlo; además, su `robots.txt` excluye `/api/`.
- **datos.gob.es** (Libre): es un catálogo para descubrir fuentes; la fuente del squad libre se conoce el 21/10, con su propuesta.

## Uso sin internet

Cada fuente guarda en `<fuente>/raw/` los cuerpos tal cual llegaron y un `manifest.json` con la URL, el estado HTTP, el tipo de contenido, el sha256 y la fecha de cada respuesta. Para servirlas con las mismas rutas que el original:

```sh
bun data-backup/serve.ts          # http://localhost:8787, o PORT=…
curl 'http://localhost:8787/www.infosubvenciones.es/bdnstrans/api/regiones?vpd=GE'
```

La ruta es `/<host>/<ruta>?<consulta>` de la URL original; el orden de los parámetros da igual. Una consulta que no esté en la copia devuelve 404 con la URL buscada. En un squad, basta con cambiar la URL base de su cliente por la del servidor local.

## Volver a descargar

```sh
bun data-backup/<fuente>/download.ts            # reanuda: solo pide lo que falta
bun data-backup/<fuente>/download.ts --refresh  # vuelve a pedirlo todo
```

Los scripts piden de uno en uno, con 1,1 s entre peticiones como mínimo (2 s en INCIBE y 3 s en RDAP), un User-Agent con la URL de este repo, un tiempo máximo de 90 s y hasta cinco reintentos con espera exponencial ante errores de red, 429 y 5xx, respetando `Retry-After`. El código común está en [`lib/polite.ts`](lib/polite.ts).
