import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Order from 'effect/Order';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';
import * as Tool from 'effect/ai/Tool';

import { GetRunningTimer, RunningTimer } from '../orbit/GetRunningTimer.js';
import { EntryKind, GetTimesheetWeek, TimeEntry, type TimesheetDay } from '../orbit/GetTimesheetWeek.js';
import { Absence, ListAbsences } from '../orbit/ListAbsences.js';
import { BookableTask, ListMyTasks } from '../orbit/ListMyTasks.js';
import { ListPlannedEntries, type PlannedEntry } from '../orbit/ListPlannedEntries.js';
import type { OrbitShape } from '../orbit/Orbit.js';
import { ApiId, definedKey, LocalDate, Minutes, TIME_ZONE, Timestamp } from '../orbit/text.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

const WORK_START = 9 * 60;

const WORK_END = 17 * 60 + 30;

const RANGE_LIMIT = 62;

export class TimeSlot extends Schema.Class<TimeSlot, { readonly brand: unique symbol }>('TimeSlot')({
  from: Schema.String.annotate({ description: 'HH:mm, Europe/Amsterdam' }),
  to: Schema.String.annotate({ description: 'HH:mm, Europe/Amsterdam' }),
  minutes: Minutes,
}) {}

export class Overlap extends Schema.Class<Overlap, { readonly brand: unique symbol }>('Overlap')({
  first: ApiId,
  second: ApiId,
  minutes: Minutes,
}) {}

export class UnconfirmedPlanned extends Schema.Class<UnconfirmedPlanned, { readonly brand: unique symbol }>(
  'UnconfirmedPlanned',
)({
  id: ApiId.annotate({ description: 'Entry api_id for ConfirmPlannedEntry' }),
  start: Timestamp,
  minutes: Minutes,
  work: Schema.String,
  taskId: ApiId.pipe(Schema.optionalKey),
  planningKind: Schema.String.annotate({ description: 'From ListPlannedEntries, e.g. "fixed-time"' }).pipe(
    Schema.optionalKey,
  ),
  seriesId: ApiId.pipe(Schema.optionalKey),
}) {}

export class WorkdayDay extends Schema.Class<WorkdayDay, { readonly brand: unique symbol }>('WorkdayDay')({
  date: LocalDate,
  weekday: Schema.String,
  state: Schema.Literals(['OPEN', 'FINAL']),
  capacityMinutes: Minutes,
  loggedMinutes: Minutes,
  plannedMinutes: Minutes,
  absenceMinutes: Minutes,
  missingMinutes: Minutes.annotate({ description: 'Capacity minus logged and absence time' }),
  dayOff: Schema.Boolean.annotate({ description: 'No capacity, or absence covers it' }),
  entries: Schema.Array(TimeEntry).annotate({ description: 'Entries, after the taskId/kind filters' }),
  unconfirmedPlanned: Schema.Array(UnconfirmedPlanned),
  gaps: Schema.Array(TimeSlot).annotate({ description: 'Unbooked time within working hours' }),
  overlaps: Schema.Array(Overlap),
  outsideWorkingHours: Schema.Array(ApiId).annotate({
    description: 'Entries starting before or ending after working hours',
  }),
}) {}

export class Workday extends Schema.Class<Workday, { readonly brand: unique symbol }>('Workday')({
  from: LocalDate,
  to: LocalDate,
  timeZone: Schema.String,
  workingHours: TimeSlot,
  totals: Schema.Struct({
    capacityMinutes: Minutes,
    loggedMinutes: Minutes,
    plannedMinutes: Minutes,
    absenceMinutes: Minutes,
    missingMinutes: Minutes,
  }),
  days: Schema.Array(WorkdayDay),
  absences: Schema.Array(Absence),
  runningTimer: RunningTimer,
  bookableTasks: Schema.Array(BookableTask),
}) {}

