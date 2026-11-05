import * as Effect from 'effect/Effect';
import * as Toolkit from 'effect/ai/Toolkit';

import { Orbit } from '../orbit/Orbit.js';
import { AddProjectTask, addProjectTask } from './AddProjectTask.js';
import { GetBoardContext, getBoardContext } from './GetBoardContext.js';
import { GetMyWorkday, getMyWorkday } from './GetMyWorkday.js';
import { GetTicketContext, getTicketContext } from './GetTicketContext.js';

/**
 * Tools the gateway defines itself: read-only tools that combine several Orbit reads, and Orbit writes with stricter
 * schemas. Each write is still exactly one Orbit write, so each one is approved separately.
 */
export const CompositeTools = Toolkit.make(GetMyWorkday, GetTicketContext, GetBoardContext, AddProjectTask);

export const CompositeToolsLive = CompositeTools.toLayer(
  Effect.gen(function* () {
    const orbit = yield* Orbit;

    return CompositeTools.of({
      GetMyWorkday: (params) => getMyWorkday(orbit, params),
      GetTicketContext: (params) => getTicketContext(orbit, params),
      GetBoardContext: (params) => getBoardContext(orbit, params),
      AddProjectTask: (params) => addProjectTask(orbit, params),
    });
  }),
);
