import { homedir } from 'node:os';

import * as Context from 'effect/Context';
import * as Data from 'effect/Data';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';

import { type BillableChoice, billableLabel, toUpdateBillable } from '../domain/billable.js';
import { parseTaskId } from '../domain/ids.js';
import {
  clockMinutes,
  endsAfterMidnight,
  formatDuration,
  parseClockTime,
  parseDuration,
  parseLocalDate,
} from '../domain/time.js';
import type { DataSource } from '../orbit/Orbit.js';
import type { TicketDetail, TimeEntryDetail } from '../orbit/parse.js';

/**
 * A reviewable, unexecuted request for an approval-only Orbit call. The gateway does not enforce Executor policy, so
 * the TUI never runs these itself; they go through Executor with per-call approval of these exact arguments.
 */
export interface ChangeRequest {
  readonly kind: 'correction' | 'deletion' | 'customer-reply';
  readonly tool: 'UpdateTimeEntry' | 'DeleteTimeEntry' | 'ReplyToTicket';
  readonly arguments: Schema.JsonObject;
  readonly summary: ReadonlyArray<string>;
  readonly sideEffects: ReadonlyArray<string>;
  readonly readback: ReadonlyArray<string>;
  readonly before: Schema.JsonObject;
}

export const APPROVAL_NOTE =
  'Concept, NIET uitgevoerd. Laat dit via Executor uitvoeren met browser-approval voor precies deze aanroep en ' +
  'argumenten. De TUI voert geen correcties, verwijderingen of klantcommunicatie uit: de gateway handhaaft geen ' +
  'Executor-policy en de approvalketen (approvalUrl → requestId → resume) is in deze route niet bewezen.';

export type DraftResult =
  | { readonly _tag: 'Ready'; readonly request: ChangeRequest }
  | { readonly _tag: 'Invalid'; readonly issues: ReadonlyArray<string> };

export const DraftResult = Data.taggedEnum<DraftResult>();

// Retain explicit JSON nulls in persisted snapshots of Orbit's nullable fields.
const JSON_NULL = Opt.getOrThrow(Schema.decodeOption(Schema.fromJsonString(Schema.Null))('null'));

export interface CorrectionEdit {
  readonly date: string;
  readonly start: string;
  readonly duration: string;
  readonly description: string;
  readonly billable: BillableChoice | undefined;
  readonly taskId: string;
}

export function correctionEditFrom(entry: TimeEntryDetail): CorrectionEdit {
  return {
    date: entry.date,
    start: entry.start,
    duration: formatDuration(entry.durationMinutes),
    description: entry.description,
    billable: Opt.match(entry.billable, {
      onNone: () => undefined,
      onSome: (value) => (value.billable ? 'billable' : 'non-billable'),
    }),
    taskId: Opt.getOrElse(entry.taskId, () => ''),
  };
}

function snapshot(entry: TimeEntryDetail): Schema.JsonObject {
  return {
    entryId: entry.id,
    date: `${entry.date} ${entry.start}`,
    durationMinutes: entry.durationMinutes,
    task: `${entry.projectLabel} / ${entry.taskName}`,
    taskId: Opt.getOrElse(entry.taskId, () => ''),
    billable: Opt.match(entry.billable, { onNone: () => 'onleesbaar', onSome: ({ raw }) => raw }),
    description: entry.description,
    locks: entry.locks,
  };
}

function validateCorrection(entry: TimeEntryDetail, edit: CorrectionEdit) {
  const issues: Array<string> = [];

  if (!entry.editable) {
    issues.push(`Entry is vergrendeld: ${entry.locks}`);
  }

  const date = parseLocalDate(edit.date);

  const start = parseClockTime(edit.start);

  const duration = parseDuration(edit.duration);

  if (Opt.isNone(date)) {
    issues.push('Datum als yyyy-MM-dd.');
  }

  if (Opt.isNone(start)) {
    issues.push('Starttijd als HH:mm (verplicht bij een correctie).');
  }

  if (Opt.isNone(duration) || duration.value <= 0 || duration.value > 1440) {
    issues.push('Duur tussen 1 en 1440 minuten.');
  } else if (Opt.isSome(start) && endsAfterMidnight(start.value, duration.value)) {
    issues.push('Loopt over middernacht.');
  }

  const taskId = edit.taskId.trim() === '' ? Opt.none() : parseTaskId(edit.taskId);

  if (edit.taskId.trim() !== '' && Opt.isNone(taskId)) {
    issues.push('Taak moet een PT-api_id zijn.');
  }

  return { issues, date, start, duration, taskId };
}

/**
 * `UpdateTimeEntry` with only the changed fields. Billable uses the update contract's string form; a date or time
 * change always sends the full `yyyy-MM-dd HH:mm`.
 *
 * @param entry
 * @param edit
 */
