import * as Effect from 'effect/Effect';
import * as Toolkit from 'effect/ai/Toolkit';

import { Orbit } from '../orbit/Orbit.js';
import { GetMyWorkday, getMyWorkday } from './GetMyWorkday.js';

/**
 * Read-only tools that combine several Orbit reads. Writes stay 1:1 Orbit tools so each one is approved separately.
 */
export const CompositeTools = Toolkit.make(GetMyWorkday);

export const CompositeToolsLive = CompositeTools.toLayer(
  Effect.gen(function* () {
    const orbit = yield* Orbit;

    return CompositeTools.of({
      GetMyWorkday: (params) => getMyWorkday(orbit, params),
    });
  }),
);
