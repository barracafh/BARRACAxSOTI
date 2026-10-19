// Consolidated texts cited by Claridad and ¿Cómo voto?, from the BOE open data API.
import { PoliteClient } from "../lib/polite";

const API = "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id";
const LAWS = {
  "BOE-A-2015-10565": "Ley 39/2015, del Procedimiento Administrativo Común",
  "BOE-A-1985-11672": "Ley Orgánica 5/1985, del Régimen Electoral General",
};

const client = await new PoliteClient({
  dir: import.meta.dir,
  headers: { Accept: "application/xml" },
}).load();

for (const id of Object.keys(LAWS))
  await client.get(`${API}/${id}`, `${id}.xml`);
// Royal Decree calling the 29 November election: it is not consolidated.
await client.get(
  "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742",
  "BOE-A-2026-20742.html",
);

client.summary("BOE");
