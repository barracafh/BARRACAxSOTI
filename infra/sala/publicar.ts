import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { eventoSchema } from "@hacknight/shared/modelo";
import { paleta } from "@hacknight/shared/paleta";
import { paginaEvento } from "../../apps/server/src/marca";
import {
  ejecutar,
  options,
  pasosDespliegue,
  root,
  type Archivos,
} from "../common";
import { registro } from "./estado";

const proyecto = "build-sala";
const dominio = "sala.build.barraca.house";
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

// The event web as static files plus one function that reads the registry.
// There is no admin here: the committee administers the registry repo itself.
export async function archivosSala(): Promise<Archivos> {
  const web = join(root, "apps/web");
  const evento = eventoSchema.parse(
    await Bun.file(
      join(root, "packages/shared/registro-base/evento.json"),
    ).json(),
  );
  const build = await Bun.build({
    entrypoints: [join(import.meta.dir, "estado.ts")],
    target: "node",
    format: "esm",
  });
  if (!build.success)
    throw new AggregateError(build.logs, "No se pudo compilar la función.");
  const files: Archivos = {
    "index.html": paginaEvento(
      await Bun.file(join(web, "index.html")).text(),
      evento,
    ),
    "paleta.css": `:root{${Object.entries(paleta)
      .map(([k, v]) => `--${k}:${v}`)
      .join(";")}}`,
    "api/estado.js": await build.outputs[0]!.text(),
    "package.json": '{ "type": "module" }\n',
    "vercel.json":
      JSON.stringify(
        {
          rewrites: [{ source: "/pantalla", destination: "/" }],
          redirects: [
            {
              source: "/admin",
              destination: `https://github.com/${registro}`,
              permanent: false,
            },
          ],
          headers: [
            {
              source: "/(.*)",
              headers: [
                { key: "Content-Security-Policy", value: csp },
                { key: "X-Content-Type-Options", value: "nosniff" },
              ],
            },
          ],
        },
        null,
        2,
      ) + "\n",
  };
  for (const name of ["app.js", "style.css", "marca.js"])
    files[name] = await Bun.file(join(web, name)).text();
  for (const name of await readdir(join(web, "fonts")))
    files[`fonts/${name}`] = await Bun.file(join(web, "fonts", name)).bytes();
  return files;
}

if (import.meta.main) {
  const args = options([]);
  const token = process.env.GITHUB_TOKEN;
  await ejecutar(
    `sala · https://${dominio}`,
    await archivosSala(),
    await pasosDespliegue(
      proyecto,
      dominio,
      args.apply,
      token
        ? [
            {
              key: "GITHUB_TOKEN",
              value: args.apply ? token : "<GITHUB_TOKEN>",
            },
          ]
        : [],
    ),
    args.apply,
    console.log,
  );
}
