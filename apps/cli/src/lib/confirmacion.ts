import { confirm, isCancel } from "@clack/prompts";
import type { Contexto } from "./contexto";
import { CliError } from "@hacknight/shared/errors";
export async function confirmar(ctx: Contexto, message: string) {
  if (ctx.opts.confirmar) return;
  if (ctx.opts.json || !process.stdin.isTTY || !process.stdout.isTTY)
    throw new CliError(
      "CONFIRMATION_REQUIRED",
      message,
      "Repite con --confirmar para confirmar explícitamente esta acción pública.",
      2,
    );
  const answer = await confirm({ message, initialValue: false });
  if (isCancel(answer) || !answer)
    throw new CliError(
      "CANCELLED",
      "Trámite cancelado.",
      "No se ha publicado nada.",
      130,
    );
}
