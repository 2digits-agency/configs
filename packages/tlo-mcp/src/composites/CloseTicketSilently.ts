import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import { ApiId } from '../orbit/text.js';
import { CloseTicketSilently as OrbitCloseTicketSilently } from '../orbit/tickets.js';
import { findTicketId, TicketRef } from './GetTicketContext.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

export class TicketClosedSilently extends Schema.Class<TicketClosedSilently, { readonly brand: unique symbol }>(
  'TicketClosedSilently',
)({
  ticketId: ApiId.annotate({ description: 'api_id of the closed ticket' }),
  message: Schema.String.annotate({ description: "Orbit's confirmation" }),
}) {}

/**
 * Orbit's `CloseTicketSilently`, which also takes the ticket number. Resolving a number is a read; the close is still
 * one Orbit write per call, so Executor approves every close separately.
 */
export const CloseTicketSilently = Tool.make('CloseTicketSilently', {
  description:
    'Close a ticket WITHOUT notifying the client: no closing message is sent and nothing is added to the conversation the client sees. Use it for tickets that need no answer, such as automatic reports or emails that only copied the support address. Use CloseTicket when the client should get a closing message. Only open tickets can be closed; Orbit rejects a ticket that is already closed.',
  parameters: Schema.Struct({
    ticket: TicketRef,
  }),
  success: TicketClosedSilently,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const CloseTicketSilentlyHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('CloseTicketSilently')(function* ({ ticket }: Tool.Parameters<typeof CloseTicketSilently>) {
    const ticketId = yield* findTicketId(orbit, ticket);

    const message = yield* orbit.call(OrbitCloseTicketSilently, { ticketId });

    return TicketClosedSilently.make({ ticketId, message });
  }, Effect.mapError(toReadError));
});
