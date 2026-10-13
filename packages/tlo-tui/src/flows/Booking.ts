import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { type BillableChoice, billableLabel, toCreateBillable } from '../domain/billable.js';
import { type TaskId, type TimeEntryId, findApiId } from '../domain/ids.js';
import {
  type ClockTime,
  type LocalDate,
  clockMinutes,
  daysBetween,
  endsAfterMidnight,
  formatDuration,
  isOffsetTransitionDay,
  parseClockTime,
  parseDuration,
  parseLocalDate,
  startOfWeek,
  weekdayIndex,
} from '../domain/time.js';
import { type CreateTimeEntryArgs, Orbit, type OrbitError, createTimeEntryArguments } from '../orbit/Orbit.js';
import { type TimeEntryDetail, type TimesheetWeek, type WeekEntry, normalizeText } from '../orbit/parse.js';

export interface SelectedTask {
  readonly taskId: TaskId;
  readonly label: string;
  /**
   * Rate shown by the search source, if any; `0` predicts a "no (no rate)" billable readback.
   */
  readonly rate: Opt.Option<number>;
}

export interface BookingDraft {
  readonly task: Opt.Option<SelectedTask>;
  readonly date: string;
  readonly start: string;
  readonly duration: string;
  readonly billable: BillableChoice | undefined;
  readonly description: string;
}

export type BookingField = 'task' | 'date' | 'start' | 'duration' | 'billable' | 'description';

export interface Issue {
  readonly field: BookingField | 'day';
  readonly message: string;
}

export type WarningCode =
  | 'duplicate'
  | 'overlap'
  | 'future'
  | 'weekend'
  | 'offset-transition'
  | 'zero-rate'
  | 'other-week'
  | 'week-unread';

export interface Warning {
  readonly code: WarningCode;
  readonly message: string;
}

export interface ValidBooking {
  readonly task: SelectedTask;
  readonly date: LocalDate;
  readonly start: ClockTime;
  readonly durationMinutes: number;
  readonly billable: BillableChoice;
  readonly description: string;
}

export const emptyDraft: BookingDraft = {
  task: Opt.none(),
  date: '',
  start: '',
  duration: '',
  billable: undefined,
  description: '',
};

/**
 * Field-level validation. A start time is mandatory (Orbit would silently use 09:00) and billability must be chosen.
 *
 * @param draft
 */
export function validateDraft(draft: BookingDraft): {
  readonly valid: Opt.Option<ValidBooking>;
  readonly issues: ReadonlyArray<Issue>;
} {
  const issues: Array<Issue> = [];

  const date = parseLocalDate(draft.date);

  const start = parseClockTime(draft.start);

  const duration = parseDuration(draft.duration);

  if (Opt.isNone(draft.task)) {
    issues.push({ field: 'task', message: 'Kies een projecttaak (PT…) via Zoeken.' });
  }

  if (Opt.isNone(date)) {
    issues.push({ field: 'date', message: 'Datum als yyyy-MM-dd.' });
  }

  if (draft.start.trim() === '') {
    issues.push({ field: 'start', message: 'Starttijd is verplicht; Orbit kiest anders stil 09:00.' });
  } else if (Opt.isNone(start)) {
    issues.push({ field: 'start', message: 'Starttijd als HH:mm.' });
  }

  if (Opt.isNone(duration)) {
    issues.push({ field: 'duration', message: 'Duur als 1h30, 90 of 1:30.' });
  } else if (duration.value <= 0 || duration.value > 1440) {
    issues.push({ field: 'duration', message: 'Duur moet tussen 1 en 1440 minuten liggen.' });
  } else if (Opt.isSome(start) && endsAfterMidnight(start.value, duration.value)) {
    issues.push({ field: 'duration', message: 'Loopt over middernacht: splits in twee boekingen per dag.' });
  }

  if (draft.billable === undefined) {
    issues.push({ field: 'billable', message: 'Kies expliciet billable (b) of niet-billable (n).' });
  }

  if (
    issues.length > 0 ||
    Opt.isNone(draft.task) ||
    Opt.isNone(date) ||
    Opt.isNone(start) ||
    Opt.isNone(duration) ||
    draft.billable === undefined
  ) {
    return { valid: Opt.none(), issues };
  }

  return {
    valid: Opt.some({
      task: draft.task.value,
      date: date.value,
      start: start.value,
      durationMinutes: duration.value,
      billable: draft.billable,
      description: draft.description.trim(),
    }),
    issues,
  };
}

