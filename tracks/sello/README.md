# Sello + estafas

**Estado:** nucleo · **Track lead:** por asignar.

## Qué resuelve y para quién

Comprueba webs y mensajes con fuentes oficiales y señales de fraude. Personas que dudan de una web, SMS o correo que aparenta ser de la administración.

## Piezas y criterio de hecho

Puede haber varios squads en el track, todos con el mismo reto: cada uno construye las piezas que le dé tiempo, en el orden que prefiera. Unas 4 h de build con el pack preparado. Alcances propuestos para que los cierre el track lead.

| Pieza                   | Alcance en 4 h                                                                        | Hecho cuando…                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ¿Esta web es oficial?   | Comprobar el dominio contra una lista oficial curada, sin visitar la URL introducida. | Distingue coincidencia exacta, subdominio válido y desconocido; no equipara desconocido con fraude. |
| Las citas son gratis    | Mostrar señales de reventa de citas y la ruta oficial para pedirlas.                  | Casos sintéticos explican las señales y enlazan a Interior; no consulta ni reserva citas.           |
| ¿Este aviso es oficial? | Contrastar avisos sintéticos con canales de Protección Civil, GVA 112 y AEMET.        | Explica qué se pudo comprobar y qué no, con fuente; no sustituye alertas de emergencia.             |

## Datos disponibles y estado

El pack de datos está en `datos/` y lo describe [SETUP.md](SETUP.md); [qué está listo y qué falta](datos/README.md). [Guías por preparar](guias/README.md). [Contexto verificado](contexto.md) e [infografía](contexto.html).

## Fuentes oficiales

- [DIR3](https://datos.gob.es/es/catalogo/e05251701-directorio-comun-de-unidades-organicas-y-oficinas-dir3)
- [INCIBE](https://www.incibe.es/)
- [Interior: fraude con citas](https://www.interior.gob.es/opencms/es/detalle/articulo/La-Policia-Nacional-desarticula-un-grupo-criminal-dedicado-a-la-venta-fraudulenta-de-citas-de-extranjeria-mediante-bots/)
- [Protección Civil: FAQ](https://www.proteccioncivil.es/es/faqappran)

## Riesgos

Hasta el 29/11: no emitir veredictos políticos ni atribuir campañas. Una lista blanca no certifica la seguridad de una página. Sin scraping de citas, sin capturar mensajes personales y sin instrucciones de evacuación.

## Qué falta antes del 20/10

Asignar track lead y revisión humana. Curar dominios y canales, documentar las reglas de coincidencia y revisar ejemplos y mensajes de incertidumbre. Dejar los datos en `datos/` con su procedencia y fecha de consulta.
