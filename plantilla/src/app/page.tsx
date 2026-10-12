import ficha from "../../ficha.json";
import { Fuentes } from "../components/Fuentes";
import { BotonAviso } from "../components/BotonAviso";

export default function Home() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:block focus:bg-acid focus:p-4 focus:font-display focus:font-extrabold focus:text-nit focus:uppercase"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-paper/15">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <span className="font-display text-lg font-extrabold tracking-tight uppercase">
            {ficha.icono} {ficha.nombre}
          </span>
          <span className="border border-paper/30 px-2.5 py-1 text-[0.7rem] tracking-[0.16em] text-muted uppercase">
            Ejemplo · datos simulados
          </span>
        </div>
      </header>
      <main
        id="contenido"
        className="mx-auto grid max-w-5xl gap-10 px-6 py-14 md:grid-cols-[1fr_1.4fr] md:py-24"
      >
        <div>
          <p className="inline-block bg-acid px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.18em] text-nit uppercase">
            Una respuesta clara
          </p>
          <h1 className="mt-6 font-display text-[clamp(1.6rem,6vw,2.75rem)] md:text-[clamp(1.5rem,3.4vw,2.5rem)] leading-[0.95] font-extrabold tracking-tight uppercase">
            Tu siguiente paso, con su fuente.
          </h1>
          <p className="mt-6 font-display text-lg leading-snug font-bold">
            Una página de ejemplo para construir una herramienta útil. Elige un
            caso pequeño y ayuda a resolverlo de principio a fin.
          </p>
        </div>
        <article className="border border-paper/15 bg-nit-2 p-7 md:p-10">
          <p className="text-[0.7rem] font-bold tracking-[0.28em] text-magenta uppercase">
            Pregunta de ejemplo
          </p>
          <h2 className="mt-3 font-display text-2xl leading-tight font-extrabold uppercase">
            ¿Dónde empiezo a buscar una ayuda?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-paper/80">
            Consulta la convocatoria en la fuente oficial. Este ejemplo muestra
            cómo presentar los pasos; no calcula si te corresponde una ayuda.
          </p>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed marker:font-bold marker:text-magenta">
            <li>Busca una convocatoria que encaje con tu situación.</li>
            <li>
              Lee sus requisitos y comprueba el plazo en la publicación oficial.
            </li>
            <li>Sigue el enlace al organismo que la tramita.</li>
          </ol>
          <Fuentes fuentes={ficha.fuentes} />
        </article>
      </main>
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5 border-t border-paper/15 px-6 py-8">
        <p className="text-[0.7rem] tracking-[0.16em] text-muted uppercase">
          Una pieza del squad · {ficha.equipo}
        </p>
        <BotonAviso />
      </footer>
    </>
  );
}
