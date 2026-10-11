import manifest from "../apps/cli/package.json";
import { VERSION } from "../apps/cli/src/version";
const tag = process.env.RELEASE_TAG;
if (
  !tag ||
  !/^cli-v\d+\.\d+\.\d+$/.test(tag) ||
  tag !== `cli-v${manifest.version}` ||
  VERSION !== manifest.version
)
  throw new Error(
    "El tag cli-vX.Y.Z debe coincidir con package.json y src/version.ts del CLI.",
  );
console.log(`Versión comprobada: ${tag}`);
