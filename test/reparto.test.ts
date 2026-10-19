import { expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { leerTracks, validarEquipos } from "../infra/equipos/preparar";
import { guardar, leer } from "../infra/reparto/almacen";
import {
  aEquipos,
  estadoVacio,
  fuera,
  importar,
  leerCsv,
  mover,
  nuevoGrupo,
  restaurar,
} from "../infra/reparto/reparto";

// Luma's guest export, trimmed to the columns the draft reads.
const cabecera = [
  "guest_id",
  "name",
  "approval_status",
  "checked_in_at",
  "¿Vienes con equipo o quieres que te busquemos uno?",
  "Nombre del equipo (solo si ya traes equipo, registraos usando el mismo)",
  "¿Qué haces mejor?",
  "Tus tres tracks favoritos (marca solo 3)",
  "¿Te apetece capitanear un equipo?",
  "Usuario de GitHub",
  "Si quieres el track libre: problema y solución en dos líneas",
  "Terms and Conditions",
];
const fila = (
  id: string,
  estado: string,
  equipo = "",
  tracks = "Buscador de ayudas",
  capitan = "No",
) => [
  id,
  `Demo ${id}`,
  estado,
  "",
  equipo ? "Vengo con equipo" : "Buscadme equipo",
  equipo,
  "Frontend, IA",
  tracks,
  capitan,
  `https://github.com/demo-${id}/`,
  "",
  `Demo ${id}`,
];
const csv = (filas: string[][]) =>
  [cabecera, ...filas]
    .map((f) => f.map((c) => `"${c.replaceAll('"', '""')}"`).join(","))
    .join("\r\n");

test("reparto: lee comillas, saltos de línea y CRLF", () => {
  expect(leerCsv('a,"b ""c""\nd",e\r\n1,2,3\n')).toEqual([
    ["a", 'b "c"\nd', "e"],
    ["1", "2", "3"],
  ]);
});

test("reparto: agrupa por equipo declarado y respeta los cambios a mano", () => {
  let estado = importar(
    estadoVacio(),
    csv([
      fila("uno", "approved", "Los Demo"),
      fila("dos", "approved", "los  demo"),
      fila(
        "tres",
        "approved",
        "",
        "Track libre, Verificador de webs y mensajes",
      ),
      fila("cuatro", "declined", "Los Demo"),
    ]),
  );
  expect(estado.grupos.map((g) => g.miembros)).toEqual([["uno", "dos"]]);
  expect(estado.personas.tres?.tracks).toEqual(["libre", "sello"]);
  expect(estado.personas.tres?.equipo).toBe("");

  // A manual move survives the next import; a late approval joins its team
  // even after the group is renamed; whoever left Luma stays, flagged.
  mover(estado, "dos", "");
  estado.grupos[0]!.nombre = "Renombrado";
  estado = importar(
    estado,
    csv([
      fila("uno", "approved", "Los Demo"),
      fila("dos", "approved", "Los Demo"),
      fila("cuatro", "approved", "Los Demo"),
    ]),
  );
  expect(estado.grupos.map((g) => g.miembros)).toEqual([["uno", "cuatro"]]);
  expect(estado.personas.tres?.enLuma).toBe(false);
  expect(() => importar(estado, "a,b\n1,2")).toThrow("guest_id");
});

test("reparto: capitanea quien vino con equipo y se ofrece, si es el único", () => {
  const estado = importar(
    estadoVacio(),
    csv([
      fila("uno", "approved", "Solo uno", "", "Sí"),
      fila("dos", "approved", "Solo uno"),
      fila("tres", "approved", "Dos quieren", "", "Sí"),
      fila("cuatro", "approved", "Dos quieren", "", "Sí"),
      fila("cinco", "approved", "", "", "Sí"),
    ]),
  );
  expect(estado.grupos.map((g) => g.capitan)).toEqual(["uno", ""]);
  // Someone who came alone doesn't block the team's own volunteer.
  mover(estado, "cinco", estado.grupos[0]!.id);
  mover(estado, "uno", "");
  mover(estado, "uno", estado.grupos[0]!.id);
  expect(importar(estado, csv([])).grupos[0]?.capitan).toBe("uno");
});

test("reparto: exporta equipos.json que acepta infra/equipos", async () => {
  const tracks = await leerTracks();
  const estado = importar(
    estadoVacio(),
    csv(["a", "b", "c", "d"].map((id) => fila(id, "approved"))),
  );
  const grupo = (nombre: string, track: string, miembros: string[]) => ({
    ...nuevoGrupo(nombre),
    track,
    miembros,
  });
  estado.grupos = [
    grupo("Uno", "derechos", ["a"]),
    grupo("Dos", "derechos", ["b", "c"]),
    grupo("Tres", "libre", ["d"]),
  ];
  const equipos = aEquipos(estado, tracks);
  expect(equipos.map((e) => [e.id, e.mesa])).toEqual([
    ["derechos-a", "1"],
    ["derechos-b", "2"],
    ["libre", "3"],
  ]);
  // Exactly the shape infra/equipos reads, with nothing it would drop.
  expect(validarEquipos(equipos, tracks)).toEqual(
    equipos.map((e) => ({
      ...e,
      miembros: e.miembros.map((m) => m.slice(19, -1)),
      repo: `barracafh/build-${e.id}`,
    })),
  );

  // Restoring the export rebuilds the same groups; unknown handles are reported.
  const otro = { ...equipos[0]!, id: "derechos-c", miembros: ["demo-nadie"] };
  const vuelta = restaurar(estado, JSON.stringify([...equipos, otro]));
  expect(vuelta.estado.grupos.map((g) => [g.track, g.miembros])).toEqual([
    ["derechos", ["a"]],
    ["derechos", ["b", "c"]],
    ["libre", ["d"]],
    ["derechos", []],
  ]);
  expect(vuelta.sueltos).toEqual(["demo-nadie"]);
  expect(() => restaurar(estado, '[{"id":"x"}]')).toThrow("formato");

  estado.grupos.push(nuevoGrupo("Sin track"));
  expect(() => aEquipos(estado, tracks)).toThrow("no tiene track");
});

test("reparto: quien ya no está aprobado en Luma no se exporta", async () => {
  const tracks = await leerTracks();
  let estado = importar(
    estadoVacio(),
    csv([fila("a", "approved", "Uno"), fila("b", "approved", "Uno")]),
  );
  estado.grupos[0]!.track = "sello";
  estado = importar(
    estado,
    csv([fila("a", "approved", "Uno"), fila("b", "declined", "Uno")]),
  );
  expect(aEquipos(estado, tracks)[0]?.miembros).toEqual([
    "https://github.com/demo-a/",
  ]);
  expect(fuera(estado)).toEqual(["Demo b"]);
  // Leaving Luma altogether counts the same; a team left empty can't export.
  estado = importar(estado, csv([]));
  expect(() => aEquipos(estado, tracks)).toThrow("miembros aprobados");
});

test("reparto: id, repo y mesa no cambian al reordenar, borrar o restaurar", async () => {
  const tracks = await leerTracks();
  const estado = importar(
    estadoVacio(),
    csv(["a", "b", "c"].map((id) => fila(id, "approved"))),
  );
  estado.grupos = ["a", "b", "c"].map((id) => ({
    ...nuevoGrupo(`Equipo ${id}`),
    track: "derechos",
    miembros: [id],
  }));
  estado.grupos.pop();
  const primera = aEquipos(estado, tracks);
  // After the first export: drop derechos-a, add a new team in front.
  estado.grupos = [
    { ...nuevoGrupo("Nuevo"), track: "derechos", miembros: ["c"] },
    estado.grupos[1]!,
  ];
  const segunda = aEquipos(estado, tracks);
  expect(segunda.map((e) => [e.nombre, e.id, e.mesa])).toEqual([
    ["Nuevo", "derechos-c", "1"],
    [primera[1]!.nombre, "derechos-b", "2"],
  ]);

  // A restored file keeps its ids, repos and tables, whatever its order.
  const aplicado = [...segunda]
    .reverse()
    .map((e) => ({ ...e, mesa: `M${e.id}`, repo: `barracafh/otro-${e.id}` }));
  const { estado: vuelta } = restaurar(estado, JSON.stringify(aplicado));
  expect(aEquipos(vuelta, tracks)).toEqual(aplicado);
});

test("reparto: dos guardados a la vez dan uno bueno y un conflicto", async () => {
  const archivo = join(
    await mkdtemp(join(tmpdir(), "hacknight-reparto-")),
    "estado.json",
  );
  const [a, b] = await Promise.all([
    guardar(archivo, estadoVacio()),
    guardar(archivo, estadoVacio()),
  ]);
  expect([a.conflicto, b.conflicto]).toEqual([false, true]);
  expect(b.estado.version).toBe(1);
  expect((await leer(archivo)).version).toBe(1);
});
