// Offline copy of the INCIBE citizen warnings (Sello track). Criteria in README.md.
import { fileFor, PoliteClient } from "../lib/polite";

const SITE = "https://www.incibe.es";
const LISTING_PAGES = 5;

const client = await new PoliteClient({
  dir: import.meta.dir,
  minIntervalMs: 2000,
}).load();

console.log("Feeds RSS");
for (const path of [
  "/ciudadania/avisos/feed",
  "/ciudadania/blog/feed",
  "/empresas/avisos/feed",
])
  await client.get(`${SITE}${path}`, fileFor(`${SITE}${path}`, "xml"));

console.log(`Listado de avisos: ${LISTING_PAGES} páginas`);
const warnings = new Set<string>();
for (let page = 0; page < LISTING_PAGES; page++) {
  const url = `${SITE}/ciudadania/avisos${page ? `?page=${page}` : ""}`;
  const result = await client.get(url, `listado/avisos-p${page}.html`);
  if (!result || result.entry.status !== 200) break;
  const html = new TextDecoder().decode(result.body);
  for (const [, slug] of html.matchAll(
    /href="\/ciudadania\/avisos\/([a-z0-9-]+)"/g,
  ))
    if (slug !== "feed") warnings.add(slug!);
}

console.log(`Avisos: ${warnings.size}`);
for (const slug of warnings)
  await client.get(`${SITE}/ciudadania/avisos/${slug}`, `avisos/${slug}.html`);

client.summary("INCIBE");
