import { describe, expect, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as TestConsole from 'effect/testing/TestConsole';

import { McpLoggerLayer } from '../src/mcp/logger.js';

describe('mcp logging', () => {
  it.effect('routes logs to stderr without writing to stdout', () =>
    Effect.gen(function* () {
      yield* Effect.log('MCP diagnostic').pipe(Effect.provide(McpLoggerLayer));

      const stderr = yield* TestConsole.errorLines;

      const stdout = yield* TestConsole.logLines;

      expect(Arr.join(Fn.pipe(stderr, Arr.map(String)), '\n')).toContain('MCP diagnostic');

      expect(stdout).toStrictEqual([]);
    }),
  );
});
