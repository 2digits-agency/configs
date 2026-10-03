import { DatabaseSync } from 'node:sqlite';

import * as Effect from 'effect/Effect';

const db = new DatabaseSync(':memory:');

export const task = Effect.never.pipe(Effect.ensuring(Effect.sync(() => db.close())));
