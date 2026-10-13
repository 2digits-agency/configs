import type * as Brand from 'effect/Brand';
import * as Data from 'effect/Data';
import * as DateTime from 'effect/DateTime';
import * as Opt from 'effect/Option';

/**
 * Calendar date without zone, `yyyy-MM-dd`. Orbit returns wall-clock values without an offset, so dates and clock times
 * stay unconverted strings: the source timezone of Orbit timestamps is not proven.
 */
export type LocalDate = string & Brand.Brand<'LocalDate'>;

/**
 * Wall-clock start time, `HH:mm`.
 */
export type ClockTime = string & Brand.Brand<'ClockTime'>;

/**
 * Half-open date range: `start` inclusive, `endExclusive` exclusive. Adapters translate per tool contract.
 */
export interface DateRange {
  readonly start: LocalDate;
  readonly endExclusive: LocalDate;
}

/**
 * The timezone the user prefers for display hints. It is not evidence of the zone Orbit stores.
 */
export const PREFERRED_ZONE = 'Europe/Amsterdam';

const MINUTES_PER_DAY = 1440;

const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toUtc(date: LocalDate): DateTime.Utc {
  return DateTime.makeUnsafe(`${date}T00:00:00Z`);
}

function fromUtc(value: DateTime.DateTime): LocalDate {
  return DateTime.formatIsoDateUtc(value) as LocalDate;
}

export function parseLocalDate(input: string): Opt.Option<LocalDate> {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());

  if (match === null) {
    return Opt.none();
  }

  const candidate = `${match[1]}-${match[2]}-${match[3]}` as LocalDate;

  return Opt.filter(Opt.map(DateTime.make(`${candidate}T00:00:00Z`), fromUtc), (roundTrip) => roundTrip === candidate);
}

/**
 * Accepts `9:30`, `09:30` and `0930`. No default: a missing start time stays missing.
 *
 * @param input
 */
export function parseClockTime(input: string): Opt.Option<ClockTime> {
  const match = /^(\d{1,2}):?(\d{2})$/.exec(input.trim());

  if (match === null) {
    return Opt.none();
  }

  const hours = Number(match[1]);

  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return Opt.none();
  }

  return Opt.some(`${pad(hours)}:${pad(minutes)}` as ClockTime);
}

export function clockMinutes(time: ClockTime): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

export function clockFromMinutes(total: number): ClockTime {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}` as ClockTime;
}

/**
 * Parses `1h30`, `1h`, `45m`, `1:30`, `1.5h`, `1,5h` or plain minutes (`90`).
 *
 * @param input
 */
export function parseDuration(input: string): Opt.Option<number> {
  const value = input.trim().toLowerCase();

  const orbit = /^(\d+)h(\d{1,2})?$/.exec(value);

  if (orbit !== null) {
    const minutes = Number(orbit[2] ?? 0);

    return minutes < 60 ? Opt.some(Number(orbit[1]) * 60 + minutes) : Opt.none();
  }

  const colon = /^(\d+):(\d{2})$/.exec(value);

  if (colon !== null) {
    const minutes = Number(colon[2]);

    return minutes < 60 ? Opt.some(Number(colon[1]) * 60 + minutes) : Opt.none();
  }

  const decimal = /^(\d+)[.,](\d+)h$/.exec(value);

  if (decimal !== null) {
    const minutes = Number(`${decimal[1]}.${decimal[2]}`) * 60;

    // Finite numbers above the safe-integer range still have integral representations; preserve the parser contract.
    const wholeMinutes =
      Number.isSafeInteger(minutes) || (Number.isFinite(minutes) && Math.abs(minutes) > Number.MAX_SAFE_INTEGER);

    return wholeMinutes ? Opt.some(minutes) : Opt.none();
  }

  const plain = /^(\d+)m?$/.exec(value);

  return plain === null ? Opt.none() : Opt.some(Number(plain[1]));
}

/**
 * Orbit's own notation: `0h30`, `1h`, `7h30`.
 *
 * @param minutes
 */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';

  const absolute = Math.abs(minutes);

  const rest = absolute % 60;

  return `${sign}${Math.floor(absolute / 60)}h${rest === 0 ? '' : pad(rest)}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtc(DateTime.add(toUtc(date), { days }));
}

/**
 * ISO weekday index: Monday 0 … Sunday 6.
 *
 * @param date
 */
export function weekdayIndex(date: LocalDate): number {
  return (DateTime.toPartsUtc(toUtc(date)).weekDay + 6) % 7;
}

export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, -weekdayIndex(date));
}

