import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as Str from 'effect/String';
import * as Struct from 'effect/Struct';

import { ApiId, Duration, LocalDate, Line, Minutes, Timestamp } from './text.js';

export const EntryKind = Schema.Literals(['logged', 'planned', 'absence']);

export class TimeEntry extends Schema.Class<TimeEntry, { readonly brand: unique symbol }>('TimeEntry')({
  id: ApiId,
  start: Timestamp,
  minutes: Minutes,
  kind: EntryKind,
  work: Schema.String.annotate({ description: 'Project / task, ticket or absence type as Orbit shows it' }),
  description: Schema.String.pipe(Schema.optionalKey),
  taskId: ApiId.pipe(Schema.optionalKey),
  ticketId: ApiId.pipe(Schema.optionalKey),
  pendingApproval: Schema.Boolean.annotate({ description: 'Absence still awaiting approval' }).pipe(Schema.optionalKey),
  lock: Schema.String.annotate({ description: 'Why Orbit refuses edits, e.g. "timesheet submitted (FINAL)"' }).pipe(
    Schema.optionalKey,
  ),
  editable: Schema.Boolean,
}) {}

export class TimesheetDay extends Schema.Class<TimesheetDay, { readonly brand: unique symbol }>('TimesheetDay')({
  date: LocalDate,
  weekday: Schema.String,
  state: Schema.Literals(['OPEN', 'FINAL']),
  loggedMinutes: Minutes,
  plannedMinutes: Minutes,
  absenceMinutes: Minutes,
  capacityMinutes: Minutes,
  entries: Schema.Array(TimeEntry),
}) {}

export class TimesheetWeek extends Schema.Class<TimesheetWeek, { readonly brand: unique symbol }>('TimesheetWeek')({
  weekOf: LocalDate,
  userId: ApiId,
  days: Schema.Array(TimesheetDay),
}) {}

/**
 * The parts of an entry that `GetTimesheetWeek` and `ListTimeEntries` both print.
 */
export const EntryFields = {
  id: ApiId,
  minutes: Duration,
  planned: Schema.Literal('[PLANNED]').pipe(Schema.optionalKey),
  absence: Schema.Literals(['ABSENCE', 'ABSENCE (pending approval)']).pipe(Schema.optionalKey),
  /*
   * Orbit pads the work before ` — `. Ticket work is `ticket "<name>"`, closed by the quote before ` — <number> `, so a
   * ` — ` inside the name stays in it. Work never starts with `[`, `(` or ABSENCE, so an unknown marker fails.
   */
  work: Schema.Trim,
  description: Schema.String.pipe(Schema.optionalKey),
  taskId: ApiId.pipe(Schema.optionalKey),
  ticketId: ApiId.pipe(Schema.optionalKey),
  lock: Schema.String.pipe(Schema.optionalKey),
};

/**
 * Turn the printed entry parts into a `TimeEntry`.
 *
 * @param start Orbit's local `yyyy-MM-dd HH:mm`
 * @param entry
 */
export function timeEntry(
  start: string,
  entry: Schema.Struct<typeof EntryFields>['Type'],
): (typeof TimeEntry)['Encoded'] {
  const { planned, absence } = entry;

  return {
    ...Struct.pick(entry, ['id', 'minutes', 'work', 'description', 'taskId', 'ticketId', 'lock']),
    start,
    kind: kindOf(planned, absence),
    ...(P.isUndefined(absence) ? {} : { pendingApproval: absence === 'ABSENCE (pending approval)' }),
    editable: P.isUndefined(entry.lock),
  };
}