export const GetMyWorkday = Tool.make('GetMyWorkday', {
  description:
    "Read-only overview of your own timesheet for one day, its week, or a range of up to 62 days, in one call. Per day: OPEN/FINAL state, logged/planned/absence time vs capacity, every entry with api_id, task/ticket api_id and edit lock, planned entries still to confirm, gaps, overlaps and entries outside 09:00–17:30. Also lists absences with approval state, the running timer and bookable tasks with remaining budget. Times are Europe/Amsterdam. Use Orbit's write tools for changes.",
  parameters: Schema.Struct({
    date: LocalDate.annotate({ description: 'The day to show, or the first day of the range (yyyy-MM-dd)' }),
    scope: Schema.Literals(['day', 'week'])
      .annotate({ description: 'day (default) or the Monday–Sunday week containing date; ignored when to is set' })
      .pipe(Schema.withDecodingDefault(Effect.succeed('day' as const))),
    to: LocalDate.annotate({ description: 'Optional last day of the range, inclusive (yyyy-MM-dd)' }).pipe(
      Schema.optional,
    ),
    taskId: ApiId.annotate({ description: 'Only list entries on this task api_id' }).pipe(Schema.optional),
    kind: EntryKind.annotate({ description: 'Only list entries of this kind' }).pipe(Schema.optional),
  }),
  success: Workday,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

function utcDay(date: string) {
  return DateTime.makeUnsafe(`${date}T00:00:00Z`);
}

function addDays(date: string, days: number) {
  return DateTime.formatIsoDateUtc(DateTime.add(utcDay(date), { days }));
}

function mondayOf(date: string) {
  return addDays(date, -((DateTime.toPartsUtc(utcDay(date)).weekDay + 6) % 7));
}

function minuteOfDay(start: DateTime.Zoned) {
  const { hour, minute } = DateTime.toParts(start);

  return hour * 60 + minute;
}

function clock(minutes: number) {
  const pad = Str.padStart(2, '0');

  return `${pad(String(Math.floor(minutes / 60)))}:${pad(String(minutes % 60))}`;
}

function slot(from: number, to: number) {
  return TimeSlot.make({ from: clock(from), to: clock(to), minutes: to - from });
}

interface Span {
  readonly id: string;
  readonly from: number;
  readonly to: number;
}

function spanOf(entry: TimeEntry): Span {
  const from = minuteOfDay(entry.start);

  return { id: entry.id, from, to: from + entry.minutes };
}

function gapsOf(spans: ReadonlyArray<Span>) {
  const gaps: Array<TimeSlot> = [];

  let cursor = WORK_START;

  const sorted = Arr.sortWith(spans, ({ from }) => from, Order.Number);

  for (const span of sorted) {
    if (span.from > cursor && cursor < WORK_END) {
      gaps.push(slot(cursor, Math.min(span.from, WORK_END)));
    }

    cursor = Math.max(cursor, span.to);
  }

  return cursor < WORK_END ? [...gaps, slot(cursor, WORK_END)] : gaps;
}

function overlapsOf(spans: ReadonlyArray<Span>) {
  const sorted = Arr.sortWith(spans, ({ from }) => from, Order.Number);

  return Arr.flatMap(sorted, (first, index) =>
    Arr.flatMap(Arr.drop(sorted, index + 1), (second) =>
      second.from < first.to
        ? [Overlap.make({ first: first.id, second: second.id, minutes: Math.min(first.to, second.to) - second.from })]
        : [],
    ),
  );
}

function workdayDay(
  day: TimesheetDay,
  planned: ReadonlyArray<PlannedEntry>,
  filter: { readonly taskId?: string | undefined; readonly kind?: (typeof EntryKind)['Type'] | undefined },
) {
  const working = Arr.filter(day.entries, (entry) => entry.kind !== 'absence');

  const spans = Arr.map(working, spanOf);

  const dayOff = day.capacityMinutes === 0 || day.absenceMinutes >= day.capacityMinutes;

  return WorkdayDay.make({
    date: day.date,
    weekday: day.weekday,
    state: day.state,
    capacityMinutes: day.capacityMinutes,
    loggedMinutes: day.loggedMinutes,
    plannedMinutes: day.plannedMinutes,
    absenceMinutes: day.absenceMinutes,
    missingMinutes: Math.max(0, day.capacityMinutes - day.loggedMinutes - day.absenceMinutes),
    dayOff,
    entries: Arr.filter(
      day.entries,
      (entry) =>
        (filter.taskId === undefined || entry.taskId === filter.taskId) &&
        (filter.kind === undefined || entry.kind === filter.kind),
    ),
    unconfirmedPlanned: Arr.flatMap(working, (entry) => {
      if (entry.kind !== 'planned') {
        return [];
      }

      const planning = Arr.findFirst(planned, ({ id }) => id === entry.id);

      return [
        UnconfirmedPlanned.make({
          id: entry.id,
          start: entry.start,
          minutes: entry.minutes,
          work: entry.work,
          ...definedKey('taskId', entry.taskId),
          ...(Opt.isSome(planning)
            ? { planningKind: planning.value.kind, ...definedKey('seriesId', planning.value.seriesId) }
            : {}),
        }),
      ];
    }),
    // Partial absences still cover their time slot.
    gaps: dayOff ? [] : gapsOf(Arr.map(day.entries, spanOf)),
    overlaps: overlapsOf(spans),
    outsideWorkingHours: Arr.flatMap(spans, ({ id, from, to }) => (from < WORK_START || to > WORK_END ? [id] : [])),
  });
}

export const getMyWorkday = Effect.fn('GetMyWorkday')(function* (
  orbit: OrbitShape,
  params: Tool.Parameters<typeof GetMyWorkday>,
) {
  const from = params.to === undefined && params.scope === 'week' ? mondayOf(params.date) : params.date;

  const to = params.to ?? (params.scope === 'week' ? addDays(from, 6) : from);

  if (to < from || to > addDays(from, RANGE_LIMIT - 1)) {
    return yield* Effect.fail(
      OrbitReadError.make({ message: `Range ${from}..${to} must be 1 to ${RANGE_LIMIT} days.` }),
    );
  }

  const mondays = Arr.unfold(mondayOf(from), (monday) =>
    monday > to ? Opt.none() : Opt.some([monday, addDays(monday, 7)] as const),
  );

  const range = { dateFrom: from, dateTo: to };

  const [weeks, absences, planned, runningTimer, bookableTasks] = yield* Effect.all(
    [
      // oxlint-disable-next-line unicorn/no-array-for-each
      Effect.forEach(mondays, (date) => orbit.call(GetTimesheetWeek, { date }), { concurrency: 'unbounded' }),
      orbit.call(ListAbsences, range),
      orbit.call(ListPlannedEntries, range),
      orbit.call(GetRunningTimer, {}),
      orbit.call(ListMyTasks, {}),
    ],
    { concurrency: 'unbounded' },
  );

  const days = Arr.map(
    Arr.filter(
      Arr.flatMap(weeks, (week) => week.days),
      (day) => day.date >= from && day.date <= to,
    ),
    (day) => workdayDay(day, planned, params),
  );

  function total(key: 'capacityMinutes' | 'loggedMinutes' | 'plannedMinutes' | 'absenceMinutes' | 'missingMinutes') {
    return Arr.reduce(days, 0, (sum, day) => sum + day[key]);
  }

  return Workday.make({
    from,
    to,
    timeZone: TIME_ZONE,
    workingHours: slot(WORK_START, WORK_END),
    totals: {
      capacityMinutes: total('capacityMinutes'),
      loggedMinutes: total('loggedMinutes'),
      plannedMinutes: total('plannedMinutes'),
      absenceMinutes: total('absenceMinutes'),
      missingMinutes: total('missingMinutes'),
    },
    days,
    absences,
    runningTimer,
    bookableTasks,
  });
}, Effect.mapError(toReadError));
