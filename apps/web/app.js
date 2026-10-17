import { actualizarMarca } from "./marca.js";
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = new Intl.NumberFormat("es-ES").format;
const compact = new Intl.NumberFormat("es-ES", {
  notation: "compact",
  maximumFractionDigits: 2,
}).format;
const clock = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});
const time = (value) => clock.format(new Date(value));
const trackStates = {
  nucleo: "NÚCLEO",
  "si-hay-gente": "SI HAY GENTE",
  condicional: "CONDICIONAL",
  libre: "CUPO LIBRE",
};
let state,
  group = "squads",
  selectedTrack = "",
  staticKey = "",
  filterKey = "",
  selectedDetail;
const projector = location.pathname === "/pantalla";
if (projector) {
  document.body.classList.add("proyector");
  $("tv-reloj").hidden = false;
  $("tv-link").href = "/";
  $("tv-link").textContent = "Volver a la web ↗";
}
const trackName = (slug) =>
  state.tracks.find((t) => t.slug === slug)?.nombre ?? slug;
const safeUrl = (value) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "#";
  } catch {
    return "#";
  }
};
function countdown() {
  if (!state) return;
  const start = Date.parse(state.evento.inicio),
    end = Date.parse(state.evento.fin),
    now = Date.now();
  const remaining = Math.max(
    0,
    Math.ceil(((now < start ? start : end) - now) / 1000),
  );
  $("reloj").textContent = [
    Math.floor(remaining / 3600),
    Math.floor((remaining % 3600) / 60),
    remaining % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  $("tv-reloj").textContent = $("reloj").textContent;
  $("plazo-label").textContent =
    now < start
      ? "EL BUILD ABRE EN"
      : now >= end
        ? "PLAZO CERRADO"
        : "EL PLAZO ES EL PLAZO";
  $("plazo").textContent = `${time(start)}–${time(end)} · Hora de València`;
  $("tipo-evento").textContent = "BUILD · EUROPE/MADRID";
}
function renderRanking() {
  if (!state?.consumo) {
    $("ranking").replaceChildren();
    return;
  }
  const consumo = state.consumo;
  const rows = consumo[group].filter(
    (r) =>
      !selectedTrack ||
      (group === "tracks" ? r.slug : r.track) === selectedTrack,
  );
  const sum = rows.reduce((s, r) => s + r.total, 0);
  $("grupo-titulo").textContent = {
    squads: "SQUAD / NEGOCIADO",
    personas: "PERSONA / SQUAD",
    tracks: "NEGOCIADO / TRACK",
  }[group];
  $("ranking").innerHTML = rows.length
    ? rows
        .map((r, i) => {
          const name = group === "personas" ? `@${r.usuario}` : r.nombre;
          const sub =
            group === "squads"
              ? `${trackName(r.track)} · Mesa ${r.mesa}`
              : group === "personas"
                ? `${consumo.squads.find((s) => s.id === r.equipo)?.nombre ?? r.equipo} · ${trackName(r.track)}`
                : r.slug;
          const fraction = sum ? (r.total / sum) * 100 : 0;
          return `<tr><td>${String(i + 1).padStart(2, "0")}</td><td><strong>${esc(name)}</strong><small>${esc(sub)}</small></td><td class="number" title="${esc(number(r.total))} tokens">${esc(number(r.total))}</td><td class="number"><svg class="bar" viewBox="0 0 65 5" role="img" aria-label="${fraction.toFixed(1)}% del total filtrado"><rect width="65" height="5" fill="var(--nit)"/><rect width="${fraction * 0.65}" height="5" fill="var(--magenta)"/></svg></td></tr>`;
        })
        .join("")
    : '<tr><td colspan="4">No hay participantes asignados a este negociado.</td></tr>';
  $("sin-consumo").hidden = consumo.total > 0;
}
function detail(slug) {
  const t = state.tracks.find((t) => t.slug === slug);
  if (!t) return;
  selectedDetail = slug;
  const squads = state.equipos.filter((s) => s.herramienta === slug);
  $("detalle-contenido").innerHTML =
    `<p class="eyebrow">NEGOCIADO · VENTANILLA ${t.ventanilla} · TRACK ${esc(t.slug)}</p><h2>${esc(t.nombre)}</h2><p>${esc(t.ciudadano)}</p><h3>Piezas para construir</h3><ul>${t.piezas.map((p) => `<li>${esc(p)}</li>`).join("")}</ul><p><strong>Lead:</strong> ${esc(t.lead)}<br><strong>Dificultad:</strong> ${esc(t.dificultad)}</p><h3>Squads</h3><p>${squads.length ? squads.map((s) => `${esc(s.nombre)} · Mesa ${esc(s.mesa)}`).join("<br>") : "Pendiente de asignación"}</p><h3>Fuentes de referencia</h3><ul>${t.fuentes.map((f) => `<li><a href="${esc(safeUrl(f.url))}" target="_blank" rel="noopener noreferrer">${esc(f.nombre)} ↗</a></li>`).join("")}</ul>`;
  if (!$("detalle").open) $("detalle").showModal();
}
function render() {
  const c = state.consumo ?? {
    total: 0,
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    peticiones: 0,
    activos: 0,
    squads: [],
    herramientas: [],
    evolucion: [],
    generado: Date.now(),
  };
  document.querySelectorAll("[data-vista]").forEach((el) => {
    el.hidden = !state.vistas[el.dataset.vista];
  });
  if (group === "personas" && !state.vistas.personas) {
    group = "squads";
    document
      .querySelectorAll("[data-group]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.group === group)),
      );
  }
  $("ventanilla").hidden = !state.vistas.ventanilla && !state.vistas.tablon;
  if (!state.vistas.negociados && $("detalle").open) $("detalle").close();
  $("contenido").hidden = projector && !state.vistas.pantalla;
  $("total").textContent = compact(c.total);
  $("total").title = `${number(c.total)} tokens`;
  $("total").dataset.total = String(c.total);
  $("peticiones").textContent = number(c.peticiones);
  $("activos").textContent = number(c.activos);
  $("squads").textContent = number(c.squads.length);
  $("actualizado").textContent =
    `ACT. ${new Date(c.generado).toLocaleTimeString("es-ES")}`;
  actualizarMarca(state.evento);
  $("comando").textContent = `hacknight observar --servidor ${location.origin}`;
  const active = state.tracks.filter((t) => t.estado !== "fuera");
  const filters = active.length ? active : (state.consumo?.tracks ?? []);
  const nextFilterKey = JSON.stringify(filters.map((t) => [t.slug, t.nombre]));
  if (nextFilterKey !== filterKey) {
    filterKey = nextFilterKey;
    if (!filters.some((t) => t.slug === selectedTrack)) selectedTrack = "";
    $("filtro-track").innerHTML =
      '<option value="">Todos</option>' +
      filters
        .map((t) => `<option value="${esc(t.slug)}">${esc(t.nombre)}</option>`)
        .join("");
    $("filtro-track").value = selectedTrack;
  }
  const key = JSON.stringify([state.tracks, state.equipos]);
  if (key !== staticKey) {
    staticKey = key;
    $("tracks").innerHTML = active
      .map(
        (t) =>
          `<button class="track" data-track="${esc(t.slug)}"><span class="eyebrow">VENTANILLA ${String(t.ventanilla).padStart(2, "0")} / ${esc(trackStates[t.estado])}</span><h3>${esc(t.nombre)}</h3><p>${esc(t.frase)}</p><span class="track-bottom"><span>${state.equipos.filter((e) => e.herramienta === t.slug).length} SQUAD(S) · TRACK ${esc(t.slug)}</span><span aria-hidden="true">↗</span></span></button>`,
      )
      .join("");
    if ($("detalle").open) {
      if (active.some((t) => t.slug === selectedDetail)) detail(selectedDetail);
      else $("detalle").close();
    }
  }
  renderRanking();
  $("desglose").innerHTML = [
    ["Entrada", c.input],
    ["Salida", c.output],
    ["Caché leída", c.cacheRead],
    ["Caché escrita", c.cacheWrite],
  ]
    .map(
      ([label, n]) =>
        `<div class="breakdown-row"><span>${label}</span><strong>${esc(number(n))}</strong></div>`,
    )
    .join("");
  $("herramientas").innerHTML = c.herramientas
    .map(
      (h) =>
        `<div class="tool"><div><span>${{ codex: "⬡ Codex", pi: "π Pi" }[h.id] ?? "✻ Claude Code"}</span><span>${esc(compact(h.total))}</span></div><progress max="${c.total || 1}" value="${h.total}" aria-label="Tokens de ${esc(h.id)}"></progress></div>`,
    )
    .join("");
  const peak = Math.max(1, ...c.evolucion.map((b) => b.total));
  $("grafico").innerHTML = c.evolucion
    .map(
      (b, i) =>
        `<rect x="${i * 30 + 2}" y="${98 - Math.max(2, (b.total / peak) * 94)}" width="22" height="${Math.max(2, (b.total / peak) * 94)}" fill="${b.total ? "var(--magenta)" : "var(--muted)"}"><title>${esc(time(b.inicio))}: ${esc(number(b.total))} tokens</title></rect>`,
    )
    .join("");
  $("inicio-grafico").textContent = time(state.evento.inicio);
  $("fin-grafico").textContent = time(state.evento.fin);
  $("turnos").innerHTML = state.cola.length
    ? state.cola
        .map(
          (t) =>
            `<article class="turno"><div><strong>${esc(t.turno)}</strong><small>${esc(trackName(t.herramienta))}<br>${esc(t.motivo)}</small></div><div>MESA ${esc(t.mesa)}<small>${t.estado === "llamado" ? "PASE, POR FAVOR" : "EN ESPERA"}</small></div></article>`,
        )
        .join("")
    : '<p class="empty">Sin turnos pendientes. Pide ayuda con <code>hacknight cita</code>.</p>';
  $("tablon").innerHTML = state.entradas.length
    ? state.entradas
        .slice(0, 4)
        .map(
          (e) =>
            `<article><p class="eyebrow">${esc(e.tipo)} · ${esc(e.herramienta ? trackName(e.herramienta) : "COMITÉ")}</p><p>${esc(e.texto)}</p></article>`,
        )
        .join("")
    : '<p class="empty">El tablón está abierto. Los avisos y registros aparecerán aquí.</p>';
  countdown();
}
async function poll() {
  try {
    const res = await fetch("/api/estado", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("sin conexión");
    state = await res.json();
    render();
    $("conexion").textContent = "● EN DIRECTO";
    $("error").hidden = true;
    if (projector && !state.vistas.pantalla)
      $("conexion").textContent = "PANTALLA DESHABILITADA";
  } catch {
    $("conexion").textContent = "○ RECONECTANDO";
    $("error").textContent =
      "No se puede consultar el registro. Se conservan los últimos datos y se reintentará automáticamente.";
    $("error").hidden = false;
  }
}
document.querySelectorAll("[data-group]").forEach((button) =>
  button.addEventListener("click", () => {
    group = button.dataset.group;
    document
      .querySelectorAll("[data-group]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    renderRanking();
  }),
);
$("filtro-track").addEventListener("change", (e) => {
  selectedTrack = e.target.value;
  renderRanking();
});
$("tracks").addEventListener("click", (e) => {
  const b = e.target.closest("[data-track]");
  if (b) detail(b.dataset.track);
});
$("detalle")
  .querySelector(".close")
  .addEventListener("click", () => $("detalle").close());
$("detalle").addEventListener("click", (e) => {
  if (e.target === $("detalle")) $("detalle").close();
});
setInterval(countdown, 1000);
async function loop() {
  await poll();
  setTimeout(loop, 2000);
}
void loop();
