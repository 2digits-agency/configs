import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as TestConsole from 'effect/testing/TestConsole';

import { McpLoggerLayer } from '../src/mcp/server.js';

describe('mcp logging', () => {
  it.effect('routes logs to stderr without writing to stdout', () =>
    Effect.gen(function* () {
      yield* Effect.log('MCP diagnostic').pipe(Effect.provide(McpLoggerLayer));

      const stderr = yield* TestConsole.errorLines;
      const stdout = yield* TestConsole.logLines;

      expect(stderr.join('\n')).toContain('MCP diagnostic');
      expect(stdout).toStrictEqual([]);
    }),
  );
});
