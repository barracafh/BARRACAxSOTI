export class CliError extends Error {
  constructor(public code: string, message: string, public hint = '', public exitCode = 1, public data?: unknown) { super(message); }
}
export const usage = (message: string, hint = '') => new CliError('USAGE', message, hint, 2);
export function missing(message: string): never { throw new CliError('NOT_FOUND', message, 'Consulta al comité o revisa --registro.', 4); }
