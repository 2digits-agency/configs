/**
 * @effect-diagnostics preferEffectArray:off preferEffectString:off nodeBuiltinImport:off
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from '@effect/vitest';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';

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
      const week = yield* GetTimesheetWeek.decode(fixture('GetTimesheetWeek-open'));

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
      const { days } = yield* GetTimesheetWeek.decode(fixture('GetTimesheetWeek-open'));

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
      const week = yield* GetTimesheetWeek.decode(fixture('GetTimesheetWeek-final'));

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
      const week = yield* GetTimesheetWeek.decode(fixture('GetTimesheetWeek-planned'));

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
});

describe('list parsers', () => {
  it.effect('reads time entry lists with their kind', () =>
    Effect.gen(function* () {
      const ticket = yield* ListTimeEntries.decode(fixture('ListTimeEntries-ticket'));

      expect(ticket.entries.map((entry) => [entry.id, entry.minutes, entry.kind, entry.work])).toStrictEqual([
        ['AC6UHATHDJJ13PP', 20, 'logged', 'ticket "Support ticket D"'],
        ['ACNC5EVRCW4A2GT', 30, 'logged', '1931 Interne uren 2026 / Alex Example'],
        ['ACFERA67KXAJDCC', 30, 'logged', 'ticket "Support ticket D"'],
        ['AC95BKNX6H2MNG2', 10, 'logged', 'ticket "Support ticket D"'],
      ]);

      const planned = yield* ListTimeEntries.decode(fixture('ListTimeEntries-planned'));

      expect(new Set(planned.entries.map((entry) => entry.kind))).toStrictEqual(new Set(['planned']));

      expect(planned.entries).toHaveLength(9);
    }),
  );

  it.effect('reports the 100-row cap and empty results', () =>
    Effect.gen(function* () {
      const text = fixture('ListTimeEntries-ticket');

      const capped = yield* ListTimeEntries.decode(
        text.replace('4 time entries:', '100 time entries (more exist — narrow the filters):'),
      );

      expect([(yield* ListTimeEntries.decode(text)).truncated, capped.truncated]).toStrictEqual([false, true]);

      expect((yield* ListTimeEntries.decode(fixture('ListTimeEntries-empty'))).entries).toStrictEqual([]);
    }),
  );

  it.effect('reads time entries whose description contains a bare line feed', () =>
    Effect.gen(function* () {
      const { entries } = yield* ListTimeEntries.decode(
        fixture('ListTimeEntries-ticket').replace('— Work note', '— Work\nnote'),
      );

      expect(entries.find((entry) => entry.id === 'ACNC5EVRCW4A2GT')?.description).toBe('Work\nnote');
    }),
  );
});

describe('lines seen live', () => {
  it.effect('reads an entry whose description contains a bare line feed', () =>
    Effect.gen(function* () {
      const week = yield* GetTimesheetWeek.decode(fixture('GetTimesheetWeek-multiline'));

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
