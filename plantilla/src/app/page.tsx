import ficha from "../../ficha.json";
import { Fuentes } from "../components/Fuentes";
import { BotonAviso } from "../components/BotonAviso";

export default function Home() {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:block focus:p-4"
      >
        Saltar al contenido
      </a>
      <header className="border-b border-arena">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6">
          <span className="font-bold tracking-tight">
            {ficha.icono} {ficha.nombre}
          </span>
          <span className="rounded-full bg-arena px-3 py-1 text-xs font-semibold">
            Ejemplo · datos simulados
          </span>
        </div>
      </header>
      <main
        id="contenido"
        className="mx-auto grid max-w-5xl gap-10 px-6 py-14 md:grid-cols-[1fr_1.4fr] md:py-24"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-cobalto">
            Una respuesta clara
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Tu siguiente paso, con su fuente.
          </h1>
          <p className="mt-6 text-lg leading-relaxed">
            Una página de ejemplo para construir una herramienta útil. Elige un
            caso pequeño y ayuda a resolverlo de principio a fin.
          </p>
        </div>
        <article className="rounded-2xl border border-arena bg-white p-7 shadow-sm md:p-10">
          <p className="text-sm font-semibold text-cobalto">
            Pregunta de ejemplo
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            ¿Dónde empiezo a buscar una ayuda?
          </h2>
          <p className="mt-4 leading-relaxed">
            Consulta la convocatoria en la fuente oficial. Este ejemplo muestra
            cómo presentar los pasos; no calcula si te corresponde una ayuda.
          </p>
          <ol className="mt-6 list-decimal space-y-3 pl-5 leading-relaxed">
            <li>Busca una convocatoria que encaje con tu situación.</li>
            <li>
              Lee sus requisitos y comprueba el plazo en la publicación oficial.
            </li>
            <li>Sigue el enlace al organismo que la tramita.</li>
          </ol>
          <Fuentes fuentes={ficha.fuentes} />
        </article>
      </main>
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5 border-t border-arena px-6 py-8">
        <p className="text-sm">Una pieza del squad · {ficha.equipo}</p>
        <BotonAviso />
      </footer>
    </>
  );
}