function overlaps(entry: WeekEntry, start: number, end: number): boolean {
  const entryStart = clockMinutes(entry.start);

  return entryStart < end && start < entryStart + entry.durationMinutes;
}

function labelMentions(entry: WeekEntry, task: SelectedTask): boolean {
  const name = normalizeText(task.label.split(' / ').at(-1) ?? task.label).toLowerCase();

  return name !== '' && normalizeText(entry.label).toLowerCase().includes(name);
}

export interface Assessment {
  readonly blockers: ReadonlyArray<Issue>;
  readonly warnings: ReadonlyArray<Warning>;
  readonly sameDay: ReadonlyArray<WeekEntry>;
}

/**
 * Context checks against the week that contains the booking date. `week` must be that week; otherwise the result says
 * the check is incomplete instead of guessing.
 *
 * @param booking
 * @param week
 * @param today
 */
export function assessBooking(booking: ValidBooking, week: Opt.Option<TimesheetWeek>, today: LocalDate): Assessment {
  const blockers: Array<Issue> = [];

  const warnings: Array<Warning> = [];

  const start = clockMinutes(booking.start);

  const end = start + booking.durationMinutes;

  let sameDay: ReadonlyArray<WeekEntry> = [];

  if (Opt.isNone(week) || startOfWeek(week.value.weekOf) !== startOfWeek(booking.date)) {
    warnings.push({
      code: 'week-unread',
      message: 'Week van deze datum nog niet gelezen; dubbel- en lockcontrole volgt bij versturen.',
    });
  } else {
    const day = week.value.days.find((candidate) => candidate.date === booking.date);

    if (day !== undefined && day.state !== 'OPEN') {
      blockers.push({ field: 'day', message: `Dag ${booking.date} is ${day.state}; boeken is geblokkeerd.` });
    }

    sameDay = week.value.entries.filter((entry) => entry.date === booking.date);

    for (const entry of sameDay) {
      if (
        entry.kind === 'logged' &&
        entry.start === booking.start &&
        entry.durationMinutes === booking.durationMinutes &&
        labelMentions(entry, booking.task)
      ) {
        warnings.push({
          code: 'duplicate',
          message: `Mogelijk dubbel: ${entry.start} ${formatDuration(entry.durationMinutes)} ${entry.label} (${entry.id}).`,
        });
      } else if (overlaps(entry, start, end)) {
        warnings.push({
          code: 'overlap',
          message: `Overlapt ${entry.kind === 'planned' ? 'planning' : 'boeking'} ${entry.start} ${formatDuration(entry.durationMinutes)} ${entry.label}.`,
        });
      }
    }
  }

  if (daysBetween(today, booking.date) > 0) {
    warnings.push({ code: 'future', message: `Datum ligt in de toekomst (${booking.date}).` });
  }

  if (weekdayIndex(booking.date) >= 5) {
    warnings.push({ code: 'weekend', message: 'Boeking in het weekend.' });
  }

  if (isOffsetTransitionDay(booking.date)) {
    warnings.push({
      code: 'offset-transition',
      message:
        'Zomer/wintertijd-wissel op deze dag; Orbit-tijdzone is onbewezen, klok wordt ongeconverteerd verstuurd.',
    });
  }

  if (booking.billable === 'billable' && Opt.contains(booking.task.rate, 0)) {
    warnings.push({
      code: 'zero-rate',
      message: 'Taak heeft tarief 0.00/u: Orbit leest dit waarschijnlijk terug als "no (no rate)".',
    });
  }

  if (startOfWeek(booking.date) !== startOfWeek(today)) {
    warnings.push({ code: 'other-week', message: `Andere week dan vandaag (${startOfWeek(booking.date)}).` });
  }

  return { blockers, warnings, sameDay };
}