export function draftCorrection(entry: TimeEntryDetail, edit: CorrectionEdit): DraftResult {
  const { issues, date, start, duration, taskId } = validateCorrection(entry, edit);

  if (issues.length > 0 || Opt.isNone(date) || Opt.isNone(start) || Opt.isNone(duration)) {
    return DraftResult.Invalid({ issues });
  }

  const changes: Record<string, Schema.Json> = {};

  const summary: Array<string> = [];

  const sideEffects: Array<string> = [];

  if (date.value !== entry.date || start.value !== entry.start) {
    changes.date = `${date.value} ${start.value}`;

    summary.push(`datum/tijd ${entry.date} ${entry.start} → ${date.value} ${start.value}`);

    if (date.value !== entry.date) {
      sideEffects.push('Verplaatst naar een andere dag; controleer locks en weekstatus van beide dagen.');
    }
  }

  if (duration.value !== entry.durationMinutes) {
    changes.durationMinutes = duration.value;

    summary.push(`duur ${formatDuration(entry.durationMinutes)} → ${formatDuration(duration.value)}`);
  }

  if (edit.description.trim() !== entry.description.trim()) {
    changes.description = edit.description.trim();

    summary.push('omschrijving gewijzigd');
  }

  const currentBillable = entry.billable.pipe(Opt.map((value) => value.billable));

  if (edit.billable !== undefined && !currentBillable.pipe(Opt.contains(edit.billable === 'billable'))) {
    changes.billable = toUpdateBillable(edit.billable);

    summary.push(`billable → ${billableLabel(edit.billable)} ('${toUpdateBillable(edit.billable)}' als string)`);

    sideEffects.push(
      'Billable op tickettijd kan door ticketinstellingen worden overschreven; een succesantwoord bewijst niets.',
    );
  }

  if (Opt.isSome(taskId) && !entry.taskId.pipe(Opt.contains(taskId.value))) {
    changes.taskId = taskId.value;

    summary.push(`taak → ${taskId.value}`);

    sideEffects.push('Taakwissel vereist recht TIM.POW.CHG.PRJ en kan budget/facturatie van beide taken raken.');
  }

  if (summary.length === 0) {
    return DraftResult.Invalid({ issues: ['Geen wijzigingen.'] });
  }

  if (clockMinutes(start.value) < 6 * 60) {
    sideEffects.push('Starttijd vóór 06:00: controleer of de klok niet in een andere tijdzone is bedoeld.');
  }

  return DraftResult.Ready({
    request: {
      kind: 'correction',
      tool: 'UpdateTimeEntry',
      arguments: { entryId: entry.id, ...changes },
      summary,
      sideEffects,
      readback: [
        `GetTimeEntry ${entry.id}: datum/tijd, duur, taak, billable en omschrijving vergelijken.`,
        'Bij afwijking stoppen en melden; niet automatisch opnieuw proberen.',
      ],
      before: snapshot(entry),
    },
  });
}

export function draftDeletion(entry: TimeEntryDetail): DraftResult {
  if (!entry.editable) {
    return DraftResult.Invalid({ issues: [`Entry is vergrendeld: ${entry.locks}`] });
  }

  return DraftResult.Ready({
    request: {
      kind: 'deletion',
      tool: 'DeleteTimeEntry',
      arguments: { entryId: entry.id },
      summary: [`verwijder ${entry.date} ${entry.start} ${formatDuration(entry.durationMinutes)} ${entry.taskName}`],
      sideEffects: [
        'Permanent. Bij vervanging eerst de nieuwe boeking verifiëren, daarna pas verwijderen.',
        'Geblokkeerd voor gefactureerde entries, goedgekeurde afwezigheid en FINAL-weken.',
      ],
      readback: [
        `GetTimeEntry ${entry.id} hoort niet meer te bestaan.`,
        'Weekstaat herlezen: precies één boeking voor dit werk over.',
      ],
      before: snapshot(entry),
    },
  });
}

export type FollowUpAction = 'NONE' | 'CLOSE' | 'REMINDER';

export interface ReplyDraft {
  readonly message: string;
  readonly waitForClient: boolean;
  readonly followUpAction: FollowUpAction;
  readonly followUpDate: string;
}

/**
 * `ReplyToTicket` request. No `logMinutes`: Orbit would log them at "now" instead of an explicit start time.
 *
 * @param ticket
 * @param draft
 */
