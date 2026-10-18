import { actualizarMarca } from "./marca.js";
const $ = (id) => document.getElementById(id);
const form = $("configuracion"),
  teamForm = $("equipo-form");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const labels = {
  clasificacion: "Tokenmaxxing · squads y tracks",
  personas: "Ranking individual de participantes",
  negociados: "Catálogo de negociados y equipos",
  tablon: "Tablón y entregas",
  pantalla: "Modo proyector",
};
let state,
  teams = [],
  editing = null,
  dirty = false,
  draftVersion = 0,
  busy = false;
function message(text, error = false) {
  $("mensaje").textContent = text;
  $("mensaje").className = error ? "error" : "admin-message";
}
function markDirty() {
  dirty = true;
  draftVersion += 1;
  $("estado-guardado").textContent = "Cambios pendientes de guardar.";
}
const handles = (value) =>
  value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
const field = (name) => form.elements.namedItem(name);
const teamField = (name) => teamForm.elements.namedItem(name);
function localDate(iso) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
}
function eventDate(name) {
  const value = field(name).value;
  const previous = state.evento[name];
  return Date.parse(value) === Date.parse(localDate(previous))
    ? previous
    : new Date(value).toISOString();
}
async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      $("login").hidden = false;
      form.hidden = true;
      $("salir").hidden = true;
    }
    throw new Error(data.error || "No se pudo guardar. Reintenta.");
  }
  return data;
}
function renderTeams() {
  const count = teams.reduce((n, t) => n + t.miembros.length, 0);
  $("resumen").textContent =
    `${teams.length} equipo(s) · ${count} participante(s)`;
  $("equipos").innerHTML = teams.length
    ? teams
        .map(
          (t, i) =>
            `<article class="admin-team"><p class="eyebrow">MESA ${esc(t.mesa)} · ${esc(state.tracks.find((s) => s.slug === t.herramienta)?.nombre ?? t.herramienta)}</p><h3>${esc(t.nombre)}</h3><p>${esc(t.pieza)}</p><p class="team-members">${t.miembros.length ? t.miembros.map((m) => `<span>@${esc(m)}</span>`).join("") : "Sin participantes asignados"}</p><div class="team-actions"><button type="button" data-edit="${i}">Editar ${esc(t.nombre)}</button><button type="button" data-remove="${i}">Quitar equipo</button></div></article>`,
        )
        .join("")
    : '<div class="empty admin-empty"><h3>Todo empieza con un equipo.</h3><p>Aún no hay equipos ni participantes. Crea el primero y asígnale su negociado.</p></div>';
}
async function load() {
  try {
    state = await request("/api/admin");
    teams = structuredClone(state.equipos);
    actualizarMarca(state.evento);
    for (const key of ["nombre", "nombre_corto", "organizan"])
      field(key).value = state.evento[key];
    field("inicio").value = localDate(state.evento.inicio);
    field("fin").value = localDate(state.evento.fin);
    field("fueraPlazo").checked = state.evento.registroFueraDePlazo;
    field("comite").value = state.comite.join("\n");
    $("vistas").innerHTML = Object.entries(labels)
      .map(
        ([key, label]) =>
          `<label class="check"><input type="checkbox" name="vista-${key}" ${state.vistas[key] ? "checked" : ""}>${label}</label>`,
      )
      .join("");
    $("zona-horaria").textContent =
      `Horario en la zona de este equipo: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. La web lo muestra en hora de València.`;
    renderTeams();
    dirty = false;
    $("estado-guardado").textContent =
      `Configuración guardada · revisión ${state.revision}.`;
    $("login").hidden = true;
    form.hidden = false;
    $("salir").hidden = false;
    message("");
  } catch (e) {
    message(e.message, true);
  }
}
$("login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.submitter;
  button.disabled = true;
  try {
    await request("/api/admin/sesion", {
      method: "POST",
      body: JSON.stringify({ clave: $("clave").value.trim() }),
    });
    $("clave").value = "";
    await load();
  } catch (e) {
    message(e.message, true);
  } finally {
    button.disabled = false;
  }
});
form.addEventListener("input", markDirty);
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return;
  if (Date.parse(field("fin").value) <= Date.parse(field("inicio").value)) {
    message("El fin debe ser posterior al inicio.", true);
    return;
  }
  busy = true;
  const savingVersion = draftVersion;
  form
    .querySelectorAll('button[type="submit"]')
    .forEach((b) => (b.disabled = true));
  const { tracks, ...previous } = state;
  const next = {
    ...previous,
    equipos: teams,
    comite: handles(field("comite").value),
    evento: {
      ...state.evento,
      nombre: field("nombre").value,
      nombre_corto: field("nombre_corto").value,
      organizan: field("organizan").value,
      inicio: eventDate("inicio"),
      fin: eventDate("fin"),
      registroFueraDePlazo: field("fueraPlazo").checked,
    },
    vistas: Object.fromEntries(
      Object.keys(labels).map((k) => [k, field(`vista-${k}`).checked]),
    ),
  };
  try {
    const saved = await request("/api/admin", {
      method: "PUT",
      body: JSON.stringify(next),
    });
    state = { ...saved, tracks };
    actualizarMarca(state.evento);
    dirty = draftVersion !== savingVersion;
    $("estado-guardado").textContent = dirty
      ? "Cambios pendientes de guardar."
      : `Configuración guardada · revisión ${saved.revision}.`;
    message(
      dirty
        ? "Se guardó la versión enviada. Quedan cambios posteriores por guardar."
        : "Configuración guardada. Las vistas se actualizan en directo.",
    );
  } catch (e) {
    message(e.message, true);
  } finally {
    busy = false;
    form
      .querySelectorAll('button[type="submit"]')
      .forEach((b) => (b.disabled = false));
  }
});
function pieces() {
  $("piezas").innerHTML = (
    state.tracks.find((t) => t.slug === teamField("herramienta").value)
      ?.piezas ?? []
  )
    .map((p) => `<option value="${esc(p)}">`)
    .join("");
}
function editTeam(i = null) {
  editing = i;
  teamForm.reset();
  $("equipo-titulo").textContent =
    i === null ? "Crear equipo" : "Editar equipo";
  teamField("herramienta").innerHTML = state.tracks
    .filter((t) => t.estado !== "fuera")
    .map(
      (t) =>
        `<option value="${esc(t.slug)}">${esc(t.nombre)} · Ventanilla ${t.ventanilla}</option>`,
    )
    .join("");
  if (i !== null)
    for (const [key, value] of Object.entries(teams[i]))
      teamField(key).value = Array.isArray(value) ? value.join("\n") : value;
  teamField("id").readOnly = i !== null;
  $("equipo-error").hidden = true;
  pieces();
  $("equipo-dialog").showModal();
}
teamField("herramienta").addEventListener("change", pieces);
$("nuevo-equipo").addEventListener("click", () => editTeam());
$("cancelar-equipo").addEventListener("click", () =>
  $("equipo-dialog").close(),
);
teamForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const team = Object.fromEntries(new FormData(teamForm));
  team.miembros = handles(team.miembros);
  const others = teams.filter((_, i) => i !== editing);
  const used = others.flatMap((t) => t.miembros).map((u) => u.toLowerCase());
  let error = "";
  if (others.some((t) => t.id === team.id)) error = "Ese id ya existe.";
  else if (team.miembros.length > 5)
    error = "El equipo admite hasta 5 participantes.";
  else if (
    team.miembros.some((u) => !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(u))
  )
    error = "Usa handles de GitHub sin @, uno por línea.";
  else if (
    new Set(team.miembros.map((u) => u.toLowerCase())).size !==
      team.miembros.length ||
    team.miembros.some((u) => used.includes(u.toLowerCase()))
  )
    error = "Cada participante debe aparecer una sola vez y en un solo equipo.";
  if (error) {
    $("equipo-error").textContent = error;
    $("equipo-error").hidden = false;
    return;
  }
  if (editing === null) teams.push(team);
  else teams[editing] = team;
  markDirty();
  renderTeams();
  $("equipo-dialog").close();
});
$("equipos").addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]"),
    remove = e.target.closest("[data-remove]");
  if (edit) editTeam(Number(edit.dataset.edit));
  if (
    remove &&
    confirm(
      "¿Quitar este equipo del borrador? Sus participantes dejarán de aparecer en el ranking al guardar. El historial de tokens se conserva.",
    )
  ) {
    teams.splice(Number(remove.dataset.remove), 1);
    markDirty();
    renderTeams();
  }
});
$("recargar").addEventListener("click", () => {
  if (!dirty || confirm("¿Descartar los cambios pendientes y recargar?"))
    void load();
});
$("salir").addEventListener("click", async () => {
  if (dirty && !confirm("¿Salir sin guardar los cambios?")) return;
  try {
    await request("/api/admin/sesion", { method: "DELETE" });
    dirty = false;
    state = undefined;
    teams = [];
    form.hidden = true;
    $("login").hidden = false;
    $("salir").hidden = true;
    message("Sesión cerrada.");
  } catch (e) {
    message(e.message, true);
  }
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
void load();
