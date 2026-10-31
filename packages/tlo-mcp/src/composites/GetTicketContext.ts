import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tool from 'effect/ai/Tool';

import { TimeEntry } from '../orbit/GetTimesheetWeek.js';
import { ListTimeEntries } from '../orbit/ListTimeEntries.js';
import type { OrbitShape } from '../orbit/Orbit.js';
import { ApiId, Minutes, TIME_ZONE } from '../orbit/text.js';
import { GetTicketDetail, ListTicketComments, ListTickets, TicketComment, TicketDetail } from '../orbit/tickets.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

const ALL_STATES = 'NEW|OPEN|WAIT|CLOSED|DELETED|REQCLOSE';

const API_ID = /^[A-Z0-9]{15}$/;

export class TicketContext extends Schema.Class<TicketContext, { readonly brand: unique symbol }>('TicketContext')({
  ticket: TicketDetail,
  comments: Schema.Array(TicketComment).annotate({ description: 'Newest first, internal notes included' }),
  commentCount: Schema.Int,
  timeEntries: Schema.Array(TimeEntry).annotate({ description: 'Your entries booked on this ticket' }),
  timeEntriesTruncated: Schema.Boolean.annotate({ description: 'Orbit capped the entry search at 100 rows' }),
  loggedMinutes: Minutes.annotate({ description: 'Sum of timeEntries' }),
  mentionedIn: Schema.Array(ApiId).annotate({
    description: 'Your other entries whose description mentions the ticket number',
  }),
}) {}

export const GetTicketContext = Tool.make('GetTicketContext', {
  description:
    'Read-only context for one support ticket by its number (e.g. 9087) or api_id, in one call: full detail, the conversation (newest first), and your time entries on it. Finds closed tickets too. Times are Europe/Amsterdam. Use Orbit write tools (ReplyToTicket, AddInternalComment, CloseTicket) for changes.',
  parameters: Schema.Struct({
    ticket: Schema.String.annotate({ description: 'Ticket number such as "9087", or the ticket api_id' }),
  }),
  success: TicketContext,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const getTicketContext = Effect.fn('GetTicketContext')(function* (
  orbit: OrbitShape,
  { ticket }: Tool.Parameters<typeof GetTicketContext>,
) {
  const query = Str.trim(ticket);

  let ticketId = query;

  if (!API_ID.test(query)) {
    const { tickets } = yield* orbit.call(ListTickets, { query, state: ALL_STATES, limit: 100 });

    const found = Arr.findFirst(tickets, ({ number }) => number === query);

    if (Opt.isNone(found)) {
      return yield* Effect.fail(OrbitReadError.make({ message: `No ticket with number ${query} found.` }));
    }

    ticketId = found.value.ticketId;
  }

  const [detail, comments] = yield* Effect.all(
    [orbit.call(GetTicketDetail, { ticketId }), orbit.call(ListTicketComments, { ticketId, limit: 100 })],
    { concurrency: 'unbounded' },
  );

  // ListTimeEntries has no ticket filter; Orbit puts the ticket number in the description of ticket entries.
  const entries = yield* orbit.call(ListTimeEntries, {
    dateFrom: DateTime.formatIsoDate(detail.createdDate),
    dateTo: DateTime.formatIsoDate(detail.closedDate ?? DateTime.setZoneNamedUnsafe(yield* DateTime.now, TIME_ZONE)),
    text: detail.number,
  });

  const marker = `ticket "${detail.name}"`;

  // The work/description split cuts at the first " — ", which can fall inside the ticket name.
  function onTicket({ work, description }: TimeEntry) {
    const text = description === undefined ? work : `${work} — ${description}`;

    return text === marker || Str.startsWith(`${marker} — `)(text);
  }

  const timeEntries = Arr.filter(entries.entries, onTicket);

  const mentions = Arr.filter(entries.entries, (entry) => !onTicket(entry));

  return TicketContext.make({
    ticket: detail,
    comments: comments.comments,
    commentCount: comments.count,
    timeEntries,
    timeEntriesTruncated: entries.truncated,
    loggedMinutes: Arr.reduce(timeEntries, 0, (sum, entry) => sum + entry.minutes),
    mentionedIn: Arr.map(mentions, ({ id }) => id),
  });
}, Effect.mapError(toReadError));
