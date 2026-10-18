/// <reference lib="dom" />
import type { Track } from "@hacknight/shared/modelo";
import { paleta } from "@hacknight/shared/paleta";
import {
  aEquipos,
  avisos,
  clave,
  estados,
  importar,
  mover,
  nuevoGrupo,
  piezaDe,
  restaurar,
  usuario,
  type Estado,
  type Grupo,
  type Persona,
} from "./reparto";

for (const [nombre, valor] of Object.entries(paleta))
  document.documentElement.style.setProperty(`--${nombre}`, valor);

let estado: Estado;
let tracks: Track[] = [];
let cola = Promise.resolve();

const $ = <T extends HTMLElement = HTMLElement>(sel: string) =>
  document.querySelector<T>(sel)!;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const track = (slug: string) => tracks.find((t) => t.slug === slug);
const cupo = (t: Track) => t.cupo ?? 2;
const usados = (slug: string) =>
  estado.grupos.filter((g) => g.track === slug).length;
const dentro = (p: Persona) => p.enLuma && p.estado === "approved";
function mensaje(texto: string, error = false) {
  $("#mensaje").textContent = texto;
  $("#mensaje").classList.toggle("error", error);
}

// Every change saves the whole state, one request after another.
function cambiar(f: () => void, repintar = true) {
  f();
  if (repintar) pintar();
  cola = cola
    .then(guardar)
    .catch((e) => mensaje(`No se ha guardado: ${e.message}`, true));
}

async function guardar() {
  const r = await fetch("/api/estado", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(estado),
  });
  const datos = await r.json();
  if (r.status === 409) {
    estado = datos;
    pintar();
    mensaje(
      "Otra pestaña había guardado antes: ves su versión y tu último cambio no se ha guardado.",
      true,
    );
  } else if (!r.ok) throw new Error(datos.error ?? r.statusText);
  else estado.version = datos.version;
}

const chipTrack = (slug: string) => {
  const t = track(slug);
  return t
    ? `<span class="chip" style="--c: var(--${t.color})">${esc(t.glifo)} ${esc(t.nombre)}</span>`
    : `<span class="chip">${esc(slug)}</span>`;
};

function tarjeta(p: Persona, g: Grupo | undefined, noche: boolean) {
  const handle = usuario(p.github);
  const notas = [
    p.equipo &&
      clave(p.equipo) !== clave(g?.nombre ?? "") &&
      `viene con «${esc(p.equipo)}»`,
    p.voluntaria && "quiere capitanear",
    !p.enLuma
      ? "ya no está en Luma"
      : p.estado !== "approved" && esc(estados[p.estado] ?? p.estado),
    p.checkin ? "ha llegado" : noche && "no ha llegado",
  ].filter(Boolean);
  const capitana = g?.capitan === p.id;
  return `<li class="persona${dentro(p) ? "" : " fuera"}${capitana ? " capitana" : ""}" draggable="true" data-persona="${esc(p.id)}">
    <div class="cabeza">
      <strong>${esc(p.nombre)}</strong>
      ${g ? `<button type="button" data-capitan aria-pressed="${capitana}" title="Capitán del equipo">★</button>` : ""}
    </div>
    ${p.firma && !clave(p.nombre).includes(clave(p.firma)) ? `<p class="tenue">firma: ${esc(p.firma)}</p>` : ""}
    ${handle ? `<a href="https://github.com/${esc(handle)}" target="_blank" rel="noreferrer">@${esc(handle)}</a>` : `<span class="tenue">sin GitHub</span>`}
    <div class="chips">${p.habilidades.map((h) => `<span class="chip">${esc(h)}</span>`).join("")}</div>
    <div class="chips">${p.tracks.map(chipTrack).join("")}</div>
    ${notas.length ? `<p class="notas">${notas.join(" · ")}</p>` : ""}
    ${p.propuesta ? `<details><summary>Su propuesta libre</summary><p>${esc(p.propuesta)}</p></details>` : ""}
    <select data-mover aria-label="Equipo de ${esc(p.nombre)}">
      <option value="">Sin equipo</option>
      ${estado.grupos.map((o) => `<option value="${o.id}"${o === g ? " selected" : ""}>${esc(o.nombre || "(sin nombre)")}</option>`).join("")}
    </select>
  </li>`;
}

