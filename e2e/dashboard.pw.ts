import { expect, test, type APIRequestContext } from "@playwright/test";
import type { Gestion } from "../shared/src/registro/gestion";
import { fixtureKey, initialConfig } from "./fixture-data";

async function configuration(request: APIRequestContext): Promise<Gestion> {
  const response = await request.get("/api/admin");
  await expect(response).toBeOK();
  const { tracks: _, ...config } = await response.json();
  return config;
}

async function saveConfiguration(
  request: APIRequestContext,
  update: (config: Gestion) => Gestion,
) {
  const response = await request.put("/api/admin", {
    data: update(await configuration(request)),
  });
  await expect(response).toBeOK();
}

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/admin/sesion", {
    data: { clave: fixtureKey },
  });
  await expect(response).toBeOK();
  await saveConfiguration(page.request, ({ revision }) => ({
    ...structuredClone(initialConfig),
    revision,
  }));
});

test("conserva pendientes las ediciones hechas durante un guardado", async ({
  page,
}) => {
  await page.goto("/admin");
  const name = page.getByLabel("Nombre del evento", { exact: true });
  await name.fill("Convocatoria enviada");

  const received = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let firstSave = true;
  await page.route("**/api/admin", async (route) => {
    if (route.request().method() !== "PUT" || !firstSave) {
      await route.continue();
      return;
    }
    firstSave = false;
    const response = await route.fetch();
    received.resolve();
    await release.promise;
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Guardar configuración" })
    .first()
    .click();
  await received.promise;
  await name.fill("Convocatoria editada durante el envío");
  expect((await configuration(page.request)).evento.nombre).toBe(
    "Convocatoria enviada",
  );
  release.resolve();

  await expect(page.locator("#mensaje")).toContainText(
    "Quedan cambios posteriores por guardar.",
  );
  await expect(page.locator("#estado-guardado")).toHaveText(
    "Cambios pendientes de guardar.",
  );
  await expect(name).toHaveValue("Convocatoria editada durante el envío");

  const warning = page.waitForEvent("dialog");
  await page.evaluate(() => {
    setTimeout(() => location.reload(), 0);
  });
  const dialog = await warning;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await expect(name).toHaveValue("Convocatoria editada durante el envío");

  await page
    .getByRole("button", { name: "Guardar configuración" })
    .first()
    .click();
  await expect(page.locator("#estado-guardado")).toContainText(
    "Configuración guardada",
  );
  expect((await configuration(page.request)).evento.nombre).toBe(
    "Convocatoria editada durante el envío",
  );
});

test("actualiza los filtros al activar la clasificación con el catálogo oculto", async ({
  page,
}) => {
  await saveConfiguration(page.request, (config) => ({
    ...config,
    vistas: { ...config.vistas, clasificacion: false, negociados: false },
  }));
  await page.goto("/");
  await expect(page.locator("#conexion")).toHaveText("● EN DIRECTO");
  await expect(page.locator("#filtro-track option")).toHaveCount(1);

  await saveConfiguration(page.request, (config) => ({
    ...config,
    vistas: { ...config.vistas, clasificacion: true },
  }));
  const state = await (await page.request.get("/api/estado")).json();
  expect(state.tracks).toEqual([]);
  expect(state.consumo.tracks.length).toBeGreaterThan(0);
  await expect(page.locator("#clasificacion")).toBeVisible();
  await expect(page.locator("#filtro-track option")).toHaveCount(
    state.consumo.tracks.length + 1,
  );
  await page.getByRole("combobox").selectOption("derechos");
  await expect(page.locator("#ranking tr")).toHaveCount(1);
  await expect(page.locator("#ranking")).toContainText(
    initialConfig.equipos[0]!.nombre,
  );
});

test("actualiza equipos y mesas en el detalle que permanece abierto", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-track="derechos"]').click();
  const detail = page.locator("#detalle");
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(initialConfig.equipos[0]!.nombre);

  await saveConfiguration(page.request, (config) => ({
    ...config,
    equipos: config.equipos.map((team) =>
      team.id === "squad-taronja"
        ? { ...team, nombre: "Equipo ficticio actualizado", mesa: "9" }
        : team,
    ),
  }));
  await expect(detail).toContainText("Equipo ficticio actualizado · Mesa 9");
  await expect(detail).not.toContainText(initialConfig.equipos[0]!.nombre);
  await expect(detail).toBeVisible();

  await saveConfiguration(page.request, (config) => ({
    ...config,
    equipos: config.equipos.filter((team) => team.id !== "squad-taronja"),
  }));
  await expect(detail).toContainText("Pendiente de asignación");
  await expect(detail).not.toContainText("Equipo ficticio actualizado");
});
