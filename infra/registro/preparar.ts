import { join } from "node:path";
import {
  executePlan,
  initialCommit,
  options,
  repository,
  root,
  type Plan,
} from "../common";

export async function registryPlan(
  repo: string,
  owners: string,
): Promise<Plan> {
  repository(repo);
  const reviewers = owners.trim().split(/\s+/);
  if (
    !reviewers.length ||
    reviewers.some(
      (owner) =>
        !/^@[A-Za-z0-9][A-Za-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9-]*)?$/.test(
          owner,
        ),
    )
  )
    throw new Error(
      "Indica --owners '@equipo-comite' o '@organizacion/equipo', con acceso Write al registro.",
    );
  const files: Record<string, string> = {};
  for (const name of ["evento", "equipos", "tracks", "comite"])
    files[`${name}.json`] = await Bun.file(
      join(root, `packages/shared/registro-base/${name}.json`),
    ).text();
  files[".github/CODEOWNERS"] =
    [
      "/evento.json",
      "/equipos.json",
      "/comite.json",
      "/tracks.json",
      "/.github/CODEOWNERS",
    ]
      .map((path) => `${path} ${reviewers.join(" ")}`)
      .join("\n") + "\n";
  files["README.md"] =
    "# Registro del evento\n\nAsignaciones del comité y fichas de los squads. Los cambios entran por PR; los avisos del comité usan Issues. No subas claves ni datos personales.\n";
  return {
    files,
    commands: [
      ...initialCommit("Seed event registry"),
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
      ...[["aviso", "FF2E88"]].map(([label, color]) => ({
        args: [
          "gh",
          "label",
          "create",
          label!,
          "--repo",
          repo,
          "--color",
          color!,
          "--force",
        ],
      })),
      {
        args: [
          "gh",
          "api",
          "--method",
          "PUT",
          `repos/${repo}/branches/main/protection`,
          "--input",
          "-",
        ],
        input: JSON.stringify(
          {
            required_status_checks: null,
            enforce_admins: true,
            required_pull_request_reviews: {
              dismiss_stale_reviews: true,
              require_code_owner_reviews: true,
              required_approving_review_count: 1,
            },
            restrictions: null,
            allow_force_pushes: false,
            allow_deletions: false,
            required_conversation_resolution: true,
          },
          null,
          2,
        ),
      },
    ],
  };
}

if (import.meta.main) {
  const args = options(["repo", "owners"]);
  await executePlan(
    await registryPlan(repository(args.get("repo")), args.get("owners") ?? ""),
    args.apply,
  );
}
