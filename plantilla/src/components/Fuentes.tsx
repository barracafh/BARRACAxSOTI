export type Source = { nombre: string; url: string };

export function Fuentes({ fuentes }: { fuentes: readonly Source[] }) {
  return (
    <aside
      aria-label="Fuentes oficiales"
      className="mt-8 border-t border-arena pt-5"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider">
        Fuentes oficiales
      </h3>
      <ul className="mt-3 space-y-2">
        {fuentes.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              className="text-cobalto underline underline-offset-4"
            >
              {source.nombre} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
