import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import { ApiId, UserId } from '../orbit/text.js';
import { SetTicketOwner as OrbitSetTicketOwner } from '../orbit/tickets.js';
import { findTicketId, TicketRef } from './GetTicketContext.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

export class TicketOwnerSet extends Schema.Class<TicketOwnerSet, { readonly brand: unique symbol }>('TicketOwnerSet')({
  ticketId: ApiId.annotate({ description: 'api_id of the ticket' }),
  ownerId: UserId.annotate({ description: 'api_id of the new owner' }),
  message: Schema.String.annotate({ description: "Orbit's confirmation" }),
}) {}

/**
 * Orbit's `SetTicketOwner`, which also takes the ticket number and only a user api_id as owner. One Orbit write per
 * call, so Executor approves every change separately.
 */
export const SetTicketOwner = Tool.make('SetTicketOwner', {
  description:
    "Make a user the OWNER of a ticket: the person responsible for it. This is not the assignee; ReplyToTicket's assignToUser changes who works on it. The new owner must be an agent on the ticket's queue, or Orbit refuses. GetTicketDetail shows the current owner.",
  parameters: Schema.Struct({
    ticket: TicketRef,
    owner: UserId.annotate({
      description: 'User api_id of the new owner (starts with US), from ListUsers or SearchCrm',
    }),
  }),
  success: TicketOwnerSet,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const SetTicketOwnerHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('SetTicketOwner')(function* ({ ticket, owner }: Tool.Parameters<typeof SetTicketOwner>) {
    const ticketId = yield* findTicketId(orbit, ticket);

    const message = yield* orbit.call(OrbitSetTicketOwner, { ticketId, user: owner });

    return TicketOwnerSet.make({ ticketId, ownerId: owner, message });
  }, Effect.mapError(toReadError));
});
