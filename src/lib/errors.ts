// src/lib/errors.ts
/** Turn any backend error shape into a displayable string. */
export function errorToMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; code?: unknown };
    if (typeof e.message === 'string' && e.message.trim()) return e.message;
    if (typeof e.code === 'string' && e.code.trim()) return e.code;
  }
  return fallback;
}