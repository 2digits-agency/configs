import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Path from 'effect/Path';

/**
 * Raw Orbit text results (CRLF preserved) captured from live Orbit; names and free text are redacted. Loaded once up
 * front so tests and reply tables can use them synchronously.
 */
const fixtures = await Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  const path = yield* Path.Path;

  const directory = yield* path.fromFileUrl(new URL('fixtures/orbit/', import.meta.url));

  const fixtures = new Map<string, string>();

  const files = yield* fs.readDirectory(directory);

  for (const file of files) {
    const text = yield* fs.readFileString(path.join(directory, file));

    fixtures.set(path.basename(file, '.txt'), text);
  }

  return fixtures;
}).pipe(Effect.provide(NodeServices.layer), Effect.runPromise);

export function fixture(name: string) {
  const text = fixtures.get(name);

  if (text === undefined) {
    throw new Error(`Missing fixture ${name}`);
  }

  return text;
}
