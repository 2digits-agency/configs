import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Result from 'effect/Result';
import { describe, expect, it } from 'vite-plus/test';

import { makeDemoMcpLayer } from '../src/demo/DemoMcp.js';
import { parseTaskId, parseTicketId } from '../src/domain/ids.js';
import { unsafeClockTime, unsafeLocalDate } from '../src/domain/time.js';
import {
  type BookingOutcome,
  type ValidBooking,
  readbackBooking,
  submitBooking,
  toCreateArgs,
} from '../src/flows/Booking.js';
import { type NoteOutcome, submitNote } from '../src/flows/InternalNote.js';
import { Orbit, makeOrbitLayer } from '../src/orbit/Orbit.js';

const today = unsafeLocalDate('2026-10-13');

const booking: ValidBooking = {
  task: { taskId: Opt.getOrThrow(parseTaskId('PTDEMO000000001')), label: 'Development', rate: Opt.some(110) },
  date: today,
  start: unsafeClockTime('17:23'),
  durationMinutes: 37,
  billable: 'non-billable',
  description: 'Asymmetric contract review',
};

function demoLayer(writeMode: 'direct-writes' | 'read-only' = 'direct-writes', fault?: 'timeout') {
  return makeOrbitLayer({ source: 'demo', writeMode }).pipe(Layer.provide(makeDemoMcpLayer({ today, fault })));
}

function verifiedBooking(outcome: BookingOutcome) {
  return Match.value(outcome).pipe(
    Match.tag('Verified', (value) => value),
    Match.orElse((value) => {
      throw new Error(`Expected verified booking, got ${value._tag}`);
    }),
  );
}

function verifiedNote(outcome: NoteOutcome) {
  return Match.value(outcome).pipe(
    Match.tag('Verified', (value) => value),
    Match.orElse((value) => {
      throw new Error(`Expected verified note, got ${value._tag}`);
    }),
  );
}

