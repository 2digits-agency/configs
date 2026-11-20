import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';
import * as Url from 'effect/http/Url';

/**
 * Raw Orbit text results (CRLF preserved) captured from live Orbit; names and free text are redacted. Loaded once up
 * front so tests and reply tables can use them synchronously.
 */
const fixtures = await Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;

  const path = yield* Path.Path;

  const directoryUrl = yield* Effect.fromResult(Url.fromString('fixtures/orbit/', import.meta.url));

  const directory = yield* path.fromFileUrl(directoryUrl);

  const files = yield* fs.readDirectory(directory);

  const entries = yield* Effect.all(
    Arr.map(files, (file) =>
      Effect.map(fs.readFileString(path.join(directory, file)), (text) => [path.basename(file, '.txt'), text] as const),
    ),
    { concurrency: 'unbounded' },
  );

  return new Map(entries);
}).pipe(Effect.provide(NodeServices.layer), Effect.runPromise);

export function fixture(name: string) {
  return Opt.getOrThrowWith(Opt.fromUndefinedOr(fixtures.get(name)), () => new Error(`Missing fixture ${name}`));
}
