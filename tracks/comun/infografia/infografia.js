// Navegación, enlaces al Markdown y preferencias compartidas por todas las páginas.
// Cada página declara en <body data-root> el camino relativo hasta tracks/.
const ROOT = document.body.dataset.root || "";
const REPO = "https://github.com/barracafh/BARRACAxSOTI/blob/main/tracks/";

// Rutas relativas a tracks/. El id es interno (colores y data-d); label es lo que se muestra:
// el código en los ficheros comunes y el nombre del track en los de cada track.
const DOCS = [
  {
    id: "00",
    label: "00",
    path: "comun/00-territorio.md",
    title: "Territorio",
    tracks: "Todos",
  },
  {
    id: "00b",
    label: "00b",
    path: "comun/00b-competencias-y-sector-publico.md",
    title: "Competencias y sector público",
    tracks: "Todos",
  },
  {
    id: "04b",
    label: "04b",
    path: "comun/04b-gestores-expedientes.md",
    title: "Gestores de expedientes",
    tracks: "Brújula, Claridad y Sello",
  },
  {
    id: "01",
    label: "Derechos",
    path: "derechos/contexto.md",
    title: "Buscador de ayudas",
    tracks: "Derechos",
  },
  {
    id: "02",
    label: "Claridad",
    path: "claridad/contexto.md",
    title: "Traductor de documentos",
    tracks: "Claridad",
  },
  {
    id: "03",
    label: "Sello",
    path: "sello/contexto.md",
    title: "Verificador de webs y mensajes",
    tracks: "Sello",
  },
  {
    id: "04",
    label: "Brújula",
    path: "brujula/contexto.md",
    title: "Asistente de trámites",
    tracks: "Brújula",
  },
  {
    id: "05",
    label: "Cómo voto",
    path: "como-voto/contexto.md",
    title: "Guía de las elecciones",
    tracks: "Cómo voto",
  },
];
const README = { path: "comun/README.md" };
const page = (d) => ROOT + d.path.replace(/\.md$/, ".html");

// 2248 → «2.248» (es-ES no agrupa los números de cuatro cifras).
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

function source() {
  return store.get("marco-fuente") === "local" ? "local" : "github";
}

function mdUrl(doc, slug) {
  const d = DOCS.find((x) => x.id === doc) || README;
  const base = source() === "local" ? ROOT : REPO;
  return base + d.path + (slug ? "#" + slug : "");
}

// «3.2» → ancla del encabezado que empieza por ese número.
function findSlug(doc, sec) {
  const d = DOCS.find((x) => x.id === doc);
  if (!d) return sec;
  const list = TOC[d.path] || [];
  if (!sec) return "";
  const norm = (s) => s.toLowerCase();
  const hit =
    list.find(([, t]) => t.startsWith(sec + " ") || t.startsWith(sec + ". ")) ||
    list.find(([, t]) => norm(t).startsWith(norm(sec)));
  return hit ? hit[2] : "";
}

function wireLinks(root = document) {
  root.querySelectorAll("[data-d]").forEach((a) => {
    a.href = mdUrl(a.dataset.d, findSlug(a.dataset.d, a.dataset.s || ""));
    a.target = "_blank";
    a.rel = "noopener";
    if (!a.textContent.trim())
      a.textContent = a.dataset.s ? "§ " + a.dataset.s : "Abrir el documento";
  });
}

function buildNav() {
  const here = document.body.dataset.doc || "";
  const nav = document.createElement("header");
  nav.className = "top";
  nav.innerHTML = `
    <div class="top-in">
      <a class="brand" href="${ROOT}index.html">MARCO<span class="long"> <b>·</b> BUILD NIGHT</span></a>
      <nav class="docnav" aria-label="Documentos">
        <a href="${ROOT}index.html" ${here ? "" : 'aria-current="page"'}>Índice</a>
        ${DOCS.map((d) => `<a class="c-${d.id}" href="${page(d)}" title="${d.title} · ${d.tracks}" ${here === d.id ? 'aria-current="page"' : ""}>${d.label}</a>`).join("")}
      </nav>
      <div class="tools">
        <div class="seg" role="group" aria-label="Dónde abrir el Markdown">
          <button type="button" data-src="github" title="Abrir los .md en GitHub">GitHub</button>
          <button type="button" data-src="local" title="Abrir los .md de tu copia local">Local</button>
        </div>
        <div class="seg" role="group" aria-label="Tema">
          <button type="button" data-th="light" title="Tema claro">Claro</button>
          <button type="button" data-th="dark" title="Tema oscuro">Oscuro</button>
        </div>
      </div>
    </div>`;
  document.body.prepend(nav);

  const paint = () => {
    nav
      .querySelectorAll("[data-src]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.src === source())),
      );
    const th =
      document.documentElement.dataset.theme ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    nav
      .querySelectorAll("[data-th]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.th === th)),
      );
  };
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.src) {
      store.set("marco-fuente", b.dataset.src);
      wireLinks();
    }
    if (b.dataset.th) {
      document.documentElement.dataset.theme = b.dataset.th;
      store.set("marco-tema", b.dataset.th);
    }
    paint();
  });
  paint();
}

