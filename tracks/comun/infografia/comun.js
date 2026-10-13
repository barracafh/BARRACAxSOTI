// Navegación, enlaces al Markdown y preferencias compartidas por todas las páginas.
const REPO =
  "https://github.com/barracafh/BARRACAxSOTI/blob/main/tracks/comun/";

const DOCS = [
  { id: "00", file: "00-territorio", title: "Territorio", tracks: "Todos" },
  {
    id: "00b",
    file: "00b-competencias-y-sector-publico",
    title: "Competencias y sector público",
    tracks: "Todos",
  },
  {
    id: "01",
    file: "01-buscador-ayudas",
    title: "Buscador de ayudas",
    tracks: "Track 1",
  },
  {
    id: "02",
    file: "02-traductor-documentos",
    title: "Traductor de documentos",
    tracks: "Track 2",
  },
  {
    id: "03",
    file: "03-verificador-webs-y-mensajes",
    title: "Verificador de webs y mensajes",
    tracks: "Track 3",
  },
  {
    id: "04",
    file: "04-asistente-tramites",
    title: "Asistente de trámites",
    tracks: "Track 4",
  },
  {
    id: "04b",
    file: "04b-gestores-expedientes",
    title: "Gestores de expedientes",
    tracks: "Tracks 4, 2 y 3",
  },
  {
    id: "05",
    file: "05-guia-elecciones",
    title: "Guía de las elecciones",
    tracks: "Track 5",
  },
];

