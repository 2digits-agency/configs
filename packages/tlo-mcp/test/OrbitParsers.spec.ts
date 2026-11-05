import { describe, expect, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { GetRunningTimer } from '../src/orbit/GetRunningTimer.js';
import { GetTimesheetWeek, type TimeEntry } from '../src/orbit/GetTimesheetWeek.js';
import { ListAbsences } from '../src/orbit/ListAbsences.js';
import { ListMyTasks } from '../src/orbit/ListMyTasks.js';
import { ListPlannedEntries } from '../src/orbit/ListPlannedEntries.js';
import { ListTimeEntries } from '../src/orbit/ListTimeEntries.js';
import { GetTodoDetail, ListBoardLists, ListBoards, ListTodos } from '../src/orbit/boards.js';
import { GetTicketDetail, ListTicketComments, ListTickets } from '../src/orbit/tickets.js';
import { fixture } from './fixture.js';

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

      expect(Arr.map(week.days, (day) => [day.date, day.state, day.loggedMinutes, day.absenceMinutes])).toStrictEqual([
        ['2026-10-26', 'OPEN', 480, 0],
        ['2026-10-27', 'OPEN', 480, 0],
        ['2026-10-28', 'OPEN', 480, 0],
        ['2026-10-29', 'OPEN', 0, 480],
        ['2026-10-30', 'OPEN', 0, 480],
        ['2026-10-31', 'OPEN', 0, 0],
        ['2026-11-01', 'OPEN', 0, 0],
      ]);

      expect(Arr.map(week.days, (day) => day.entries.length)).toStrictEqual([14, 7, 7, 1, 1, 0, 0]);
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

      const entries = Arr.flatMap(week.days, (day) => day.entries);

      expect(new Set(Arr.map(week.days, (day) => day.state))).toStrictEqual(new Set(['FINAL']));

      expect(
        new Set(Arr.map(entries, (entry) => Arr.join([String(entry.lock), String(entry.editable)], ','))),
      ).toStrictEqual(new Set(['timesheet submitted (FINAL),false']));

      expect(iso(entries[0]?.start)).toBe('2026-10-19T09:00:00.000+02:00[Europe/Amsterdam]');

      expect(Opt.getOrUndefined(Arr.findFirst(entries, (entry) => entry.id === 'ACE543N9G4T9WS2'))?.minutes).toBe(115);
    }),
  );

  it.effect('reads planned entries, pending absences and days in the next year', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(fixture('GetTimesheetWeek-planned'));

      const [monday] = week.days;

      expect(monday).toMatchObject({ plannedMinutes: 75, absenceMinutes: 480 });

      expect(Arr.map(monday?.entries ?? [], (entry) => [entry.kind, entry.pendingApproval])).toStrictEqual([
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
        Str.replace('| Day | State | Logged | Planned |', '| Day | State | Planned | Logged |')(open),
      ).pipe(Effect.flip);

      expect(swapped.message).toContain('Unexpected line: "| Day | State | Planned | Logged |');

      const tableOnly = Arr.join(Arr.take(Str.split(open, '\r\n'), 4), '\r\n');

      const noDays = yield* decode(GetTimesheetWeek)(tableOnly).pipe(Effect.flip);

      expect(noDays.message).toBe('Expected a value with a length of 7\n  at ["days"]');

      const duration = yield* decode(GetTimesheetWeek)(Str.replace('- Mon 09:00 0h15', '- Mon 09:00 0h99')(open)).pipe(
        Effect.flip,
      );

      expect(duration.message).toBe(
        'Expected a string matching the RegExp ^\\d+h(?:[0-5]\\d)?$\n  at ["entries"][0]["minutes"]',
      );

      const date = yield* decode(ListTimeEntries)(
        Str.replace('- 2026-10-20 12:10', '- 2026-02-30 12:10')(fixture('ListTimeEntries-ticket')),
      ).pipe(Effect.flip);

      expect(date.message).toBe('Expected an existing yyyy-MM-dd HH:mm\n  at ["entries"][0]["start"]');
    }),
  );

  it.effect('fails on a missing column header, shifted day rows and unknown entry markers', () =>
    Effect.gen(function* () {
      const open = fixture(OPEN_WEEK);

      const noColumns = yield* decode(GetTimesheetWeek)(
        Str.replace('| Day | State | Logged | Planned | Absence | Capacity |\r\n', '')(open),
      ).pipe(Effect.flip);

      expect(noColumns.message).toBe('Expected a value with a length of 1\n  at ["columns"]');

      const shifted = yield* decode(GetTimesheetWeek)(
        Str.replace('| Tue 2026-10-27 |', '| Mon 2026-10-27 |')(open),
      ).pipe(Effect.flip);

      expect(shifted.message).toContain('Expected day rows Mon to Sun with consecutive dates from the week start');

      const mixed = fixture('GetTimesheetWeek-mixed');

      const scheduled = yield* decode(GetTimesheetWeek)(Str.replace('[PLANNED]', '[SCHEDULED]')(mixed)).pipe(
        Effect.flip,
      );

      expect(scheduled.message).toContain('Unexpected line: "- Wed 10:00 0h30 [SCHEDULED]');

      const awaiting = yield* decode(GetTimesheetWeek)(
        Str.replace('(pending approval)', '(awaiting approval)')(fixture('GetTimesheetWeek-planned')),
      ).pipe(Effect.flip);

      expect(awaiting.message).toContain('Unexpected line: "- Mon 09:00 8h ABSENCE (awaiting approval)');
    }),
  );
});

