/**
 * @effect-diagnostics preferEffectArray:off preferEffectString:off nodeBuiltinImport:off
 */
import { readFileSync } from 'node:fs';

import * as NodeServices from '@effect/platform-node/NodeServices';
import { describe, expect, it } from '@effect/vitest';
import type * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as McpClientError from 'effect/ai/McpClientError';
import * as McpSchema from 'effect/ai/McpSchema';
import * as McpServer from 'effect/ai/McpServer';
import * as HttpRouter from 'effect/http/HttpRouter';

import { Workday } from '../src/composites/GetMyWorkday.js';
import { gatewayRoutes } from '../src/http/gateway.js';
import { OrbitClient } from '../src/mcp/OrbitClient.js';
import { OrbitToolsLive } from '../src/mcp/proxy.js';
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
].map((name) => McpSchema.Tool.make({ name, inputSchema: { type: 'object' } }));

type Reply = string | McpClientError.McpClientError;

interface Call {
  readonly name: string;
  readonly args: Schema.JsonObject;
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

    return typeof reply === 'string'
      ? Effect.succeed(McpSchema.CallToolResult.make({ content: [{ type: 'text', text: reply }] }))
      : Effect.fail(reply);
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

  const result = yield* call('GetMyWorkday', { date: '2026-10-28', scope: 'week' });

  return { calls, result, workday: yield* structured(Workday, result) };
});

const holidayWeeks = Effect.fn('CompositeTools.test.holidayWeeks')(function* () {
  return yield* setup({
    ...workdayReplies,
    ListPlannedEntries: fixture('ListPlannedEntries'),
    GetTimesheetWeek: ({ date }) =>
      fixture(date === HOLIDAY_MONDAY ? 'GetTimesheetWeek-planned' : 'GetTimesheetWeek-mixed'),
  });
});

describe('composite tool registration', () => {
  it.effect('registers read-only composites with output schemas next to the forwarded tools', () =>
    Effect.gen(function* () {
      const { registrations } = yield* setup({});

      const composites = ['GetMyWorkday'].map((name) => {
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
      ]);

      expect(registrations.has('GetTimesheetWeek')).toBeTruthy();
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
        { date: '2026-10-28', dayOff: false, gaps: ['12:30-13:00'], overlaps: [], outside: [] },
        { date: '2026-10-29', dayOff: true, gaps: [], overlaps: [], outside: [] },
        { date: '2026-10-30', dayOff: true, gaps: [], overlaps: [], outside: [] },
        { date: '2026-10-31', dayOff: true, gaps: [], overlaps: [], outside: [] },
        { date: '2026-11-01', dayOff: true, gaps: [], overlaps: [], outside: [] },
      ]);

      expect(workday.days[0]?.entries[0]?.start).toBe('2026-10-26T09:00:00.000+01:00[Europe/Amsterdam]');
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

      const workday = yield* structured(
        Workday,
        yield* call('GetMyWorkday', { date: '2026-12-04', to: HOLIDAY_MONDAY, kind: 'planned' }),
      );

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

      const filtered = yield* structured(
        Workday,
        yield* call('GetMyWorkday', { date: HOLIDAY_MONDAY, taskId: 'PT42D4KQVJPHKGJ' }),
      );

      expect(filtered.days[0]?.entries.map((entry) => entry.id)).toStrictEqual(['ACGC6QVZ73MDPVT']);

      const tooLong = yield* call('GetMyWorkday', { date: '2026-10-01', to: '2027-01-01' });

      expect([tooLong.isError, textOf(tooLong)]).toStrictEqual([
        true,
        'Range 2026-10-01..2027-01-01 must be 1 to 62 days.',
      ]);

      const invalid = yield* Effect.flip(call('GetMyWorkday', { date: '2026-02-30' }));

      expect(invalid.message).toBe(
        `Invalid parameters for tool 'GetMyWorkday': Expected an existing calendar date\n  at ["date"]`,
      );
    }).pipe(Effect.provide(requestContext), Effect.scoped),
  );
});

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

    return typeof reply === 'string'
      ? Effect.succeed(McpSchema.CallToolResult.make({ content: [{ type: 'text', text: reply }] }))
      : Effect.fail(reply);
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
    (handler) => Effect.tryPromise((_signal) => handler.dispose()).pipe(Effect.orDie),
  );

  let session: string | undefined;

  return Effect.fn('CompositeTools.test.send')(function* (method: string, params: unknown, id?: number) {
    const body = yield* encodeJson({ jsonrpc: '2.0', method, params, ...(id === undefined ? {} : { id }) });

    const response = yield* Effect.tryPromise((signal) =>
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
    );

    session = response.headers.get('mcp-session-id') ?? session;

    const text = yield* Effect.tryPromise((_signal) => response.text());

    return { status: response.status, body: text === '' ? undefined : yield* decodeJson(text) };
  });
});

describe('composites over the HTTP gateway', () => {
  it.effect('return structuredContent in a valid JSON-RPC response for every composite', () =>
    Effect.gen(function* () {
      const send = yield* overHttp({
        ...workdayReplies,
        GetTimesheetWeek: fixture('GetTimesheetWeek-open'),
      });

      yield* send(
        'initialize',
        { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
        1,
      );

      yield* send('notifications/initialized', {});

      const results = [];

      for (const [id, name, args] of [
        [2, 'GetMyWorkday', { date: '2026-10-28', scope: 'week' }],
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
      ]);
    }).pipe(Effect.scoped),
  );
});
