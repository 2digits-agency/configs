import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

class DraftError extends Schema.TaggedError<DraftError>()('DraftError', { message: Schema.String }) {}

// UTC here is civil calendar arithmetic, never a conversion of Orbit wall times.
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') {
    return false;
  }

  const date = DateTime.make(`${value}T12:00:00Z`);

  return Opt.isSome(date) && DateTime.formatIsoDateUtc(date.value) === value;
}

export function shiftDate(value: string, days: number): string {
  if (!validDate(value)) {
    throw new Error('Ongeldige kalenderdatum.');
  }

  return DateTime.formatIsoDateUtc(DateTime.add(DateTime.makeUnsafe(`${value}T12:00:00Z`), { days }));
}

export function weekRange(value: string) {
  if (!validDate(value)) {
    throw new Error('Ongeldige kalenderdatum.');
  }

  const weekday = DateTime.getPartUtc(DateTime.makeUnsafe(`${value}T12:00:00Z`), 'weekDay');

  const from = shiftDate(value, -((weekday + 6) % 7));

  return { from, until: shiftDate(from, 7) };
}

export function timeEntryRange(from: string, until: string) {
  if (!validDate(from) || !validDate(until) || from >= until) {
    throw new Error('Lege of ongeldige datumrange.');
  }

  return { dateFrom: from, dateTo: shiftDate(until, -1) };
}

export function ticketRange(from: string, until: string) {
  if (!validDate(from) || !validDate(until) || from >= until) {
    throw new Error('Lege of ongeldige datumrange.');
  }

  return { createdFrom: from, createdTo: until };
}

export function hours(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

export interface Task {
  id: string;
  project: string;
  title: string;
  open: boolean;
  budget: string;
}

export interface Entry {
  id: string;
  taskId: string;
  date: string;
  durationMinutes: number;
  description: string;
  billable: boolean;
  kind: 'logged' | 'planned' | 'absence';
  lock?: string;
}

export interface Ticket {
  id: string;
  number: number;
  title: string;
  client: string;
  status: string;
  priority: string;
  taskId?: string;
  comments: Array<{ note: string; internal: boolean }>;
}

const BookingDraft = Schema.Struct({
  taskId: Schema.String,
  date: Schema.String,
  start: Schema.String,
  minutes: Schema.String,
  description: Schema.String,
  billable: Schema.Literals(['', 'true', 'false']),
});

export type BookingDraft = typeof BookingDraft.Type;

const CivilDate = Schema.String.check(Schema.makeFilter(validDate));

const WallTime = Schema.String.check(Schema.isPattern(/^([01]\d|2[0-3]):[0-5]\d$/));

const WholeMinutes = Schema.String.check(Schema.isPattern(/^\d+$/));

const DurationMinutes = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 1440 }));

const NonEmptyText = Schema.Trim.check(Schema.isNonEmpty());

export interface CreateArguments {
  taskId: string;
  date: string;
  durationMinutes: number;
  description: string;
  billable: boolean;
}

export const bookingArguments = Effect.fn('bookingArguments')(function* (input: unknown, tasks: Array<Task>) {
  const draft = yield* Schema.decodeUnknownEffect(BookingDraft)(input).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Ongeldig boekingsconcept.' })),
  );

  const task = tasks.find((item) => item.id === draft.taskId);

  if (!task?.open) {
    return yield* DraftError.make({
      message: 'Kies een bevestigde, open projecttaak; een ticketnummer is geen taak-ID.',
    });
  }

  yield* Schema.decodeUnknownEffect(CivilDate)(draft.date).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Gebruik een bestaande datum: jjjj-mm-dd.' })),
  );

  yield* Schema.decodeUnknownEffect(WallTime)(draft.start).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Starttijd is verplicht: uu:mm, zonder default.' })),
  );

  yield* Schema.decodeUnknownEffect(WholeMinutes)(draft.minutes).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Duur moet uit gehele minuten bestaan.' })),
  );

  const minutes = yield* Schema.decodeUnknownEffect(DurationMinutes)(Number(draft.minutes)).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Duur moet 1 tot 1440 minuten zijn.' })),
  );

  const [hour, minute] = draft.start.split(':').map(Number);

  if (hour * 60 + minute + minutes > 1440) {
    return yield* DraftError.make({ message: 'Boeking loopt over middernacht. Splits op de datumgrens.' });
  }

  if (draft.billable === '') {
    return yield* DraftError.make({ message: 'Kies declarabel of niet-declarabel expliciet.' });
  }

  const description = yield* Schema.decodeUnknownEffect(NonEmptyText)(draft.description).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Voeg een omschrijving toe.' })),
  );

  return {
    taskId: task.id,
    date: `${draft.date} ${draft.start}`,
    durationMinutes: minutes,
    description,
    billable: draft.billable === 'true',
  };
});

