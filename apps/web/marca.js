// Los mismos datos que el HTML inicial, actualizados al guardar o consultar.
export function actualizarMarca(evento) {
  document.querySelectorAll("[data-evento]").forEach((el) => {
    const value = (el.dataset.prefix ?? "") + evento[el.dataset.evento];
    if (el.tagName === "META") el.setAttribute("content", value);
    else el.textContent = value;
    if (el.classList.contains("plate")) el.dataset.plate = value;
  });
  document.querySelectorAll("a.brand").forEach((el) => {
    el.setAttribute("aria-label", `${evento.nombre}, inicio`);
  });
}
