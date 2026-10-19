import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, it } from '@effect/vitest';
import { deepStrictEqual } from '@effect/vitest/utils';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Stdio from 'effect/Stdio';
import * as CliConfig from 'effect/cli/CliConfig';

import { cli } from '../../src/Cli.js';
import { EslintSetupService } from '../../src/services/EslintSetupService.js';
import { PrettierSetupService } from '../../src/services/PrettierSetupService.js';
import { TurborepoSetupService } from '../../src/services/TurborepoSetupService.js';

const runCli = Effect.fn('runCli')(function* (args: ReadonlyArray<string>) {
  const ran = yield* Ref.make<ReadonlyArray<string>>([]);

  function record(name: string) {
    return () => Ref.update(ran, (names) => [...names, name]);
  }

  yield* cli.pipe(
    // oxlint-disable-next-line effecttsgo/strict-effect-provide -- the test runs the CLI as its entry point
    Effect.provide(
      Layer.mergeAll(
        CliConfig.layer(),
        NodeServices.layer,
        Stdio.layerTest({ args: Effect.succeed(args) }),
        Layer.mock(PrettierSetupService, { setup: record('prettier') }),
        Layer.mock(EslintSetupService, { setup: record('eslint') }),
        Layer.mock(TurborepoSetupService, { setup: record('turbo') }),
      ),
    ),
  );

  return yield* Ref.get(ran);
});

describe('2d command', () => {
  it.effect.each([
    { args: [], expected: ['prettier'] },
    { args: ['--prettier'], expected: ['prettier'] },
    { args: ['--no-prettier'], expected: [] },
    { args: ['--no-prettier', '--eslint', '--turbo'], expected: ['eslint', 'turbo'] },
  ])('$args runs $expected', ({ args, expected }) =>
    Effect.gen(function* () {
      deepStrictEqual(yield* runCli(args), expected);
    }),
  );
});
