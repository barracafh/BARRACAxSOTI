# Abierto

**Estado:** si-hay-gente · **Track lead:** por asignar.

## Qué resuelve y para quién

Consulta contratos, presupuestos e indicadores con definición y fuente. Personas que quieren entender contratos, presupuestos e indicadores públicos; track opcional, solo si hay gente.

## Piezas y criterio de hecho

Una pieza por squad, con 3,5 h de build y el pack preparado. Alcances propuestos para que los cierre el track lead.

| Pieza                     | Alcance en 3,5 h                                                                          | Hecho cuando…                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Contratos en claro        | Consultar un extracto de contratos de un año de la GVA con filtros o preguntas acotadas.  | Cada respuesta muestra filas de origen, unidad y periodo; no inventa agregados.                             |
| Presupuestos consultables | Consultar una tabla pequeña de presupuesto con categorías previamente definidas.          | Los totales cuadran con el extracto y se distinguen presupuesto y ejecución.                                |
| Dato oficial              | Mostrar indicadores fijos del INE, elegidos desde su catálogo de principales indicadores. | Cada tarjeta incluye definición, serie, fecha, atribución y qué no mide; sin entrada libre de afirmaciones. |

## Datos disponibles y estado

Las fuentes están identificadas en el contexto del comité del 07/10; **los paquetes siguen pendientes**. [Formatos, origen y preparación](datos/README.md). [Guías por preparar](guias/README.md).

## Fuentes oficiales

- [Contratos GVA](https://dadesobertes.gva.es/es/dataset?q=contratos+adjudicados)
- [Hacienda València](https://opendata.vlci.valencia.es/en/group/hacienda)
- [PLACSP](https://contrataciondelestado.es/)
- [API INE](https://www.ine.es/dyngs/DAB/index.htm?cid=1099)
- [Aviso legal INE](https://ine.es/dyngs/AYU/index.htm?cid=125)

## Riesgos

Hasta el 29/11: sin rankings de gobiernos ni veredictos sobre candidatos. Revisar serie, unidad, periodo y licencia. Dato oficial es opcional; Maldita requiere permiso para uso con IA según el contexto. Datos DANA quedan fuera salvo decisión expresa del comité.

## Qué falta antes del 20/10

Asignar track lead y revisión humana. Confirmar si se activa, elegir tablas, limpiar y comprobar totales, decidir si cabe Dato oficial y mapear sus series. Publicar el pack con procedencia, fecha y SHA256; actualizar `track.json` y regenerar el catálogo.
