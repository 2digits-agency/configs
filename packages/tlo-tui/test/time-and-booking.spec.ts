import * as Opt from 'effect/Option';
import { describe, expect, it } from 'vite-plus/test';

import { parseTaskId } from '../src/domain/ids.js';
import {
  BoundaryNote,
  daysBetween,
  isoWeekNumber,
  localDateAt,
  toInclusiveEnd,
  unsafeLocalDate,
  weekBoundaryNotes,
  weekDates,
  weekRange,
} from '../src/domain/time.js';
import { type BookingDraft, bookingPayload, validateDraft } from '../src/flows/Booking.js';

const draft: BookingDraft = {
  task: Opt.some({ taskId: Opt.getOrThrow(parseTaskId('PTDEMO000000001')), label: 'Development', rate: Opt.some(110) }),
  date: '2026-10-13',
  start: '23:23',
  duration: '37m',
  billable: 'non-billable',
  description: '  Late review  ',
};

describe('booking review contract', () => {
  it('requires independent explicit start and billable choices instead of gateway defaults', () => {
    for (const [edit, field] of [
      [{ start: ' ' }, 'start'],
      [{ billable: undefined }, 'billable'],
    ] as const) {
      const result = validateDraft({ ...draft, ...edit });

      expect(Opt.isNone(result.valid)).toBeTruthy();

      expect(result.issues.map((issue) => issue.field)).toStrictEqual([field]);
    }
  });

  it('allows ending exactly at midnight, but requires a split for even one minute beyond it', () => {
    const valid = validateDraft(draft);

    expect(valid.issues).toStrictEqual([]);

    expect(bookingPayload(Opt.getOrThrow(valid.valid))).toStrictEqual({
      taskId: 'PTDEMO000000001',
      date: '2026-10-13 23:23',
      durationMinutes: 37,
      billable: false,
      description: 'Late review',
    });

    const crossing = validateDraft({ ...draft, duration: '38' });

    expect(Opt.isNone(crossing.valid)).toBeTruthy();

    expect(crossing.issues.map((issue) => issue.field)).toStrictEqual(['duration']);
  });
});

describe('wall-clock calendar contract', () => {
  it('keeps Monday-based weeks and inclusive gateway dates correct across the ISO year boundary', () => {
    const date = unsafeLocalDate('2021-01-01');

    expect(weekDates(date)).toStrictEqual([
      '2020-12-28',
      '2020-12-29',
      '2020-12-30',
      '2020-12-31',
      '2021-01-01',
      '2021-01-02',
      '2021-01-03',
    ]);

    expect([isoWeekNumber(date), isoWeekNumber(unsafeLocalDate('2021-01-04'))]).toStrictEqual([53, 1]);

    expect(weekRange(date)).toStrictEqual({ start: '2020-12-28', endExclusive: '2021-01-04' });

    expect(toInclusiveEnd(weekRange(date))).toStrictEqual({ dateFrom: '2020-12-28', dateTo: '2021-01-03' });

    expect(weekBoundaryNotes(date)).toStrictEqual([
      BoundaryNote.YearBoundary({ from: unsafeLocalDate('2020-12-31'), to: unsafeLocalDate('2021-01-01') }),
    ]);
  });

  it.for(['2026-03-29', '2026-10-25'])('flags Amsterdam DST on %s without changing calendar day lengths', (day) => {
    const date = unsafeLocalDate(day);

    const range = weekRange(date);

    expect(daysBetween(range.start, range.endExclusive)).toBe(7);

    expect(weekBoundaryNotes(date)).toContainEqual(BoundaryNote.OffsetTransition({ date, zone: 'Europe/Amsterdam' }));

    expect(weekBoundaryNotes(date, 'UTC').map((note) => note._tag)).not.toContain('OffsetTransition');
  });

  it('uses the preferred display zone only when deriving a date from an instant', () => {
    const instant = Date.parse('2026-03-28T23:30:00Z');

    expect(localDateAt(instant, 'Europe/Amsterdam')).toBe('2026-03-29');

    expect(localDateAt(instant, 'UTC')).toBe('2026-03-28');
  });
});
