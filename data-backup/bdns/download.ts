// Offline copy of the BDNS API (Derechos track). Criteria in README.md.
import { PoliteClient } from "../lib/polite";

const API = "https://www.infosubvenciones.es/bdnstrans/api";
const YEAR_FROM = "01/01/2026";
const DETAIL_FROM = "01/07/2026";
const CV = "54,55,56,57";
const VALENCIA_CITY = "2903";
const PAGE_SIZE = 10_000;

const client = await new PoliteClient({
  dir: import.meta.dir,
  minIntervalMs: 1100,
  headers: { Accept: "application/json" },
}).load();

async function getJson(url: string, file: string) {
  const result = await client.get(url, file);
  if (!result || result.entry.status !== 200) return null;
  return JSON.parse(new TextDecoder().decode(result.body));
}

type Params = Record<string, string | undefined>;

const query = (params: Params) =>
  new URLSearchParams(
    Object.entries({ vpd: "GE", ...params }).filter(
      (pair): pair is [string, string] => pair[1] !== undefined,
    ),
  )
    .toString()
    .replaceAll("%2C", ",")
    .replaceAll("%2F", "/");

/** Walks every page of a search and returns the BDNS numbers it lists. */
async function search(name: string, params: Params, pageSize = PAGE_SIZE) {
  const numbers: string[] = [];
  for (let page = 0; ; page++) {
    const data = await getJson(
      `${API}/convocatorias/busqueda?${query({
        page: String(page),
        pageSize: String(pageSize),
        order: "fechaRecepcion",
        direccion: "desc",
        ...params,
      })}`,
      `busquedas/${name}-p${page}.json`,
    );
    if (!data) break;
    for (const item of data.content ?? [])
      numbers.push(item.numeroConvocatoria);
    if (data.last !== false || pageSize < PAGE_SIZE) break;
  }
  return numbers;
}

const SCOPES: Record<string, Params> = {
  gva: { tipoAdministracion: "A", regiones: CV },
  estado: { tipoAdministracion: "C" },
  ajuntament: { tipoAdministracion: "L", organos: VALENCIA_CITY },
  "locales-cv": { tipoAdministracion: "L", regiones: CV },
};

console.log("Catálogos");
for (const name of [
  "regiones",
  "finalidades",
  "beneficiarios",
  "instrumentos",
  "actividades",
  "objetivos",
  "reglamentos",
])
  await getJson(`${API}/${name}?vpd=GE`, `catalogos/${name}.json`);
await getJson(`${API}/sectores`, "catalogos/sectores.json");
for (const admin of ["A", "C", "L", "O"])
  await getJson(
    `${API}/organos?vpd=GE&idAdmon=${admin}`,
    `catalogos/organos-${admin}.json`,
  );
await getJson(
  `${API}/organos/codigo?codigo=L01462508`,
  "catalogos/organo-L01462508.json",
);
await client.get(
  "https://www.infosubvenciones.es/bdnstrans/estaticos/doc/snpsap-api.json",
  "snpsap-api.json",
);

console.log("Llamadas probadas en SETUP.md");
for (const name of ["gva", "estado", "ajuntament"])
  await search(
    `setup-${name}`,
    { tiposBeneficiario: "1", fechaDesde: DETAIL_FROM, ...SCOPES[name] },
    50,
  );
await getJson(
  `${API}/convocatorias/ultimas?${query({ page: "0", pageSize: "100", order: "fechaRecepcion", direccion: "desc" })}`,
  "busquedas/ultimas-p0.json",
);

console.log(`Listados completos desde ${YEAR_FROM}`);
for (const [name, params] of Object.entries(SCOPES))
  await search(`2026-${name}`, { fechaDesde: YEAR_FROM, ...params });

console.log(`Fichas desde ${DETAIL_FROM} (personas físicas y autónomos)`);
const numbers = new Set<string>();
for (const [name, params] of Object.entries(SCOPES)) {
  // The city council is small enough to keep whole, for any beneficiary.
  const types = name === "ajuntament" ? {} : { tiposBeneficiario: "1,3" };
  const found = await search(`fichas-${name}`, {
    fechaDesde: DETAIL_FROM,
    ...params,
    ...types,
  });
  for (const number of found) numbers.add(number);
}
console.log(`  ${numbers.size} fichas`);
for (const number of numbers)
  await client.get(
    `${API}/convocatorias?vpd=GE&numConv=${number}`,
    `fichas/${number}.json`,
  );

client.summary("BDNS");