// Encabezados ## y ### de cada Markdown con su ancla de GitHub (generado desde los ficheros).
const TOC = {
  "00-territorio.md": [
    [2, "1. Niveles de administración", "1-niveles-de-administración"],
    [
      2,
      "2. Comunidades y ciudades autónomas",
      "2-comunidades-y-ciudades-autónomas",
    ],
    [2, "3. Provincias e islas", "3-provincias-e-islas"],
    [3, "3.1 Las 50 provincias", "31-las-50-provincias"],
    [
      3,
      "3.2 Los 7 cabildos insulares canarios",
      "32-los-7-cabildos-insulares-canarios",
    ],
    [
      3,
      "3.3 Los 4 consells insulars de Baleares",
      "33-los-4-consells-insulars-de-baleares",
    ],
    [
      2,
      "4. Regímenes forales y especiales",
      "4-regímenes-forales-y-especiales",
    ],
    [3, "4.1 País Vasco", "41-país-vasco"],
    [3, "4.2 Navarra", "42-navarra"],
    [3, "4.3 Canarias", "43-canarias"],
    [3, "4.4 Cataluña", "44-cataluña"],
    [3, "4.5 Illes Balears", "45-illes-balears"],
    [3, "4.6 Ceuta y Melilla", "46-ceuta-y-melilla"],
    [3, "4.7 Comunidades uniprovinciales", "47-comunidades-uniprovinciales"],
    [
      2,
      "5. Identificadores y directorios oficiales",
      "5-identificadores-y-directorios-oficiales",
    ],
    [
      3,
      "5.1 Códigos INE (comunidades, provincias, islas, municipios)",
      "51-códigos-ine-comunidades-provincias-islas-municipios",
    ],
    [
      3,
      "5.2 DIR3 (Directorio Común de Unidades Orgánicas y Oficinas)",
      "52-dir3-directorio-común-de-unidades-orgánicas-y-oficinas",
    ],
    [
      3,
      "5.3 Registro de Entidades Locales (REL)",
      "53-registro-de-entidades-locales-rel",
    ],
    [
      3,
      "5.4 INVENTE (Inventario de Entes del Sector Público)",
      "54-invente-inventario-de-entes-del-sector-público",
    ],
    [3, "5.5 NIF de entidades públicas", "55-nif-de-entidades-públicas"],
    [
      3,
      "5.6 datos.gob.es (catálogo nacional de datos abiertos)",
      "56-datosgobes-catálogo-nacional-de-datos-abiertos",
    ],
    [
      3,
      "5.7 Receta mínima para una tabla territorial determinista",
      "57-receta-mínima-para-una-tabla-territorial-determinista",
    ],
    [2, "Fuentes", "fuentes"],
  ],
  "00b-competencias-y-sector-publico.md": [
    [2, "1. Reparto competencial", "1-reparto-competencial"],
    [3, "1.1 Reglas de base", "11-reglas-de-base"],
    [3, "1.2 Matriz materia por nivel", "12-matriz-materia-por-nivel"],
    [3, "1.3 Excepciones territoriales", "13-excepciones-territoriales"],
    [2, "2. Tipología del sector público", "2-tipología-del-sector-público"],
    [3, "2.1 Marco", "21-marco"],
    [3, "2.2 Tabla por tipo de entidad", "22-tabla-por-tipo-de-entidad"],
    [3, "2.3 Empresas de capital público", "23-empresas-de-capital-público"],
    [3, "2.4 Entidades público-privadas", "24-entidades-público-privadas"],
    [
      2,
      "3. Cómo distinguirlas en la práctica",
      "3-cómo-distinguirlas-en-la-práctica",
    ],
    [
      3,
      "3.1 Letra inicial del NIF (Orden EHA/451/2008, art. 3, redacción de la Orden HAP/5/2016)",
      "31-letra-inicial-del-nif-orden-eha4512008-art-3-redacción-de-la-orden-hap52016",
    ],
    [3, "3.2 Registros y directorios", "32-registros-y-directorios"],
    [
      3,
      "3.3 Tabla de pregunta, regla y fuente",
      "33-tabla-de-pregunta-regla-y-fuente",
    ],
    [
      3,
      "3.4 Orden de clasificación para un agente",
      "34-orden-de-clasificación-para-un-agente",
    ],
    [2, "Fuentes", "fuentes"],
    [3, "Normas (BOE)", "normas-boe"],
    [
      3,
      "Portales oficiales y de entidades",
      "portales-oficiales-y-de-entidades",
    ],
  ],
  "01-buscador-ayudas.md": [
    [
      2,
      "Correcciones a las premisas del encargo",
      "correcciones-a-las-premisas-del-encargo",
    ],
    [2, "1. Qué cuenta como «ayuda»", "1-qué-cuenta-como-ayuda"],
    [
      2,
      "2. Fuente única de convocatorias: BDNS / SNPSAP",
      "2-fuente-única-de-convocatorias-bdns--snpsap",
    ],
    [3, "2.1 Obligación legal", "21-obligación-legal"],
    [3, "2.2 Qué se publica", "22-qué-se-publica"],
    [3, "2.3 API pública", "23-api-pública"],
    [3, "2.4 Pruebas del 12/10/2026", "24-pruebas-del-12102026"],
    [3, "2.5 Limitaciones de la BDNS", "25-limitaciones-de-la-bdns"],
    [
      2,
      "3. Algoritmo determinista de proveedor",
      "3-algoritmo-determinista-de-proveedor",
    ],
    [
      3,
      "3.1 Entrada y clasificación territorial",
      "31-entrada-y-clasificación-territorial",
    ],
    [
      3,
      "3.2 Orden de consulta por necesidad",
      "32-orden-de-consulta-por-necesidad",
    ],
    [3, "3.3 Reglas de decisión", "33-reglas-de-decisión"],
    [
      3,
      "3.4 Patrón «lo financia X, lo convoca Y, lo tramita Z» y cómo atribuirlo",
      "34-patrón-lo-financia-x-lo-convoca-y-lo-tramita-z-y-cómo-atribuirlo",
    ],
    [
      2,
      "4. Tabla por territorio (17 comunidades + Ceuta + Melilla)",
      "4-tabla-por-territorio-17-comunidades--ceuta--melilla",
    ],
    [
      2,
      "5. Ayudas y prestaciones más buscadas",
      "5-ayudas-y-prestaciones-más-buscadas",
    ],
    [
      2,
      "6. Datos para construir la herramienta",
      "6-datos-para-construir-la-herramienta",
    ],
    [
      2,
      "7. Errores que la herramienta debe evitar",
      "7-errores-que-la-herramienta-debe-evitar",
    ],
    [2, "Fuentes", "fuentes"],
  ],
  "02-traductor-documentos.md": [
    [
      2,
      "0. Cómo usar este fichero (orden de lectura de un documento)",
      "0-cómo-usar-este-fichero-orden-de-lectura-de-un-documento",
    ],
    [2, "1. ¿Quién me lo manda?", "1-quién-me-lo-manda"],
    [
      3,
      "1.1 Señales de identificación del emisor",
      "11-señales-de-identificación-del-emisor",
    ],
    [
      3,
      "1.2 Canal de llegada (también identifica al emisor)",
      "12-canal-de-llegada-también-identifica-al-emisor",
    ],
    [
      3,
      "1.3 Edictos: Tablón Edictal Único del BOE",
      "13-edictos-tablón-edictal-único-del-boe",
    ],
    [
      3,
      "1.4 Recaudación delegada: organismos provinciales",
      "14-recaudación-delegada-organismos-provinciales",
    ],
    [
      3,
      "1.5 Administración, empresa pública, juzgado o empresa privada de recobro",
      "15-administración-empresa-pública-juzgado-o-empresa-privada-de-recobro",
    ],
    [
      2,
      "2. ¿Qué significa? Tipología de documentos",
      "2-qué-significa-tipología-de-documentos",
    ],
    [
      3,
      "2.1 Notificación, comunicación, aviso, publicación",
      "21-notificación-comunicación-aviso-publicación",
    ],
    [
      3,
      "2.2 Requerimiento de subsanación (art. 68)",
      "22-requerimiento-de-subsanación-art-68",
    ],
    [3, "2.3 Trámite de audiencia (art. 82)", "23-trámite-de-audiencia-art-82"],
    [
      3,
      "2.4 Acuerdo de inicio de procedimiento sancionador",
      "24-acuerdo-de-inicio-de-procedimiento-sancionador",
    ],
    [
      3,
      "2.5 Propuesta de resolución (sancionador)",
      "25-propuesta-de-resolución-sancionador",
    ],
    [
      3,
      "2.6 Resolución (¿agota la vía administrativa?)",
      "26-resolución-agota-la-vía-administrativa",
    ],
    [3, "2.7 Liquidación tributaria", "27-liquidación-tributaria"],
    [
      3,
      "2.8 Propuesta de liquidación y requerimientos de la AEAT",
      "28-propuesta-de-liquidación-y-requerimientos-de-la-aeat",
    ],
    [3, "2.9 Providencia de apremio", "29-providencia-de-apremio"],
    [3, "2.10 Diligencia de embargo", "210-diligencia-de-embargo"],
    [3, "2.11 Multa de tráfico (RDL 6/2015)", "211-multa-de-tráfico-rdl-62015"],
    [3, "2.12 Citación (comparecencia)", "212-citación-comparecencia"],
    [3, "2.13 Edicto", "213-edicto"],
    [
      3,
      "2.14 Escritos de procedimientos específicos (SEPE, IMV, subvenciones)",
      "214-escritos-de-procedimientos-específicos-sepe-imv-subvenciones",
    ],
    [
      3,
      "2.15 Emplazamiento, citación o notificación judicial (solo reconocer)",
      "215-emplazamiento-citación-o-notificación-judicial-solo-reconocer",
    ],
    [2, "3. ¿Tiene algún plazo?", "3-tiene-algún-plazo"],
    [
      3,
      "3.1 Reglas de cómputo (Ley 39/2015, texto consolidado)",
      "31-reglas-de-cómputo-ley-392015-texto-consolidado",
    ],
    [
      3,
      "3.2 Tabla de plazos de referencia",
      "32-tabla-de-plazos-de-referencia",
    ],
    [
      3,
      "3.3 Aclaraciones y errores frecuentes",
      "33-aclaraciones-y-errores-frecuentes",
    ],
    [3, "3.4 Calendarios de festivos", "34-calendarios-de-festivos"],
    [
      2,
      "4. ¿Me genera una obligación? Clasificación determinista",
      "4-me-genera-una-obligación-clasificación-determinista",
    ],
    [
      3,
      "4.1 Categorías (por orden de gravedad; si hay varias, se devuelve la mayor como principal y se lista el resto)",
      "41-categorías-por-orden-de-gravedad-si-hay-varias-se-devuelve-la-mayor-como-principal-y-se-lista-el-resto",
    ],
    [
      3,
      "4.2 Señales de plazo, de efecto y de importe",
      "42-señales-de-plazo-de-efecto-y-de-importe",
    ],
    [
      2,
      "5. ¿Qué tengo que hacer y cómo respondo?",
      "5-qué-tengo-que-hacer-y-cómo-respondo",
    ],
    [
      3,
      "5.1 Dónde presentar la respuesta (Ley 39/2015 art. 16.4)",
      "51-dónde-presentar-la-respuesta-ley-392015-art-164",
    ],
    [3, "5.2 Identificación y firma", "52-identificación-y-firma"],
    [3, "5.3 Representación", "53-representación"],
    [
      3,
      "5.4 Qué recurso corresponde (árbol de decisión)",
      "54-qué-recurso-corresponde-árbol-de-decisión",
    ],
    [
      3,
      "5.5 Plantilla mínima de escrito de alegaciones o recurso",
      "55-plantilla-mínima-de-escrito-de-alegaciones-o-recurso",
    ],
    [
      2,
      "6. Especificación de salida de la herramienta",
      "6-especificación-de-salida-de-la-herramienta",
    ],
    [3, "6.1 Esquema de campos (JSON)", "61-esquema-de-campos-json"],
    [
      3,
      "6.2 Lo que la herramienta no debe hacer",
      "62-lo-que-la-herramienta-no-debe-hacer",
    ],
    [3, "6.3 Privacidad: «sin guardar nada»", "63-privacidad-sin-guardar-nada"],
    [2, "7. Casos tipo (salida esperada)", "7-casos-tipo-salida-esperada"],
    [3, "7.1 Multa de la DGT", "71-multa-de-la-dgt"],
    [
      3,
      "7.2 Requerimiento de la AEAT (propuesta de liquidación de IRPF)",
      "72-requerimiento-de-la-aeat-propuesta-de-liquidación-de-irpf",
    ],
    [3, "7.3 Recibo o liquidación del IBI", "73-recibo-o-liquidación-del-ibi"],
    [
      3,
      "7.4 Providencia de apremio de un organismo provincial",
      "74-providencia-de-apremio-de-un-organismo-provincial",
    ],
    [3, "7.5 Requerimiento del SEPE", "75-requerimiento-del-sepe"],
    [
      3,
      "7.6 Resolución denegatoria del IMV",
      "76-resolución-denegatoria-del-imv",
    ],
    [
      3,
      "7.7 Requerimiento de subsanación de una ayuda",
      "77-requerimiento-de-subsanación-de-una-ayuda",
    ],
    [
      3,
      "7.8 Carta de una empresa de recobro (no administrativa)",
      "78-carta-de-una-empresa-de-recobro-no-administrativa",
    ],
    [2, "Fuentes", "fuentes"],
    [
      3,
      "Normas del BOE (texto consolidado)",
      "normas-del-boe-texto-consolidado",
    ],
    [3, "Calendarios", "calendarios"],
    [3, "BOE, notificaciones", "boe-notificaciones"],
    [3, "Agencia Tributaria", "agencia-tributaria"],
    [3, "Organismos de recaudación", "organismos-de-recaudación"],
    [3, "Administración electrónica", "administración-electrónica"],
    [
      3,
      "Tráfico, empleo y Seguridad Social",
      "tráfico-empleo-y-seguridad-social",
    ],
  ],
  "03-verificador-webs-y-mensajes.md": [
    [2, "0. Resumen", "0-resumen"],
    [
      2,
      "1. Qué se puede afirmar con certeza y qué no",
      "1-qué-se-puede-afirmar-con-certeza-y-qué-no",
    ],
    [3, "1.1 Las tres salidas", "11-las-tres-salidas"],
    [3, "1.2 Señales concluyentes", "12-señales-concluyentes"],
    [
      3,
      "1.3 Lo que se observa en certificados reales (obs. técnica 12/10/2026)",
      "13-lo-que-se-observa-en-certificados-reales-obs-técnica-12102026",
    ],
    [
      3,
      "1.4 Señales heurísticas (suman, no concluyen)",
      "14-señales-heurísticas-suman-no-concluyen",
    ],
    [
      3,
      "1.5 Dónde falla gob.es como garantía",
      "15-dónde-falla-gobes-como-garantía",
    ],
    [
      2,
      "2. Dominios oficiales de los organismos más suplantados",
      "2-dominios-oficiales-de-los-organismos-más-suplantados",
    ],
    [3, "2.1 Tabla principal", "21-tabla-principal"],
    [
      3,
      "2.2 Dominios legítimos que no cumplen el patrón gob.es",
      "22-dominios-legítimos-que-no-cumplen-el-patrón-gobes",
    ],
    [
      2,
      "3. Patrones por nivel de administración",
      "3-patrones-por-nivel-de-administración",
    ],
    [
      3,
      "3.1 Administración General del Estado",
      "31-administración-general-del-estado",
    ],
    [
      3,
      "3.2 Comunidades autónomas y ciudades autónomas",
      "32-comunidades-autónomas-y-ciudades-autónomas",
    ],
    [
      3,
      "3.3 Diputaciones, cabildos y consells",
      "33-diputaciones-cabildos-y-consells",
    ],
    [3, "3.4 Ayuntamientos", "34-ayuntamientos"],
    [
      3,
      "3.5 Dominio registrable con la Public Suffix List (PSL)",
      "35-dominio-registrable-con-la-public-suffix-list-psl",
    ],
    [
      2,
      "4. SMS, correos, llamadas y mensajería",
      "4-sms-correos-llamadas-y-mensajería",
    ],
    [
      3,
      "4.1 Qué dice la ley sobre avisos y notificaciones",
      "41-qué-dice-la-ley-sobre-avisos-y-notificaciones",
    ],
    [
      3,
      "4.2 Qué hace y qué no hace cada organismo (según sus comunicaciones oficiales)",
      "42-qué-hace-y-qué-no-hace-cada-organismo-según-sus-comunicaciones-oficiales",
    ],
    [
      3,
      "4.3 Remitentes alfanuméricos (alias) y numeración",
      "43-remitentes-alfanuméricos-alias-y-numeración",
    ],
    [3, "4.4 Fraudes recurrentes", "44-fraudes-recurrentes"],
    [
      3,
      "4.5 Ejemplos reales publicados de dominios fraudulentos",
      "45-ejemplos-reales-publicados-de-dominios-fraudulentos",
    ],
    [2, "5. Algoritmo de verificación", "5-algoritmo-de-verificación"],
    [3, "5.1 Entradas y salida", "51-entradas-y-salida"],
    [
      3,
      "5.2 Pasos deterministas para una URL",
      "52-pasos-deterministas-para-una-url",
    ],
    [
      3,
      "5.3 Casos de prueba (los marcados «ilustrativo» están construidos y no se han observado; no visitarlos)",
      "53-casos-de-prueba-los-marcados-ilustrativo-están-construidos-y-no-se-han-observado-no-visitarlos",
    ],
    [
      3,
      "5.4 Reglas de contenido (mensaje con enlace)",
      "54-reglas-de-contenido-mensaje-con-enlace",
    ],
    [
      3,
      "5.5 Cuando la web no es oficial: «la web buena es…»",
      "55-cuando-la-web-no-es-oficial-la-web-buena-es",
    ],
    [
      3,
      "5.6 SMS sin enlace, correo sin enlace y llamadas",
      "56-sms-sin-enlace-correo-sin-enlace-y-llamadas",
    ],
    [
      3,
      "5.7 Registros y límites del algoritmo",
      "57-registros-y-límites-del-algoritmo",
    ],
    [
      2,
      "6. Fuentes de datos para la allowlist",
      "6-fuentes-de-datos-para-la-allowlist",
    ],
    [
      2,
      "7. Limitaciones y falsos positivos o negativos",
      "7-limitaciones-y-falsos-positivos-o-negativos",
    ],
    [
      3,
      "7.1 Falsos positivos (marcar como no oficial algo que es oficial)",
      "71-falsos-positivos-marcar-como-no-oficial-algo-que-es-oficial",
    ],
    [
      3,
      "7.2 Falsos negativos (dar por bueno algo que no lo es)",
      "72-falsos-negativos-dar-por-bueno-algo-que-no-lo-es",
    ],
    [3, "7.3 Límites de datos", "73-límites-de-datos"],
    [
      3,
      "7.4 Datos que contradicen lo esperado",
      "74-datos-que-contradicen-lo-esperado",
    ],
    [
      2,
      "Anexo A. Semilla de allowlist: hosts del directorio de sedes de la AGE (PAG, 12/10/2026)",
      "anexo-a-semilla-de-allowlist-hosts-del-directorio-de-sedes-de-la-age-pag-12102026",
    ],
    [2, "Fuentes", "fuentes"],
    [3, "Normativa (BOE)", "normativa-boe"],
    [3, "Dominios y red", "dominios-y-red"],
    [
      3,
      "Punto de Acceso General y organismos",
      "punto-de-acceso-general-y-organismos",
    ],
    [3, "INCIBE", "incibe"],
    [3, "Datos abiertos", "datos-abiertos"],
  ],
  "04-asistente-tramites.md": [
    [2, "0. Resumen", "0-resumen"],
    [
      2,
      "1. Ley 39/2015 frente a Ley 40/2015",
      "1-ley-392015-frente-a-ley-402015",
    ],
    [3, "1.1 Qué regula cada una", "11-qué-regula-cada-una"],
    [
      3,
      "1.2 Respuesta a «¿la sede está en la 39 o en la 40?»",
      "12-respuesta-a-la-sede-está-en-la-39-o-en-la-40",
    ],
    [
      3,
      "1.3 Ley 39/2015: artículos que importan al ciudadano",
      "13-ley-392015-artículos-que-importan-al-ciudadano",
    ],
    [
      3,
      "1.4 Ley 40/2015: artículos que importan",
      "14-ley-402015-artículos-que-importan",
    ],
    [
      3,
      "1.5 RD 203/2021: artículos principales",
      "15-rd-2032021-artículos-principales",
    ],
    [2, "2. Sede electrónica", "2-sede-electrónica"],
    [3, "2.1 Qué es y qué debe tener", "21-qué-es-y-qué-debe-tener"],
    [3, "2.2 Sede, sede asociada y portal", "22-sede-sede-asociada-y-portal"],
    [3, "2.3 Cómo reconocer una sede", "23-cómo-reconocer-una-sede"],
    [
      3,
      "2.4 Punto de Acceso General y Carpeta Ciudadana",
      "24-punto-de-acceso-general-y-carpeta-ciudadana",
    ],
    [
      2,
      "3. DEHú (Dirección Electrónica Habilitada única)",
      "3-dehú-dirección-electrónica-habilitada-única",
    ],
    [3, "3.1 Qué es y base normativa", "31-qué-es-y-base-normativa"],
    [3, "3.2 Qué notificaciones aparecen", "32-qué-notificaciones-aparecen"],
    [
      3,
      "3.3 Relación con Notific@, Carpeta Ciudadana y la antigua DEH",
      "33-relación-con-notific-carpeta-ciudadana-y-la-antigua-deh",
    ],
    [3, "3.4 Avisos por correo y SMS", "34-avisos-por-correo-y-sms"],
    [3, "3.5 Reglas de plazo", "35-reglas-de-plazo"],
    [
      3,
      "3.6 Quién está obligado a recibir notificaciones electrónicas",
      "36-quién-está-obligado-a-recibir-notificaciones-electrónicas",
    ],
    [
      3,
      "3.7 Cómo se accede y quién puede acceder",
      "37-cómo-se-accede-y-quién-puede-acceder",
    ],
    [
      2,
      "4. Identificación, firma y representación",
      "4-identificación-firma-y-representación",
    ],
    [
      3,
      "4.1 Sistemas de identificación y firma",
      "41-sistemas-de-identificación-y-firma",
    ],
    [
      3,
      "4.2 Representación y apoderamientos",
      "42-representación-y-apoderamientos",
    ],
    [
      3,
      "4.3 Funcionarios habilitados y asistencia (art. 12)",
      "43-funcionarios-habilitados-y-asistencia-art-12",
    ],
    [2, "5. Registros e interoperabilidad", "5-registros-e-interoperabilidad"],
    [
      3,
      "Derecho a no aportar documentos (Ley 39 art. 28)",
      "derecho-a-no-aportar-documentos-ley-39-art-28",
    ],
    [2, "6. Catálogos de trámites", "6-catálogos-de-trámites"],
    [
      3,
      "6.1 SIA (Sistema de Información Administrativa)",
      "61-sia-sistema-de-información-administrativa",
    ],
    [
      3,
      "6.2 Buscador de trámites y otras entradas del PAG",
      "62-buscador-de-trámites-y-otras-entradas-del-pag",
    ],
    [3, "6.3 Catálogos autonómicos", "63-catálogos-autonómicos"],
    [
      3,
      "6.4 Pasarela Digital Única de la UE",
      "64-pasarela-digital-única-de-la-ue",
    ],
    [
      3,
      "6.5 Situaciones vitales: trámite, competente y enlace",
      "65-situaciones-vitales-trámite-competente-y-enlace",
    ],
    [2, "7. Protección de datos", "7-protección-de-datos"],
    [3, "7.1 Marco", "71-marco"],
    [
      3,
      "7.2 Legitimación en el sector público",
      "72-legitimación-en-el-sector-público",
    ],
    [3, "7.3 Información y derechos", "73-información-y-derechos"],
    [3, "7.4 DPD y autoridades de control", "74-dpd-y-autoridades-de-control"],
    [
      3,
      "7.5 Implicaciones para una herramienta de terceros que procesa documentos o datos personales con un LLM",
      "75-implicaciones-para-una-herramienta-de-terceros-que-procesa-documentos-o-datos-personales-con-un-llm",
    ],
    [
      3,
      "7.6 Reglamento europeo de IA (UE 2024/1689) y guías",
      "76-reglamento-europeo-de-ia-ue-20241689-y-guías",
    ],
    [2, "8. ENS, ENI y accesibilidad", "8-ens-eni-y-accesibilidad"],
    [
      3,
      "8.1 Esquema Nacional de Seguridad (RD 311/2022)",
      "81-esquema-nacional-de-seguridad-rd-3112022",
    ],
    [
      3,
      "8.2 Esquema Nacional de Interoperabilidad (RD 4/2010)",
      "82-esquema-nacional-de-interoperabilidad-rd-42010",
    ],
    [3, "8.3 Accesibilidad (RD 1112/2018)", "83-accesibilidad-rd-11122018"],
    [
      2,
      "9. Qué puede y qué no puede hacer una herramienta de terceros",
      "9-qué-puede-y-qué-no-puede-hacer-una-herramienta-de-terceros",
    ],
    [3, "Qué puede hacer", "qué-puede-hacer"],
    [3, "Qué no puede o no debe hacer", "qué-no-puede-o-no-debe-hacer"],
    [
      3,
      "Qué es posible con representación o habilitación",
      "qué-es-posible-con-representación-o-habilitación",
    ],
    [2, "Notas de verificación y límites", "notas-de-verificación-y-límites"],
    [2, "Fuentes", "fuentes"],
    [
      3,
      "Normativa (BOE, texto consolidado)",
      "normativa-boe-texto-consolidado",
    ],
    [3, "Administración electrónica", "administración-electrónica"],
    [3, "Protección de datos", "protección-de-datos"],
  ],
  "04b-gestores-expedientes.md": [
    [
      2,
      "1. Qué es un gestor de expedientes y qué piezas lo rodean",
      "1-qué-es-un-gestor-de-expedientes-y-qué-piezas-lo-rodean",
    ],
    [
      2,
      "2. AGE: servicios comunes y soluciones",
      "2-age-servicios-comunes-y-soluciones",
    ],
    [2, "3. Comunidades autónomas", "3-comunidades-autónomas"],
    [
      2,
      "4. Diputaciones y entes supramunicipales",
      "4-diputaciones-y-entes-supramunicipales",
    ],
    [3, "4.1 Tabla principal", "41-tabla-principal"],
    [3, "4.2 Sedipualba en detalle", "42-sedipualba-en-detalle"],
    [2, "5. Proveedores privados", "5-proveedores-privados"],
    [2, "6. Grandes ayuntamientos", "6-grandes-ayuntamientos"],
    [
      3,
      "6.1 Los 25 municipios más poblados",
      "61-los-25-municipios-más-poblados",
    ],
    [
      3,
      "6.2 Capitales de provincia de la Comunitat Valenciana",
      "62-capitales-de-provincia-de-la-comunitat-valenciana",
    ],
    [
      3,
      "6.3 València: solución propia (PIAE)",
      "63-valència-solución-propia-piae",
    ],
    [
      2,
      "7. Cómo identificar la plataforma de una sede",
      "7-cómo-identificar-la-plataforma-de-una-sede",
    ],
    [
      2,
      "8. Datos abiertos y fuentes para ampliar el mapa",
      "8-datos-abiertos-y-fuentes-para-ampliar-el-mapa",
    ],
    [2, "Fuentes", "fuentes"],
    [3, "Plataformas y proveedores", "plataformas-y-proveedores"],
    [3, "AGE y CTT", "age-y-ctt"],
    [3, "CCAA", "ccaa"],
    [3, "Diputaciones", "diputaciones"],
    [3, "Grandes ayuntamientos", "grandes-ayuntamientos"],
  ],
  "05-guia-elecciones.md": [
    [2, "1. La convocatoria", "1-la-convocatoria"],
    [
      3,
      "1.1 Qué dice el Real Decreto 806/2026",
      "11-qué-dice-el-real-decreto-8062026",
    ],
    [3, "1.2 Calendario oficial", "12-calendario-oficial"],
    [3, "1.3 Qué se elige", "13-qué-se-elige"],
    [2, "2. Cómo votar", "2-cómo-votar"],
    [3, "2.1 Votación presencial", "21-votación-presencial"],
    [
      3,
      "2.2 Voto por correo (residentes en España)",
      "22-voto-por-correo-residentes-en-españa",
    ],
    [
      3,
      "2.3 Residentes ausentes en el extranjero (CERA)",
      "23-residentes-ausentes-en-el-extranjero-cera",
    ],
    [
      3,
      "2.4 Electores temporalmente en el extranjero (ERTA)",
      "24-electores-temporalmente-en-el-extranjero-erta",
    ],
    [
      3,
      "2.5 Voto accesible y personas con discapacidad",
      "25-voto-accesible-y-personas-con-discapacidad",
    ],
    [3, "2.6 Permiso laboral para votar", "26-permiso-laboral-para-votar"],
    [3, "2.7 Miembros de mesa", "27-miembros-de-mesa"],
    [
      2,
      "3. El sistema electoral explicado",
      "3-el-sistema-electoral-explicado",
    ],
    [3, "3.1 Congreso (arts. 162-164 LOREG)", "31-congreso-arts-162-164-loreg"],
    [
      3,
      "3.2 Fórmula D'Hondt y barrera (art. 163)",
      "32-fórmula-dhondt-y-barrera-art-163",
    ],
    [
      3,
      "3.3 Voto en blanco, voto nulo y abstención",
      "33-voto-en-blanco-voto-nulo-y-abstención",
    ],
    [3, "3.4 Senado (arts. 165-166)", "34-senado-arts-165-166"],
    [2, "4. Programas y candidaturas", "4-programas-y-candidaturas"],
    [3, "4.1 Candidaturas oficiales", "41-candidaturas-oficiales"],
    [3, "4.2 Programas electorales", "42-programas-electorales"],
    [
      2,
      "5. Normas de campaña relevantes para una herramienta",
      "5-normas-de-campaña-relevantes-para-una-herramienta",
    ],
    [
      2,
      "6. Fact-checker: propuesta de alcance",
      "6-fact-checker-propuesta-de-alcance",
    ],
    [3, "6.1 Tipos de afirmación", "61-tipos-de-afirmación"],
    [3, "6.2 Formato de salida", "62-formato-de-salida"],
    [
      3,
      "6.3 Ejemplos del corpus del tipo (a) con fuente",
      "63-ejemplos-del-corpus-del-tipo-a-con-fuente",
    ],
    [
      3,
      "6.4 Datos estadísticos (tipo b): fuentes y limitaciones",
      "64-datos-estadísticos-tipo-b-fuentes-y-limitaciones",
    ],
    [3, "6.5 Verificadores profesionales", "65-verificadores-profesionales"],
    [
      3,
      "6.6 Reutilizar sus verificaciones",
      "66-reutilizar-sus-verificaciones",
    ],
    [3, "6.7 Riesgos", "67-riesgos"],
    [3, "6.8 Recomendación para 4,5 horas", "68-recomendación-para-45-horas"],
    [2, "Fuentes", "fuentes"],
    [3, "BOE", "boe"],
    [3, "Junta Electoral Central", "junta-electoral-central"],
    [
      3,
      "Ministerio del Interior (Infoelectoral)",
      "ministerio-del-interior-infoelectoral",
    ],
    [
      3,
      "INE / Oficina del Censo Electoral",
      "ine--oficina-del-censo-electoral",
    ],
    [3, "Correos", "correos"],
    [3, "Estadística europea", "estadística-europea"],
    [3, "Verificadores y redes", "verificadores-y-redes"],
    [3, "Google", "google"],
  ],
};

