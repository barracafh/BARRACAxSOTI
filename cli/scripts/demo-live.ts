import { arrancarDemoLive } from "./live-fixture";
const index = process.argv.indexOf("--puerto");
const puerto = index < 0 ? 4310 : Number(process.argv[index + 1]);
if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535)
  throw new Error("Puerto inválido");
const demo = await arrancarDemoLive(
  puerto,
  !process.argv.includes("--sin-simulacion"),
);
const quote = (s: string) => "'" + s.replaceAll("'", "'\\''") + "'";
console.log(
  `\nBARBARITAT · ENSAYO GENERAL\n\nWeb: ${demo.url}\nProyector: ${demo.url}pantalla\nRegistro y contadores: ${demo.dir}\n\n4 squads ficticios · 4 watchers reales · Claude Code + Codex sintéticos.\nPausa o impulsa la simulación desde la web.\n\nPara abrir otro watcher visible, pega en otra terminal:\n`,
);
console.log(
  `BARBARITAT_CLAUDE_DIR=${quote(demo.participants[0]!.claude)} BARBARITAT_CODEX_DIR=${quote(demo.participants[0]!.codex)} ${demo.command(0).map(quote).join(" ")}\n`,
);
console.log(
  "Ctrl+C cierra el servidor y sus watchers. Los datos temporales se conservan.",
);
let quit!: () => void;
const done = new Promise<void>((r) => {
  quit = r;
});
process.once("SIGINT", quit);
process.once("SIGTERM", quit);
try {
  await done;
} finally {
  process.off("SIGINT", quit);
  process.off("SIGTERM", quit);
  await demo.close();
}
