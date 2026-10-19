// Original results package of the 23 July 2023 general election (¿Cómo voto? track).
import { PoliteClient } from "../lib/polite";

const client = await new PoliteClient({ dir: import.meta.dir }).load();

await client.get(
  "https://infoelectoral.interior.gob.es/estaticos/docxl/apliextr/02202307_MUNI.zip",
  "02202307_MUNI.zip",
);

client.summary("Infoelectoral");
