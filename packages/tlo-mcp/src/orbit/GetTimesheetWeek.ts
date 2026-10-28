import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import {
  ApiId,
  atLine,
  definedKey,
  isSkipped,
  LocalDate,
  linesOf,
  localTimestamp,
  matchLine,
  Minutes,
  orbitTool,
  parseMinutes,
  splitWork,
  Timestamp,
} from './text.js';

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

const HEADER = /^Timesheet week of (?<week>\d{4}-\d{2}-\d{2}) for .+ \(user api_id: (?<userId>[A-Z0-9]{15})\)$/;

const DAY =
  /^\| (?<weekday>[A-Z][a-z]{2}) (?<date>\d{4}-\d{2}-\d{2}) \| (?<state>[A-Z]+) \| (?<logged>\S+) \| (?<planned>\S+) \| (?<absence>\S+) \| (?<capacity>\S+) \|$/;

// `s`: descriptions can contain a bare LF inside Orbit's CRLF-delimited lines.
const ENTRY =
  /^- (?<weekday>[A-Z][a-z]{2}) (?<time>\d{2}:\d{2}) (?<duration>\d+h(?:\d{2})?) (?<marker>\[PLANNED\] |ABSENCE (?:\(pending approval\) )?)?(?<rest>.+?) {2}\(api_id: (?<id>[A-Z0-9]{15})(?:, (?<ref>task|ticket) api_id: (?<refId>[A-Z0-9]{15}))?\)(?: \[locked: (?<lock>.+)\])?$/s;

const IGNORE = [/^\| Day \|/, /^\|---/, /^Week total: /, /^Entries:$/, /^Planned entries can be confirmed/];

interface DayRow {
  readonly date: string;
  readonly weekday: string;
  readonly entries: Array<unknown>;
}

function kindOf(marker: string | undefined) {
  if (marker === undefined) {
    return 'logged' as const;
  }

  return Str.startsWith('ABSENCE')(marker) ? ('absence' as const) : ('planned' as const);
}

/**
 * Entry fields shared by `GetTimesheetWeek` and `ListTimeEntries` lines.
 *
 * @param date
 * @param groups
 * @param marker
 */
export function entryFrom(
  date: string | undefined,
  groups: Readonly<Record<string, string | undefined>>,
  marker: string | undefined,
): Result.Result<unknown, string> {
  return Result.gen(function* () {
    const kind = kindOf(marker);

    return {
      id: groups.id ?? '',
      start: yield* localTimestamp(date, groups.time),
      minutes: yield* parseMinutes(groups.duration),
      kind,
      ...splitWork(groups.rest),
      ...definedKey(groups.ref === 'task' ? 'taskId' : 'ticketId', groups.refId),
      ...(kind === 'absence' ? { pendingApproval: Str.includes('pending approval')(marker ?? '') } : {}),
      ...definedKey('lock', groups.lock),
      editable: groups.lock === undefined,
    };
  });
}

function parse(text: string) {
  return Result.gen(function* () {
    const [header, ...lines] = linesOf(text);

    const { week = '', userId = '' } = yield* atLine(0, matchLine(HEADER, header));

    const days: Array<DayRow & Record<string, unknown>> = [];

    for (const [index, line] of lines.entries()) {
      if (!isSkipped(line, IGNORE)) {
        yield* atLine(index + 1, parseLine(days, line));
      }
    }

    return { weekOf: week, userId, days };
  });
}

/**
 * A day-table row adds a day; an entry line is added to its day.
 *
 * @param days
 * @param line
 */
function parseLine(days: Array<DayRow & Record<string, unknown>>, line: string) {
  return Result.gen(function* () {
    if (Str.startsWith('| ')(line)) {
      const day = yield* matchLine(DAY, line);

      days.push({
        date: day.date ?? '',
        weekday: day.weekday ?? '',
        state: day.state,
        loggedMinutes: yield* parseMinutes(day.logged),
        plannedMinutes: yield* parseMinutes(day.planned),
        absenceMinutes: yield* parseMinutes(day.absence),
        capacityMinutes: yield* parseMinutes(day.capacity),
        entries: [],
      });

      return;
    }

    const groups = yield* matchLine(ENTRY, line);

    const day = Arr.findFirst(days, ({ weekday }) => weekday === groups.weekday);

    if (Opt.isNone(day)) {
      return yield* Result.fail(`Entry on unknown day: ${JSON.stringify(line)}`);
    }

    day.value.entries.push(yield* entryFrom(day.value.date, groups, groups.marker));
  });
}

export const GetTimesheetWeek = orbitTool<{ readonly date: string }>()('GetTimesheetWeek', TimesheetWeek, parse);
