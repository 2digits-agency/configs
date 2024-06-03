import type { Awaitable } from 'eslint-flat-config-utils';

export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;

  return ((resolved as Record<string, unknown>).default || resolved) as never;
}
