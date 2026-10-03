import { DatabaseSync } from 'node:sqlite';

import * as Effect from 'effect/Effect';

const db = new DatabaseSync(':memory:');
const cleanup = Effect.sync(() => db.close());

export const task = Effect.never.pipe(
  Effect.tap(() => cleanup),
  Effect.tapError(() => cleanup),
);