function buildDocExtras() {
  const id = document.body.dataset.doc;
  if (!id) return;
  const i = DOCS.findIndex((d) => d.id === id);
  const d = DOCS[i];
  const list = TOC[d.path] || [];
  const main = document.querySelector("main");

  const toc = document.createElement("details");
  toc.className = "toc";
  toc.id = "indice";
  toc.innerHTML = `<summary>Índice completo del documento · ${list.length} apartados</summary>
    <ul class="toclist">${list
      .map(
        ([lvl, t]) =>
          `<li class="l${lvl}"><a data-d="${id}" data-slug="${encodeURIComponent(t)}">${t}</a></li>`,
      )
      .join("")}</ul>`;
  main.append(toc);
  toc.querySelectorAll("a").forEach((a, k) => {
    a.removeAttribute("data-d");
    a.target = "_blank";
    a.rel = "noopener";
    a.dataset.slug2 = list[k][2];
  });

  const prev = DOCS[i - 1];
  const next = DOCS[i + 1];
  const pager = document.createElement("nav");
  pager.className = "pager";
  pager.innerHTML =
    (prev
      ? `<a class="c-${prev.id}" href="${page(prev)}"><span>← ${prev.label}</span>${prev.title}</a>`
      : `<a href="${ROOT}index.html"><span>←</span>Índice general</a>`) +
    (next
      ? `<a class="nx c-${next.id}" href="${page(next)}"><span>${next.label} →</span>${next.title}</a>`
      : `<a class="nx" href="${ROOT}index.html"><span>→</span>Índice general</a>`);
  main.append(pager);

  const foot = document.createElement("footer");
  foot.className = "foot";
  foot.innerHTML = `<div>Resumen visual de <code>tracks/${d.path}</code>. Las cifras y reglas salen del documento; ante un ciudadano, cita siempre la fuente oficial que enlaza el Markdown.</div>
    <div>Lo marcado <span class="pill sv">sin verificar</span> en el documento hay que confirmarlo antes de usarlo.</div>`;
  main.append(foot);
}

function rewireToc() {
  const id = document.body.dataset.doc;
  if (!id) return;
  document
    .querySelectorAll(".toclist a")
    .forEach((a) => (a.href = mdUrl(id, a.dataset.slug2)));
}

// Tooltips: cualquier .info[data-tip] muestra su texto al pasar, enfocar o tocar.
function initTips() {
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.id = "tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);
  let current = null;

  const show = (el) => {
    if (current && current !== el)
      current.setAttribute("aria-expanded", "false");
    current = el;
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    el.setAttribute("aria-expanded", "true");
    el.setAttribute("aria-describedby", "tip");
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth,
      h = tip.offsetHeight;
    let x = Math.min(
      Math.max(16, r.left + r.width / 2 - w / 2),
      innerWidth - w - 16,
    );
    let y = r.bottom + 8;
    if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  };
  const hide = () => {
    if (!current) return;
    current.setAttribute("aria-expanded", "false");
    current.removeAttribute("aria-describedby");
    current = null;
    tip.hidden = true;
  };

  document.querySelectorAll(".info[data-tip]").forEach((el) => {
    el.type = "button";
    el.setAttribute("aria-label", "Más información");
    el.setAttribute("aria-expanded", "false");
    el.addEventListener("mouseenter", () => show(el));
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", () => show(el));
    el.addEventListener("blur", hide);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      current === el && !tip.hidden ? hide() : show(el);
    });
  });
  document.addEventListener("click", hide);
  document.addEventListener("keydown", (e) => e.key === "Escape" && hide());
  addEventListener("scroll", hide, { passive: true });
}

(function init() {
  const th = store.get("marco-tema");
  if (th) document.documentElement.dataset.theme = th;
  buildNav();
  buildDocExtras();
  wireLinks();
  rewireToc();
  initTips();
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-src]")) rewireToc();
  });
})();