describe('list parsers', () => {
  it.effect('reads time entry lists with their kind', () =>
    Effect.gen(function* () {
      const ticket = yield* decode(ListTimeEntries)(fixture('ListTimeEntries-ticket'));

      expect(Arr.map(ticket.entries, (entry) => [entry.id, entry.minutes, entry.kind, entry.work])).toStrictEqual([
        ['AC6UHATHDJJ13PP', 20, 'logged', 'ticket "Support ticket D"'],
        ['ACNC5EVRCW4A2GT', 30, 'logged', '1931 Interne uren 2026 / Alex Example'],
        ['ACFERA67KXAJDCC', 30, 'logged', 'ticket "Support ticket D"'],
        ['AC95BKNX6H2MNG2', 10, 'logged', 'ticket "Support ticket D"'],
      ]);

      const planned = yield* decode(ListTimeEntries)(fixture('ListTimeEntries-planned'));

      expect(new Set(Arr.map(planned.entries, (entry) => entry.kind))).toStrictEqual(new Set(['planned']));

      expect(planned.entries).toHaveLength(9);
    }),
  );

  it.effect('reports the 100-row cap and empty results', () =>
    Effect.gen(function* () {
      const text = fixture('ListTimeEntries-ticket');

      const capped = yield* decode(ListTimeEntries)(
        Str.replace('4 time entries:', '100 time entries (more exist — narrow the filters):')(text),
      );

      expect([(yield* decode(ListTimeEntries)(text)).truncated, capped.truncated]).toStrictEqual([false, true]);

      expect((yield* decode(ListTimeEntries)(fixture('ListTimeEntries-empty'))).entries).toStrictEqual([]);
    }),
  );

  it.effect('reads time entries whose description contains a bare line feed', () =>
    Effect.gen(function* () {
      const { entries } = yield* decode(ListTimeEntries)(
        Str.replace('— Work note', '— Work\nnote')(fixture('ListTimeEntries-ticket')),
      );

      expect(Opt.getOrUndefined(Arr.findFirst(entries, (entry) => entry.id === 'ACNC5EVRCW4A2GT'))?.description).toBe(
        'Work\nnote',
      );
    }),
  );

  it.effect('keeps a " — " and quotes inside a ticket name in the work', () =>
    Effect.gen(function* () {
      const { days } = yield* decode(GetTimesheetWeek)(
        Str.replaceAll('Support ticket A', 'Support — ticket A')(fixture(OPEN_WEEK)),
      );

      const entry = Opt.getOrUndefined(Arr.findFirst(days[0]?.entries ?? [], ({ id }) => id === 'ACZ3XD8VSWW6MU9'));

      expect([entry?.work, entry?.description]).toStrictEqual([
        'ticket "Support — ticket A"',
        '9353 Support — ticket A',
      ]);

      const { days: quoted } = yield* decode(GetTimesheetWeek)(
        Str.replaceAll('Support ticket A', 'Support "case" — ticket A')(fixture(OPEN_WEEK)),
      );

      expect(
        Opt.getOrUndefined(Arr.findFirst(quoted[0]?.entries ?? [], ({ id }) => id === 'ACZ3XD8VSWW6MU9'))?.work,
      ).toBe('ticket "Support "case" — ticket A"');
    }),
  );

  it.effect('reads planning entries with their series', () =>
    Effect.gen(function* () {
      const planned = yield* decode(ListPlannedEntries)(fixture('ListPlannedEntries'));

      expect(planned).toHaveLength(8);

      expect(planned[1]).toMatchObject({
        id: 'ACGC6QVZ73MDPVT',
        minutes: 60,
        kind: 'fixed-time',
        work: '2275 Intern board / Placeholder CS',
        seriesId: 'BPBT31GBME2HK8U',
      });

      const listPlannedEntriesEmpty = yield* decode(ListPlannedEntries)(fixture('ListPlannedEntries-empty'));

      expect(listPlannedEntriesEmpty).toStrictEqual([]);
    }),
  );

  it.effect('reads absences with approval state and note', () =>
    Effect.gen(function* () {
      const absences = yield* decode(ListAbsences)(fixture('ListAbsences'));

      expect(Arr.map(absences, (absence) => [absence.date, absence.type, absence.state, absence.note])).toStrictEqual([
        ['2026-11-02', 'Holiday', 'approved', undefined],
        ['2026-11-03', 'Holiday', 'approved', undefined],
        ['2026-11-20', 'Holiday', 'approved', 'privé'],
        ['2026-11-23', 'Holiday', 'approved', 'privé'],
        ['2026-12-25', 'Office Closed', 'approved', undefined],
        ['2026-12-28', 'Holiday', 'pending', 'Vakantie'],
        ['2026-12-29', 'Holiday', 'pending', 'Vakantie'],
        ['2026-12-30', 'Holiday', 'pending', 'Vakantie'],
        ['2026-12-31', 'Holiday', 'pending', 'Vakantie'],
      ]);

      const listAbsencesEmpty = yield* decode(ListAbsences)(fixture('ListAbsences-empty'));

      expect(listAbsencesEmpty).toStrictEqual([]);
    }),
  );

  it.effect('reads planning work and absence notes that contain a bare line feed', () =>
    Effect.gen(function* () {
      const [planned] = yield* decode(ListPlannedEntries)(
        Str.replace('/ Morning stand-up 2026 |', '/ Morning\nstand-up 2026 |')(fixture('ListPlannedEntries')),
      );

      expect(planned?.work).toBe('2050 Stand-up 2026 / Morning\nstand-up 2026');

      const absences = yield* decode(ListAbsences)(
        Str.replace('— privé ', '— privé\nmiddag ')(fixture('ListAbsences')),
      );

      expect(Opt.getOrUndefined(Arr.findFirst(absences, ({ id }) => id === 'AB1MRN24STSHJZ2'))?.note).toBe(
        'privé\nmiddag',
      );
    }),
  );

  it.effect('fails on timer text that is neither the idle message nor a running timer', () =>
    Effect.gen(function* () {
      const changed = yield* decode(GetRunningTimer)('No active timer.').pipe(Effect.flip);

      expect(changed.message).toContain('Unexpected line: "No active timer."');

      expect((yield* decode(GetRunningTimer)('').pipe(Effect.flip)).message).toContain('Unexpected line: ""');
    }),
  );

  it.effect('reads bookable tasks with remaining budget, and the idle timer', () =>
    Effect.gen(function* () {
      const tasks = yield* decode(ListMyTasks)(fixture('ListMyTasks'));

      expect(tasks).toHaveLength(30);

      expect(Opt.getOrUndefined(Arr.findFirst(tasks, (task) => task.id === 'PTSCJBQEWYX3KGQ'))).toMatchObject({
        label: '2050 Stand-up 2026 | Morning stand-up 2026',
        projectNumber: '2050',
        remainingMinutes: 158 * 60 + 51,
      });

      expect(
        Opt.getOrUndefined(Arr.findFirst(tasks, (task) => task.id === 'PTB3K18Q2XWAFHK'))?.remainingMinutes,
      ).toBeUndefined();

      const listMyTasksEmpty = yield* decode(ListMyTasks)(fixture('ListMyTasks-empty'));

      expect(listMyTasksEmpty).toStrictEqual([]);

      const getRunningTimerIdle = yield* decode(GetRunningTimer)(fixture('GetRunningTimer-idle'));

      expect(getRunningTimerIdle).toMatchObject({ running: false });
    }),
  );
});

