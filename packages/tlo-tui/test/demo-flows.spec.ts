import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import { describe, expect, it } from 'vite-plus/test';

import { makeDemoMcpLayer } from '../src/demo/DemoMcp.js';
import { parseTaskId, parseTicketId } from '../src/domain/ids.js';
import { unsafeClockTime, unsafeLocalDate } from '../src/domain/time.js';
import { type ValidBooking, readbackBooking, submitBooking, toCreateArgs } from '../src/flows/Booking.js';
import { submitNote } from '../src/flows/InternalNote.js';
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

describe('demo-backed Orbit user flows', () => {
  it.each([undefined, 'timeout'] as const)(
    'verifies a booking and repeated readback without duplicates (fault: %s)',
    (fault) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const orbit = yield* Orbit;
          const before = yield* orbit.timesheetWeek(today);
          const outcome = yield* submitBooking(booking, { acceptDuplicate: false, today });
          expect(outcome._tag).toBe('Verified');
          if (outcome._tag !== 'Verified') throw new Error(`Expected verified booking, got ${outcome._tag}`);
          expect(outcome.attempt.delivery).toBe(fault === 'timeout' ? 'unknown' : 'acknowledged');
          expect(outcome.entry).toMatchObject({
            date: today,
            start: '17:23',
            durationMinutes: 37,
            description: booking.description,
          });
          expect(Opt.getOrThrow(outcome.entry.taskId)).toBe(booking.task.taskId);
          expect(Opt.getOrThrow(outcome.entry.billable).billable).toBe(false);

          for (let reread = 0; reread < 2; reread++) {
            const settled = yield* readbackBooking(booking, outcome.attempt);
            expect(settled._tag).toBe('Verified');
            if (settled._tag === 'Verified') expect(settled.entry.id).toBe(outcome.entry.id);
          }
          const after = yield* orbit.timesheetWeek(today);
          expect(after.entries).toHaveLength(before.entries.length + 1);
          expect(after.entries.filter((entry) => entry.id === outcome.entry.id)).toHaveLength(1);
          const duplicate = yield* submitBooking(booking, { acceptDuplicate: false, today }).pipe(Effect.result);
          expect(duplicate).toMatchObject({ _tag: 'Failure', failure: { _tag: 'DuplicateSuspected' } });
          expect((yield* orbit.timesheetWeek(today)).entries).toHaveLength(after.entries.length);
        }).pipe(Effect.provide(demoLayer('direct-writes', fault))),
      ),
  );

  it('read-only allows reads but rejects both direct write APIs without modifying data', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;
        const before = yield* orbit.timesheetWeek(today);
        const [ticket] = yield* orbit.tickets({ state: 'WAIT' });
        if (ticket === undefined) throw new Error('Expected WAIT demo ticket');
        const ticketId = Opt.getOrThrow(parseTicketId(ticket.ticketId));
        const comments = yield* orbit.ticketComments(ticketId);
        expect(yield* orbit.createTimeEntry(toCreateArgs(booking)).pipe(Effect.result)).toMatchObject({
          _tag: 'Failure',
          failure: { _tag: 'OrbitNotAllowed', tool: 'CreateTimeEntry' },
        });
        expect(yield* orbit.addInternalComment({ ticketId, note: 'Do not write' }).pipe(Effect.result)).toMatchObject({
          _tag: 'Failure',
          failure: { _tag: 'OrbitNotAllowed', tool: 'AddInternalComment' },
        });
        expect(yield* orbit.timesheetWeek(today)).toEqual(before);
        expect(yield* orbit.ticketComments(ticketId)).toEqual(comments);
      }).pipe(Effect.provide(demoLayer('read-only'))),
    ));

  it('direct mode still excludes approval-only and unproven sensitive tools from its public allowlist', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;
        expect(orbit.callable.has('CreateTimeEntry')).toBe(true);
        expect(orbit.callable.has('AddInternalComment')).toBe(true);
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
          expect(orbit.callable.has(tool), tool).toBe(false);
        }
      }).pipe(Effect.provide(demoLayer())),
    ));

  it('adds one simple internal note while preserving a WAIT ticket and its existing assignee', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;
        const [ticket] = yield* orbit.tickets({ state: 'WAIT' });
        if (ticket === undefined) throw new Error('Expected WAIT demo ticket');
        const ticketId = Opt.getOrThrow(parseTicketId(ticket.ticketId));
        const before = yield* orbit.ticketDetail(ticketId);
        const comments = yield* orbit.ticketComments(ticketId);
        const outcome = yield* submitNote(ticketId, '  Investigated feed lag; awaiting sample  ');
        expect(outcome._tag).toBe('Verified');
        if (outcome._tag !== 'Verified') throw new Error(`Expected verified note, got ${outcome._tag}`);
        expect(outcome.attempt.arguments).toEqual({
          ticketId: ticket.ticketId,
          note: 'Investigated feed lag; awaiting sample',
        });
        expect(outcome.comment).toMatchObject({ isInternal: true, loggedMinutes: 0 });
        expect(outcome.comment.content?.trim()).toBe('Investigated feed lag; awaiting sample');
        const after = yield* orbit.ticketDetail(ticketId);
        expect(after.state).toBe('WAIT');
        expect(after.assignee).toBe(before.assignee);
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
          if (outcome._tag !== 'Verified') throw new Error(`Expected verified booking, got ${outcome._tag}`);
          ids.push(outcome.entry.id);
        }
        const rows = yield* orbit.timeEntries(
          { start: unsafeLocalDate('2026-10-12'), endExclusive: unsafeLocalDate('2026-10-14') },
          { taskId: booking.task.taskId },
        );
        const returnedIds = rows.map((entry) => entry.id);
        expect(returnedIds).toContain(ids[0]);
        expect(returnedIds).toContain(ids[1]);
        expect(returnedIds).not.toContain(ids[2]);
        expect(rows.every((entry) => entry.date === '2026-10-12' || entry.date === '2026-10-13')).toBe(true);
        expect(rows.every((entry) => entry.label.includes('/ Development'))).toBe(true);
      }).pipe(Effect.provide(demoLayer())),
    ));
});
