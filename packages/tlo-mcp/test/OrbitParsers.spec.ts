/**
 * @effect-diagnostics preferEffectArray:off preferEffectString:off nodeBuiltinImport:off
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { GetTimesheetWeek, type TimeEntry } from '../src/orbit/GetTimesheetWeek.js';
import { ListTimeEntries } from '../src/orbit/ListTimeEntries.js';

/**
 * Raw Orbit text results (CRLF preserved) captured from live Orbit; names and free text are redacted.
 *
 * @param name
 */
function fixture(name: string) {
  return readFileSync(new URL(`fixtures/orbit/${name}.txt`, import.meta.url), 'utf8');
}

const OPEN_WEEK = 'GetTimesheetWeek-open';

/**
 * Decode a tool's text result the way `Orbit.call` does.
 *
 * @param tool
 * @param tool.result
 */
function decode<TResult extends Schema.Top & { readonly Encoded: string; readonly DecodingServices: never }>(tool: {
  readonly result: TResult;
}) {
  return Schema.decodeEffect(tool.result);
}

function iso(value: DateTime.Zoned | undefined) {
  return value === undefined ? undefined : DateTime.formatIsoZoned(value);
}

function summary(entry: TimeEntry | undefined) {
  return entry === undefined
    ? undefined
    : {
        id: entry.id,
        start: iso(entry.start),
        minutes: entry.minutes,
        kind: entry.kind,
        work: entry.work,
        description: entry.description,
        taskId: entry.taskId,
        ticketId: entry.ticketId,
        pendingApproval: entry.pendingApproval,
        lock: entry.lock,
        editable: entry.editable,
      };
}

describe('timesheet week parser', () => {
  it.effect('reads the day table of an open week', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(fixture(OPEN_WEEK));

      expect(week.userId).toBe('UST7V7BUH3KZ2WQ');

      expect(week.days.map((day) => [day.date, day.state, day.loggedMinutes, day.absenceMinutes])).toStrictEqual([
        ['2026-10-26', 'OPEN', 480, 0],
        ['2026-10-27', 'OPEN', 480, 0],
        ['2026-10-28', 'OPEN', 480, 0],
        ['2026-10-29', 'OPEN', 0, 480],
        ['2026-10-30', 'OPEN', 0, 480],
        ['2026-10-31', 'OPEN', 0, 0],
        ['2026-11-01', 'OPEN', 0, 0],
      ]);

      expect(week.days.map((day) => day.entries.length)).toStrictEqual([14, 7, 7, 1, 1, 0, 0]);
    }),
  );

  it.effect('reads task, ticket and absence entries in Amsterdam winter time', () =>
    Effect.gen(function* () {
      const { days } = yield* decode(GetTimesheetWeek)(fixture(OPEN_WEEK));

      const [monday] = days;

      const thursday = days[3];

      expect(summary(monday?.entries[1])).toStrictEqual({
        id: 'ACDD9296SCCUN39',
        // 26 October is after the DST switch, so Amsterdam is UTC+1.
        start: '2026-10-26T09:15:00.000+01:00[Europe/Amsterdam]',
        minutes: 45,
        kind: 'logged',
        work: '1931 Interne uren 2026 / Alex Example',
        description: undefined,
        taskId: 'PTB3K18Q2XWAFHK',
        ticketId: undefined,
        pendingApproval: undefined,
        lock: undefined,
        editable: true,
      });

      expect(summary(monday?.entries[11])).toMatchObject({
        id: 'ACZ3XD8VSWW6MU9',
        work: 'ticket "Support ticket A"',
        description: '9353 Support ticket A',
        taskId: undefined,
        ticketId: 'TCZJXWYVDW451V5',
      });

      expect(summary(thursday?.entries[0])).toMatchObject({ kind: 'absence', work: 'Holiday', pendingApproval: false });
    }),
  );

  it.effect('marks every entry of a FINAL week as locked, in summer time', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(fixture('GetTimesheetWeek-final'));

      const entries = week.days.flatMap((day) => day.entries);

      expect(new Set(week.days.map((day) => day.state))).toStrictEqual(new Set(['FINAL']));

      expect(new Set(entries.map((entry) => [entry.lock, entry.editable].join(',')))).toStrictEqual(
        new Set(['timesheet submitted (FINAL),false']),
      );

      expect(iso(entries[0]?.start)).toBe('2026-10-19T09:00:00.000+02:00[Europe/Amsterdam]');

      expect(entries.find((entry) => entry.id === 'ACE543N9G4T9WS2')?.minutes).toBe(115);
    }),
  );

  it.effect('reads planned entries, pending absences and days in the next year', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(fixture('GetTimesheetWeek-planned'));

      const [monday] = week.days;

      expect(monday).toMatchObject({ plannedMinutes: 75, absenceMinutes: 480 });

      expect(monday?.entries.map((entry) => [entry.kind, entry.pendingApproval])).toStrictEqual([
        ['planned', undefined],
        ['absence', true],
        ['planned', undefined],
      ]);

      expect(week.days[4]).toMatchObject({ date: '2027-01-01', weekday: 'Fri' });

      expect(summary(week.days[4]?.entries[0])).toMatchObject({ work: 'Office Closed', pendingApproval: false });
    }),
  );

  it.effect('fails on a reordered day table, a missing day table, and impossible times or durations', () =>
    Effect.gen(function* () {
      const open = fixture(OPEN_WEEK);

      const swapped = yield* decode(GetTimesheetWeek)(
        open.replace('| Day | State | Logged | Planned |', '| Day | State | Planned | Logged |'),
      ).pipe(Effect.flip);

      expect(swapped.message).toContain('Unexpected line: "| Day | State | Planned | Logged |');

      const tableOnly = open.split('\r\n', 4).join('\r\n');

      const noDays = yield* decode(GetTimesheetWeek)(tableOnly).pipe(Effect.flip);

      expect(noDays.message).toBe('Expected a value with a length of 7\n  at ["days"]');

      const duration = yield* decode(GetTimesheetWeek)(open.replace('- Mon 09:00 0h15', '- Mon 09:00 0h99')).pipe(
        Effect.flip,
      );

      expect(duration.message).toBe(
        'Expected a string matching the RegExp ^\\d+h(?:[0-5]\\d)?$\n  at ["entries"][0]["minutes"]',
      );

      const date = yield* decode(ListTimeEntries)(
        fixture('ListTimeEntries-ticket').replace('- 2026-10-20 12:10', '- 2026-02-30 12:10'),
      ).pipe(Effect.flip);

      expect(date.message).toBe('Expected an existing yyyy-MM-dd HH:mm\n  at ["entries"][0]["start"]');
    }),
  );

  it.effect('fails on a missing column header, shifted day rows and unknown entry markers', () =>
    Effect.gen(function* () {
      const open = fixture(OPEN_WEEK);

      const noColumns = yield* decode(GetTimesheetWeek)(
        open.replace('| Day | State | Logged | Planned | Absence | Capacity |\r\n', ''),
      ).pipe(Effect.flip);

      expect(noColumns.message).toBe('Expected a value with a length of 1\n  at ["columns"]');

      const shifted = yield* decode(GetTimesheetWeek)(open.replace('| Tue 2026-10-27 |', '| Mon 2026-10-27 |')).pipe(
        Effect.flip,
      );

      expect(shifted.message).toContain('Expected day rows Mon to Sun with consecutive dates from the week start');

      const mixed = fixture('GetTimesheetWeek-mixed');

      const scheduled = yield* decode(GetTimesheetWeek)(mixed.replace('[PLANNED]', '[SCHEDULED]')).pipe(Effect.flip);

      expect(scheduled.message).toContain('Unexpected line: "- Wed 10:00 0h30 [SCHEDULED]');

      const awaiting = yield* decode(GetTimesheetWeek)(
        fixture('GetTimesheetWeek-planned').replace('(pending approval)', '(awaiting approval)'),
      ).pipe(Effect.flip);

      expect(awaiting.message).toContain('Unexpected line: "- Mon 09:00 8h ABSENCE (awaiting approval)');
    }),
  );
});

