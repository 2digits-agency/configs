import { useEffect, useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes, type KeyEvent } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { billableLabel } from '../../domain/billable.js';
import { formatDuration, parseLocalDate, startOfWeek } from '../../domain/time.js';
import {
  type BookingField,
  type BookingOutcome,
  type ValidBooking,
  assessBooking,
  bookingPayload,
  validateDraft,
} from '../../flows/Booking.js';
import { Async, Field, Hint, JsonBlock, Line, Muted, Panel, failureMessage } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';

const FIELDS: ReadonlyArray<{ readonly id: BookingField; readonly label: string; readonly input: boolean }> = [
  { id: 'task', label: 'Taak', input: false },
  { id: 'date', label: 'Datum', input: true },
  { id: 'start', label: 'Starttijd', input: true },
  { id: 'duration', label: 'Duur', input: true },
  { id: 'billable', label: 'Billable', input: false },
  { id: 'description', label: 'Omschrijving', input: true },
];

type Stage = 'edit' | 'review' | 'result';

function successfulOutcome(result: AsyncResult.AsyncResult<BookingOutcome, unknown>) {
  return AsyncResult.isSuccess(result) ? Opt.some(result.value) : Opt.none();
}

function Outcome(props: { readonly outcome: BookingOutcome }) {
  const { outcome } = props;

  return Match.value(outcome).pipe(
    Match.tagsExhaustive({
      Verified: ({ entry }) => (
        <box flexDirection="column">
          <text fg={theme.green} attributes={TextAttributes.BOLD}>
            ✓ GEVERIFIEERD — readback komt overeen
          </text>

          <Line>{`${entry.id} · ${entry.date} ${entry.start} · ${formatDuration(entry.durationMinutes)} · ${entry.taskName}`}</Line>

          <Muted>
            {`billable: ${Opt.match(entry.billable, { onNone: () => 'onleesbaar', onSome: (value) => value.raw })}`}
          </Muted>
        </box>
      ),
      Mismatch: ({ diffs, entry }) => (
        <box flexDirection="column">
          <text fg={theme.red} attributes={TextAttributes.BOLD}>
            ✗ AFWIJKING — Orbit bewaarde iets anders dan gevraagd
          </text>

          {diffs.map((diff) => (
            <text key={diff.field} fg={diff.field === 'billable' ? theme.red : theme.yellow}>
              {`${diff.field}: gevraagd ${diff.expected} · gelezen ${diff.actual}`}
            </text>
          ))}

          <Muted>{`Entry ${entry.id} bestaat. Niet automatisch hersteld: corrigeer via tab 5 (concept + approval).`}</Muted>
        </box>
      ),
      Unknown: ({ reason, attempt, candidates }) => (
        <box flexDirection="column">
          <text fg={theme.orange} attributes={TextAttributes.BOLD}>
            ? UITKOMST ONBEKEND — niet opnieuw verstuurd
          </text>

          <Line>{reason}</Line>

          <Muted>{`Verzending: ${attempt.delivery} · ${attempt.message}`}</Muted>

          {candidates.map((entry) => (
            <Muted
              key={
                entry.id
              }>{`kandidaat ${entry.id} ${entry.start} ${formatDuration(entry.durationMinutes)} ${entry.label}`}</Muted>
          ))}

          <Muted>Druk r om te herlezen. Verstuur pas opnieuw na herlezen én een nieuwe review.</Muted>
        </box>
      ),
      Rejected: ({ reason }) => (
        <box flexDirection="column">
          <text fg={theme.red} attributes={TextAttributes.BOLD}>
            ✗ GEWEIGERD — niets aangemaakt
          </text>

          <Line>{reason}</Line>
        </box>
      ),
    }),
  );
}