// 2248 → «2.248» (es-ES no agrupa los números de cuatro cifras).
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

function source() {
  return store.get("marco-fuente") === "local" ? "local" : "github";
}

function mdUrl(doc, slug) {
  const d = DOCS.find((x) => x.id === doc) || { file: "README" };
  const base = source() === "local" ? "../" : REPO;
  return base + d.file + ".md" + (slug ? "#" + slug : "");
}

// «3.2» → ancla del encabezado que empieza por ese número.
function findSlug(doc, sec) {
  const d = DOCS.find((x) => x.id === doc);
  if (!d) return sec;
  const list = TOC[d.file + ".md"] || [];
  if (!sec) return "";
  const norm = (s) => s.toLowerCase();
  const hit =
    list.find(([, t]) => t.startsWith(sec + " ") || t.startsWith(sec + ". ")) ||
    list.find(([, t]) => norm(t).startsWith(norm(sec)));
  return hit ? hit[2] : "";
}

function wireLinks(root = document) {
  root.querySelectorAll("[data-d]").forEach((a) => {
    a.href = mdUrl(a.dataset.d, findSlug(a.dataset.d, a.dataset.s || ""));
    a.target = "_blank";
    a.rel = "noopener";
    if (!a.textContent.trim())
      a.textContent = a.dataset.s ? "§ " + a.dataset.s : "Abrir el documento";
  });
}

