import { join } from "node:path";
import manifest from "../../apps/cli/package.json";
import { VERSION } from "../../apps/cli/src/version";
import { ejecutar, options, root, type Command } from "../common";

// Public, since the monorepo is private, and committee-only: squads get Write
// on the registry, which would let anyone replace the binaries everyone installs.
const releases = "barracafh/build-comite";
const assets = [
  "buildnight-linux-x64",
  "buildnight-linux-arm64",
  "buildnight-darwin-x64",
  "buildnight-darwin-arm64",
  "buildnight-windows-x64.exe",
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
        "Binarios de buildnight con sumas SHA256. Instalación: curl -fsSL https://build.barraca.house/instalar.sh | sh",
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
