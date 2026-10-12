import { site } from "../config/sitio";

export function BotonAviso() {
  return (
    <a
      href={site.feedbackUrl}
      className="inline-flex bg-acid px-5 py-3 font-display text-sm font-extrabold tracking-wide text-nit uppercase shadow-[3px_3px_0_0_var(--color-magenta)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-magenta)] motion-reduce:transition-none motion-reduce:hover:translate-none"
    >
      ¿Algo está mal? Avísanos
    </a>
  );
}
