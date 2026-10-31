import * as Effect from 'effect/Effect';
import * as Toolkit from 'effect/ai/Toolkit';

import { Orbit } from '../orbit/Orbit.js';
import { GetBoardContext, getBoardContext } from './GetBoardContext.js';
import { GetMyWorkday, getMyWorkday } from './GetMyWorkday.js';
import { GetTicketContext, getTicketContext } from './GetTicketContext.js';

/**
 * Read-only tools that combine several Orbit reads. Writes stay 1:1 Orbit tools so each one is approved separately.
 */
export const CompositeTools = Toolkit.make(GetMyWorkday, GetTicketContext, GetBoardContext);

export const CompositeToolsLive = CompositeTools.toLayer(
  Effect.gen(function* () {
    const orbit = yield* Orbit;

    return CompositeTools.of({
      GetMyWorkday: (params) => getMyWorkday(orbit, params),
      GetTicketContext: (params) => getTicketContext(orbit, params),
      GetBoardContext: (params) => getBoardContext(orbit, params),
    });
  }),
);
