import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RegistroLocal } from "../packages/shared/src/registro/local";
import { AlmacenUso } from "../apps/server/src/almacen";
import { crearHandler } from "../apps/server/src/servidor";
import { fixtureKey, fixtureUrl } from "./fixture-data";

const dir = await mkdtemp(join(tmpdir(), "hacknight-browser-"));
const registry = join(dir, "registro");
let store: AlmacenUso | undefined;
let server: ReturnType<typeof Bun.serve> | undefined;
const stopped = Promise.withResolvers<void>();
const stop = () => stopped.resolve();
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  await cp(new URL("../test/fixtures/registro", import.meta.url), registry, {
    recursive: true,
  });
  store = new AlmacenUso(join(dir, "uso.sqlite"));
  const url = new URL(fixtureUrl);
  server = Bun.serve({
    hostname: url.hostname,
    port: Number(url.port),
    maxRequestBodySize: 256_000,
    fetch: crearHandler(new RegistroLocal(registry), store, fixtureKey),
  });
  console.log(`Servidor de pruebas ficticias disponible en ${fixtureUrl}`);
  await stopped.promise;
} finally {
  process.off("SIGINT", stop);
  process.off("SIGTERM", stop);
  await server?.stop(true);
  store?.close();
  await rm(dir, { recursive: true, force: true });
}
