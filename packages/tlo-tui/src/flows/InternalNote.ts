import * as Effect from 'effect/Effect';
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
    return { _tag: 'Unknown', reason: 'Notities konden niet worden herlezen.', attempt } satisfies NoteOutcome;
  }

  const before = new Set(attempt.before);

  const expected = normalizeText(note);

  const added = comments.value.filter((comment) => !before.has(comment.commentId));

  const matching = added.filter((comment) => normalizeText(comment.content ?? '').includes(expected));

  const [only] = matching;

  if (matching.length !== 1 || only === undefined) {
    if (added.length === 0 && attempt.delivery === 'rejected') {
      return {
        _tag: 'Rejected',
        reason: `${attempt.message} Readback: geen nieuwe notitie.`,
        attempt,
      } satisfies NoteOutcome;
    }

    return {
      _tag: 'Unknown',
      reason:
        matching.length === 0 ? 'Geen nieuwe notitie met deze tekst gevonden.' : 'Meerdere nieuwe notities passen.',
      attempt,
    } satisfies NoteOutcome;
  }

  const problems: Array<string> = [];

  if (!only.isInternal) {
    problems.push('Notitie is NIET intern: mogelijk zichtbaar voor de klant.');
  }

  if ((only.loggedMinutes ?? 0) !== 0) {
    problems.push(`Notitie heeft ${only.loggedMinutes} gelogde minuten (verwacht 0).`);
  }

  const ticket = yield* orbit.ticketDetail(ticketId).pipe(Effect.option);

  if (Opt.isNone(ticket)) {
    problems.push('Tickethoofd kon niet worden herlezen (status/toewijzing onbevestigd).');
  } else {
    if (ticket.value.state !== attempt.ticketBefore.state) {
      problems.push(`Ticketstatus veranderd: ${attempt.ticketBefore.state} → ${ticket.value.state}.`);
    }

    if ((ticket.value.assignee ?? null) !== (attempt.ticketBefore.assignee ?? null)) {
      problems.push(`Toewijzing veranderd: ${attempt.ticketBefore.assignee ?? '—'} → ${ticket.value.assignee ?? '—'}.`);
    }
  }

  return (
    problems.length === 0
      ? { _tag: 'Verified', comment: only, attempt }
      : { _tag: 'Mismatch', comment: only, problems, attempt }
  ) satisfies NoteOutcome;
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

  if (result._tag === 'Success') {
    return yield* readbackNote(ticketId, note, {
      arguments: args,
      delivery: 'acknowledged',
      message: result.success,
      before,
      ticketBefore,
    });
  }

  const { failure } = result;

  const notSent =
    failure._tag === 'OrbitNotAllowed' || (failure._tag === 'McpCallError' && failure.delivery === 'not-sent');

  const attempt: NoteAttempt = {
    arguments: args,
    delivery: failure._tag === 'McpCallError' && !notSent ? 'unknown' : 'rejected',
    message:
      failure._tag === 'OrbitNotAllowed'
        ? failure.reason
        : failure._tag === 'OrbitUnreadable'
          ? failure.raw
          : failure.message,
    before,
    ticketBefore,
  };

  if (notSent) {
    return { _tag: 'Rejected', reason: `Niet verstuurd: ${attempt.message}`, attempt } satisfies NoteOutcome;
  }

  return yield* readbackNote(ticketId, note, attempt);
});
