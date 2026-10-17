import { join } from "node:path";
import manifest from "../../apps/cli/package.json";
import { VERSION } from "../../apps/cli/src/version";
import { ejecutar, options, root, type Command } from "../common";

// Releases live in the public registry: the monorepo is private, so its own
// releases could not be downloaded by participants.
const releases = "barracafh/build-registro";
const assets = [
  "hacknight-linux-x64",
  "hacknight-linux-arm64",
  "hacknight-darwin-x64",
  "hacknight-darwin-arm64",
  "hacknight-windows-x64.exe",
  "SHA256SUMS",
];

export function pasosRelease(): Command[] {
  if (VERSION !== manifest.version)
    throw new Error("package.json y src/version.ts del CLI no coinciden.");
  const tag = `cli-v${manifest.version}`;
  const dist = join(root, "apps/cli/dist");
  return [
    { args: ["bash", join(root, "apps/cli/scripts/build-all.sh")] },
    {
      args: [
        "gh",
        "release",
        "create",
        tag,
        ...assets.map((a) => join(dist, a)),
        "--repo",
        releases,
        "--title",
        tag,
        "--notes",
        "Binarios de hacknight con sumas SHA256. Instalación: curl -fsSL https://build.barraca.house/instalar.sh | sh",
      ],
    },
  ];
}

if (import.meta.main) {
  const args = options([]);
  await ejecutar(
    `release · ${releases}`,
    {},
    pasosRelease(),
    args.apply,
    console.log,
  );
}
