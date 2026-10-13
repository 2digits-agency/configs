import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import type * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import type * as McpSchema from 'effect/ai/McpSchema';

import type { TaskId, TicketId, TimeEntryId } from '../domain/ids.js';
import { type DateRange, type LocalDate, toInclusiveEnd } from '../domain/time.js';
import { McpCallError, McpClient } from '../mcp/McpClient.js';
import { type Capability, type WriteMode, assessCapabilities, callableTools } from './Policy.js';
import {
  type ListedEntry,
  type ProjectRow,
  type TaskOption,
  type TicketComment,
  type TicketDetail,
  type TicketSummary,
  type TimeEntryDetail,
  type TimesheetWeek,
  parseMyTasks,
  parseProjectItems,
  parseProjects,
  parseTicketComments,
  parseTicketDetail,
  parseTickets,
  parseTimeEntryDetail,
  parseTimeEntryList,
  parseTimesheetWeek,
} from './parse.js';

const TaggedErrorClass = Schema.TaggedError;

/**
 * Orbit answered, but with an error (often as plain text with `isError: false`, e.g. `Error: … not a valid …`).
 */
class OrbitToolError extends TaggedErrorClass<OrbitToolError>()('OrbitToolError', {
  tool: Schema.String,
  message: Schema.String,
}) {}

class OrbitRateLimited extends TaggedErrorClass<OrbitRateLimited>()('OrbitRateLimited', {
  tool: Schema.String,
  message: Schema.String,
}) {}

/**
 * The answer did not match the shape this client relies on; the raw text is kept for display.
 */
class OrbitUnreadable extends TaggedErrorClass<OrbitUnreadable>()('OrbitUnreadable', {
  tool: Schema.String,
  raw: Schema.String,
}) {}

/**
 * Blocked locally: not proven, approval-only, read-only mode, or missing/drifted on the gateway.
 */
class OrbitNotAllowed extends TaggedErrorClass<OrbitNotAllowed>()('OrbitNotAllowed', {
  tool: Schema.String,
  reason: Schema.String,
}) {}

export type OrbitError = OrbitToolError | OrbitRateLimited | OrbitUnreadable | OrbitNotAllowed | McpCallError;

export type DataSource = 'live' | 'demo';

export interface CreateTimeEntryArgs {
  readonly taskId: TaskId;
  /**
   * `yyyy-MM-dd HH:mm`; the time part is mandatory in this client.
   */
  readonly date: string;
  readonly durationMinutes: number;
  readonly billable: boolean;
  readonly description?: string;
}

export interface InternalNoteArgs {
  readonly ticketId: TicketId;
  readonly note: string;
}

interface TicketQuery {
  readonly query?: string;
  readonly state?: string;
  readonly limit?: number;
}

export interface OrbitShape {
  readonly source: DataSource;
  readonly endpoint: string;
  readonly writeMode: WriteMode;
  readonly capabilities: ReadonlyArray<Capability>;
  readonly callable: ReadonlySet<string>;
  readonly timesheetWeek: (date: LocalDate) => Effect.Effect<TimesheetWeek, OrbitError>;
  readonly timeEntry: (id: TimeEntryId) => Effect.Effect<TimeEntryDetail, OrbitError>;
  readonly timeEntries: (
    range: DateRange,
    filter?: { readonly taskId?: TaskId },
  ) => Effect.Effect<ReadonlyArray<ListedEntry>, OrbitError>;
  readonly myTasks: (text: string) => Effect.Effect<ReadonlyArray<TaskOption>, OrbitError>;
  readonly projectItems: (
    text: string,
    options?: { readonly projectId?: string; readonly openOnly?: boolean },
  ) => Effect.Effect<ReadonlyArray<TaskOption>, OrbitError>;
  readonly projects: (text: string) => Effect.Effect<ReadonlyArray<ProjectRow>, OrbitError>;
  readonly tickets: (query: TicketQuery) => Effect.Effect<ReadonlyArray<TicketSummary>, OrbitError>;
  readonly ticketDetail: (id: TicketId) => Effect.Effect<TicketDetail, OrbitError>;
  readonly ticketComments: (id: TicketId, limit?: number) => Effect.Effect<ReadonlyArray<TicketComment>, OrbitError>;
  /**
   * Single attempt. Returns Orbit's acknowledgement text; callers must read back.
   */
  readonly createTimeEntry: (args: CreateTimeEntryArgs) => Effect.Effect<string, OrbitError>;
  /**
   * Single attempt; simple note only (no `logMinutes`, no `assignToUser`).
   */
  readonly addInternalComment: (args: InternalNoteArgs) => Effect.Effect<string, OrbitError>;
}

