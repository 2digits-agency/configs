import * as NodePath from '@effect/platform-node/NodePath';
import * as Path from '@effect/platform/Path';
import { describe, layer } from '@effect/vitest';
import { assertTrue, strictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { CurrentWorkingDirService } from '../../../src/services/CurrentWorkingDirService.js';

describe(CurrentWorkingDirService, () => {
  const testLayer = Layer.mergeAll(CurrentWorkingDirService.Default, NodePath.layer);

  layer(testLayer)((it) => {
    it('returns process.cwd()', () =>
      Effect.gen(function* () {
        const service = yield* CurrentWorkingDirService;
        const cwd = yield* service.cwd;
        const expected = process.cwd();

        strictEqual(cwd, expected);
      }));

    it('returns an absolute path', () =>
      Effect.gen(function* () {
        const service = yield* CurrentWorkingDirService;
        const path = yield* Path.Path;
        const cwd = yield* service.cwd;

        assertTrue(path.isAbsolute(cwd));
      }));

    it('returns a non-empty string', () =>
      Effect.gen(function* () {
        const service = yield* CurrentWorkingDirService;
        const cwd = yield* service.cwd;

        assertTrue(cwd.length > 0);
      }));

    it('is consistent across multiple calls', () =>
      Effect.gen(function* () {
        const service = yield* CurrentWorkingDirService;
        const cwd1 = yield* service.cwd;
        const cwd2 = yield* service.cwd;

        strictEqual(cwd1, cwd2);
      }));
  });
});
