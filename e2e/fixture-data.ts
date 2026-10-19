import evento from "../test/fixtures/registro/evento.json" with { type: "json" };
import equipos from "../test/fixtures/registro/equipos.json" with { type: "json" };
import comite from "../test/fixtures/registro/comite.json" with { type: "json" };
import type { Gestion } from "../packages/shared/src/registro/gestion";

// Clave ficticia exclusiva del servidor efímero de pruebas.
export const fixtureKey = "buildnight-browser-fixture-key-00000000";
export const fixtureUrl = "http://127.0.0.1:4317";
export const initialConfig = {
  evento,
  equipos,
  comite,
  vistas: {
    clasificacion: true,
    personas: false,
    negociados: true,
    tablon: true,
    pantalla: true,
  },
} satisfies Omit<Gestion, "revision">;
