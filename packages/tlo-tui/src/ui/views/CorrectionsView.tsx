import { useEffect, useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes, type KeyEvent } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { billableLabel } from '../../domain/billable.js';
import type { TimeEntryId } from '../../domain/ids.js';
import { formatDuration } from '../../domain/time.js';
import {
  APPROVAL_NOTE,
  type ChangeRequest,
  type CorrectionEdit,
  type DraftResult,
  correctionEditFrom,
  draftCorrection,
  draftDeletion,
} from '../../flows/ChangeRequest.js';
import type { TimeEntryDetail } from '../../orbit/parse.js';
import { Async, Field, Hint, JsonBlock, Muted, Panel, failureMessage } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';

type EditField = 'date' | 'start' | 'duration' | 'description' | 'billable' | 'taskId';

const FIELDS: ReadonlyArray<{ readonly id: EditField; readonly label: string }> = [
  { id: 'date', label: 'Datum' },
  { id: 'start', label: 'Starttijd' },
  { id: 'duration', label: 'Duur' },
  { id: 'description', label: 'Omschrijving' },
  { id: 'billable', label: 'Billable' },
  { id: 'taskId', label: 'Taak (PT…)' },
];

export function ApprovalBanner({ title, color }: { readonly title: string; readonly color: string }) {
  return (
    <box border borderStyle="double" borderColor={color} paddingLeft={1} flexDirection="column">
      <text fg={color} attributes={TextAttributes.BOLD}>
        {title}
      </text>

      <text fg={theme.text}>{APPROVAL_NOTE}</text>
    </box>
  );
}

export function RequestView(props: {
  readonly request: ChangeRequest;
  readonly saved: AsyncResult.AsyncResult<string, unknown>;
}) {
  const { request, saved } = props;

  return (
    <box flexDirection="column">
      {request.summary.map((line) => (
        <text key={line} fg={theme.text}>{`• ${line}`}</text>
      ))}

      <JsonBlock title={`${request.tool} (niet uitgevoerd)`} value={request.arguments} color={theme.yellow} />

      {request.sideEffects.map((line) => (
        <text key={line} fg={theme.orange}>{`⚠ ${line}`}</text>
      ))}

      <Muted>Readback na uitvoering:</Muted>

      {request.readback.map((line) => (
        <Muted key={line}>{`  ↺ ${line}`}</Muted>
      ))}

      {saved.waiting ? <Muted>Opslaan…</Muted> : undefined}

      {AsyncResult.isSuccess(saved) ? (
        <text fg={theme.green}>{`✓ concept opgeslagen: ${saved.value}`}</text>
      ) : undefined}

      {AsyncResult.isFailure(saved) ? <text fg={theme.red}>{`✗ ${failureMessage(saved.cause)}`}</text> : undefined}
    </box>
  );
}

