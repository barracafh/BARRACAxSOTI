// Única fuente: demo/plantilla-stub. El binario lleva los mismos bytes sin rutas externas.
const archivos = ["index.html", "README.md", ".barbaritat/plantilla.json"];
const plantilla: Record<string, string> = {};
for (const path of archivos)
  plantilla[path] = await Bun.file(
    new URL("../demo/plantilla-stub/" + path, import.meta.url),
  ).text();
await Bun.write(
  new URL("../src/assets/plantilla.ts", import.meta.url),
  "// Generado por scripts/embed-plantilla.ts.\nexport const plantilla = " +
    JSON.stringify(plantilla, null, 2) +
    ";\n",
);
