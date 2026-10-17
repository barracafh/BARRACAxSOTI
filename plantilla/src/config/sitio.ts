// El repo de cada equipo trae aquí su enlace a issues; no lo cambies.
export const site = {
  feedbackUrl: "https://example.invalid/formulario-de-avisos",
};

// Next añade la ruta del equipo a <Link> y next/image, pero no a fetch ni a
// los archivos de public/: usa fetch(ruta("/api/ia")) y src={ruta("/foto.png")}.
export const ruta = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