describe('ticket parsers', () => {
  it.effect('reads ticket lists', () =>
    Effect.gen(function* () {
      const list = yield* decode(ListTickets)(fixture('ListTickets'));

      expect(Arr.map(list.tickets, (ticket) => [ticket.number, ticket.ticketId])).toStrictEqual([
        ['9087', 'TCRFWYDSTH445WJ'],
      ]);

      expect((yield* decode(ListTickets)(fixture('ListTickets-empty'))).tickets).toStrictEqual([]);
    }),
  );

  it.effect('reads ticket detail and converts its local times to Amsterdam timestamps', () =>
    Effect.gen(function* () {
      const detail = yield* decode(GetTicketDetail)(fixture('GetTicketDetail'));

      expect(iso(detail.createdDate)).toBe('2026-10-01T16:10:00.000+02:00[Europe/Amsterdam]');

      expect(detail).toMatchObject({
        number: '9087',
        state: 'CLOSED',
        loggedMinutes: 60,
      });

      expect(detail.slaCloseDue).toBeNull();

      expect(detail.downloadLinksNote).toContain('Download links expire at 2026-10-28 16:27');

      expect(detail.otherOpenTicketsOfClient).toHaveLength(4);
    }),
  );

  it.effect('reads ticket comments', () =>
    Effect.gen(function* () {
      const comments = yield* decode(ListTicketComments)(fixture('ListTicketComments'));

      expect(Arr.map(comments.comments, (comment) => [comment.isInternal, comment.loggedMinutes])).toStrictEqual([
        [true, 20],
        [false, 0],
        [false, 0],
      ]);

      expect(iso(comments.comments[0]?.date)).toBe('2026-10-20T11:38:00.000+02:00[Europe/Amsterdam]');
    }),
  );
});

