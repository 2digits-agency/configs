import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import { ApiId, ProjectTaskId } from '../orbit/text.js';
import { LinkTicketToProject as OrbitLinkTicketToProject } from '../orbit/tickets.js';
import { findTicketId, TicketRef } from './GetTicketContext.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

export class TicketLinked extends Schema.Class<TicketLinked, { readonly brand: unique symbol }>('TicketLinked')({
  ticketId: ApiId.annotate({ description: 'api_id of the ticket' }),
  taskId: ProjectTaskId.pipe(Schema.NullOr).annotate({ description: 'The linked project task, or null when unlinked' }),
  message: Schema.String.annotate({ description: "Orbit's confirmation" }),
}) {}

/**
 * Orbit's `LinkTicketToProject`, which also takes the ticket number, only a project task api_id, and `null` instead of
 * an empty string to unlink. One Orbit write per call, so Executor approves every change separately.
 */
export const LinkTicketToProject = Tool.make('LinkTicketToProject', {
  description:
    "Link a ticket to a PROJECT TASK, so time logged on the ticket is booked on that task. Orbit also moves the ticket's existing uninvoiced time to the task. It takes a task, not a project: find the task api_id with GetProject or SearchProjectItems. Pass taskId null to unlink. GetTicketDetail shows the current link.",
  parameters: Schema.Struct({
    ticket: TicketRef,
    taskId: ProjectTaskId.pipe(Schema.NullOr).annotate({
      description: 'Project task api_id (starts with PT), or null to unlink the ticket',
    }),
  }),
  success: TicketLinked,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const LinkTicketToProjectHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('LinkTicketToProject')(function* ({ ticket, taskId }: Tool.Parameters<typeof LinkTicketToProject>) {
    const ticketId = yield* findTicketId(orbit, ticket);

    const message = yield* orbit.call(OrbitLinkTicketToProject, { ticketId, taskId: taskId ?? '' });

    return TicketLinked.make({ ticketId, taskId, message });
  }, Effect.mapError(toReadError));
});