export function draftCustomerReply(ticket: TicketDetail, draft: ReplyDraft): DraftResult {
  const issues: Array<string> = [];

  if (draft.message.trim() === '') {
    issues.push('Bericht is leeg.');
  }

  const followUpDate = parseLocalDate(draft.followUpDate);

  if (draft.followUpAction !== 'NONE' && Opt.isNone(followUpDate)) {
    issues.push(`Follow-up ${draft.followUpAction} vereist een datum (yyyy-MM-dd).`);
  }

  if (issues.length > 0) {
    return DraftResult.Invalid({ issues });
  }

  const sideEffects = [
    `KLANT ZIET DIT: ${ticket.contact ?? 'de melder'} (${ticket.client ?? 'klant'}) krijgt een notificatie.`,
    draft.waitForClient
      ? 'Ticket gaat terug naar de melder: status WAIT met standaard follow-up van de tenant.'
      : `Ticket blijft OPEN bij ${ticket.assignee ?? 'de huidige behandelaar'}.`,
  ];

  if (ticket.state === 'CLOSED') {
    sideEffects.push('Ticket is GESLOTEN: een antwoord heropent het.');
  }

  if (draft.followUpAction !== 'NONE') {
    sideEffects.push(`Follow-up ${draft.followUpAction} op ${draft.followUpDate}.`);
  }

  const args: Record<string, Schema.Json> = {
    ticketId: ticket.ticketId,
    message: draft.message.trim(),
    waitForClient: draft.waitForClient,
    followUpAction: draft.followUpAction,
  };

  if (draft.followUpAction !== 'NONE' && Opt.isSome(followUpDate)) {
    args.followUpDate = followUpDate.value;
  }

  return DraftResult.Ready({
    request: {
      kind: 'customer-reply',
      tool: 'ReplyToTicket',
      arguments: args,
      summary: [`antwoord op #${ticket.number ?? '?'} ${ticket.name}`],
      sideEffects,
      readback: [
        'ListTicketComments: precies één nieuw niet-intern ANSWER met deze tekst.',
        'GetTicketDetail: status, behandelaar en follow-up zoals hierboven.',
      ],
      before: {
        ticketId: ticket.ticketId,
        number: ticket.number ?? JSON_NULL,
        state: ticket.state,
        assignee: ticket.assignee ?? JSON_NULL,
      },
    },
  });
}

const TaggedErrorClass = Schema.TaggedError;

export class ChangeRequestStoreError extends TaggedErrorClass<ChangeRequestStoreError>()('ChangeRequestStoreError', {
  message: Schema.String,
}) {}

export interface ChangeRequestStoreShape {
  readonly directory: string;
  readonly save: (request: ChangeRequest) => Effect.Effect<string, ChangeRequestStoreError>;
}

export class ChangeRequestStore extends Context.Service<ChangeRequestStore, ChangeRequestStoreShape>()(
  '@2digits/tlo-tui/flows/ChangeRequest/ChangeRequestStore',
) {}

const PrettyJson = Schema.fromJsonString(Schema.Json, { space: 2 });

export const DEFAULT_REQUEST_DIRECTORY = `${homedir()}/.config/2digits/tlo-tui/requests`;

// Preserve String's JSON-value coercion for filenames, while making object and array handling explicit.
function subjectText(value: Schema.Json): string {
  if (Array.isArray(value)) {
    return value.map((element: Schema.Json) => (element === null ? '' : subjectText(element))).join(',');
  }

  if (value === null) {
    return 'null';
  }

  return typeof value === 'object' ? '[object Object]' : String(value);
}

/**
 * Writes change requests as private JSON files. They contain business data, so the directory is `0700`.
 *
 * @param options
 * @param options.directory
 * @param options.source
 */
export function makeChangeRequestStoreLayer(options: { readonly directory: string; readonly source: DataSource }) {
  return Layer.effect(
    ChangeRequestStore,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      const path = yield* Path.Path;

      return ChangeRequestStore.of({
        directory: options.directory,
        save: Effect.fn('ChangeRequestStore.save')(
          function* (request) {
            const now = yield* DateTime.now;

            const createdAt = DateTime.formatIso(now);

            const subjectValue = request.arguments.entryId ?? request.arguments.ticketId ?? 'request';

            const subject = subjectText(subjectValue);

            const file = path.join(
              options.directory,
              `${createdAt.replaceAll(/[:.]/g, '-')}-${request.tool}-${subject}.json`,
            );

            yield* fs.makeDirectory(options.directory, { recursive: true, mode: 0o700 });

            const json = yield* Schema.encodeEffect(PrettyJson)({
              status: 'concept-niet-uitgevoerd',
              approval: APPROVAL_NOTE,
              source: options.source,
              createdAt,
              kind: request.kind,
              tool: request.tool,
              arguments: request.arguments,
              summary: [...request.summary],
              sideEffects: [...request.sideEffects],
              readback: [...request.readback],
              before: request.before,
            });

            yield* fs.writeFileString(file, `${json}\n`, { flag: 'wx', mode: 0o600 });

            return file;
          },
          Effect.mapError(() => ChangeRequestStoreError.make({ message: 'Kon het concept niet opslaan.' })),
        ),
      });
    }),
  );
}
