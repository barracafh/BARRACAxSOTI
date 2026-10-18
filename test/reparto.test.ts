import { expect, test } from "bun:test";
import { leerTracks, validarEquipos } from "../infra/equipos/preparar";
import {
  aEquipos,
  estadoVacio,
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
  const derechos = tracks.find((t) => t.slug === "derechos")!;
  expect(equipos[1]?.pieza).toBe(derechos.piezas[1]!);
  expect(validarEquipos(equipos, tracks)[2]?.miembros).toEqual(["demo-d"]);

  // Restoring the export rebuilds the same groups; unknown handles are reported.
  const otro = { ...equipos[0]!, miembros: ["demo-nadie"] };
  const vuelta = restaurar(estado, JSON.stringify([...equipos, otro]));
  expect(
    vuelta.estado.grupos.map((g) => [g.track, g.pieza, g.miembros]),
  ).toEqual([
    ["derechos", "Ayudas para ti", ["a"]],
    ["derechos", derechos.piezas[1]!, ["b", "c"]],
    ["libre", equipos[2]!.pieza, ["d"]],
    ["derechos", "Ayudas para ti", []],
  ]);
  expect(vuelta.sueltos).toEqual(["demo-nadie"]);
  expect(() => restaurar(estado, '[{"id":"x"}]')).toThrow("formato");

  estado.grupos.push(nuevoGrupo("Sin track"));
  expect(() => aEquipos(estado, tracks)).toThrow("no tiene track");
});
