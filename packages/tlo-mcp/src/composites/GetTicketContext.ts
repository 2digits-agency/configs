import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Num from 'effect/Number';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tool from 'effect/ai/Tool';

import { TimeEntry } from '../orbit/GetTimesheetWeek.js';
import { ListTimeEntries } from '../orbit/ListTimeEntries.js';
import { Orbit, type OrbitShape } from '../orbit/Orbit.js';
import { ApiId, Minutes, TIME_ZONE } from '../orbit/text.js';
import { GetTicketDetail, ListTicketComments, ListTickets, TicketComment, TicketDetail } from '../orbit/tickets.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

const ALL_STATES = 'NEW|OPEN|WAIT|CLOSED|DELETED|REQCLOSE';

const API_ID = /^[A-Z0-9]{15}$/;

const COMMENT_LIMIT = 100;

const TICKET_LIMIT = 100;

const loggedMinutes = Match.type<TimeEntry>().pipe(
  Match.when({ kind: 'logged' }, ({ minutes }) => minutes),
  Match.orElse(() => 0),
);

/**
 * The api_id of a ticket given by its number or api_id. Searches all states, so closed tickets are found too.
 */
export const findTicketId = Effect.fn('findTicketId')(function* (orbit: OrbitShape, ticket: string) {
  const query = Str.trim(ticket);

  if (API_ID.test(query)) {
    return query;
  }

  const { tickets } = yield* orbit.call(ListTickets, { query, state: ALL_STATES, limit: TICKET_LIMIT });

  const found = Arr.findFirst(tickets, ({ number }) => number === query);

  if (Opt.isNone(found)) {
    return yield* Effect.fail(
      OrbitReadError.make({
        message:
          tickets.length >= TICKET_LIMIT
            ? `Ticket ${query} is not in the first ${TICKET_LIMIT} search results Orbit returned; pass the ticket api_id instead.`
            : `No ticket with number ${query} found.`,
      }),
    );
  }

  return found.value.ticketId;
});

export class TicketContext extends Schema.Class<TicketContext, { readonly brand: unique symbol }>('TicketContext')({
  ticket: TicketDetail,
  comments: Schema.Array(TicketComment).annotate({ description: 'Newest first, internal notes included' }),
  commentCount: Schema.Int.annotate({ description: 'Number of comments returned, not the ticket total' }),
  commentsTruncated: Schema.Boolean.annotate({
    description: 'Orbit returns at most 100 comments; true when that cap was reached, so older comments may be missing',
  }),
  timeEntries: Schema.Array(TimeEntry).annotate({ description: 'Your entries booked on this ticket' }),
  timeEntriesTruncated: Schema.Boolean.annotate({ description: 'Orbit capped the entry search at 100 rows' }),
  loggedMinutes: Minutes.annotate({ description: 'Sum of the logged timeEntries; planned entries are not counted' }),
  mentionedIn: Schema.Array(ApiId).annotate({
    description: 'Your other entries whose description mentions the ticket number',
  }),
}) {}

export const GetTicketContext = Tool.make('GetTicketContext', {
  description:
    'Read-only context for one support ticket by its number (e.g. 9087) or api_id, in one call: full detail, the conversation (newest first), and your time entries on it. Finds closed tickets too. Times are Europe/Amsterdam. Use the write tools (ReplyToTicket, AddInternalComment, CloseTicket, CloseTicketSilently) for changes.',
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

export const GetTicketContextHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('GetTicketContext')(function* ({ ticket }: Tool.Parameters<typeof GetTicketContext>) {
    const ticketId = yield* findTicketId(orbit, ticket);

    const [detail, comments] = yield* Effect.all(
      [orbit.call(GetTicketDetail, { ticketId }), orbit.call(ListTicketComments, { ticketId, limit: COMMENT_LIMIT })],
      { concurrency: 'unbounded' },
    );

    /*
     * ListTimeEntries has no ticket filter; Orbit puts the ticket number in the description of ticket entries. Search up
     * to today, because time can still be booked on a ticket after it closed.
     */
    const now = yield* DateTime.now;

    const entries = yield* orbit.call(ListTimeEntries, {
      dateFrom: DateTime.formatIsoDate(detail.createdDate),
      dateTo: DateTime.formatIsoDate(DateTime.setZoneNamedUnsafe(now, TIME_ZONE)),
      text: detail.number,
    });

    /*
     * Orbit writes ticket entries as `ticket "<name>" — <number> <name>`. Match the number only: titles are not unique,
     * and an entry keeps the title it was booked under after a rename.
     */
    function onTicket({ work, description = '' }: TimeEntry) {
      const [number] = Str.split(description, ' ');

      return Str.startsWith('ticket "')(work) && number === detail.number;
    }

    // Orbit's text search also matches substrings (19087) and other fields, so a mention needs the number as a token.
    function mentions({ work, description = '' }: TimeEntry) {
      return Arr.contains(Str.split(`${work} ${description}`, /\D+/), detail.number);
    }

    const timeEntries = Arr.filter(entries.entries, onTicket);

    const mentionedIn = Arr.filter(entries.entries, (entry) => !onTicket(entry) && mentions(entry));

    return TicketContext.make({
      ticket: detail,
      comments: comments.comments,
      commentCount: comments.count,
      commentsTruncated: comments.comments.length >= COMMENT_LIMIT,
      timeEntries,
      timeEntriesTruncated: entries.truncated,
      loggedMinutes: Num.sumAll(Arr.map(timeEntries, loggedMinutes)),
      mentionedIn: Arr.map(mentionedIn, ({ id }) => id),
    });
  }, Effect.mapError(toReadError));
});