export function weekDates(date: LocalDate): ReadonlyArray<LocalDate> {
  const monday = startOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function weekRange(date: LocalDate): DateRange {
  const start = startOfWeek(date);

  return { start, endExclusive: addDays(start, 7) };
}

/**
 * `ListTimeEntries` and `ListPlannedEntries` take an inclusive end date.
 *
 * @param range
 */
export function toInclusiveEnd(range: DateRange): { readonly dateFrom: LocalDate; readonly dateTo: LocalDate } {
  return { dateFrom: range.start, dateTo: addDays(range.endExclusive, -1) };
}

export function isoWeekNumber(date: LocalDate): number {
  const thursday = addDays(startOfWeek(date), 3);

  return Math.floor(daysBetween(`${thursday.slice(0, 4)}-01-01` as LocalDate, thursday) / 7) + 1;
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((DateTime.toEpochMillis(toUtc(to)) - DateTime.toEpochMillis(toUtc(from))) / DAY_MS);
}

const WEEKDAYS_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const;

const MONTHS_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;

export function weekdayLabel(date: LocalDate): string {
  return WEEKDAYS_NL[weekdayIndex(date)] ?? '';
}

export function monthLabel(date: LocalDate): string {
  return MONTHS_NL[Number(date.slice(5, 7)) - 1] ?? '';
}

export function shortDateLabel(date: LocalDate): string {
  return `${weekdayLabel(date)} ${Number(date.slice(8, 10))} ${monthLabel(date)}`;
}

/**
 * Orbit's English weekday abbreviations, as used in `GetTimesheetWeek`.
 */
export const ORBIT_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * UTC offset in minutes of `zone` at local noon on `date`.
 *
 * @param date
 * @param zone
 */
export function zoneOffsetMinutes(date: LocalDate, zone: string): number {
  return DateTime.zonedOffset(DateTime.makeZonedUnsafe(`${date}T12:00:00Z`, { timeZone: zone })) / 60_000;
}

/**
 * Date on which `zone` changes offset (DST), checked from the previous day's noon to this day's noon.
 *
 * @param date
 * @param zone
 */
export function isOffsetTransitionDay(date: LocalDate, zone: string = PREFERRED_ZONE): boolean {
  return zoneOffsetMinutes(addDays(date, -1), zone) !== zoneOffsetMinutes(date, zone);
}

export type BoundaryNote =
  | { readonly _tag: 'MonthBoundary'; readonly from: LocalDate; readonly to: LocalDate }
  | { readonly _tag: 'YearBoundary'; readonly from: LocalDate; readonly to: LocalDate }
  | { readonly _tag: 'OffsetTransition'; readonly date: LocalDate; readonly zone: string };

export const BoundaryNote = Data.taggedEnum<BoundaryNote>();

/**
 * Week-level hazards: month/year closes split a week and DST days make unconverted wall-clock times ambiguous.
 *
 * @param date
 * @param zone
 */
export function weekBoundaryNotes(date: LocalDate, zone: string = PREFERRED_ZONE): ReadonlyArray<BoundaryNote> {
  const dates = weekDates(date);

  const notes: Array<BoundaryNote> = [];

  for (const [index, day] of dates.entries()) {
    const previous = dates[index - 1];

    if (previous !== undefined && previous.slice(0, 7) !== day.slice(0, 7)) {
      notes.push(
        previous.slice(0, 4) === day.slice(0, 4)
          ? BoundaryNote.MonthBoundary({ from: previous, to: day })
          : BoundaryNote.YearBoundary({ from: previous, to: day }),
      );
    }

    if (isOffsetTransitionDay(day, zone)) {
      notes.push(BoundaryNote.OffsetTransition({ date: day, zone }));
    }
  }

  return notes;
}

export function endsAfterMidnight(start: ClockTime, durationMinutes: number): boolean {
  return clockMinutes(start) + durationMinutes > MINUTES_PER_DAY;
}

/**
 * Calendar date of `epochMillis` in `zone`, or in this machine's zone when omitted.
 *
 * @param epochMillis
 * @param zone
 */
export function localDateAt(epochMillis: number, zone?: string): LocalDate {
  const instant = DateTime.makeUnsafe(epochMillis);

  return DateTime.formatIsoDate(
    zone === undefined
      ? DateTime.setZone(instant, DateTime.zoneMakeLocal())
      : DateTime.makeZonedUnsafe(instant, { timeZone: zone }),
  ) as LocalDate;
}

export function unsafeLocalDate(input: string): LocalDate {
  return Opt.getOrThrowWith(parseLocalDate(input), () => new Error(`Invalid date ${input}`));
}

export function unsafeClockTime(input: string): ClockTime {
  return Opt.getOrThrowWith(parseClockTime(input), () => new Error(`Invalid time ${input}`));
}