function buildNav() {
  const here = document.body.dataset.doc || "";
  const nav = document.createElement("header");
  nav.className = "top";
  nav.innerHTML = `
    <div class="top-in">
      <a class="brand" href="index.html">MARCO<span class="long"> <b>·</b> BUILD NIGHT</span></a>
      <nav class="docnav" aria-label="Documentos">
        <a href="index.html" ${here ? "" : 'aria-current="page"'}>Índice</a>
        ${DOCS.map((d) => `<a class="c-${d.id}" href="${d.file}.html" title="${d.title}" ${here === d.id ? 'aria-current="page"' : ""}>${d.id}</a>`).join("")}
      </nav>
      <div class="tools">
        <div class="seg" role="group" aria-label="Dónde abrir el Markdown">
          <button type="button" data-src="github" title="Abrir los .md en GitHub">GitHub</button>
          <button type="button" data-src="local" title="Abrir los .md de tu copia local">Local</button>
        </div>
        <div class="seg" role="group" aria-label="Tema">
          <button type="button" data-th="light" title="Tema claro">Claro</button>
          <button type="button" data-th="dark" title="Tema oscuro">Oscuro</button>
        </div>
      </div>
    </div>`;
  document.body.prepend(nav);

  const paint = () => {
    nav
      .querySelectorAll("[data-src]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.src === source())),
      );
    const th =
      document.documentElement.dataset.theme ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    nav
      .querySelectorAll("[data-th]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.th === th)),
      );
  };
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.src) {
      store.set("marco-fuente", b.dataset.src);
      wireLinks();
    }
    if (b.dataset.th) {
      document.documentElement.dataset.theme = b.dataset.th;
      store.set("marco-tema", b.dataset.th);
    }
    paint();
  });
  paint();
}

