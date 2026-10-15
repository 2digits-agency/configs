import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vite-plus/test';

import { initialEntries, initialTickets, tasks } from '../src/demo';
import {
  bookingArguments,
  compareReadback,
  conflicts,
  correctionArguments,
  customerReply,
  shiftDate,
  ticketRange,
  timeEntryRange,
  weekRange,
  type BookingDraft,
} from '../src/domain';

const draft: BookingDraft = {
  taskId: 'DEMO-TASK-PORTAL',
  date: '2026-10-25',
  start: '11:37',
  minutes: '53',
  description: ' Keyboard review ',
  billable: 'false',
};

describe('orbit drafts and calendar contracts', () => {
  it('preserves wall times on the DST boundary and uses boolean create / string update billing', () => {
    const args = Effect.runSync(bookingArguments(draft, tasks));

    expect(args).toStrictEqual({
      taskId: 'DEMO-TASK-PORTAL',
      date: '2026-10-25 11:37',
      durationMinutes: 53,
      description: 'Keyboard review',
      billable: false,
    });

    expect(Effect.runSync(correctionArguments(initialEntries[0], draft, tasks))).toStrictEqual({
      ...args,
      entryId: 'DEMO-E1',
      billable: 'false',
    });

    expect(Effect.runSync(bookingArguments({ ...draft, billable: 'true' }, tasks)).billable).toBeTruthy();
  });

  it.for([
    [{ start: '' }, /Starttijd/],
    [{ start: '24:00' }, /Starttijd/],
    [{ minutes: '1.5' }, /gehele/],
    [{ minutes: '0' }, /1 tot 1440/],
    [{ minutes: '1441' }, /1 tot 1440/],
    [{ date: '2026-02-29' }, /bestaande datum/],
    [{ date: '2026-04-31' }, /bestaande datum/],
    [{ billable: '' }, /expliciet/],
    [{ taskId: 'DEMO-TASK-CLOSED' }, /open projecttaak/],
    [{ taskId: '1042' }, /taak-ID/],
    [{ start: '23:30', minutes: '31' }, /middernacht/],
  ] as Array<[Partial<BookingDraft>, RegExp]>)('rejects ambiguous/unsafe draft %j', ([change, error]) => {
    expect(() => Effect.runSync(bookingArguments({ ...draft, ...change }, tasks))).toThrow(error);
  });

  it.for([
    { ...draft, billable: true },
    { ...draft, start: 9 },
    { ...draft, description: undefined },
  ])('rejects malformed external draft %j', (input) => {
    expect(() => Effect.runSync(bookingArguments(input, tasks))).toThrow(/Ongeldig boekingsconcept/);
  });

  it('accepts exact midnight but never rolls into another date', () => {
    expect(Effect.runSync(bookingArguments({ ...draft, start: '23:30', minutes: '30' }, tasks)).date).toBe(
      '2026-10-25 23:30',
    );

    expect(Effect.runSync(bookingArguments({ ...draft, start: '00:00', minutes: '1440' }, tasks)).durationMinutes).toBe(
      1440,
    );
  });

  it('handles Sunday, year rollover, leap day and DST without UTC conversion of Orbit time', () => {
    expect(weekRange('2026-10-25')).toStrictEqual({ from: '2026-10-19', until: '2026-10-26' });

    expect(weekRange('2027-01-03')).toStrictEqual({ from: '2026-12-28', until: '2027-01-04' });

    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('keeps inclusive time-entry and exclusive ticket boundaries distinct', () => {
    expect(timeEntryRange('2026-10-19', '2026-10-26')).toStrictEqual({ dateFrom: '2026-10-19', dateTo: '2026-10-25' });

    expect(ticketRange('2026-10-19', '2026-10-26')).toStrictEqual({
      createdFrom: '2026-10-19',
      createdTo: '2026-10-26',
    });

    expect(() => timeEntryRange('2026-10-26', '2026-10-26')).toThrow(/datumrange/);
  });

  it('blocks locked corrections and separates a customer reply from internal logging', () => {
    expect(() => Effect.runSync(correctionArguments(initialEntries[6], draft, tasks))).toThrow(/vergrendeld/);

    expect(Effect.runSync(customerReply(initialTickets[2], ' We onderzoeken dit. '))).toStrictEqual({
      tool: 'ReplyToTicket',
      label: 'Klantantwoord #1044 · notificatie + WAIT',
      status: 'Concept — niet verzonden',
      arguments: {
        ticketId: 'DEMO-TICKET-1044',
        message: 'We onderzoeken dit.',
        followUpAction: 'NONE',
        waitForClient: true,
      },
    });
  });

  it('detects actual stored mismatches, including task/time/billing, not just transport success', () => {
    const args = Effect.runSync(bookingArguments(draft, tasks));

    expect(compareReadback(args, { ...args, billable: true })).toStrictEqual(['billable']);

    expect(
      compareReadback(args, { ...args, taskId: 'other', date: '2026-10-24 11:37', durationMinutes: 54 }),
    ).toStrictEqual(['taskId', 'date', 'durationMinutes']);

    expect(compareReadback(args, { ...args })).toStrictEqual([]);
  });

  it('treats touching entries as nonoverlapping but detects a one-minute overlap', () => {
    const args = Effect.runSync(bookingArguments({ ...draft, date: '2026-10-13', start: '11:30' }, tasks));

    expect(conflicts(args, initialEntries)).toStrictEqual([]);

    expect(conflicts({ ...args, date: '2026-10-13 11:29' }, initialEntries).map((entry) => entry.id)).toStrictEqual([
      'DEMO-E3',
    ]);
  });
});
