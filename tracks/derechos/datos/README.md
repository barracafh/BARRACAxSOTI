# Datos · Derechos

| Recurso                  | Formato | Origen                                                                                                                                                                      | Estado  |
| ------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Ayudas y trámites        | JSON    | `catalogo-tramites-ayudas.json`: 8 ayudas y 13 trámites con requisitos, pasos y fuente. Ver [SETUP.md](../SETUP.md).                                                        | listo   |
| Convocatorias BDNS       | API     | API pública de la BDNS, sin clave; las llamadas probadas el 18/10 están en [SETUP.md](../SETUP.md).                                                                         | en vivo |
| Copia de respaldo BDNS   | JSON    | `bdns-convocatorias-cv.json`: 59 convocatorias para personas físicas (Generalitat, Ayuntamiento de València y Estado), consultadas el 18/10, con su consulta y su licencia. | listo   |
| Datos abiertos de la GVA | API     | Dades Obertes GVA (CKAN): solo ayudas concedidas, con nombres de beneficiarios; no usar. Ver [SETUP.md](../SETUP.md).                                                       | en vivo |

Los recursos «en vivo» los consulta la herramienta durante la noche: leerlos y citarlos es parte del reto. Cada archivo lleva su procedencia y fecha de consulta; ninguno contiene datos personales. `infra/equipos` copia esta carpeta al repo de cada squad, sin este README.