describe('board parsers', () => {
  it.effect('reads boards and columns', () =>
    Effect.gen(function* () {
      const boards = yield* decode(ListBoards)(fixture('ListBoards'));

      expect(boards[1]).toMatchObject({
        id: 'BO1GWM3SZPBP5NP',
        name: '2045 Client South | Acief',
        listCount: 6,
        cardCount: 14,
      });

      const listBoardsEmpty = yield* decode(ListBoards)(fixture('ListBoards-empty'));

      expect(listBoardsEmpty).toStrictEqual([]);

      const lists = yield* decode(ListBoardLists)(fixture('ListBoardLists'));

      expect(Arr.map(lists, (list) => [list.name, list.cardCount, list.done])).toStrictEqual([
        ['Backlog', 0, false],
        ['To do', 11, false],
        ['In Progress', 1, false],
        ['In Review', 1, false],
        ['Live', 0, false],
        ['Done', 1, true],
      ]);

      const listBoardListsTemplate = yield* decode(ListBoardLists)(fixture('ListBoardLists-template'));

      expect(listBoardListsTemplate).toHaveLength(6);
    }),
  );

  it.effect('reads cards, including done cards and cards without a due date', () =>
    Effect.gen(function* () {
      const cards = yield* decode(ListTodos)(fixture('ListTodos'));

      expect(cards).toHaveLength(14);

      expect(cards[2]).toMatchObject({
        id: 'TD5TVDAC9FJUQJU',
        heading: 'BL-02 — Transactiedatering en refunds | 2045 Client South | Acief',
        listId: 'KCQ5Y1MENXH9G89',
        list: 'Done',
        done: true,
        due: '2026-10-23',
      });

      expect(cards[13]).toMatchObject({ ownerId: 'UST7V7BUH3KZ2WQ', done: false });

      // JSON-RPC cannot carry undefined, so absent values must be absent keys.
      expect(cards[13]).not.toHaveProperty('due');

      const listTodosEmpty = yield* decode(ListTodos)(fixture('ListTodos-empty'));

      expect(listTodosEmpty).toStrictEqual([]);
    }),
  );

  it.effect('reads card detail with a multi-line description and linked tasks', () =>
    Effect.gen(function* () {
      const detail = yield* decode(GetTodoDetail)(fixture('GetTodoDetail'));

      expect(detail).toMatchObject({
        id: 'TDFPXAJVJE7RMQ5',
        listId: 'KC74DC1DK3EW51P',
        list: 'In Progress',
        ownerId: 'UST7V7BUH3KZ2WQ',
        due: '2026-10-28',
        checklist: '0/0 done | comments 1 | files 0 | followers 0',
      });

      expect(detail.description).toContain('\nWat: klant accordeert');

      expect(Arr.map(detail.linked, (link) => [link.type, link.id])).toStrictEqual([
        ['PROJECT_TASK', 'PT3DCNCG9N22AMX'],
        ['PROJECT_TASK', 'PTKHQ9S2H8MNE2S'],
      ]);
    }),
  );
});

