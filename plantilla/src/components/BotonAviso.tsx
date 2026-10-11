import { site } from "../config/sitio";

export function BotonAviso() {
  return (
    <a
      href={site.feedbackUrl}
      className="inline-flex rounded-full border border-tinta px-5 py-3 text-sm font-semibold hover:bg-arena"
    >
      ¿Algo está mal? Avísanos
    </a>
  );
}
