import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import type * as Schema from 'effect/Schema';

import type { TicketId } from '../domain/ids.js';
import { Orbit, internalNoteArguments } from '../orbit/Orbit.js';
import { type TicketComment, type TicketDetail, normalizeText } from '../orbit/parse.js';

export interface NoteAttempt {
  readonly arguments: Schema.JsonObject;
  readonly delivery: 'acknowledged' | 'rejected' | 'unknown';
  readonly message: string;
  readonly before: ReadonlyArray<string>;
  readonly ticketBefore: TicketDetail;
}

export type NoteOutcome =
  | { readonly _tag: 'Verified'; readonly comment: TicketComment; readonly attempt: NoteAttempt }
  | {
      readonly _tag: 'Mismatch';
      readonly comment: TicketComment;
      readonly problems: ReadonlyArray<string>;
      readonly attempt: NoteAttempt;
    }
  | { readonly _tag: 'Unknown'; readonly reason: string; readonly attempt: NoteAttempt }
  | { readonly _tag: 'Rejected'; readonly reason: string; readonly attempt: NoteAttempt };

export const NoteOutcome = Data.taggedEnum<NoteOutcome>();

export function validateNote(note: string): ReadonlyArray<string> {
  return note.trim() === '' ? ['Notitie is leeg.'] : [];
}

/**
 * Reads back the comment thread and ticket header: the note must exist once, be internal, carry no logged minutes, and
 * leave state and assignee untouched.
 *
 * @param ticketId
 * @param note
 * @param attempt
 */
export const readbackNote = Effect.fn('InternalNote.readback')(function* (
  ticketId: TicketId,
  note: string,
  attempt: NoteAttempt,
) {
  const orbit = yield* Orbit;

  const comments = yield* orbit.ticketComments(ticketId, 30).pipe(Effect.option);

  if (Opt.isNone(comments)) {
    return NoteOutcome.Unknown({ reason: 'Notities konden niet worden herlezen.', attempt });
  }

  const before = new Set(attempt.before);

  const expected = normalizeText(note);

  const added = comments.value.filter((comment) => !before.has(comment.commentId));

  const matching = added.filter((comment) => normalizeText(comment.content ?? '').includes(expected));

  const [only] = matching;

  if (only === undefined || matching.length !== 1) {
    const noAddedNotes = added.length === 0;

    if (noAddedNotes && attempt.delivery === 'rejected') {
      return NoteOutcome.Rejected({
        reason: `${attempt.message} Readback: geen nieuwe notitie.`,
        attempt,
      });
    }

    return NoteOutcome.Unknown({
      reason:
        matching.length === 0 ? 'Geen nieuwe notitie met deze tekst gevonden.' : 'Meerdere nieuwe notities passen.',
      attempt,
    });
  }

  const problems: Array<string> = [];

  if (!only.isInternal) {
    problems.push('Notitie is NIET intern: mogelijk zichtbaar voor de klant.');
  }

  if ((only.loggedMinutes ?? 0) !== 0) {
    problems.push(`Notitie heeft ${only.loggedMinutes} gelogde minuten (verwacht 0).`);
  }

  const ticket = yield* orbit.ticketDetail(ticketId).pipe(Effect.option);

  Opt.match(ticket, {
    onNone: () => {
      problems.push('Tickethoofd kon niet worden herlezen (status/toewijzing onbevestigd).');
    },
    onSome: (value) => {
      if (value.state !== attempt.ticketBefore.state) {
        problems.push(`Ticketstatus veranderd: ${attempt.ticketBefore.state} → ${value.state}.`);
      }

      if ((value.assignee ?? undefined) !== (attempt.ticketBefore.assignee ?? undefined)) {
        problems.push(`Toewijzing veranderd: ${attempt.ticketBefore.assignee ?? '—'} → ${value.assignee ?? '—'}.`);
      }
    },
  });

  return problems.length === 0
    ? NoteOutcome.Verified({ comment: only, attempt })
    : NoteOutcome.Mismatch({ comment: only, problems, attempt });
});

/**
 * Sends one simple internal note (no `logMinutes`, no `assignToUser`) and reads back. Never retried.
 *
 * @param ticketId
 * @param note
 */
export const submitNote = Effect.fn('InternalNote.submit')(function* (ticketId: TicketId, note: string) {
  const orbit = yield* Orbit;

  const ticketBefore = yield* orbit.ticketDetail(ticketId);

  const comments = yield* orbit.ticketComments(ticketId, 30);

  const args = internalNoteArguments({ ticketId, note: note.trim() });

  const before = comments.map(({ commentId }) => commentId);

  const result = yield* orbit.addInternalComment({ ticketId, note: note.trim() }).pipe(Effect.result);

  return yield* Match.value(result).pipe(
    Match.tag('Success', ({ success }) =>
      readbackNote(ticketId, note, {
        arguments: args,
        delivery: 'acknowledged',
        message: success,
        before,
        ticketBefore,
      }),
    ),
    Match.tag('Failure', ({ failure }) => {
      const notSent = Match.value(failure).pipe(
        Match.tag('OrbitNotAllowed', () => true),
        Match.tag('McpCallError', (value) => value.delivery === 'not-sent'),
        Match.orElse(() => false),
      );

      const attempt: NoteAttempt = {
        arguments: args,
        delivery: Match.value(failure).pipe(
          Match.tag('McpCallError', () => (notSent ? ('rejected' as const) : ('unknown' as const))),
          Match.orElse(() => 'rejected' as const),
        ),
        message: Match.value(failure).pipe(
          Match.tag('OrbitNotAllowed', (value) => value.reason),
          Match.tag('OrbitUnreadable', (value) => value.raw),
          Match.orElse((value) => value.message),
        ),
        before,
        ticketBefore,
      };

      return notSent
        ? Effect.succeed(NoteOutcome.Rejected({ reason: `Niet verstuurd: ${attempt.message}`, attempt }))
        : readbackNote(ticketId, note, attempt);
    }),
    Match.exhaustive,
  );
});