export function toCreateArgs(booking: ValidBooking): CreateTimeEntryArgs {
  return {
    taskId: booking.task.taskId,
    date: `${booking.date} ${booking.start}`,
    durationMinutes: booking.durationMinutes,
    billable: toCreateBillable(booking.billable),
    description: booking.description,
  };
}

export function bookingPayload(booking: ValidBooking) {
  return createTimeEntryArguments(toCreateArgs(booking));
}

export class BookingBlocked extends Schema.TaggedError<BookingBlocked>()('BookingBlocked', {
  messages: Schema.Array(Schema.String),
}) {}

/**
 * The fresh week shows a likely duplicate the user has not explicitly accepted.
 */
export class DuplicateSuspected extends Schema.TaggedError<DuplicateSuspected>()('DuplicateSuspected', {
  messages: Schema.Array(Schema.String),
}) {}

export interface Diff {
  readonly field: string;
  readonly expected: string;
  readonly actual: string;
}

export type Delivery = 'acknowledged' | 'rejected' | 'unknown';

export interface Attempt {
  readonly arguments: Schema.JsonObject;
  readonly delivery: Delivery;
  readonly message: string;
  /**
   * Entry ids on the booking day before the attempt; used to find the new entry on reread.
   */
  readonly before: ReadonlyArray<TimeEntryId>;
}

export type BookingOutcome =
  | { readonly _tag: 'Verified'; readonly entry: TimeEntryDetail; readonly attempt: Attempt }
  | {
      readonly _tag: 'Mismatch';
      readonly entry: TimeEntryDetail;
      readonly diffs: ReadonlyArray<Diff>;
      readonly attempt: Attempt;
    }
  | {
      readonly _tag: 'Unknown';
      readonly reason: string;
      readonly candidates: ReadonlyArray<WeekEntry>;
      readonly attempt: Attempt;
    }
  | { readonly _tag: 'Rejected'; readonly reason: string; readonly attempt: Attempt };

export function compareEntry(booking: ValidBooking, entry: TimeEntryDetail): ReadonlyArray<Diff> {
  const diffs: Array<Diff> = [];

  const push = (field: string, expected: string, actual: string) => {
    if (expected !== actual) {
      diffs.push({ field, expected, actual });
    }
  };

  push('datum', booking.date, entry.date);

  push('starttijd', booking.start, entry.start);

  push('duur', formatDuration(booking.durationMinutes), formatDuration(entry.durationMinutes));

  push(
    'taak',
    booking.task.taskId,
    Opt.getOrElse(entry.taskId, () => 'onleesbaar'),
  );

  push(
    'billable',
    billableLabel(booking.billable),
    Opt.match(entry.billable, {
      onNone: () => 'onleesbaar',
      onSome: (value) => `${billableLabel(value.billable)}${value.reason === undefined ? '' : ` (${value.reason})`}`,
    }),
  );

  if (booking.description !== '') {
    push('omschrijving', normalizeText(booking.description), normalizeText(entry.description));
  }

  if (!/^logged/i.test(entry.kind)) {
    diffs.push({ field: 'soort', expected: 'logged time', actual: entry.kind });
  }

  return diffs;
}

/**
 * Reads back what Orbit actually stored. Only reads; safe to repeat from the UI after an unknown outcome.
 *
 * @param booking
 * @param attempt
 */