function buildDocExtras() {
  const id = document.body.dataset.doc;
  if (!id) return;
  const i = DOCS.findIndex((d) => d.id === id);
  const d = DOCS[i];
  const list = TOC[d.file + ".md"] || [];
  const main = document.querySelector("main");

  const toc = document.createElement("details");
  toc.className = "toc";
  toc.id = "indice";
  toc.innerHTML = `<summary>Índice completo del documento · ${list.length} apartados</summary>
    <ul class="toclist">${list
      .map(
        ([lvl, t]) =>
          `<li class="l${lvl}"><a data-d="${id}" data-slug="${encodeURIComponent(t)}">${t}</a></li>`,
      )
      .join("")}</ul>`;
  main.append(toc);
  toc.querySelectorAll("a").forEach((a, k) => {
    a.removeAttribute("data-d");
    a.target = "_blank";
    a.rel = "noopener";
    a.dataset.slug2 = list[k][2];
  });

  const prev = DOCS[i - 1];
  const next = DOCS[i + 1];
  const pager = document.createElement("nav");
  pager.className = "pager";
  pager.innerHTML =
    (prev
      ? `<a class="c-${prev.id}" href="${prev.file}.html"><span>← ${prev.id}</span>${prev.title}</a>`
      : `<a href="index.html"><span>←</span>Índice general</a>`) +
    (next
      ? `<a class="nx c-${next.id}" href="${next.file}.html"><span>${next.id} →</span>${next.title}</a>`
      : `<a class="nx" href="index.html"><span>→</span>Índice general</a>`);
  main.append(pager);

  const foot = document.createElement("footer");
  foot.className = "foot";
  foot.innerHTML = `<div>Resumen visual de <code>tracks/comun/${d.file}.md</code>. Las cifras y reglas salen del documento; ante un ciudadano, cita siempre la fuente oficial que enlaza el Markdown.</div>
    <div>Lo marcado <span class="pill sv">sin verificar</span> en el documento hay que confirmarlo antes de usarlo.</div>`;
  main.append(foot);
}

