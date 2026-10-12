export type Source = { nombre: string; url: string };

export function Fuentes({ fuentes }: { fuentes: readonly Source[] }) {
  return (
    <aside
      aria-label="Fuentes oficiales"
      className="mt-8 border-t border-dashed border-paper/25 pt-5"
    >
      <h3 className="text-[0.7rem] font-bold tracking-[0.28em] text-magenta uppercase">
        Fuentes oficiales
      </h3>
      <ul className="mt-3 space-y-2">
        {fuentes.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              className="text-sm text-acid underline underline-offset-4"
            >
              {source.nombre} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