export function BookingView() {
  const atoms = useAtoms();

  const [draft, setDraft] = Hooks.useAtom(atoms.bookingDraft);

  const [editing, setEditing] = Hooks.useAtom(atoms.editing);

  const info = Hooks.useAtomValue(atoms.info);

  const week = Hooks.useAtomValue(atoms.week);

  const refreshWeek = Hooks.useAtomRefresh(atoms.week);

  const setSelectedDate = Hooks.useAtomSet(atoms.selectedDate);

  const setTab = Hooks.useAtomSet(atoms.tab);

  const setSearch = Hooks.useAtomSet(atoms.searchRequest);

  const [submitResult, submit] = Hooks.useAtom(atoms.submitBooking);

  const [rereadResult, reread] = Hooks.useAtom(atoms.rereadBooking);

  const [field, setField] = useState<BookingField>(Opt.isNone(draft.task) ? 'task' : 'start');

  const [stage, setStage] = useState<Stage>('edit');

  const [acceptDuplicate, setAcceptDuplicate] = useState(false);

  const [submitted, setSubmitted] = useState<ValidBooking | undefined>(undefined);

  const { valid, issues } = validateDraft(draft);

  const loadedWeek =
    AsyncResult.isSuccess(week) && Opt.isSome(valid) && startOfWeek(week.value.weekOf) === startOfWeek(valid.value.date)
      ? Opt.some(week.value)
      : Opt.none();

  const assessment = valid.pipe(Opt.map((booking) => assessBooking(booking, loadedWeek, atoms.today)));

  const writesEnabled =
    AsyncResult.isSuccess(info) &&
    info.value.writeMode === 'direct-writes' &&
    info.value.callable.has('CreateTimeEntry');

  const outcome = successfulOutcome(rereadResult).pipe(Opt.orElse(() => successfulOutcome(submitResult)));

  useEffect(() => {
    if (AsyncResult.isSuccess(submitResult) || AsyncResult.isSuccess(rereadResult)) {
      refreshWeek();
    }
  }, [submitResult, rereadResult, refreshWeek]);

  const current = FIELDS.find(({ id }) => id === field);

  useEffect(() => {
    if (stage === 'edit') {
      setEditing(current?.input ?? false);
    }
  }, [stage, current, setEditing]);

  function moveField(step: number) {
    const position = FIELDS.findIndex(({ id }) => id === field);

    const next = FIELDS[(position + step + FIELDS.length) % FIELDS.length];

    if (next !== undefined) {
      setField(next.id);
    }
  }

  function reset() {
    submit(Atom.Reset);

    reread(Atom.Reset);

    setDraft((previous) => ({ ...previous, start: '', duration: '', description: '', billable: undefined }));

    setAcceptDuplicate(false);

    setSubmitted(undefined);

    setStage('edit');

    setField('start');
  }

  function editKey(key: KeyEvent) {
    if (key.name === 'tab') {
      moveField(key.shift ? -1 : 1);

      return;
    }

    if (key.ctrl && key.name === 's') {
      setEditing(false);

      setStage('review');

      return;
    }

    if (editing) {
      return;
    }

    Match.value(key.name).pipe(
      Match.when(Match.is('down', 'j'), () => moveField(1)),
      Match.when(Match.is('up', 'k'), () => moveField(-1)),
      Match.when('return', () => {
        if (field === 'task') {
          setSearch(Opt.some({ source: 'my-tasks', text: '', projectId: undefined }));

          setTab('search');
        } else if (current?.input === true) {
          setEditing(true);
        }
      }),
      Match.when(Match.is('b', 'n', 'space'), () => {
        if (field !== 'billable') {
          return;
        }

        const next =
          key.name === 'b' || (key.name === 'space' && draft.billable !== 'billable') ? 'billable' : 'non-billable';

        setDraft((previous) => ({ ...previous, billable: next }));
      }),
      Match.orElse(() => {}),
    );
  }

  function reviewKey(key: KeyEvent) {
    if (key.name === 'escape' || key.name === 'e') {
      setStage('edit');
    } else if (key.name === 'd') {
      setAcceptDuplicate(!acceptDuplicate);
    } else if (
      writesEnabled &&
      key.name === 'y' &&
      Opt.isSome(valid) &&
      Opt.isSome(assessment) &&
      assessment.value.blockers.length === 0
    ) {
      setSubmitted(valid.value);

      submit({ booking: valid.value, acceptDuplicate, today: atoms.today });

      setStage('result');
    }
  }

  function resultKey(key: KeyEvent) {
    if (submitted !== undefined && !submitResult.waiting && key.name === 'r' && Opt.isSome(outcome)) {
      reread({ booking: submitted, attempt: outcome.value.attempt });
    } else if (!submitResult.waiting && key.name === 'n') {
      reset();
    } else if (key.name === 'w') {
      setSelectedDate(submitted?.date ?? Opt.getOrElse(parseLocalDate(draft.date), () => atoms.today));

      setTab('week');
    } else if (key.name === 'e' && AsyncResult.isFailure(submitResult)) {
      submit(Atom.Reset);

      setStage('review');
    }
  }

  useKeyboard((key) => {
    Match.value(stage).pipe(
      Match.when('edit', () => editKey(key)),
      Match.when('review', () => reviewKey(key)),
      Match.when('result', () => resultKey(key)),
      Match.exhaustive,
    );
  });

  function set(key: 'date' | 'start' | 'duration' | 'description') {
    return (value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function issueFor(id: BookingField) {
    return issues.find((issue) => issue.field === id);
  }

  function input(id: 'date' | 'start' | 'duration' | 'description', placeholder: string) {
    return (
      <input
        flexGrow={1}
        value={draft[id]}
        placeholder={placeholder}
        focused={stage === 'edit' && editing && field === id}
        onInput={set(id)}
        onSubmit={() => moveField(1)}
        textColor={theme.text}
        backgroundColor={field === id ? theme.raised : undefined}
        focusedBackgroundColor={theme.raised}
      />
    );
  }

  const form = (
    <Panel
      title="Uren boeken · CreateTimeEntry"
      flexGrow={1}
      borderColor={stage === 'edit' ? theme.focus : theme.border}>
      <Field label="Taak" active={field === 'task'} invalid={issueFor('task') !== undefined} hint="Enter = zoeken">
        <text fg={Opt.isSome(draft.task) ? theme.text : theme.dim} wrapMode="none">
          {Opt.match(draft.task, {
            onNone: () => '— geen taak gekozen —',
            onSome: (task) => `${task.label}  ${task.taskId}`,
          })}
        </text>
      </Field>

      <Field label="Datum" active={field === 'date'} invalid={issueFor('date') !== undefined} hint="yyyy-MM-dd">
        {input('date', 'yyyy-MM-dd')}
      </Field>

      <Field label="Starttijd" active={field === 'start'} invalid={issueFor('start') !== undefined} hint="verplicht">
        {input('start', 'HH:mm — geen standaard')}
      </Field>

      <Field label="Duur" active={field === 'duration'} invalid={issueFor('duration') !== undefined} hint="1h30 · 90">
        {input('duration', '1h30')}
      </Field>

      <Field label="Billable" active={field === 'billable'} invalid={issueFor('billable') !== undefined} hint="b / n">
        <text
          fg={draft.billable === undefined ? theme.red : draft.billable === 'billable' ? theme.green : theme.yellow}
          attributes={TextAttributes.BOLD}>
          {draft.billable === undefined ? 'kies b of n' : billableLabel(draft.billable)}
        </text>
      </Field>

      <Field label="Omschrijving" active={field === 'description'}>
        {input('description', 'optioneel')}
      </Field>

      <box height={1} />

      {issues.map((issue) => (
        <text key={`${issue.field}-${issue.message}`} fg={theme.red}>{`• ${issue.message}`}</text>
      ))}

      {Opt.match(assessment, {
        onNone: () => undefined,
        onSome: (value) => (
          <box flexDirection="column">
            {value.blockers.map((issue) => (
              <text key={issue.message} fg={theme.red}>{`⛔ ${issue.message}`}</text>
            ))}

            {value.warnings.map((warning) => (
              <text key={warning.message} fg={warning.code === 'duplicate' ? theme.red : theme.yellow}>
                {`⚠ ${warning.message}`}
              </text>
            ))}
          </box>
        ),
      })}
    </Panel>
  );

  const review = Opt.match(valid, {
    onNone: () => (
      <Panel title="Review" flexGrow={1} borderColor={theme.red}>
        <text fg={theme.red}>Formulier is nog niet geldig; Esc terug.</text>
      </Panel>
    ),
    onSome: (booking) => {
      const blocked = Opt.exists(assessment, (value) => value.blockers.length > 0);

      const duplicate = Opt.exists(assessment, (value) => value.warnings.some(({ code }) => code === 'duplicate'));

      return (
        <Panel title="Review · exact wat verstuurd wordt" flexGrow={1} borderColor={theme.magenta}>
          <JsonBlock title="CreateTimeEntry" value={bookingPayload(booking)} />

          <Muted>
            {`Klok "${booking.start}" gaat ongeconverteerd mee; de bron-tijdzone van Orbit is onbewezen. billable is een boolean in deze aanroep.`}
          </Muted>

          <Muted>Eén poging, geen automatische retry. Daarna verplichte readback via GetTimeEntry.</Muted>

          {duplicate ? (
            <text fg={acceptDuplicate ? theme.yellow : theme.red}>
              {acceptDuplicate
                ? '☑ dubbele boeking bewust geaccepteerd (d)'
                : '☐ mogelijk dubbel — druk d om bewust te accepteren'}
            </text>
          ) : undefined}

          <box height={1} />

          {writesEnabled ? (
            blocked ? (
              <text fg={theme.red}>Geblokkeerd; e om aan te passen.</text>
            ) : (
              <text fg={theme.green} attributes={TextAttributes.BOLD}>
                y = versturen · e/Esc = terug
              </text>
            )
          ) : (
            <text fg={theme.cyan}>Writes staan uit (read-only of tool niet beschikbaar). Alleen review.</text>
          )}
        </Panel>
      );
    },
  });

  const result = (
    <Panel title="Readback" flexGrow={1} borderColor={theme.border}>
      {submitResult.waiting ? (
        <Muted>Versturen… één poging, daarna readback (geen retry).</Muted>
      ) : AsyncResult.isFailure(submitResult) ? (
        <box flexDirection="column">
          <text fg={theme.red}>{`✗ ${failureMessage(submitResult.cause)}`}</text>

          <Muted>Er is niets verstuurd als de controle vóór verzenden faalde. e = terug naar review.</Muted>
        </box>
      ) : (
        Opt.match(outcome, {
          onNone: () => <Muted>Nog geen resultaat.</Muted>,
          onSome: (value) => (
            <box flexDirection="column">
              <Outcome outcome={value} />

              {rereadResult.waiting ? <Muted>Herlezen…</Muted> : undefined}

              {AsyncResult.isFailure(rereadResult) ? (
                <text fg={theme.red}>{`Herlezen mislukt: ${failureMessage(rereadResult.cause)}`}</text>
              ) : undefined}

              <box height={1} />

              <JsonBlock title="verstuurde argumenten" value={value.attempt.arguments} color={theme.dim} />
            </box>
          ),
        })
      )}
    </Panel>
  );

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="row" flexGrow={1} gap={1}>
        {form}

        {stage === 'review' ? review : undefined}

        {stage === 'result' ? result : undefined}
      </box>

      <Async result={week} loading="">
        {(value) => (
          <Muted>{`Weekcontext: ${value.weekOf} (${value.entries.length} entries) · dubbel/lock-check gebruikt de verse week bij versturen`}</Muted>
        )}
      </Async>

      <box flexDirection="row" height={1}>
        {Match.value(stage).pipe(
          Match.when('edit', () => (
            <>
              <Hint keys="Tab" label="veld" />

              <Hint keys="Enter" label="bewerk/volgende" />

              <Hint keys="b/n" label="billable" />

              <Hint keys="Ctrl+S" label="review" />
            </>
          )),
          Match.when('review', () => (
            <>
              <Hint keys="y" label="versturen" />

              <Hint keys="d" label="dubbel accepteren" />

              <Hint keys="e" label="aanpassen" />
            </>
          )),
          Match.when('result', () => (
            <>
              <Hint keys="r" label="herlees (read-only)" />

              <Hint keys="n" label="nieuwe boeking" />

              <Hint keys="w" label="naar week" />
            </>
          )),
          Match.exhaustive,
        )}
      </box>
    </box>
  );
}
