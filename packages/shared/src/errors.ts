export class CliError extends Error {
  constructor(
    public code: string,
    message: string,
    public hint = "",
    public exitCode = 1,
    public data?: unknown,
  ) {
    super(message);
  }
}
export const usage = (message: string, hint = "") =>
  new CliError("USAGE", message, hint, 2);