function tarjetaGrupo(g: Grupo, noche: boolean) {
  const ms = g.miembros.flatMap((id) => estado.personas[id] ?? []);
  const gustos = new Map<string, number>();
  for (const p of ms)
    for (const t of p.tracks) gustos.set(t, (gustos.get(t) ?? 0) + 1);
  const t = track(g.track);
  const lista = avisos(g, estado.personas);
  return `<article class="grupo zona" data-zona data-grupo="${g.id}"${t ? ` style="--c: var(--${t.color})"` : ""}>
    <input class="nombre" data-campo="nombre" value="${esc(g.nombre)}" placeholder="Nombre del equipo" aria-label="Nombre del equipo">
    <div class="campos">
      <select data-campo="track" aria-label="Track">
        <option value="">Sin track</option>
        ${tracks.map((o) => `<option value="${o.slug}"${o === t ? " selected" : ""}>${esc(o.glifo)} ${esc(o.nombre)} · ${usados(o.slug)}/${cupo(o)}</option>`).join("")}
      </select>
      <input data-campo="pieza" list="piezas-${g.track}" value="${esc(g.pieza)}" placeholder="${esc(piezaDe(g, estado.grupos, t) || "Pieza")}" aria-label="Pieza">
      <input data-campo="mesa" value="${esc(g.mesa)}" placeholder="${estado.grupos.indexOf(g) + 1}" aria-label="Mesa" title="Mesa">
    </div>
    <p class="tenue">${ms.length} persona${ms.length === 1 ? "" : "s"}${
      gustos.size
        ? ` · prefieren ${[...gustos]
            .sort((a, b) => b[1] - a[1])
            .map(([s, n]) => `${esc(track(s)?.nombre ?? s)} ${n}`)
            .join(", ")}`
        : ""
    }</p>
    ${lista.length ? `<ul class="avisos">${lista.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : `<p class="ok">Listo</p>`}
    <ul class="lista">${ms.map((p) => tarjeta(p, g, noche)).join("")}</ul>
    <button type="button" data-borrar>Borrar equipo</button>
  </article>`;
}

function pintar() {
  const todas = Object.values(estado.personas).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );
  const enGrupo = new Set(estado.grupos.flatMap((g) => g.miembros));
  const noche = todas.some((p) => p.checkin);
  const aprobadas = todas.filter(dentro);
  const sueltas = todas.filter((p) => !enGrupo.has(p.id));
  const filtro = clave($<HTMLInputElement>("#buscar").value);
  const busca = (p: Persona) =>
    clave(
      [
        p.nombre,
        p.firma,
        p.github,
        p.equipo,
        ...p.habilidades,
        ...p.tracks.map((s) => track(s)?.nombre ?? s),
      ].join(" "),
    ).includes(filtro);

  $("#resumen").textContent = estado.importado
    ? `CSV importado el ${new Date(estado.importado).toLocaleString("es-ES")} · ${aprobadas.length} aprobadas · ${aprobadas.filter((p) => enGrupo.has(p.id)).length} con equipo · ${estado.grupos.length} equipos`
    : "Importa el CSV de invitados de Luma para empezar.";
  $("#tracks").innerHTML = tracks
    .map((t) => {
      const piden = aprobadas.filter((p) => p.tracks.includes(t.slug));
      return `<li style="--c: var(--${t.color})"><b>${esc(t.glifo)} ${esc(t.nombre)}</b> · ${usados(t.slug)}/${cupo(t)} equipos · ${piden.length} lo eligen, ${piden.filter((p) => !enGrupo.has(p.id)).length} sin equipo</li>`;
    })
    .join("");
  const libres = sueltas.filter(dentro);
  $("#cuenta").textContent = `(${libres.length})`;
  $("#sueltas").innerHTML = libres
    .filter(busca)
    .map((p) => tarjeta(p, undefined, noche))
    .join("");
  const fuera = sueltas.filter((p) => !dentro(p));
  $("#fuera-titulo").textContent =
    `Fuera de la lista (${fuera.length}): rechazadas, en espera o que ya no están en Luma`;
  $("#fuera").innerHTML = fuera
    .map((p) => tarjeta(p, undefined, noche))
    .join("");
  $("#grupos").innerHTML = estado.grupos
    .map((g) => tarjetaGrupo(g, noche))
    .join("");
}

const grupoDe = (el: Element) =>
  estado.grupos.find(
    (g) => g.id === el.closest<HTMLElement>("[data-grupo]")?.dataset.grupo,
  );
const personaDe = (el: Element) =>
  el.closest<HTMLElement>("[data-persona]")?.dataset.persona ?? "";

document.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  const g = grupoDe(el);
  if (el.matches("[data-mover]"))
    cambiar(() => mover(estado, personaDe(el), el.value));
  else if (g && el.dataset.campo) {
    const campo = el.dataset.campo as "nombre" | "track" | "pieza" | "mesa";
    // Text fields save without repainting so the next field keeps focus.
    cambiar(() => (g[campo] = el.value), campo === "track");
  }
});

document.addEventListener("click", (e) => {
  const el = e.target as Element;
  const g = grupoDe(el);
  if (!g) return;
  if (el.closest("[data-capitan]")) {
    const id = personaDe(el);
    cambiar(() => (g.capitan = g.capitan === id ? "" : id));
  } else if (
    el.closest("[data-borrar]") &&
    (!g.miembros.length ||
      confirm(
        `¿Borrar «${g.nombre}»? Sus ${g.miembros.length} personas vuelven a «Sin equipo».`,
      ))
  )
    cambiar(() => (estado.grupos = estado.grupos.filter((o) => o !== g)));
});

// Dragging selected text targets a Text node, which has no closest().
const elemento = (e: Event) => (e.target instanceof Element ? e.target : null);

document.addEventListener("dragstart", (e) => {
  const el = elemento(e);
  const id = el ? personaDe(el) : "";
  if (id) e.dataTransfer?.setData("text/plain", id);
});
document.addEventListener("dragover", (e) => {
  const zona = elemento(e)?.closest("[data-zona]");
  if (!zona) return;
  e.preventDefault();
  for (const z of document.querySelectorAll(".encima"))
    if (z !== zona) z.classList.remove("encima");
  zona.classList.add("encima");
});
document.addEventListener("dragend", () => {
  for (const z of document.querySelectorAll(".encima"))
    z.classList.remove("encima");
});
document.addEventListener("drop", (e) => {
  const zona = elemento(e)?.closest("[data-zona]");
  const id = e.dataTransfer?.getData("text/plain") ?? "";
  if (!zona || !estado.personas[id]) return;
  e.preventDefault();
  cambiar(() => mover(estado, id, grupoDe(zona)?.id ?? ""));
});

$("#buscar").addEventListener("input", pintar);

$("#nuevo").addEventListener("click", () => {
  const g = nuevoGrupo("");
  cambiar(() => estado.grupos.push(g));
  $<HTMLInputElement>(`[data-grupo="${g.id}"] .nombre`).focus();
});

$<HTMLInputElement>("#csv").addEventListener("change", async (e) => {
  const input = e.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = "";
  if (!archivo) return;
  try {
    const texto = await archivo.text();
    if (texto.trimStart().startsWith("[")) {
      const { estado: nuevo, sueltos } = restaurar(estado, texto);
      if (
        estado.grupos.length &&
        !confirm(
          `¿Sustituir los ${estado.grupos.length} equipos actuales por los de ${archivo.name}?`,
        )
      )
        return;
      cambiar(() => (estado = nuevo));
      mensaje(
        `${archivo.name}: ${nuevo.grupos.length} equipos restaurados.${sueltos.length ? ` No están en el CSV de Luma y se han quedado fuera: ${sueltos.map((s) => `@${s}`).join(", ")}.` : ""}`,
        sueltos.length > 0,
      );
      return;
    }
    const nuevo = importar(estado, texto);
    const antes = estado.personas;
    const personas = Object.values(nuevo.personas);
    const altas = personas.filter((p) => !antes[p.id]).length;
    const bajas = personas.filter(
      (p) => !p.enLuma && antes[p.id]?.enLuma,
    ).length;
    const equipos = nuevo.grupos.length - estado.grupos.length;
    cambiar(() => (estado = nuevo));
    mensaje(
      `${archivo.name}: ${personas.filter((p) => p.enLuma).length} personas en el CSV, ${altas} nuevas, ${bajas} que ya no están y ${equipos} equipos nuevos con el nombre que pusieron al inscribirse.`,
    );
  } catch (error) {
    mensaje((error as Error).message, true);
  }
});

$("#exportar").addEventListener("click", async () => {
  try {
    const r = await fetch("/api/exportar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(aEquipos(estado, tracks)),
    });
    const datos = await r.json();
    if (!r.ok) throw new Error(datos.error);
    const pendientes = estado.grupos.filter(
      (g) => avisos(g, estado.personas).length,
    ).length;
    mensaje(
      `${datos.equipos.length} equipos en ${datos.ruta}${pendientes ? `, ${pendientes} con avisos` : ""}. Siguiente paso: bun infra/equipos/preparar.ts --equipos ${datos.ruta} --dry-run`,
    );
  } catch (error) {
    mensaje(`No se ha exportado: ${(error as Error).message}`, true);
  }
});

const inicio = await fetch("/api/estado").then((r) => r.json());
estado = inicio.estado;
tracks = inicio.tracks;
$("#piezas").innerHTML = tracks
  .map(
    (t) =>
      `<datalist id="piezas-${t.slug}">${t.piezas.map((p) => `<option value="${esc(p)}">`).join("")}</datalist>`,
  )
  .join("");
pintar();