function kindOf(planned: string | undefined, absence: string | undefined) {
  if (P.isNotUndefined(absence)) {
    return 'absence';
  }

  return P.isUndefined(planned) ? 'logged' : 'planned';
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const Weekday = Schema.Literals(WEEKDAYS);

// Day rows are read by position, so the column header must be there exactly once and match exactly.
const COLUMNS = '| Day | State | Logged | Planned | Absence | Capacity |';

// `s` on entry patterns: descriptions can contain a bare LF inside Orbit's CRLF-delimited lines.
const WeekText = Schema.Struct({
  header: Line(/^Timesheet week of (?<weekOf>\S+) for .+ \(user api_id: (?<userId>[A-Z0-9]{15})\)$/, {
    weekOf: LocalDate,
    userId: ApiId,
  }),
  days: Schema.Array(
    Line(
      /^\| (?<weekday>\w+) (?<date>\S+) \| (?<state>[A-Z]+) \| (?<loggedMinutes>\S+) \| (?<plannedMinutes>\S+) \| (?<absenceMinutes>\S+) \| (?<capacityMinutes>\S+) \|$/,
      {
        weekday: Weekday,
        date: LocalDate,
        state: TimesheetDay.fields.state,
        loggedMinutes: Duration,
        plannedMinutes: Duration,
        absenceMinutes: Duration,
        capacityMinutes: Duration,
      },
    ),
  ).check(Schema.isBetweenLength(7, 7)),
  columns: Schema.Array(Schema.String).check(Schema.isBetweenLength(1, 1)),
  entries: Schema.Array(
    Line(
      /^- (?<weekday>\w+) (?<time>\d{2}:\d{2}) (?<minutes>\d+h\d*) (?:(?<planned>\[PLANNED\]) |(?<absence>ABSENCE(?: \(pending approval\))?) )?(?![[(]|ABSENCE)(?<work>ticket ".*?"(?= — \d+ )|.+?)(?: — (?<description>.+?))? {2}\(api_id: (?<id>[A-Z0-9]{15})(?:, task api_id: (?<taskId>[A-Z0-9]{15})|, ticket api_id: (?<ticketId>[A-Z0-9]{15}))?\)(?: \[locked: (?<lock>.+)\])?$/s,
      { weekday: Weekday, time: Schema.String, ...EntryFields },
    ),
  ),
}).check(
  Schema.makeFilter(
    ({ header, days }) =>
      Arr.every(
        days,
        (day, index) =>
          day.weekday === WEEKDAYS[index] &&
          day.date === DateTime.formatIsoDateUtc(DateTime.add(DateTime.makeUnsafe(header.weekOf), { days: index })),
      ),
    { expected: 'day rows Mon to Sun with consecutive dates from the week start' },
  ),
);

const IGNORE = [/^\|---/, /^Week total: /, /^Entries:$/, /^Planned entries can be confirmed/];

/**
 * The first line is the header and `- ` lines are entries. Every other line that is not ignored must be a day row, so
 * an unknown line fails as one.
 *
 * @param text
 */
function sections(text: string) {
  const [header = '', ...lines] = Arr.filter(
    Str.split(text, '\r\n'),
    (line) => Str.isNonEmpty(Str.trim(line)) && !Arr.some(IGNORE, (pattern) => pattern.test(line)),
  );

  const isEntry = Str.startsWith('- ');

  return {
    header,
    columns: Arr.filter(lines, (line) => line === COLUMNS),
    days: Arr.filter(lines, (line) => line !== COLUMNS && !isEntry(line)),
    entries: Arr.filter(lines, isEntry),
  };
}

export const GetTimesheetWeek = {
  name: 'GetTimesheetWeek',
  args: Schema.Struct({ date: LocalDate }),
  result: Schema.String.pipe(
    Schema.decodeTo(WeekText, { decode: SchemaGetter.transform(sections), encode: SchemaGetter.forbiddenEncoding }),
    Schema.decodeTo(TimesheetWeek, {
      decode: SchemaGetter.transform(({ header, days, entries }) =>
        Struct.assign(header, {
          days: Arr.map(days, (day) =>
            Struct.assign(day, {
              entries: Arr.map(
                Arr.filter(entries, ({ weekday }) => weekday === day.weekday),
                ({ time, ...entry }) => timeEntry(`${day.date} ${time}`, entry),
              ),
            }),
          ),
        }),
      ),
      encode: SchemaGetter.forbiddenEncoding,
    }),
  ),
};