export const readbackBooking = Effect.fn('Booking.readback')(function* (booking: ValidBooking, attempt: Attempt) {
  const orbit = yield* Orbit;

  const acknowledgedId = attempt.delivery === 'acknowledged' ? findApiId(attempt.message, 'AC') : Opt.none();

  let id: TimeEntryId;

  if (Opt.isSome(acknowledgedId)) {
    id = acknowledgedId.value as TimeEntryId;
  } else {
    const week = yield* orbit.timesheetWeek(booking.date).pipe(Effect.option);

    if (Opt.isNone(week)) {
      return {
        _tag: 'Unknown',
        reason: 'Week kon niet worden herlezen.',
        candidates: [],
        attempt,
      } satisfies BookingOutcome;
    }

    const before = new Set(attempt.before);

    const added = week.value.entries.filter((entry) => entry.date === booking.date && !before.has(entry.id));

    const matching = added.filter(
      (entry) => entry.start === booking.start && entry.durationMinutes === booking.durationMinutes,
    );

    const [only] = matching;

    if (matching.length !== 1 || only === undefined) {
      if (added.length === 0 && attempt.delivery === 'rejected') {
        return {
          _tag: 'Rejected',
          reason: `${attempt.message} Readback: geen nieuwe entry op ${booking.date}.`,
          attempt,
        } satisfies BookingOutcome;
      }

      return {
        _tag: 'Unknown',
        reason:
          matching.length === 0
            ? `Geen nieuwe entry ${booking.start} ${formatDuration(booking.durationMinutes)} gevonden op ${booking.date}.`
            : `${matching.length} nieuwe entries passen; kies handmatig.`,
        candidates: added,
        attempt,
      } satisfies BookingOutcome;
    }

    ({ id } = only);
  }

  const entry = yield* orbit.timeEntry(id).pipe(Effect.option);

  if (Opt.isNone(entry)) {
    return {
      _tag: 'Unknown',
      reason: `Entry ${id} kon niet worden gelezen.`,
      candidates: [],
      attempt,
    } satisfies BookingOutcome;
  }

  const diffs = compareEntry(booking, entry.value);

  return (
    diffs.length === 0
      ? { _tag: 'Verified', entry: entry.value, attempt }
      : { _tag: 'Mismatch', entry: entry.value, diffs, attempt }
  ) satisfies BookingOutcome;
});

function deliveryOf(error: OrbitError): Delivery {
  switch (error._tag) {
    case 'McpCallError':
      return error.delivery === 'not-sent' ? 'rejected' : 'unknown';
    case 'OrbitNotAllowed':
    case 'OrbitToolError':
    case 'OrbitRateLimited':
      return 'rejected';
    case 'OrbitUnreadable':
      return 'unknown';
  }
}

function errorMessage(error: OrbitError): string {
  switch (error._tag) {
    case 'McpCallError':
    case 'OrbitToolError':
    case 'OrbitRateLimited':
      return error.message;
    case 'OrbitNotAllowed':
      return error.reason;
    case 'OrbitUnreadable':
      return error.raw;
  }
}

/**
 * Re-reads the week, re-checks locks and duplicates, sends `CreateTimeEntry` exactly once and reads back. A lost
 * acknowledgement never triggers a second write; it yields `Unknown` until a reread settles it.
 *
 * @param booking
 * @param options
 * @param options.acceptDuplicate
 * @param options.today
 */
export const submitBooking = Effect.fn('Booking.submit')(function* (
  booking: ValidBooking,
  options: { readonly acceptDuplicate: boolean; readonly today: LocalDate },
) {
  const orbit = yield* Orbit;

  const week = yield* orbit.timesheetWeek(booking.date);

  const assessment = assessBooking(booking, Opt.some(week), options.today);

  if (assessment.blockers.length > 0) {
    return yield* BookingBlocked.make({ messages: assessment.blockers.map(({ message }) => message) });
  }

  const duplicates = assessment.warnings.filter(({ code }) => code === 'duplicate');

  if (duplicates.length > 0 && !options.acceptDuplicate) {
    return yield* DuplicateSuspected.make({ messages: duplicates.map(({ message }) => message) });
  }

  const args = bookingPayload(booking);

  const before = assessment.sameDay.map(({ id }) => id);

  const result = yield* orbit.createTimeEntry(toCreateArgs(booking)).pipe(Effect.result);

  const attempt: Attempt =
    result._tag === 'Success'
      ? { arguments: args, delivery: 'acknowledged', message: result.success, before }
      : { arguments: args, delivery: deliveryOf(result.failure), message: errorMessage(result.failure), before };

  if (
    result._tag === 'Failure' &&
    (result.failure._tag === 'OrbitNotAllowed' ||
      (result.failure._tag === 'McpCallError' && result.failure.delivery === 'not-sent'))
  ) {
    return { _tag: 'Rejected', reason: `Niet verstuurd: ${attempt.message}`, attempt } satisfies BookingOutcome;
  }

  return yield* readbackBooking(booking, attempt);
});
