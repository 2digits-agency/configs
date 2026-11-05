/**
 * @effect-diagnostics preferEffectArray:off preferEffectString:off nodeBuiltinImport:off
 */
import { readFileSync } from 'node:fs';

import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import type * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as McpClientError from 'effect/ai/McpClientError';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as TestClock from 'effect/testing/TestClock';

import { BoardContext } from '../src/composites/GetBoardContext.js';
import { Workday } from '../src/composites/GetMyWorkday.js';
import { TicketContext } from '../src/composites/GetTicketContext.js';
import { gatewayRoutes } from '../src/http/gateway.js';
import { OrbitClient } from '../src/mcp/OrbitClient.js';
import { OrbitToolsLive } from '../src/mcp/proxy.js';
import { ProjectTaskAdded } from '../src/orbit/AddProjectTask.js';
import { PlatformLive } from '../src/platform.js';

function fixture(name: string) {
  return readFileSync(new URL(`fixtures/orbit/${name}.txt`, import.meta.url), 'utf8');
}

const UPSTREAM = [
  'GetTimesheetWeek',
  'ListAbsences',
  'ListPlannedEntries',
  'GetRunningTimer',
  'ListMyTasks',
  'ListTimeEntries',
  'ListTickets',
  'GetTicketDetail',
  'ListTicketComments',
  'ListBoards',
  'ListBoardLists',
  'ListTodos',
  'GetTodoDetail',
  'AddProjectTask',
].map((name) => McpSchema.Tool.make({ name, inputSchema: { type: 'object' } }));

type Reply = string | McpSchema.CallToolResult | McpClientError.McpClientError;

interface Call {
  readonly name: string;
  readonly args: Schema.JsonObject;
}

/**
 * Orbit's answer to one call: captured text as a single text block, a raw result, or a client error.
 *
 * @param reply
 */
function answer(reply: Reply): Effect.Effect<McpSchema.CallToolResult, McpClientError.McpClientError> {
  if (typeof reply === 'string') {
    return Effect.succeed(McpSchema.CallToolResult.make({ content: [{ type: 'text', text: reply }] }));
  }

  return P.isTagged(reply, 'McpClientError') ? Effect.fail(reply) : Effect.succeed(reply);
}

/**
 * Register the gateway tools against a fake Orbit that answers each tool with captured text.
 *
 * @param replies
 */
const setup = Effect.fn('CompositeTools.test.setup')(function* (
  replies: Record<string, Reply | ((args: Schema.JsonObject) => Reply)>,
) {
  type Registration = Parameters<Context.Service.Shape<typeof McpServer.McpServer>['addTool']>[0];

  const registrations = new Map<string, Registration>();

  const calls: Array<Call> = [];

  const server = Layer.effect(
    McpServer.McpServer,
    Effect.gen(function* () {
      const base = yield* McpServer.McpServer.make;

      return McpServer.McpServer.of({
        ...base,
        addTool: Effect.fn('CompositeTools.test.addTool')(function* (registration) {
          registrations.set(registration.tool.name, registration);

          yield* base.addTool(registration);
        }),
      });
    }),
  );

  function callTool(tool: McpSchema.Tool, args: Schema.JsonObject) {
    calls.push({ name: tool.name, args });

    const entry = replies[tool.name];

    const reply = typeof entry === 'function' ? entry(args) : entry;

    if (reply === undefined) {
      return Effect.die(`Unexpected Orbit call ${tool.name}`);
    }

    return answer(reply);
  }

  yield* Layer.build(
    OrbitToolsLive.pipe(
      Layer.provide(server),
      Layer.provide(Layer.succeed(OrbitClient, { tools: UPSTREAM, instructions: undefined, callTool })),
      Layer.provide(NodeServices.layer),
    ),
  );

  const call = Effect.fn('CompositeTools.test.call')(function* (name: string, input: unknown) {
    const registration = registrations.get(name);

    if (registration === undefined) {
      return yield* Effect.die(`Missing ${name}`);
    }

    const result = yield* registration.handle(input);

    if (!('content' in result)) {
      return yield* Effect.die('Unexpected InputRequired');
    }

    return result;
  });

  return { registrations, calls, call };
});

const requestContext = Layer.succeed(McpSchema.McpRequestContext, {
  clientId: 1,
  protocolVersion: '2025-06-18',
  clientCapabilities: {},
});

/**
 * Check the structured result against the tool's output schema and type it as the JSON the client receives.
 *
 * @param schema
 * @param result
 */
