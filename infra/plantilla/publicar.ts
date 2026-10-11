import { join } from "node:path";
import { lstat } from "node:fs/promises";
import {
  executePlan,
  initialCommit,
  options,
  repository,
  root,
  type Plan,
} from "../common";

export async function templatePlan(repo: string): Promise<Plan> {
  repository(repo);
  // Export only tracked starter files, never dependencies, builds or local secrets.
  const child = Bun.spawn(["git", "ls-files", "-z", "--", "plantilla"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [output, , code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0)
    throw new Error(
      "No se pudieron enumerar los archivos versionados de plantilla/.",
    );
  const files: Record<string, string> = {};
  for (const path of output.split("\0").filter(Boolean)) {
    if (
      /(^|\/)(node_modules|\.next|out|\.git|\.vercel|\.env(?:\.[^/]*)?)(\/|$)/.test(
        path,
      )
    )
      throw new Error(
        "La plantilla tiene un artefacto o secreto versionado; retíralo antes de publicar.",
      );
    if (!(await lstat(join(root, path))).isFile())
      throw new Error("La plantilla solo puede exportar archivos regulares.");
    files[path.slice("plantilla/".length)] = await Bun.file(
      join(root, path),
    ).text();
  }
  for (const name of [
    "README.md",
    "package.json",
    "bun.lock",
    "ficha.json",
    ".hacknight/plantilla.json",
  ])
    if (!files[name])
      throw new Error(`Falta ${name} versionado en plantilla/.`);
  const url = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(`https://github.com/${repo}`)}`;
  files["README.md"] = files["README.md"]!.replace(
    /Cuando el comité publique el repo plantilla,[^\n]+/,
    `[![Publicar en Vercel](https://vercel.com/button)](${url})\n\nEl botón crea una copia para desplegar. Si ya tienes repo de squad, impórtalo en Vercel para conservar el mismo repo.`,
  );
  return {
    files,
    commands: [
      ...initialCommit("Publish squad starter"),
      {
        args: [
          "gh",
          "repo",
          "create",
          repo,
          "--public",
          "--source=.",
          "--remote=origin",
          "--push",
        ],
      },
      { args: ["gh", "repo", "edit", repo, "--template"] },
    ],
  };
}

if (import.meta.main) {
  const args = options(["repo"]);
  await executePlan(
    await templatePlan(repository(args.get("repo"))),
    args.apply,
  );
}