export class Orbit extends Context.Service<Orbit, OrbitShape>()('@2digits/tlo-tui/orbit/Orbit') {}

/**
 * Drops undefined optionals so arguments stay valid JSON and omitted fields are really omitted.
 *
 * @param record
 */
function args(record: Record<string, Schema.Json | undefined>): Schema.JsonObject {
  const result: Record<string, Schema.Json> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

function resultText(result: McpSchema.CallToolResult): string {
  return result.content
    .map((block) => ('text' in block && typeof block.text === 'string' ? block.text : `[${block.type}]`))
    .join('\n')
    .trim();
}

const classify = Effect.fn('Orbit.classify')(function* (tool: string, result: McpSchema.CallToolResult) {
  const text = resultText(result);

  if (text.startsWith('RATE_LIMITED')) {
    return yield* OrbitRateLimited.make({ tool, message: text });
  }

  if (result.isError === true || /^Error\b/i.test(text)) {
    return yield* OrbitToolError.make({
      tool,
      message: text.replace(/^Error:?\s*/i, '') || 'Orbit returned an error.',
    });
  }

  return text;
});

const decode = Effect.fn('Orbit.decode')(function* <T>(
  tool: string,
  text: string,
  parse: (text: string) => Opt.Option<T>,
) {
  const parsed = parse(text);

  return yield* Effect.fromOption(parsed).pipe(Effect.mapError(() => OrbitUnreadable.make({ tool, raw: text })));
});

/**
 * The exact `CreateTimeEntry` arguments, also shown to the user before submit.
 *
 * @param entry
 */
export function createTimeEntryArguments(entry: CreateTimeEntryArgs): Schema.JsonObject {
  return args({
    taskId: entry.taskId,
    date: entry.date,
    durationMinutes: entry.durationMinutes,
    billable: entry.billable,
    description: entry.description === '' ? undefined : entry.description,
  });
}

/**
 * The exact `AddInternalComment` arguments: never `logMinutes` or `assignToUser`.
 *
 * @param note
 */
export function internalNoteArguments(note: InternalNoteArgs): Schema.JsonObject {
  return { ticketId: note.ticketId, note: note.note };
}

export interface OrbitOptions {
  readonly source: DataSource;
  readonly writeMode: WriteMode;
}

export function makeOrbitLayer(options: OrbitOptions) {
  return Layer.effect(
    Orbit,
    Effect.gen(function* () {
      const client = yield* McpClient;

      const capabilities = assessCapabilities(client.tools);

      const callable = callableTools(capabilities, options.writeMode);

      const invoke = Effect.fn('Orbit.invoke')(function* (tool: string, args: Schema.JsonObject) {
        if (!callable.has(tool)) {
          const capability = capabilities.find(({ policy }) => policy.name === tool);

          return yield* OrbitNotAllowed.make({
            tool,
            reason:
              capability === undefined
                ? 'Not in the proven tool policy.'
                : Match.value(capability.status).pipe(
                    Match.tag('Available', () =>
                      Match.value(capability.policy.access).pipe(
                        Match.when('approval-only', () => 'Approval-only: draft a change request instead.'),
                        Match.when('direct-write', () => 'Read-only mode.'),
                        Match.orElse(() => 'Not exposed.'),
                      ),
                    ),
                    Match.tag('Missing', () => 'Gateway: tool missing.'),
                    Match.tag('Drift', () => 'Gateway: schema drift.'),
                    Match.exhaustive,
                  ),
          });
        }

        return yield* classify(tool, yield* client.callTool(tool, args));
      });

      const read = Effect.fn('Orbit.read')(function* <T>(
        tool: string,
        args: Schema.JsonObject,
        parse: (text: string) => Opt.Option<T>,
      ) {
        return yield* decode(tool, yield* invoke(tool, args), parse);
      });

      return Orbit.of({
        source: options.source,
        endpoint: client.endpoint,
        writeMode: options.writeMode,
        capabilities,
        callable,
        timesheetWeek: Effect.fn('Orbit.timesheetWeek')(function* (date) {
          return yield* read('GetTimesheetWeek', { date }, parseTimesheetWeek);
        }),
        timeEntry: Effect.fn('Orbit.timeEntry')(function* (entryId) {
          return yield* read('GetTimeEntry', { entryId }, parseTimeEntryDetail);
        }),
        timeEntries: Effect.fn('Orbit.timeEntries')(function* (range, filter) {
          return yield* read(
            'ListTimeEntries',
            args({ ...toInclusiveEnd(range), taskId: filter?.taskId }),
            parseTimeEntryList,
          );
        }),
        myTasks: Effect.fn('Orbit.myTasks')(function* (text) {
          return yield* read('ListMyTasks', text.trim() === '' ? {} : { text }, parseMyTasks);
        }),
        projectItems: Effect.fn('Orbit.projectItems')(function* (text, itemOptions) {
          return yield* read(
            'SearchProjectItems',
            args({
              text,
              itemType: 'TASK',
              openOnly: itemOptions?.openOnly ?? false,
              projectId: itemOptions?.projectId,
            }),
            parseProjectItems,
          );
        }),
        projects: Effect.fn('Orbit.projects')(function* (text) {
          return yield* read('ListProjects', { text, pageSize: 25 }, parseProjects);
        }),
        tickets: Effect.fn('Orbit.tickets')(function* (query) {
          const text = query.query?.trim() === '' ? undefined : query.query;

          return yield* read(
            'ListTickets',
            args({ limit: query.limit ?? 50, query: text, state: query.state }),
            parseTickets,
          );
        }),
        ticketDetail: Effect.fn('Orbit.ticketDetail')(function* (ticketId) {
          return yield* read('GetTicketDetail', { ticketId }, parseTicketDetail);
        }),
        ticketComments: Effect.fn('Orbit.ticketComments')(function* (ticketId, limit = 30) {
          return yield* read('ListTicketComments', { ticketId, limit }, parseTicketComments);
        }),
        createTimeEntry: Effect.fn('Orbit.createTimeEntry')(function* (entry) {
          return yield* invoke('CreateTimeEntry', createTimeEntryArguments(entry));
        }),
        addInternalComment: Effect.fn('Orbit.addInternalComment')(function* (note) {
          return yield* invoke('AddInternalComment', internalNoteArguments(note));
        }),
      });
    }),
  );
}

export function describeOrbitError(error: OrbitError): string {
  return Match.value(error).pipe(
    Match.tag('OrbitToolError', (value) => `Orbit (${value.tool}): ${value.message}`),
    Match.tag(
      'OrbitRateLimited',
      (value) => `Rate limit (${value.tool}): ${value.message} — niet eerder opnieuw proberen.`,
    ),
    Match.tag(
      'OrbitUnreadable',
      (value) => `Onbekend antwoordformaat van ${value.tool}; ruwe tekst getoond, afhankelijke writes uit.`,
    ),
    Match.tag('OrbitNotAllowed', (value) => `${value.tool} geblokkeerd: ${value.reason}`),
    Match.tag('McpCallError', (error) =>
      error.delivery === 'unknown'
        ? `${error.tool}: ${error.message} Uitkomst onbekend — niet automatisch herhaald.`
        : `${error.tool}: ${error.message} (niet verstuurd)`,
    ),
    Match.exhaustive,
  );
}

export function isOrbitError(error: unknown): error is OrbitError {
  return (
    Schema.is(OrbitToolError)(error) ||
    Schema.is(OrbitRateLimited)(error) ||
    Schema.is(OrbitUnreadable)(error) ||
    Schema.is(OrbitNotAllowed)(error) ||
    Schema.is(McpCallError)(error)
  );
}