function structured<TSchema extends Schema.Top>(schema: TSchema, result: McpSchema.CallToolResult) {
  return Schema.decodeUnknownEffect(schema.pipe(Schema.toEncoded))(result.structuredContent);
}

function textOf(result: McpSchema.CallToolResult) {
  const [block] = result.content;

  return block?.type === 'text' ? block.text : '';
}

const HOLIDAY_MONDAY = '2026-12-28';

const OPEN_WEDNESDAY = '2026-10-28';

const workdayReplies = {
  ListAbsences: fixture('ListAbsences-empty'),
  ListPlannedEntries: fixture('ListPlannedEntries-empty'),
  GetRunningTimer: fixture('GetRunningTimer-idle'),
  ListMyTasks: fixture('ListMyTasks'),
};

/**
 * The open week, with two Monday entries stretched: one now overlaps the next by 15 minutes, one runs past 17:30.
 */
const openWeek = Effect.fn('CompositeTools.test.openWeek')(function* () {
  const { call, calls } = yield* setup({
    ...workdayReplies,
    GetTimesheetWeek: fixture('GetTimesheetWeek-open')
      .replace('- Mon 09:15 0h45', '- Mon 09:15 1h')
      .replace('- Mon 17:00 0h30', '- Mon 17:00 1h'),
  });

  const result = yield* call('GetMyWorkday', { date: OPEN_WEDNESDAY, scope: 'week' });

  return { calls, result, workday: yield* structured(Workday, result) };
});

function plusDays(date: string, days: number) {
  return DateTime.formatIsoDateUtc(DateTime.add(DateTime.makeUnsafe(date), { days }));
}

/**
 * The mixed week (2026-11-30), moved to the week starting at `monday`.
 *
 * @param monday
 */
function mixedWeekOf(monday: string) {
  return Arr.reduce(Arr.range(0, 6), fixture('GetTimesheetWeek-mixed'), (text, day) =>
    Arr.join(Str.split(text, plusDays('2026-11-30', day)), plusDays(monday, day)),
  );
}

const holidayWeeks = Effect.fn('CompositeTools.test.holidayWeeks')(function* () {
  return yield* setup({
    ...workdayReplies,
    ListPlannedEntries: fixture('ListPlannedEntries'),
    GetTimesheetWeek: ({ date }) =>
      typeof date === 'string' && date !== HOLIDAY_MONDAY ? mixedWeekOf(date) : fixture('GetTimesheetWeek-planned'),
  });
});

const ticketReplies = {
  ListTickets: fixture('ListTickets'),
  GetTicketDetail: fixture('GetTicketDetail'),
  ListTicketComments: fixture('ListTicketComments'),
  ListTimeEntries: fixture('ListTimeEntries-ticket'),
};