describe('list parsers', () => {
  it.effect('reads time entry lists with their kind', () =>
    Effect.gen(function* () {
      const ticket = yield* decode(ListTimeEntries)(fixture('ListTimeEntries-ticket'));

      expect(ticket.entries.map((entry) => [entry.id, entry.minutes, entry.kind, entry.work])).toStrictEqual([
        ['AC6UHATHDJJ13PP', 20, 'logged', 'ticket "Support ticket D"'],
        ['ACNC5EVRCW4A2GT', 30, 'logged', '1931 Interne uren 2026 / Alex Example'],
        ['ACFERA67KXAJDCC', 30, 'logged', 'ticket "Support ticket D"'],
        ['AC95BKNX6H2MNG2', 10, 'logged', 'ticket "Support ticket D"'],
      ]);

      const planned = yield* decode(ListTimeEntries)(fixture('ListTimeEntries-planned'));

      expect(new Set(planned.entries.map((entry) => entry.kind))).toStrictEqual(new Set(['planned']));

      expect(planned.entries).toHaveLength(9);
    }),
  );

  it.effect('reports the 100-row cap and empty results', () =>
    Effect.gen(function* () {
      const text = fixture('ListTimeEntries-ticket');

      const capped = yield* decode(ListTimeEntries)(
        text.replace('4 time entries:', '100 time entries (more exist — narrow the filters):'),
      );

      expect([(yield* decode(ListTimeEntries)(text)).truncated, capped.truncated]).toStrictEqual([false, true]);

      expect((yield* decode(ListTimeEntries)(fixture('ListTimeEntries-empty'))).entries).toStrictEqual([]);
    }),
  );

  it.effect('reads time entries whose description contains a bare line feed', () =>
    Effect.gen(function* () {
      const { entries } = yield* decode(ListTimeEntries)(
        fixture('ListTimeEntries-ticket').replace('— Work note', '— Work\nnote'),
      );

      expect(entries.find((entry) => entry.id === 'ACNC5EVRCW4A2GT')?.description).toBe('Work\nnote');
    }),
  );
});

describe('lines seen live', () => {
  it.effect('reads an entry whose description contains a bare line feed', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(fixture('GetTimesheetWeek-multiline'));

      expect(week.days[4]?.entries.map((entry) => [entry.id, entry.work, entry.description])).toStrictEqual([
        [
          'ACK7RM2XWQ4D8BN',
          '1931 Interne uren 2026 / Alex Example',
          '🎉 Birthday celebration lunch SB Group 🎉\nJoin us for a cheerful and delicious gathering as we celebrate all our colleagues’ birthdays in one festive occasion!',
        ],
        ['ACP3TV9HZE6LQ2M', '1931 Interne uren 2026 / Alex Example', undefined],
      ]);
    }),
  );
});
