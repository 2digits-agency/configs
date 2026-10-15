import { homedir } from 'node:os';

import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

/**
 * Written by `tlo-mcp`; this client only reads it and never creates or rotates it.
 */
export const DEFAULT_KEY_FILE = `${homedir()}/.config/2digits/tlo-mcp/gateway.key`;

const KEY = /^[a-f0-9]{64}$/;

const TaggedErrorClass = Schema.TaggedError;

export class GatewayKeyError extends TaggedErrorClass<GatewayKeyError>()('GatewayKeyError', {
  message: Schema.String,
}) {}

/**
 * Loads the gateway bearer key without ever printing it. The file must be private (no group/other bits).
 *
 * @param file
 */
export const loadGatewayKey = Effect.fn('GatewayKey.load')(function* (file: string) {
  const fs = yield* FileSystem.FileSystem;

  const info = yield* fs.stat(file).pipe(
    Effect.mapError(() =>
      GatewayKeyError.make({
        message: `Gateway key not found at ${file}. Start tlo-mcp once (it creates the key), or pass --key-file.`,
      }),
    ),
  );

  if (info.type !== 'File' || (info.mode & 0o077) !== 0) {
    return yield* GatewayKeyError.make({ message: `Gateway key ${file} must be a private file (chmod 600).` });
  }

  const value = (yield* fs
    .readFileString(file)
    .pipe(Effect.mapError(() => GatewayKeyError.make({ message: `Cannot read gateway key ${file}.` })))).trim();

  if (!KEY.test(value)) {
    return yield* GatewayKeyError.make({ message: `Gateway key ${file} has an unexpected format.` });
  }

  return Redacted.make(value);
});
