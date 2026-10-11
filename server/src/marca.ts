import type { Evento } from "@hacknight/shared/modelo";

const escaparHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

// Sustitución única: los datos del registro nunca se interpretan como HTML.
export function paginaEvento(html: string, evento: Evento) {
  const marca = {
    nombre: evento.nombre,
    nombre_corto: evento.nombre_corto,
    organizan: evento.organizan,
  };
  return html.replace(
    /\{\{(nombre|nombre_corto|organizan)\}\}/g,
    (_, key: keyof typeof marca) => escaparHtml(marca[key]),
  );
}