function CorrectionEditor(props: { readonly entry: TimeEntryDetail }) {
  const atoms = useAtoms();

  const { entry } = props;

  const [editing, setEditing] = Hooks.useAtom(atoms.editing);

  const [saved, save] = Hooks.useAtom(atoms.saveRequest);

  const [edit, setEdit] = useState<CorrectionEdit>(() => correctionEditFrom(entry));

  const [field, setField] = useState<EditField>('start');

  const [mode, setMode] = useState<'update' | 'delete'>('update');

  const [draft, setDraft] = useState<DraftResult | undefined>(undefined);

  useEffect(() => {
    save(Atom.Reset);
  }, [save]);

  useEffect(() => {
    setEditing(draft === undefined && mode === 'update' && field !== 'billable');
  }, [draft, mode, field, setEditing]);

  function moveField(step: number) {
    const position = FIELDS.findIndex(({ id }) => id === field);

    setField(FIELDS[(position + step + FIELDS.length) % FIELDS.length]?.id ?? 'start');
  }

  function reviewKey(key: KeyEvent, draft: DraftResult) {
    if (key.name === 'escape' || key.name === 'e') {
      setDraft(undefined);

      save(Atom.Reset);
    } else if (key.name === 's' && P.isTagged(draft, 'Ready') && !saved.waiting && !AsyncResult.isSuccess(saved)) {
      save(draft.request);
    }
  }

  function editKey(key: KeyEvent) {
    if (key.ctrl && key.name === 's') {
      setEditing(false);

      setDraft(mode === 'delete' ? draftDeletion(entry) : draftCorrection(entry, edit));

      return;
    }

    if (key.name === 'tab') {
      moveField(key.shift ? -1 : 1);

      return;
    }

    if (editing) {
      return;
    }

    Match.value(key.name).pipe(
      Match.when('x', () => setMode(mode === 'delete' ? 'update' : 'delete')),
      Match.when(Match.is('b', 'n'), () => {
        if (field === 'billable') {
          setEdit({ ...edit, billable: key.name === 'b' ? 'billable' : 'non-billable' });
        }
      }),
      Match.when('return', () => {
        if (field !== 'billable') {
          setEditing(true);
        }
      }),
      Match.orElse(() => {}),
    );
  }

  useKeyboard((key) => {
    if (draft === undefined) {
      editKey(key);
    } else {
      reviewKey(key, draft);
    }
  });

  function input(id: Exclude<EditField, 'billable'>) {
    return (
      <input
        flexGrow={1}
        value={edit[id]}
        focused={editing && field === id && draft === undefined && mode === 'update'}
        onInput={(value: string) => setEdit({ ...edit, [id]: value })}
        onSubmit={() => moveField(1)}
        backgroundColor={field === id ? theme.raised : undefined}
        focusedBackgroundColor={theme.raised}
      />
    );
  }

  return (
    <box flexDirection="row" flexGrow={1} gap={1}>
      <Panel title={`Huidig · ${entry.id}`} width="34%">
        <text fg={theme.text}>{`${entry.date} ${entry.start} · ${formatDuration(entry.durationMinutes)}`}</text>

        <text fg={theme.muted}>{entry.projectLabel}</text>

        <text fg={theme.text}>{entry.taskName}</text>

        <text fg={theme.muted}>{entry.description === '' ? '—' : entry.description}</text>

        <text fg={theme.yellow}>
          {`billable: ${Opt.match(entry.billable, { onNone: () => 'onleesbaar', onSome: ({ raw }) => raw })}`}
        </text>

        <text fg={entry.editable ? theme.green : theme.red}>{`locks: ${entry.locks}`}</text>
      </Panel>

      <Panel
        title={mode === 'delete' ? 'Verwijderen · DeleteTimeEntry (concept)' : 'Correctie · UpdateTimeEntry (concept)'}
        flexGrow={1}
        borderColor={mode === 'delete' ? theme.red : theme.yellow}>
        {draft === undefined ? (
          mode === 'delete' ? (
            <box flexDirection="column">
              <text fg={theme.red}>
                Verwijderverzoek voor deze entry. Ctrl+S maakt het concept; x terug naar wijzigen.
              </text>

              <Muted>
                Vervanging: eerst nieuwe boeking maken en verifiëren (tab 3), daarna pas dit verzoek laten uitvoeren.
              </Muted>
            </box>
          ) : (
            <box flexDirection="column">
              {FIELDS.map(({ id, label }) => (
                <Field key={id} label={label} active={field === id}>
                  {id === 'billable' ? (
                    <text fg={edit.billable === 'billable' ? theme.green : theme.yellow}>
                      {edit.billable === undefined
                        ? 'onbekend — b/n'
                        : `${billableLabel(edit.billable)} (string 'true'/'false')`}
                    </text>
                  ) : (
                    input(id)
                  )}
                </Field>
              ))}
            </box>
          )
        ) : P.isTagged(draft, 'Invalid') ? (
          <box flexDirection="column">
            {draft.issues.map((issue) => (
              <text key={issue} fg={theme.red}>{`• ${issue}`}</text>
            ))}

            <Muted>e = terug</Muted>
          </box>
        ) : (
          <RequestView request={draft.request} saved={saved} />
        )}
      </Panel>
    </box>
  );
}

function Loader({ id }: { readonly id: TimeEntryId }) {
  const atoms = useAtoms();

  const detail = Hooks.useAtomValue(atoms.entryDetail(id));

  return (
    <Async result={detail} loading="GetTimeEntry…">
      {(entry) => <CorrectionEditor key={entry.id} entry={entry} />}
    </Async>
  );
}

export function CorrectionsView() {
  const atoms = useAtoms();

  const target = Hooks.useAtomValue(atoms.correctionTarget);

  const setTab = Hooks.useAtomSet(atoms.tab);

  useKeyboard((key) => {
    if (Opt.isNone(target) && key.name === 'w') {
      setTab('week');
    }
  });

  return (
    <box flexDirection="column" flexGrow={1} gap={0}>
      <ApprovalBanner
        title="APPROVAL-ONLY · correcties en verwijderingen worden niet uitgevoerd"
        color={theme.yellow}
      />

      {Opt.match(target, {
        onNone: () => <Muted>Kies in tab 1 (Week) een entry en druk c. (w = naar Week)</Muted>,
        onSome: (id) => <Loader id={id} />,
      })}

      <box flexDirection="row" height={1}>
        <Hint keys="Tab" label="veld" />

        <Hint keys="b/n" label="billable" />

        <Hint keys="x" label="wijzigen ↔ verwijderen" />

        <Hint keys="Ctrl+S" label="concept maken" />

        <Hint keys="s" label="concept opslaan" />

        <Hint keys="e" label="terug" />
      </box>
    </box>
  );
}