describe('composite tool registration', () => {
  it.effect('registers read-only composites with output schemas next to the forwarded tools', () =>
    Effect.gen(function* () {
      const { registrations } = yield* setup({});

      const composites = ['GetMyWorkday', 'GetTicketContext', 'GetBoardContext', 'AddProjectTask'].map((name) => {
        const tool = registrations.get(name)?.tool;

        return {
          name,
          readOnly: tool?.annotations?.readOnlyHint,
          destructive: tool?.annotations?.destructiveHint,
          output: tool?.outputSchema?.type,
        };
      });

      expect(composites).toStrictEqual([
        { name: 'GetMyWorkday', readOnly: true, destructive: false, output: 'object' },
        { name: 'GetTicketContext', readOnly: true, destructive: false, output: 'object' },
        { name: 'GetBoardContext', readOnly: true, destructive: false, output: 'object' },
        { name: 'AddProjectTask', readOnly: false, destructive: false, output: 'object' },
      ]);

      expect(registrations.has('GetTimesheetWeek')).toBeTruthy();

      // The gateway's AddProjectTask replaces Orbit's: its schema is the one clients see.
      expect(registrations.get('AddProjectTask')?.tool.inputSchema).toMatchObject({
        properties: { startDate: { type: 'string' }, assignees: { type: 'array' } },
        required: ['projectId', 'name'],
      });
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

describe('getMyWorkday', () => {
  it.effect('reads the Monday–Sunday week with one timesheet call and range-wide totals', () =>
    Effect.gen(function* () {
      const { calls, result, workday } = yield* openWeek();

      expect(result.isError).toBeFalsy();

      expect([workday.from, workday.to]).toStrictEqual(['2026-10-26', '2026-11-01']);

      expect(calls.filter(({ name }) => name === 'GetTimesheetWeek').map(({ args }) => args)).toStrictEqual([
        { date: '2026-10-26' },
      ]);

      expect(calls.find(({ name }) => name === 'ListAbsences')?.args).toStrictEqual({
        dateFrom: '2026-10-26',
        dateTo: '2026-11-01',
      });

      expect(workday.totals).toStrictEqual({
        capacityMinutes: 2400,
        loggedMinutes: 1440,
        plannedMinutes: 0,
        absenceMinutes: 960,
        missingMinutes: 0,
      });
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('computes gaps, overlaps and entries outside working hours per day', () =>
    Effect.gen(function* () {
      const { workday } = yield* openWeek();

      expect(
        workday.days.map((day) => ({
          date: day.date,
          dayOff: day.dayOff,
          gaps: day.gaps.map(({ from, to }) => `${from}-${to}`),
          overlaps: day.overlaps,
          outside: day.outsideWorkingHours,
        })),
      ).toStrictEqual([
        {
          date: '2026-10-26',
          dayOff: false,
          gaps: ['12:30-13:00'],
          overlaps: [{ first: 'ACDD9296SCCUN39', second: 'ACASNTA59QBVVSE', minutes: 15 }],
          outside: ['ACQ5Y1ME4MF6Y49'],
        },
        { date: '2026-10-27', dayOff: false, gaps: ['13:30-14:00'], overlaps: [], outside: [] },
        { date: OPEN_WEDNESDAY, dayOff: false, gaps: ['12:30-13:00'], overlaps: [], outside: [] },
        { date: '2026-10-29', dayOff: true, gaps: [], overlaps: [], outside: [] },
        { date: '2026-10-30', dayOff: true, gaps: [], overlaps: [], outside: [] },
        { date: '2026-10-31', dayOff: true, gaps: [], overlaps: [], outside: [] },
        { date: '2026-11-01', dayOff: true, gaps: [], overlaps: [], outside: [] },
      ]);

      expect(workday.days[0]?.entries[0]?.start).toBe('2026-10-26T09:00:00.000+01:00[Europe/Amsterdam]');
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('counts partial absences in overlaps and outside working hours', () =>
    Effect.gen(function* () {
      const { call } = yield* setup({
        ...workdayReplies,
        GetTimesheetWeek: fixture('GetTimesheetWeek-mixed').replace(
          '- Mon 14:00 2h',
          '- Mon 07:30 1h ABSENCE Dentist  (api_id: ABEARLY00000001)\r\n- Mon 13:30 1h ABSENCE Doctor  (api_id: ABDOCTOR0000001)\r\n- Mon 14:00 2h',
        ),
      });

      const workdayResult = yield* call('GetMyWorkday', { date: '2026-11-30', scope: 'day' });

      const workday = yield* structured(Workday, workdayResult);

      expect(workday.days[0]?.overlaps).toStrictEqual([
        { first: 'ACY8KZJDWPT94W3', second: 'ABDOCTOR0000001', minutes: 30 },
        { first: 'ABDOCTOR0000001', second: 'ACEJUTYMTXFBGQ3', minutes: 30 },
      ]);

      expect(workday.days[0]?.outsideWorkingHours).toStrictEqual(['ABEARLY00000001']);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('includes bookable tasks with ids and budget, and the running timer', () =>
    Effect.gen(function* () {
      const { workday } = yield* openWeek();

      expect(workday.bookableTasks).toContainEqual({
        id: 'PTB3K18Q2XWAFHK',
        label: '1931 Interne uren 2026 | Alex Example',
        projectNumber: '1931',
      });

      expect(workday.bookableTasks).toContainEqual(
        expect.objectContaining({ id: 'PT42D4KQVJPHKGJ', remainingMinutes: 615 * 60 + 15 }),
      );

      expect(workday.runningTimer).toStrictEqual({ running: false });
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('calls GetTimesheetWeek once per week of a longer range and lists planned entries to confirm', () =>
    Effect.gen(function* () {
      const { call, calls } = yield* holidayWeeks();

      const workdayResult = yield* call('GetMyWorkday', { date: '2026-12-04', to: HOLIDAY_MONDAY, kind: 'planned' });

      const workday = yield* structured(Workday, workdayResult);

      expect(calls.filter(({ name }) => name === 'GetTimesheetWeek').map(({ args }) => args.date)).toStrictEqual([
        '2026-11-30',
        '2026-12-07',
        '2026-12-14',
        '2026-12-21',
        HOLIDAY_MONDAY,
      ]);

      const monday = workday.days.find((day) => day.date === HOLIDAY_MONDAY);

      expect(monday?.unconfirmedPlanned).toStrictEqual([
        {
          id: 'AC8GN5EJQAMN89E',
          start: '2026-12-28T09:00:00.000+01:00[Europe/Amsterdam]',
          minutes: 15,
          work: '2050 Stand-up 2026 / Morning stand-up 2026',
          taskId: 'PTSCJBQEWYX3KGQ',
          planningKind: 'fixed-time',
          seriesId: 'BPXZBJN2UCGUGK2',
        },
        expect.objectContaining({ id: 'ACGC6QVZ73MDPVT', taskId: 'PT42D4KQVJPHKGJ', planningKind: 'fixed-time' }),
      ]);

      expect([monday?.dayOff, monday?.entries.map((entry) => entry.kind)]).toStrictEqual([
        true,
        ['planned', 'planned'],
      ]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('filters entries by task and rejects ranges over 62 days and dates that do not exist', () =>
    Effect.gen(function* () {
      const { call } = yield* holidayWeeks();

      const workdayResult = yield* call('GetMyWorkday', { date: HOLIDAY_MONDAY, taskId: 'PT42D4KQVJPHKGJ' });

      const filtered = yield* structured(Workday, workdayResult);

      expect(filtered.days[0]?.entries.map((entry) => entry.id)).toStrictEqual(['ACGC6QVZ73MDPVT']);

      const tooLong = yield* call('GetMyWorkday', { date: '2026-10-01', to: '2027-01-01' });

      expect([tooLong.isError, textOf(tooLong)]).toStrictEqual([
        true,
        'Range 2026-10-01..2027-01-01 must be 1 to 62 days.',
      ]);

      const invalid = yield* Effect.flip(call('GetMyWorkday', { date: '2026-02-30' }));

      expect(invalid.message).toBe(
        `Invalid parameters for tool 'GetMyWorkday': Expected an existing date as yyyy-MM-dd\n  at ["date"]`,
      );
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

const MEETING_DAY = '2026-11-05';

const TASK_ADDED =
  'Task "Interne meeting" added (0.3h), default rate card "Specialist", assigned to Niels Mentink [UST7V7BUH3KZ2WQ]. api_id: PTZVTW47TJ5J6JT. Open project (api_id PR9TQKGXE3D3CYU)';

describe('addProjectTask', () => {
  it.effect("maps typed parameters to Orbit's arguments and returns the new task's api_id", () =>
    Effect.gen(function* () {
      const { call, calls } = yield* setup({ AddProjectTask: TASK_ADDED });

      const result = yield* call('AddProjectTask', {
        projectId: '2238',
        name: 'Interne meeting',
        workloadHours: 0.25,
        startDate: MEETING_DAY,
        endDate: MEETING_DAY,
        assignees: ['UST7V7BUH3KZ2WQ', 'Niels Mentink'],
        retainerId: 'NONE',
      });

      expect(calls).toStrictEqual([
        {
          name: 'AddProjectTask',
          args: {
            projectId: '2238',
            name: 'Interne meeting',
            workloadHours: 0.25,
            startDt: MEETING_DAY,
            endDt: MEETING_DAY,
            assignedTo: 'UST7V7BUH3KZ2WQ,Niels Mentink',
            retainerId: 'NONE',
          },
        },
      ]);

      const added = yield* structured(ProjectTaskAdded, result);

      expect(added).toStrictEqual({
        taskId: 'PTZVTW47TJ5J6JT',
        projectId: 'PR9TQKGXE3D3CYU',
        message: TASK_ADDED,
      });
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('rejects invalid parameters before calling Orbit', () =>
    Effect.gen(function* () {
      const { call, calls } = yield* setup({ AddProjectTask: TASK_ADDED });

      const reversed = yield* call('AddProjectTask', {
        projectId: '2238',
        name: 'Interne meeting',
        startDate: '2026-11-06',
        endDate: MEETING_DAY,
      });

      expect([reversed.isError, textOf(reversed)]).toStrictEqual([
        true,
        `endDate ${MEETING_DAY} is before startDate 2026-11-06.`,
      ]);

      // oxlint-disable-next-line unicorn/no-array-for-each
      const invalid = yield* Effect.forEach(
        [
          { projectId: '2238', name: '  ' },
          { projectId: ' 2238', name: 'Meeting' },
          { projectId: '2238', name: 'Meeting', assignees: ['Niels, Rob'] },
          { projectId: '2238', name: 'Meeting', assignees: [] },
          { projectId: '2238', name: 'Meeting', endDate: '2026-02-30' },
          { projectId: '2238', name: 'Meeting', billingMode: 'FIXED' },
          { projectId: '2238', name: 'Meeting', workloadHours: -1 },
          { projectId: '2238', name: 'Meeting', retainerId: 'none' },
        ],
        (input) => Effect.flip(call('AddProjectTask', input)).pipe(Effect.map(({ message }) => message)),
      );

      expect(invalid).toHaveLength(8);

      expect(
        invalid.every((message) => message.startsWith("Invalid parameters for tool 'AddProjectTask'")),
      ).toBeTruthy();

      expect(calls).toStrictEqual([]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect("reports Orbit's errors, and an unfamiliar confirmation as success so it is not retried", () =>
    Effect.gen(function* () {
      const { call } = yield* setup({
        AddProjectTask: ({ name }) =>
          name === 'Closed'
            ? 'Error: project 2000 is CLOSED; tasks can only be added to DRAFT or OPEN projects.'
            : 'Task added.',
      });

      const closed = yield* call('AddProjectTask', { projectId: '2000', name: 'Closed' });

      expect([closed.isError, textOf(closed)]).toStrictEqual([
        true,
        'MCP tool reported an error: Error: project 2000 is CLOSED; tasks can only be added to DRAFT or OPEN projects.',
      ]);

      const unfamiliar = yield* call('AddProjectTask', { projectId: '2238', name: 'Meeting' });

      expect(unfamiliar.isError).toBeFalsy();

      const confirmation = yield* structured(ProjectTaskAdded, unfamiliar);

      expect(confirmation).toStrictEqual({ message: 'Task added.' });
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

describe('getTicketContext', () => {
  it.effect('resolves a closed ticket number, then reads detail, comments and time booked up to today', () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(Date.UTC(2026, 9, 31, 10));

      const { call, calls } = yield* setup(ticketReplies);

      yield* call('GetTicketContext', { ticket: '9087' });

      expect(calls.map(({ name, args }) => [name, args])).toStrictEqual([
        ['ListTickets', { query: '9087', state: 'NEW|OPEN|WAIT|CLOSED|DELETED|REQCLOSE', limit: 100 }],
        ['GetTicketDetail', { ticketId: 'TCRFWYDSTH445WJ' }],
        ['ListTicketComments', { ticketId: 'TCRFWYDSTH445WJ', limit: 100 }],
        ['ListTimeEntries', { dateFrom: '2026-10-01', dateTo: '2026-10-31', text: '9087' }],
      ]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('counts only entries on this ticket number, even with a dash in its name, a shared or an old title', () =>
    Effect.gen(function* () {
      const { call } = yield* setup(
        R.map(ticketReplies, (text) =>
          text
            .replace(
              'ticket "Support ticket D" — 9087 Support ticket D  (api_id: AC95BKNX6H2MNG2)',
              'ticket "Old — title" — 9087 Old — title  (api_id: AC95BKNX6H2MNG2)',
            )
            .replaceAll('Support ticket D', 'Support — ticket D')
            .replace(
              '(api_id: AC95BKNX6H2MNG2) [locked: timesheet submitted (FINAL)]\r\n',
              '(api_id: AC95BKNX6H2MNG2) [locked: timesheet submitted (FINAL)]\r\n- 2026-10-21 10:00 | Alex Example | 0h40 | ticket "Support — ticket D" — 1234 Support — ticket D related to 9087  (api_id: ACW4TQ8ZD2K6RMH)\r\n- 2026-10-22 10:00 | Alex Example | 2h [PLANNED] | ticket "Support — ticket D" — 9087 Support — ticket D  (api_id: ACPLANNED000001)\r\n- 2026-10-23 10:00 | Alex Example | 0h30 | ticket "Other" — 19087 Other  (api_id: ACOTHER00000001)\r\n',
            ),
        ),
      );

      const ticketContextResult = yield* call('GetTicketContext', { ticket: '9087' });

      const context = yield* structured(TicketContext, ticketContextResult);

      expect(context.ticket).toMatchObject({ number: '9087', state: 'CLOSED', loggedMinutes: 60 });

      expect(context.commentCount).toBe(3);

      expect(context.timeEntries.map((entry) => entry.id)).toStrictEqual([
        'AC6UHATHDJJ13PP',
        'ACFERA67KXAJDCC',
        'AC95BKNX6H2MNG2',
        'ACPLANNED000001',
      ]);

      // The planned entry is listed but not counted; 19087 and an entry without the number are not mentions.
      expect([context.loggedMinutes, context.mentionedIn]).toStrictEqual([60, ['ACW4TQ8ZD2K6RMH']]);

      expect([context.timeEntries[2]?.work, context.commentsTruncated]).toStrictEqual(['ticket "Old — title"', false]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

describe('composite errors', () => {
  it.effect('return readable error results, and rate limits like forwarded tools', () =>
    Effect.gen(function* () {
      const { call } = yield* setup({
        ListTickets: fixture('ListTickets-empty'),
        GetTicketDetail: fixture('GetTicket-invalid-id'),
        ListBoards: McpClientError.McpClientError.make({
          reason: McpClientError.HttpError.make({ status: 429, retryAfter: '30' }),
        }),
      });

      const missing = yield* call('GetTicketContext', { ticket: '1234' });

      expect([missing.isError, textOf(missing)]).toStrictEqual([true, 'No ticket with number 1234 found.']);

      const invalid = yield* call('GetTicketContext', { ticket: 'TCAAAAAAAAAAAAA' });

      // Orbit answers isError: false with this text; the gateway still reports it as an error.
      expect([invalid.isError, textOf(invalid)]).toStrictEqual([
        true,
        "MCP tool reported an error: Error: '9087' is not a valid TICKET API ID for this account.",
      ]);

      const limited = yield* call('GetBoardContext', { board: 'anything' });

      expect([limited.isError, limited._meta, textOf(limited)]).toStrictEqual([
        true,
        { 'tlo-mcp/httpStatus': 429, 'tlo-mcp/retryAfter': '30' },
        'Orbit rate limited this call; retry after 30. Not replayed.',
      ]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

describe('orbit replies', () => {
  it.effect('fail visibly when Orbit answers without exactly one text block', () =>
    Effect.gen(function* () {
      const { call } = yield* setup({
        ...workdayReplies,
        GetTimesheetWeek: fixture('GetTimesheetWeek-open'),
        ListAbsences: McpSchema.CallToolResult.make({ content: [] }),
      });

      const result = yield* call('GetMyWorkday', { date: OPEN_WEDNESDAY, scope: 'week' });

      expect([result.isError, textOf(result)]).toStrictEqual([true, 'Missing key\n  at [0]']);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('fail when a week does not cover the range, or the ticket search hit its cap', () =>
    Effect.gen(function* () {
      const { call } = yield* setup({ ...workdayReplies, GetTimesheetWeek: fixture('GetTimesheetWeek-mixed') });

      const shifted = yield* call('GetMyWorkday', { date: OPEN_WEDNESDAY, scope: 'week' });

      expect([shifted.isError, textOf(shifted)]).toStrictEqual([
        true,
        "Orbit's timesheets do not cover every day of 2026-10-26..2026-11-01.",
      ]);

      const tickets = yield* encodeJson({
        count: 100,
        tickets: Arr.replicate({ ticketId: 'TCRFWYDSTH445WJ', number: '19087', name: 'Other', state: 'OPEN' }, 100),
      });

      const { call: callTickets } = yield* setup({ ListTickets: tickets });

      const capped = yield* callTickets('GetTicketContext', { ticket: '9087' });

      expect(textOf(capped)).toBe(
        'Ticket 9087 is not in the first 100 search results Orbit returned; pass the ticket api_id instead.',
      );
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

describe('getBoardContext', () => {
  const todos = fixture('ListTodos');

  const boardReplies = {
    ListBoards: fixture('ListBoards'),
    ListBoardLists: fixture('ListBoardLists'),
    ListTodos: ({ state }: Schema.JsonObject) =>
      state === 'all'
        ? todos
        : `1 card(s):\r\n${todos.split('\r\n').find((line) => line.startsWith('- TDFPXAJVJE7RMQ5'))}\r\n`,
    GetTodoDetail: fixture('GetTodoDetail'),
  };

  it.effect('groups cards under their columns, matching the board name case-insensitively', () =>
    Effect.gen(function* () {
      const { call } = yield* setup(boardReplies);

      const boardContextResult = yield* call('GetBoardContext', {
        board: '2045 client south | acief',
        includeDone: true,
        details: false,
      });

      const board = yield* structured(BoardContext, boardContextResult);

      expect(board.board.id).toBe('BO1GWM3SZPBP5NP');

      expect(board.columns.map((column) => [column.id, column.name, column.done, column.cards.length])).toStrictEqual([
        ['KC18XMJS1WFQRM3', 'Backlog', false, 0],
        ['KCNK9U9T62DZA49', 'To do', false, 11],
        ['KC74DC1DK3EW51P', 'In Progress', false, 1],
        ['KC96AKDWUHCK57J', 'In Review', false, 1],
        ['KCJ8PZV17MNT4ZT', 'Live', false, 0],
        ['KCQ5Y1MENXH9G89', 'Done', true, 1],
      ]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('adds card detail by default and asks for an api_id when the name is ambiguous', () =>
    Effect.gen(function* () {
      const { call } = yield* setup(boardReplies);

      const boardContextResult = yield* call('GetBoardContext', { board: 'BO1GWM3SZPBP5NP' });

      const detailed = yield* structured(BoardContext, boardContextResult);

      const card = detailed.columns[2]?.cards[0];

      expect([card?.id, card?.checklist, card?.linked?.length]).toStrictEqual([
        'TDFPXAJVJE7RMQ5',
        '0/0 done | comments 1 | files 0 | followers 0',
        2,
      ]);

      const ambiguous = yield* call('GetBoardContext', { board: 'Client' });

      expect(textOf(ambiguous)).toContain('"Client" matches 5 boards');

      const [, other = ''] = Str.split(fixture('ListBoards'), '\r\n');

      const { call: callMany } = yield* setup({
        ...boardReplies,
        ListBoards: `100 board(s):\r\n${Arr.join(Arr.replicate(other, 100), '\r\n')}\r\n`,
      });

      const capped = yield* callMany('GetBoardContext', { board: 'BO1GWM3SZPBP5NP' });

      expect([capped.isError, textOf(capped)]).toMatchObject([
        true,
        expect.stringContaining('in the first 100 boards Orbit returned'),
      ]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('splits card names that contain " | " off the known board name, and keeps the priority', () =>
    Effect.gen(function* () {
      const { call } = yield* setup({
        ...boardReplies,
        ListTodos: todos
          .replace('| BL-01 vragen naar klant sturen |', '| FE | vragen naar klant sturen |')
          .replace('| due 2026-10-22 | owner', '| due 2026-10-22 | prio high | owner'),
      });

      const boardContextResult = yield* call('GetBoardContext', {
        board: 'BO1GWM3SZPBP5NP',
        includeDone: true,
        details: false,
      });

      const board = yield* structured(BoardContext, boardContextResult);

      expect([board.columns[1]?.cards[0], board.cardsTruncated]).toMatchObject([
        { id: 'TD8H65VYHYWE65T', name: 'FE | vragen naar klant sturen', priority: 'high' },
        false,
      ]);
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );

  it.effect('fails when a card sits in a column ListBoardLists did not return, and flags the 100-card cap', () =>
    Effect.gen(function* () {
      const lists = fixture('ListBoardLists');

      const { call } = yield* setup({
        ...boardReplies,
        ListBoardLists: Arr.join(
          Arr.filter(Str.split(lists, '\r\n'), (line) => !Str.includes('KCNK9U9T62DZA49')(line)),
          '\r\n',
        ),
      });

      const changed = yield* call('GetBoardContext', { board: 'BO1GWM3SZPBP5NP', includeDone: true, details: false });

      expect([changed.isError, textOf(changed)]).toMatchObject([
        true,
        expect.stringContaining('The board changed while it was read: card TD8H65VYHYWE65T is in column To do'),
      ]);

      const [, card = ''] = Str.split(todos, '\r\n');

      const { call: callFull } = yield* setup({
        ...boardReplies,
        ListTodos: `100 card(s):\r\n${Arr.join(Arr.replicate(card, 100), '\r\n')}\r\n`,
      });

      const boardContextResult = yield* callFull('GetBoardContext', { board: 'BO1GWM3SZPBP5NP', details: false });

      const full = yield* structured(BoardContext, boardContextResult);

      expect(full.cardsTruncated).toBeTruthy();
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

class HttpRequestError extends Schema.TaggedError<HttpRequestError, { readonly brand: unique symbol }>()(
  'HttpRequestError',
  { cause: Schema.Unknown },
) {}

const GATEWAY_KEY = Str.repeat(64)('b');

const encodeJson = Schema.encodeEffect(Schema.Unknown.pipe(Schema.fromJsonString));

const decodeJson = Schema.decodeEffect(Schema.Unknown.pipe(Schema.fromJsonString));

/**
 * Call composites over the real HTTP gateway, so the JSON-RPC response is serialized like in production.
 *
 * @param replies
 */
const overHttp = Effect.fn('CompositeTools.test.overHttp')(function* (replies: Record<string, Reply>) {
  function callTool(tool: McpSchema.Tool) {
    const reply = replies[tool.name];

    if (reply === undefined) {
      return Effect.die(`Unexpected Orbit call ${tool.name}`);
    }

    return answer(reply);
  }

  const web = yield* Effect.acquireRelease(
    Effect.sync(() =>
      HttpRouter.toWebHandler(
        gatewayRoutes(Redacted.make(GATEWAY_KEY)).pipe(
          Layer.provide(Layer.succeed(OrbitClient, { tools: UPSTREAM, instructions: undefined, callTool })),
          Layer.provide(PlatformLive),
        ),
        { disableLogger: true },
      ),
    ),
    (handler) =>
      Effect.tryPromise({
        try: (_signal) => handler.dispose(),
        catch: (cause) => HttpRequestError.make({ cause }),
      }).pipe(Effect.orDie),
  );

  let session: string | undefined;

  return Effect.fn('CompositeTools.test.send')(function* (method: string, params: unknown, id?: number) {
    const body = yield* encodeJson({ jsonrpc: '2.0', method, params, ...(id === undefined ? {} : { id }) });

    const response = yield* Effect.tryPromise({
      try: (signal) =>
        web.handler(
          new Request('https://gateway/mcp', {
            method: 'POST',
            signal,
            headers: {
              authorization: `Bearer ${GATEWAY_KEY}`,
              'content-type': 'application/json',
              accept: 'application/json, text/event-stream',
              'mcp-protocol-version': '2025-06-18',
              ...(session === undefined ? {} : { 'mcp-session-id': session }),
            },
            body,
          }),
        ),
      catch: (cause) => HttpRequestError.make({ cause }),
    });

    session = response.headers.get('mcp-session-id') ?? session;

    const text = yield* Effect.tryPromise({
      try: (_signal) => response.text(),
      catch: (cause) => HttpRequestError.make({ cause }),
    });

    return { status: response.status, body: text === '' ? undefined : yield* decodeJson(text) };
  });
});

describe('composites over the HTTP gateway', () => {
  it.effect('return structuredContent in a valid JSON-RPC response for every composite', () =>
    Effect.gen(function* () {
      const send = yield* overHttp({
        ...workdayReplies,
        GetTimesheetWeek: fixture('GetTimesheetWeek-open'),
        ...ticketReplies,
        ListBoards: fixture('ListBoards'),
        ListBoardLists: fixture('ListBoardLists'),
        ListTodos: fixture('ListTodos'),
        GetTodoDetail: fixture('GetTodoDetail'),
      });

      yield* send(
        'initialize',
        { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
        1,
      );

      yield* send('notifications/initialized', {});

      const results = [];

      for (const [id, name, args] of [
        [2, 'GetMyWorkday', { date: OPEN_WEDNESDAY, scope: 'week' }],
        [3, 'GetTicketContext', { ticket: '9087' }],
        [4, 'GetBoardContext', { board: 'BO1GWM3SZPBP5NP', details: false }],
      ] as const) {
        const { status, body } = yield* send('tools/call', { name, arguments: args }, id);

        results.push({ name, status, body });
      }

      expect(results).toMatchObject([
        {
          name: 'GetMyWorkday',
          status: 200,
          body: { result: { isError: false, structuredContent: { to: '2026-11-01' } } },
        },
        {
          name: 'GetTicketContext',
          status: 200,
          body: { result: { isError: false, structuredContent: { commentCount: 3 } } },
        },
        {
          name: 'GetBoardContext',
          status: 200,
          body: { result: { isError: false, structuredContent: { board: { id: 'BO1GWM3SZPBP5NP' } } } },
        },
      ]);
    }).pipe(Effect.scoped),
  );
});