function rewireToc() {
  const id = document.body.dataset.doc;
  if (!id) return;
  document
    .querySelectorAll(".toclist a")
    .forEach((a) => (a.href = mdUrl(id, a.dataset.slug2)));
}

// Tooltips: cualquier .info[data-tip] muestra su texto al pasar, enfocar o tocar.
function initTips() {
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.id = "tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);
  let current = null;

  const show = (el) => {
    if (current && current !== el)
      current.setAttribute("aria-expanded", "false");
    current = el;
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    el.setAttribute("aria-expanded", "true");
    el.setAttribute("aria-describedby", "tip");
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth,
      h = tip.offsetHeight;
    let x = Math.min(
      Math.max(16, r.left + r.width / 2 - w / 2),
      innerWidth - w - 16,
    );
    let y = r.bottom + 8;
    if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  };
  const hide = () => {
    if (!current) return;
    current.setAttribute("aria-expanded", "false");
    current.removeAttribute("aria-describedby");
    current = null;
    tip.hidden = true;
  };

  document.querySelectorAll(".info[data-tip]").forEach((el) => {
    el.type = "button";
    el.setAttribute("aria-label", "Más información");
    el.setAttribute("aria-expanded", "false");
    el.addEventListener("mouseenter", () => show(el));
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", () => show(el));
    el.addEventListener("blur", hide);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      current === el && !tip.hidden ? hide() : show(el);
    });
  });
  document.addEventListener("click", hide);
  document.addEventListener("keydown", (e) => e.key === "Escape" && hide());
  addEventListener("scroll", hide, { passive: true });
}

(function init() {
  const th = store.get("marco-tema");
  if (th) document.documentElement.dataset.theme = th;
  buildNav();
  buildDocExtras();
  wireLinks();
  rewireToc();
  initTips();
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-src]")) rewireToc();
  });
})();
