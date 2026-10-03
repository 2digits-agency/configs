import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vite-plus/test';

describe('effect runner Promise rejection controls', () => {
  it('distinguishes missing rejection handling from handlers that themselves reject', () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-'], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      timeout: 10_000,
      input: `
      import * as Effect from ${JSON.stringify(import.meta.resolve('effect/Effect'))};

      const task = Effect.fail(new Error('rejection-control'));
      const labels = new Map();
      const unhandled = [];
      process.on('unhandledRejection', (_reason, promise) => unhandled.push(labels.get(promise)));
      process.on('beforeExit', () => console.log(JSON.stringify(unhandled.sort())));

      labels.set(Effect.runPromise(task).then(() => 'success'), 'success-only');
      labels.set(Effect.runPromise(task).finally(() => {}), 'finally-only');
      labels.set(Effect.runPromise(task).then(() => 'success', () => 'handled'), 'then-handled');
      labels.set(Effect.runPromise(task).finally(() => {}).catch(() => 'handled'), 'catch-handled');
      labels.set(Effect.runPromise(task).catch(() => { throw new Error('handler'); }), 'throwing-catch');
      labels.set(Effect.runPromise(task).catch(() => Promise.reject(new Error('handler'))), 'rejecting-catch');
    `,
    });

    expect(result).toMatchObject({ status: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toStrictEqual([
      'finally-only',
      'rejecting-catch',
      'success-only',
      'throwing-catch',
    ]);
  });
});