export const correctionArguments = Effect.fn('correctionArguments')(function* (
  entry: Entry,
  draft: BookingDraft,
  tasks: Array<Task>,
) {
  if (entry.lock || entry.kind !== 'logged') {
    return yield* DraftError.make({ message: 'Deze entry is vergrendeld of niet geschreven.' });
  }

  const args = yield* bookingArguments(draft, tasks);

  return { entryId: entry.id, ...args, billable: args.billable ? 'true' : 'false' };
});

export function compareReadback(expected: CreateArguments, actual: CreateArguments): Array<string> {
  const fields: Array<keyof CreateArguments> = ['taskId', 'date', 'durationMinutes', 'billable', 'description'];

  return fields.filter((field) => expected[field] !== actual[field]);
}

export function conflicts(args: CreateArguments, entries: Array<Entry>, exceptId?: string): Array<Entry> {
  const start = Number(args.date.slice(11, 13)) * 60 + Number(args.date.slice(14, 16));

  return entries.filter((entry) => {
    if (entry.id === exceptId || entry.kind !== 'logged' || entry.date.slice(0, 10) !== args.date.slice(0, 10)) {
      return false;
    }

    const otherStart = Number(entry.date.slice(11, 13)) * 60 + Number(entry.date.slice(14, 16));

    return start < otherStart + entry.durationMinutes && otherStart < start + args.durationMinutes;
  });
}

export interface ChangeRequest {
  tool: 'UpdateTimeEntry' | 'DeleteTimeEntry' | 'ReplyToTicket';
  arguments: Record<string, unknown>;
  label: string;
  status: 'Concept — niet verzonden';
}

export const customerReply = Effect.fn('customerReply')(function* (ticket: Ticket, input: unknown) {
  const message = yield* Schema.decodeUnknownEffect(NonEmptyText)(input).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Schrijf eerst een klantantwoord.' })),
  );

  return {
    tool: 'ReplyToTicket',
    arguments: { ticketId: ticket.id, message, followUpAction: 'NONE', waitForClient: true },
    label: `Klantantwoord #${ticket.number} · notificatie + WAIT`,
    status: 'Concept — niet verzonden',
  } satisfies ChangeRequest;
});

export const reviewBooking = Effect.fn('reviewBooking')(function* (
  draft: BookingDraft,
  tasks: Array<Task>,
  entries: Array<Entry>,
  entry?: Entry,
) {
  const args = yield* bookingArguments(draft, tasks);

  const updateArgs = entry ? yield* correctionArguments(entry, draft, tasks) : undefined;

  if (conflicts(args, entries, entry?.id).length > 0) {
    return yield* DraftError.make({ message: 'Overlap met geschreven uren. Controleer eerst de dag.' });
  }

  return { args, updateArgs };
});

export const reviewSupport = Effect.fn('reviewSupport')(function* (
  ticket: Ticket,
  composer: 'internal' | 'customer',
  input: unknown,
) {
  const note = yield* Schema.decodeUnknownEffect(NonEmptyText)(input).pipe(
    Effect.mapError(() => DraftError.make({ message: 'Schrijf eerst een bericht.' })),
  );

  const reply = composer === 'customer' ? yield* customerReply(ticket, note) : undefined;

  return { reply, payload: reply?.arguments ?? { ticketId: ticket.id, note } };
});
