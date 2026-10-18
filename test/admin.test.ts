import { test, expect, afterEach } from "bun:test";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  inicializarRegistro,
  administracion,
  type Gestion,
} from "@hacknight/shared/registro/gestion";
import { RegistroLocal } from "@hacknight/shared/registro/local";
import { contexto, miEquipo } from "../apps/cli/src/lib/contexto";
import { AlmacenUso } from "../apps/server/src/almacen";
import { crearHandler } from "../apps/server/src/servidor";
import { claveAdministracion } from "../apps/server/src/admin";
import { hash, ventanaId } from "@hacknight/shared/contrato-uso";
import { eventoBase } from "@hacknight/shared/evento";
import { banner } from "../apps/cli/src/lib/banner";
import { sello } from "../apps/cli/src/lib/justificante";

const directories: string[] = [];
afterEach(async () => {
  for (const dir of directories.splice(0))
    await rm(dir, { recursive: true, force: true });
});

const equipo = {
  id: "test-equipo",
  nombre: "Equipo de prueba",
  herramienta: "derechos",
  pieza: "Una pieza",
  mesa: "1",
  miembros: ["test-builder"],
  repo: "",
};
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-admin-test-"));
  directories.push(dir);
  await inicializarRegistro(dir);
  const ctx = await contexto({
    registro: pathToFileURL(dir).href,
    usuario: "test-builder",
  });
  const reg = ctx.registro as RegistroLocal;
  const almacen = new AlmacenUso(join(dir, "uso.sqlite"));
  const clave = "test-admin-key-only-for-isolated-unit-tests";
  const handler = crearHandler(ctx.registro as RegistroLocal, almacen, clave);
  const request = (
    path: string,
    method = "GET",
    body?: unknown,
    cookie = "",
    headers = {},
  ) =>
    handler(
      new Request(`http://127.0.0.1:4310${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  const login = async () => {
    const response = await request("/api/admin/sesion", "POST", { clave });
    expect(response.status).toBe(200);
    return response.headers.get("set-cookie")!.split(";")[0]!;
  };
  const publico = async () => (await request("/api/estado")).json();
  const config = await administracion(reg);
  config.evento.inicio = new Date(Date.now() - 60000).toISOString();
  config.evento.fin = new Date(Date.now() + 3600000).toISOString();
  config.equipos = [structuredClone(equipo)];
  const lote = {
    version: 1 as const,
    usuario: "test-builder",
    cliente: hash("cliente"),
    ventana: ventanaId(config.evento),
    eventos: [
      {
        id: hash("evento"),
        herramienta: "codex",
        fecha: new Date().toISOString(),
        input: 60,
        output: 30,
        cacheRead: 10,
        cacheWrite: 0,
      },
    ],
  };
  return {
    dir,
    ctx,
    reg,
    almacen,
    clave,
    handler,
    request,
    login,
    publico,
    config,
    lote,
  };
}

test("el arranque es vacío, idempotente y no inventa una identidad local", async () => {
  const f = await fixture();
  try {
    const s = await f.publico();
    expect(s.equipos).toEqual([]);
    expect(s.consumo).toMatchObject({
      total: 0,
      peticiones: 0,
      activos: 0,
      squads: [],
      personas: [],
    });
    expect(s.entradas).toEqual([]);
    expect(s.tracks).toHaveLength(6);
    expect(
      (await f.request("/api/demo", "POST", { accion: "impulso" })).status,
    ).toBe(404);
    await expect(new RegistroLocal(f.dir, "").usuario()).rejects.toThrow(
      "Falta tu identidad",
    );
    const original = await f.reg.evento();
    await writeFile(
      join(f.dir, "evento.json"),
      JSON.stringify({ ...original, nombre: "Configurado por el comité" }),
    );
    await inicializarRegistro(f.dir);
    expect((await f.reg.evento()).nombre).toBe("Configurado por el comité");
  } finally {
    f.almacen.close();
  }
});

test("la marca del registro llega a web, admin y CLI, con HTML escapado", async () => {
  const f = await fixture();
  try {
    expect(await f.reg.evento()).toEqual(eventoBase);
    for (const path of ["/", "/admin", "/pantalla"]) {
      const html = await (await f.request(path)).text();
      expect(html).toContain(eventoBase.nombre);
      expect(html).toContain('property="og:title"');
      expect(html).not.toContain("{{nombre");
    }
    const cookie = await f.login();
    f.config.evento.nombre = 'Otra noche "<&>" 🌙';
    f.config.evento.nombre_corto = "Otra noche";
    f.config.evento.organizan = "Comité & builders";
    expect(
      (await f.request("/api/admin", "PUT", f.config, cookie)).status,
    ).toBe(200);
    for (const path of ["/", "/admin", "/pantalla"]) {
      const html = await (await f.request(path)).text();
      expect(html).toContain("Otra noche &quot;&lt;&amp;&gt;&quot; 🌙");
      expect(html).toContain("Comité &amp; builders");
      expect(html).not.toContain(eventoBase.nombre);
    }
    const evento = await f.ctx.registro.evento();
    expect((await f.publico()).evento).toEqual(evento);
    expect(banner(80, null, evento)).toContain("OTRA NOCHE");
    expect(banner(80, null, evento)).toContain("Comité & builders");
    expect(sello(evento)).toContain("OTRA NOCHE");
  } finally {
    f.almacen.close();
  }
});

test("la administración exige sesión, bloquea otros orígenes y revoca la cookie al salir", async () => {
  const f = await fixture();
  try {
    expect((await f.request("/api/admin")).status).toBe(401);
    expect((await f.request("/api/admin", "PUT", f.config)).status).toBe(401);
    expect(
      (await f.request("/api/admin/sesion", "POST", { clave: "incorrecta" }))
        .status,
    ).toBe(401);
    expect(
      (
        await f.request("/api/admin/sesion", "POST", { clave: f.clave }, "", {
          Origin: "https://intruso.example",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await f.request("/api/admin/sesion", "POST", { clave: f.clave }, "", {
          "Content-Type": "text/plain",
        })
      ).status,
    ).toBe(415);
    const cookie = await f.login();
    expect(
      (await f.request("/api/admin", "GET", undefined, cookie)).status,
    ).toBe(200);
    expect(
      (
        await f.request("/api/admin", "PUT", f.config, cookie, {
          Origin: "https://intruso.example",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await f.request(
          "/api/admin",
          "PUT",
          { extra: "x".repeat(256001) },
          cookie,
        )
      ).status,
    ).toBe(413);
    expect(
      (await f.request("/api/admin/sesion", "DELETE", undefined, cookie))
        .status,
    ).toBe(200);
    expect(
      (await f.request("/api/admin", "PUT", f.config, cookie)).status,
    ).toBe(401);
    expect(await f.reg.equipos()).toEqual([]);
  } finally {
    f.almacen.close();
  }
});

test("equipos, comité y horario persisten y los comandos CLI ven la misma asignación", async () => {
  const f = await fixture();
  try {
    const cookie = await f.login();
    f.config.comite = ["test-mentor"];
    const res = await f.request("/api/admin", "PUT", f.config, cookie);
    expect(res.status).toBe(200);
    expect((await res.json()).revision).toBe(1);
    expect((await miEquipo(f.ctx)).equipo.id).toBe(equipo.id);
    const restarted = new RegistroLocal(f.dir, "test-builder");
    expect(await restarted.equipos()).toEqual([equipo]);
    expect(await restarted.comite()).toEqual(["test-mentor"]);
    expect((await restarted.evento()).inicio).toBe(f.config.evento.inicio);
    const publicText = JSON.stringify(await f.publico());
    expect(publicText).not.toContain("test-mentor");
    expect(publicText).not.toContain("test-builder");
    expect(publicText).not.toContain(f.clave);
    expect(publicText).not.toContain(f.dir);
    const newHandler = crearHandler(
      f.ctx.registro as RegistroLocal,
      f.almacen,
      f.clave,
    );
    expect(
      (
        await newHandler(
          new Request("http://127.0.0.1:4310/api/admin", {
            headers: { Cookie: cookie },
          }),
        )
      ).status,
    ).toBe(401);
  } finally {
    f.almacen.close();
  }
});

test("asignaciones inválidas se rechazan sin cambios parciales", async () => {
  const f = await fixture();
  const cases: [string, (g: Gestion) => void][] = [
    [
      "handle duplicado sin distinguir mayúsculas",
      (g) =>
        g.equipos.push({ ...equipo, id: "otro", miembros: ["TEST-builder"] }),
    ],
    ["id duplicado", (g) => g.equipos.push({ ...equipo, miembros: [] })],
    ["track inexistente", (g) => (g.equipos[0]!.herramienta = "inventado")],
    [
      "cupo libre",
      (g) =>
        (g.equipos = [
          { ...equipo, herramienta: "libre" },
          { ...equipo, id: "otro", herramienta: "libre", miembros: [] },
        ]),
    ],
    [
      "seis miembros",
      (g) => (g.equipos[0]!.miembros = ["a", "b", "c", "d", "e", "f"]),
    ],
    ["handle inválido", (g) => (g.equipos[0]!.miembros = ["@alguien"])],
    ["comité duplicado", (g) => (g.comite = ["Mentor", "mentor"])],
    ["horario inverso", (g) => (g.evento.fin = g.evento.inicio)],
  ];
  try {
    const cookie = await f.login();
    for (const [name, mutate] of cases) {
      const config = structuredClone(f.config);
      mutate(config);
      expect(
        (await f.request("/api/admin", "PUT", config, cookie)).status,
        name,
      ).toBe(400);
      expect((await administracion(f.reg)).revision).toBe(0);
      expect(await f.reg.equipos()).toEqual([]);
    }
    const draft = structuredClone(f.config);
    draft.equipos[0]!.miembros = [];
    expect((await f.request("/api/admin", "PUT", draft, cookie)).status).toBe(
      200,
    );
  } finally {
    f.almacen.close();
  }
});

test("dos administradores no pisan ediciones; guardar con una revisión vieja devuelve conflicto", async () => {
  const f = await fixture();
  try {
    const cookie = await f.login();
    const results = await Promise.all([
      f.request("/api/admin", "PUT", f.config, cookie),
      f.request(
        "/api/admin",
        "PUT",
        { ...f.config, comite: ["test-mentor"] },
        cookie,
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await administracion(f.reg)).revision).toBe(1);
    expect(
      (await f.request("/api/admin", "PUT", f.config, cookie)).status,
    ).toBe(409);
  } finally {
    f.almacen.close();
  }
});

test("deshabilitar vistas retira sus datos de la API y no interrumpe la recolección", async () => {
  const f = await fixture();
  try {
    const cookie = await f.login();
    await f.request(
      "/api/admin",
      "PUT",
      { ...f.config, comite: ["test-builder"] },
      cookie,
    );
    await f.reg.crearIssue("Prueba", "Aviso del comité", ["aviso"]);
    expect((await f.publico()).entradas).toHaveLength(1);
    let g = await administracion(f.reg);
    for (const k of Object.keys(g.vistas) as (keyof Gestion["vistas"])[])
      g.vistas[k] = false;
    expect((await f.request("/api/admin", "PUT", g, cookie)).status).toBe(200);
    expect((await f.request("/api/uso", "POST", f.lote)).status).toBe(200);
    expect(await f.publico()).toMatchObject({
      consumo: null,
      tracks: [],
      equipos: [],
      entradas: [],
      registros: [],
    });
    expect((await f.request("/pantalla")).status).toBe(403);
    g = await administracion(f.reg);
    g.vistas.clasificacion = true;
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.publico()).consumo).toMatchObject({
      total: 100,
      personas: [],
    });
    g = await administracion(f.reg);
    g.vistas.personas = true;
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.publico()).consumo.personas[0]).toMatchObject({
      usuario: "test-builder",
      total: 100,
    });
    g = await administracion(f.reg);
    g.vistas.pantalla = true;
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.request("/pantalla")).status).toBe(200);
  } finally {
    f.almacen.close();
  }
});

test("reasignar o retirar personas y cambiar la ventana no borra ni duplica los contadores", async () => {
  const f = await fixture();
  try {
    const cookie = await f.login();
    await f.request("/api/admin", "PUT", f.config, cookie);
    await f.request("/api/uso", "POST", f.lote);
    let g = await administracion(f.reg);
    g.equipos = [{ ...equipo, id: "nuevo", herramienta: "claridad" }];
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.publico()).consumo.squads[0]).toMatchObject({
      id: "nuevo",
      track: "claridad",
      total: 100,
    });
    g = await administracion(f.reg);
    g.equipos = [];
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.publico()).consumo.total).toBe(0);
    expect((await f.request("/api/uso", "POST", f.lote)).status).toBe(422);
    g = await administracion(f.reg);
    g.equipos = [equipo];
    g.evento.fin = new Date(Date.parse(g.evento.fin) + 60000).toISOString();
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.publico()).consumo.total).toBe(0);
    expect((await f.request("/api/uso", "POST", f.lote)).status).toBe(422);
    g = await administracion(f.reg);
    g.evento = f.config.evento;
    await f.request("/api/admin", "PUT", g, cookie);
    expect((await f.publico()).consumo.total).toBe(100);
    expect(
      (await (await f.request("/api/uso", "POST", f.lote)).json()).cambios,
    ).toBe(0);
  } finally {
    f.almacen.close();
  }
});

test("la clave local se conserva al reiniciar y solo el propietario puede leer el archivo", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hacknight-key-test-"));
  directories.push(dir);
  const first = await claveAdministracion(dir),
    next = await claveAdministracion(dir);
  expect(next.clave).toBe(first.clave);
  expect(first.clave.length).toBeGreaterThan(32);
  expect((await stat(first.path)).mode & 0o777).toBe(0o600);
  expect((await readFile(first.path, "utf8")).trim()).toBe(first.clave);
});

test("guardar el mismo horario con otro offset conserva la ventana y el consumo", async () => {
  const f = await fixture();
  try {
    const cookie = await f.login();
    f.config.evento.inicio = "2026-10-22T18:30:00+02:00";
    f.config.evento.fin = "2026-10-22T22:00:00+02:00";
    const canonical = {
      ...f.config.evento,
      inicio: "2026-10-22T16:30:00.000Z",
      fin: "2026-10-22T20:00:00Z",
    };
    expect(ventanaId(canonical)).toBe(ventanaId(f.config.evento));
    await f.request("/api/admin", "PUT", f.config, cookie);
    const lote = {
      ...f.lote,
      ventana: ventanaId(f.config.evento),
      eventos: [
        {
          ...f.lote.eventos[0]!,
          fecha: "2026-10-22T19:00:00Z" as string,
          herramienta: "codex" as const,
        },
      ],
    };
    f.almacen.recibir(
      lote,
      f.config.evento,
      f.config.equipos,
      Date.parse("2026-10-22T19:30:00Z"),
    );
    const g = await administracion(f.reg);
    await f.request("/api/admin", "PUT", { ...g, evento: canonical }, cookie);
    expect((await f.publico()).consumo.total).toBe(100);
  } finally {
    f.almacen.close();
  }
});

test("la recepción de uso no mezcla ventana y miembros de dos revisiones", async () => {
  const f = await fixture();
  try {
    const cookie = await f.login();
    await f.request("/api/admin", "PUT", f.config, cookie);
    const antes = await administracion(f.reg);
    const despues = structuredClone(antes);
    despues.evento.fin = new Date(
      Date.parse(despues.evento.fin) + 60000,
    ).toISOString();
    despues.equipos = [];
    expect((await f.request("/api/admin", "PUT", despues, cookie)).status).toBe(
      200,
    );
    // Modela dos lecturas independientes que atraviesan el guardado atómico:
    // una obtiene el nuevo horario y la otra aún conserva los miembros previos.
    f.reg.evento = async () => despues.evento;
    f.reg.equipos = async () => antes.equipos;
    const lote = { ...f.lote, ventana: ventanaId(despues.evento) };
    expect((await f.request("/api/uso", "POST", lote)).status).toBe(422);
    expect(
      f.almacen.clasificacion(
        despues.evento,
        antes.equipos,
        await f.reg.tracks(),
      ).total,
    ).toBe(0);
  } finally {
    f.almacen.close();
  }
});