describe('lines seen live', () => {
  it.effect('reads an entry whose description contains a bare line feed', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(fixture('GetTimesheetWeek-multiline'));

      expect(Arr.map(week.days[4]?.entries ?? [], (entry) => [entry.id, entry.work, entry.description])).toStrictEqual([
        [
          'ACK7RM2XWQ4D8BN',
          '1931 Interne uren 2026 / Alex Example',
          '🎉 Birthday celebration lunch SB Group 🎉\nJoin us for a cheerful and delicious gathering as we celebrate all our colleagues’ birthdays in one festive occasion!',
        ],
        ['ACP3TV9HZE6LQ2M', '1931 Interne uren 2026 / Alex Example', undefined],
      ]);
    }),
  );

  it.effect('reads unassigned cards and card labels', () =>
    Effect.gen(function* () {
      const [card] = yield* decode(ListTodos)(fixture('ListTodos-unassigned'));

      expect(card).toMatchObject({ id: 'TD71KP8DZSNRW1K', list: 'Sprint 7', listId: 'KCQVJRBER289UHQ' });

      expect(card).not.toHaveProperty('ownerId');

      const detail = yield* decode(GetTodoDetail)(fixture('GetTodoDetail-label'));

      expect(detail.labels).toStrictEqual([{ id: 'BCVRJPA3A5CQC1E', name: 'Sprint 1' }]);

      expect(detail).not.toHaveProperty('ownerId');
    }),
  );

  it.effect('fails on an unknown card owner, and keeps a pipe in an absence user name out of the type', () =>
    Effect.gen(function* () {
      const owner = yield* decode(GetTodoDetail)(
        Str.replace('Owner: unassigned', 'Owner: someone-else')(fixture('GetTodoDetail-label')),
      ).pipe(Effect.flip);

      expect(owner.message).toContain('Unexpected line: "Owner: someone-else"');

      const [absence] = yield* decode(ListAbsences)(
        Str.replace('| Alex Example |', '| Alex | Example |')(fixture('ListAbsences')),
      );

      expect(absence?.type).toBe('Holiday');
    }),
  );

  it.effect('reads card priority from the list and the detail', () =>
    Effect.gen(function* () {
      const [card] = yield* decode(ListTodos)(fixture('ListTodos-priority'));

      expect(card).toMatchObject({
        heading: 'SU inplannen | 1008 CDP Implementatie proces | Client North | 2DIGITS Custom App',
        due: '2024-10-30',
        priority: 'high',
        ownerId: 'USRRTYG4BXFMUDU',
      });

      const getTodoDetailPriority = yield* decode(GetTodoDetail)(fixture('GetTodoDetail-priority'));

      expect(getTodoDetailPriority).toMatchObject({
        name: 'SU inplannen',
        due: '2024-10-30',
        priority: 'high',
        ownerId: 'USRRTYG4BXFMUDU',
      });
    }),
  );
});

describe('format changes', () => {
  it.effect('fail with a SchemaError naming the line Orbit sent', () =>
    Effect.gen(function* () {
      const week = yield* decode(GetTimesheetWeek)(
        Str.replace('| Mon 2026-10-26 | OPEN | 8h |', '| Mon 2026-10-26 | OPEN | 8 hours |')(fixture(OPEN_WEEK)),
      ).pipe(Effect.flip);

      expect(Schema.isSchemaError(week)).toBeTruthy();

      expect(week.message).toBe(
        'Unexpected line: "| Mon 2026-10-26 | OPEN | 8 hours | 0h | 0h | 8h |"\n  at ["days"][0]',
      );

      const tasks = yield* decode(ListMyTasks)(
        Str.replace('| 1h | PTEQ4TF9Y52WMP6 |', '| 1h | ? |')(fixture('ListMyTasks')),
      ).pipe(Effect.flip);

      expect(tasks.message).toContain('Unexpected line: "| 1929 2D | Existing business Sales');

      expect(tasks.message).toContain('at [0]');

      const absences = yield* decode(ListAbsences)(
        Str.replace('| APPROVED  (api_id', '| ON HOLD  (api_id')(fixture('ListAbsences')),
      ).pipe(Effect.flip);

      expect(absences.message).toContain('Unexpected line');
    }),
  );

  it.effect('fail with the JSON path for JSON results', () =>
    Effect.gen(function* () {
      const error = yield* decode(ListTicketComments)(
        Str.replace('"2026-10-20 11:38"', '"20-10-2026 11:38"')(fixture('ListTicketComments')),
      ).pipe(Effect.flip);

      expect(error.message).toContain('["comments"][0]["date"]');
    }),
  );
});
