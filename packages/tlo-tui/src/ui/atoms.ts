import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import type * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import type { TicketId, TimeEntryId } from '../domain/ids.js';
import type { LocalDate } from '../domain/time.js';
import {
  type BookingDraft,
  type ValidBooking,
  type Attempt,
  emptyDraft,
  readbackBooking,
  submitBooking,
} from '../flows/Booking.js';
import { type ChangeRequest, ChangeRequestStore } from '../flows/ChangeRequest.js';
import { submitNote } from '../flows/InternalNote.js';
import type { GatewayKeyError } from '../mcp/GatewayKey.js';
import type { McpConnectError } from '../mcp/McpClient.js';
import { Orbit, type OrbitError } from '../orbit/Orbit.js';
import type { ProjectRow, TaskOption, TicketComment, TicketDetail, TicketSummary } from '../orbit/parse.js';

export type Tab = 'week' | 'search' | 'book' | 'support' | 'corrections' | 'reply' | 'capabilities';

export const TABS: ReadonlyArray<{ readonly id: Tab; readonly key: string; readonly label: string }> = [
  { id: 'week', key: '1', label: 'Week' },
  { id: 'search', key: '2', label: 'Zoeken' },
  { id: 'book', key: '3', label: 'Boeken' },
  { id: 'support', key: '4', label: 'Support' },
  { id: 'corrections', key: '5', label: 'Correcties' },
  { id: 'reply', key: '6', label: 'Klantantwoord' },
  { id: 'capabilities', key: '7', label: 'Capabilities' },
];

export type SearchSource = 'my-tasks' | 'project-items' | 'projects' | 'tickets';

type SearchResult =
  | { readonly _tag: 'Idle' }
  | { readonly _tag: 'Tasks'; readonly source: 'my-tasks' | 'project-items'; readonly rows: ReadonlyArray<TaskOption> }
  | { readonly _tag: 'Projects'; readonly rows: ReadonlyArray<ProjectRow> }
  | { readonly _tag: 'Tickets'; readonly rows: ReadonlyArray<TicketSummary> };

const SearchResult = Data.taggedEnum<SearchResult>();

export interface SearchRequest {
  readonly source: SearchSource;
  readonly text: string;
  readonly projectId: string | undefined;
}

export type AppServices = Orbit | ChangeRequestStore;

type AppLayerError = GatewayKeyError | McpConnectError;

/**
 * All Effect work reaches the UI through these atoms; components only read results and trigger functions.
 *
 * @param layer
 * @param today
 */
export function makeAtoms<TError>(layer: Layer.Layer<AppServices, TError>, today: LocalDate) {
  const runtime = Atom.runtime(layer);

  const info = runtime.atom(
    Orbit.pipe(
      Effect.map((orbit) => ({
        source: orbit.source,
        endpoint: orbit.endpoint,
        writeMode: orbit.writeMode,
        capabilities: orbit.capabilities,
        callable: orbit.callable,
      })),
    ),
  );

  const selectedDate = Atom.make(today).pipe(Atom.keepAlive);

  const week = runtime.atom((get) => Orbit.use((orbit) => orbit.timesheetWeek(get(selectedDate))));

  const entryDetail = Atom.family((id: TimeEntryId) => runtime.atom(Orbit.use((orbit) => orbit.timeEntry(id))));

  const searchRequest = Atom.make<Opt.Option<SearchRequest>>(Opt.none()).pipe(Atom.keepAlive);

  const searchResults = runtime.atom((get) =>
    Effect.gen(function* () {
      const request = get(searchRequest);

      if (Opt.isNone(request)) {
        return SearchResult.Idle();
      }

      const orbit = yield* Orbit;

      const { source, text, projectId } = request.value;

      return yield* Match.value(source).pipe(
        Match.when('my-tasks', (source) =>
          Effect.map(orbit.myTasks(text), (rows) => SearchResult.Tasks({ source, rows })),
        ),
        Match.when('project-items', (source) =>
          Effect.map(orbit.projectItems(text, { projectId }), (rows) => SearchResult.Tasks({ source, rows })),
        ),
        Match.when('projects', () => Effect.map(orbit.projects(text), (rows) => SearchResult.Projects({ rows }))),
        Match.when('tickets', () =>
          Effect.map(orbit.tickets({ query: text, state: 'NEW|OPEN|WAIT|CLOSED|REQCLOSE', limit: 50 }), (rows) =>
            SearchResult.Tickets({ rows }),
          ),
        ),
        Match.exhaustive,
      );
    }),
  );

  const ticketFilter = Atom.make<{ readonly query: string; readonly includeClosed: boolean }>({
    query: '',
    includeClosed: false,
  }).pipe(Atom.keepAlive);

  const tickets = runtime.atom((get) => {
    const filter = get(ticketFilter);

    return Orbit.use((orbit) =>
      orbit.tickets({
        query: filter.query,
        state: filter.includeClosed ? 'NEW|OPEN|WAIT|CLOSED|REQCLOSE' : undefined,
        limit: 50,
      }),
    );
  });

  const ticketDetail = Atom.family((id: TicketId) => runtime.atom(Orbit.use((orbit) => orbit.ticketDetail(id))));

  const ticketComments = Atom.family((id: TicketId) =>
    runtime.atom(Orbit.use((orbit) => orbit.ticketComments(id, 30))),
  );

  // Stand-ins while no ticket is selected, so hooks never trigger a read for a placeholder id.
  const noTicketDetail = Atom.make<AsyncResult.AsyncResult<TicketDetail, OrbitError | TError>>(AsyncResult.initial());

  const noTicketComments = Atom.make<AsyncResult.AsyncResult<ReadonlyArray<TicketComment>, OrbitError | TError>>(
    AsyncResult.initial(),
  );

  return {
    today,
    noTicketDetail,
    noTicketComments,
    info,
    selectedDate,
    week,
    entryDetail,
    searchRequest,
    searchResults,
    ticketFilter,
    tickets,
    ticketDetail,
    ticketComments,
    tab: Atom.make<Tab>('week').pipe(Atom.keepAlive),
    editing: Atom.make(false).pipe(Atom.keepAlive),
    bookingDraft: Atom.make<BookingDraft>({ ...emptyDraft, date: today }).pipe(Atom.keepAlive),
    selectedTicket: Atom.make<Opt.Option<TicketId>>(Opt.none()).pipe(Atom.keepAlive),
    correctionTarget: Atom.make<Opt.Option<TimeEntryId>>(Opt.none()).pipe(Atom.keepAlive),
    status: Atom.make('').pipe(Atom.keepAlive),
    submitBooking: runtime.fn(
      (args: { readonly booking: ValidBooking; readonly acceptDuplicate: boolean; readonly today: LocalDate }) =>
        submitBooking(args.booking, { acceptDuplicate: args.acceptDuplicate, today: args.today }),
    ),
    rereadBooking: runtime.fn((args: { readonly booking: ValidBooking; readonly attempt: Attempt }) =>
      readbackBooking(args.booking, args.attempt),
    ),
    submitNote: runtime.fn((args: { readonly ticketId: TicketId; readonly note: string }) =>
      submitNote(args.ticketId, args.note),
    ),
    saveRequest: runtime.fn((request: ChangeRequest) => ChangeRequestStore.use((store) => store.save(request))),
  };
}

export type AppAtoms = ReturnType<typeof makeAtoms<AppLayerError>>;

export function taskLabel(project: string, task: string): string {
  return task === '' ? project : `${project} / ${task}`;
}
