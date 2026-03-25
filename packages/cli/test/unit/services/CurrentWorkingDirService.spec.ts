import { describe, it } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';

import { CurrentWorkingDirService } from '../../../src/services/CurrentWorkingDirService.js';

describe('CurrentWorkingDirService', () => {
  const testLayer = CurrentWorkingDirService.Default;

  it('returns process.cwd()', () =>
    Effect.gen(function* () {
      const service = yield* CurrentWorkingDirService;
      const cwd = yield* service.cwd;
      const expected = process.cwd();

      strictEqual(cwd, expected);
    }).pipe(Effect.provide(testLayer)));

  it('returns an absolute path', () =>
    Effect.gen(function* () {
      const service = yield* CurrentWorkingDirService;
      const cwd = yield* service.cwd;

      assertTrue(cwd.startsWith('/') || /^[a-z]:\\/i.test(cwd));
    }).pipe(Effect.provide(testLayer)));

  it('returns a non-empty string', () =>
    Effect.gen(function* () {
      const service = yield* CurrentWorkingDirService;
      const cwd = yield* service.cwd;

      assertTrue(cwd.length > 0);
    }).pipe(Effect.provide(testLayer)));

  it('is consistent across multiple calls', () =>
    Effect.gen(function* () {
      const service = yield* CurrentWorkingDirService;
      const cwd1 = yield* service.cwd;
      const cwd2 = yield* service.cwd;

      strictEqual(cwd1, cwd2);
    }).pipe(Effect.provide(testLayer)));
});