describe('demo-backed Orbit user flows', () => {
  it.for([
    { fault: undefined, delivery: 'acknowledged' },
    { fault: 'timeout', delivery: 'unknown' },
  ] as const)(
    'verifies a booking and repeated readback without duplicates (delivery: $delivery)',
    ({ fault, delivery }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const orbit = yield* Orbit;

          const before = yield* orbit.timesheetWeek(today);

          const outcome = verifiedBooking(yield* submitBooking(booking, { acceptDuplicate: false, today }));

          expect({
            delivery: outcome.attempt.delivery,
            entry: outcome.entry,
            taskId: Opt.getOrThrow(outcome.entry.taskId),
            billable: Opt.getOrThrow(outcome.entry.billable).billable,
          }).toMatchObject({
            delivery,
            taskId: booking.task.taskId,
            billable: false,
            entry: {
              date: today,
              start: '17:23',
              durationMinutes: 37,
              description: booking.description,
            },
          });

          for (let reread = 0; reread < 2; reread++) {
            const settled = yield* readbackBooking(booking, outcome.attempt);

            expect(verifiedBooking(settled).entry.id).toBe(outcome.entry.id);
          }

          const after = yield* orbit.timesheetWeek(today);

          expect({
            count: after.entries.length,
            matching: after.entries.filter((entry) => entry.id === outcome.entry.id).length,
          }).toStrictEqual({ count: before.entries.length + 1, matching: 1 });

          const duplicate = yield* submitBooking(booking, { acceptDuplicate: false, today }).pipe(Effect.result);

          expect(duplicate.pipe(Result.getFailure, Opt.getOrThrow)._tag).toBe('DuplicateSuspected');

          expect((yield* orbit.timesheetWeek(today)).entries).toHaveLength(after.entries.length);
        }).pipe(Effect.provide(demoLayer('direct-writes', fault))),
      ),
  );

  it('read-only allows reads but rejects both direct write APIs without modifying data', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;

        const before = yield* orbit.timesheetWeek(today);

        const ticket = Opt.getOrThrow(Opt.fromUndefinedOr((yield* orbit.tickets({ state: 'WAIT' }))[0]));

        const ticketId = Opt.getOrThrow(parseTicketId(ticket.ticketId));

        const comments = yield* orbit.ticketComments(ticketId);

        const bookingError = (yield* orbit.createTimeEntry(toCreateArgs(booking)).pipe(Effect.result)).pipe(
          Result.getFailure,
          Opt.getOrThrow,
        );

        const noteError = (yield* orbit
          .addInternalComment({ ticketId, note: 'Do not write' })
          .pipe(Effect.result)).pipe(Result.getFailure, Opt.getOrThrow);

        expect([bookingError._tag, bookingError.tool, noteError._tag, noteError.tool]).toStrictEqual([
          'OrbitNotAllowed',
          'CreateTimeEntry',
          'OrbitNotAllowed',
          'AddInternalComment',
        ]);

        expect(yield* orbit.timesheetWeek(today)).toStrictEqual(before);

        expect(yield* orbit.ticketComments(ticketId)).toStrictEqual(comments);
      }).pipe(Effect.provide(demoLayer('read-only'))),
    ));

  it('direct mode still excludes approval-only and unproven sensitive tools from its public allowlist', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;

        expect(orbit.callable.has('CreateTimeEntry')).toBeTruthy();

        expect(orbit.callable.has('AddInternalComment')).toBeTruthy();

        for (const tool of [
          'UpdateTimeEntry',
          'DeleteTimeEntry',
          'ReplyToTicket',
          'StartTimer',
          'StopTimer',
          'CreateTodo',
          'UpdateTodo',
          'MoveTodo',
          'SetCustomFieldValues',
        ]) {
          expect(orbit.callable.has(tool), tool).toBeFalsy();
        }
      }).pipe(Effect.provide(demoLayer())),
    ));

  it('adds one simple internal note while preserving a WAIT ticket and its existing assignee', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;

        const ticket = Opt.getOrThrow(Opt.fromUndefinedOr((yield* orbit.tickets({ state: 'WAIT' }))[0]));

        const ticketId = Opt.getOrThrow(parseTicketId(ticket.ticketId));

        const before = yield* orbit.ticketDetail(ticketId);

        const comments = yield* orbit.ticketComments(ticketId);

        const outcome = verifiedNote(yield* submitNote(ticketId, '  Investigated feed lag; awaiting sample  '));

        expect(outcome.attempt.arguments).toStrictEqual({
          ticketId: ticket.ticketId,
          note: 'Investigated feed lag; awaiting sample',
        });

        expect(outcome.comment).toMatchObject({ isInternal: true, loggedMinutes: 0 });

        expect(outcome.comment.content?.trim()).toBe('Investigated feed lag; awaiting sample');

        const after = yield* orbit.ticketDetail(ticketId);

        expect({ state: after.state, assignee: after.assignee }).toStrictEqual({
          state: 'WAIT',
          assignee: before.assignee,
        });

        expect(yield* orbit.ticketComments(ticketId)).toHaveLength(comments.length + 1);
      }).pipe(Effect.provide(demoLayer())),
    ));

  it('translates a half-open range to include its final day but exclude the next day, with task filtering', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;

        const ids: Array<string> = [];

        for (const day of ['2026-10-12', '2026-10-13', '2026-10-14']) {
          const outcome = yield* submitBooking(
            { ...booking, date: unsafeLocalDate(day) },
            { acceptDuplicate: false, today },
          );

          ids.push(verifiedBooking(outcome).entry.id);
        }

        const rows = yield* orbit.timeEntries(
          { start: unsafeLocalDate('2026-10-12'), endExclusive: unsafeLocalDate('2026-10-14') },
          { taskId: booking.task.taskId },
        );

        const returnedIds = rows.map((entry) => entry.id);

        expect(returnedIds).toContain(ids[0]);

        expect(returnedIds).toContain(ids[1]);

        expect(returnedIds).not.toContain(ids[2]);

        expect(rows.map((entry) => ({ date: entry.date, label: entry.label }))).toStrictEqual(
          rows.map(() => ({
            date: expect.stringMatching(/^2026-10-1[23]$/) as unknown,
            label: expect.stringContaining('/ Development') as unknown,
          })),
        );
      }).pipe(Effect.provide(demoLayer())),
    ));
});
