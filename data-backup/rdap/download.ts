// RDAP response samples (Sello track). Criteria in README.md.
import { PoliteClient } from "../lib/polite";

// Only domains that are official or reserved: never the suspicious URLs of the
// test messages. One per registry, so each response format is covered.
const DOMAINS = [
  "correos.com", // official domain in dominios-oficiales.json (.com, Verisign)
  "example.com", // reserved by IANA (RFC 2606)
  "example.net",
  "example.org",
  "europa.eu",
  "nic.top", // registry domains of TLDs that are frequent in smishing
  "nic.xyz",
  "nic.info",
  "nic.shop",
  "nic.online",
  "dgt.es", // .es: rdap.org has no data (404)
];

const client = await new PoliteClient({
  dir: import.meta.dir,
  minIntervalMs: 3000,
  headers: { Accept: "application/rdap+json, application/json" },
}).load();

for (const domain of DOMAINS)
  await client.get(
    `https://rdap.org/domain/${domain}`,
    `domain/${domain}.json`,
  );

client.summary("RDAP");
