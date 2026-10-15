import { useEffect, useRef, useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes, type TextareaRenderable, type KeyEvent } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { type TicketId, parseTaskId } from '../../domain/ids.js';
import { type NoteOutcome, validateNote } from '../../flows/InternalNote.js';
import { internalNoteArguments } from '../../orbit/Orbit.js';
import { type TicketComment, type TicketDetail, type TicketSummary, normalizeText } from '../../orbit/parse.js';
import { Async, Hint, JsonBlock, Line, Muted, Panel, failureMessage } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';

type Mode = 'browse' | 'compose' | 'review' | 'result';

const STATE_COLOR: Record<string, string> = {
  NEW: theme.cyan,
  OPEN: theme.green,
  WAIT: theme.yellow,
  CLOSED: theme.dim,
  REQCLOSE: theme.muted,
};

function TicketRow({ ticket, active }: { readonly ticket: TicketSummary; readonly active: boolean }) {
  const sla = ticket.slaMinutesRemaining;

  return (
    <box flexDirection="row" height={1} backgroundColor={active ? theme.raised : undefined}>
      <text fg={active ? theme.focus : theme.dim}>{active ? '▸' : ' '}</text>

      <text fg={STATE_COLOR[ticket.state] ?? theme.text} width={7}>{` ${ticket.state}`}</text>

      <text fg={ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? theme.red : theme.muted} width={9}>
        {ticket.priority ?? ''}
      </text>

      <text fg={theme.cyan} width={7}>{`#${ticket.number ?? '?'}`}</text>

      <text fg={theme.text} flexGrow={1} wrapMode="none">
        {ticket.name}

        <span fg={theme.muted}>{`  ${ticket.client ?? ''}`}</span>

        <span fg={sla !== undefined && sla !== null && sla < 0 ? theme.red : theme.dim}>
          {sla === undefined || sla === null ? '' : `  SLA ${sla}m`}
        </span>
      </text>
    </box>
  );
}

function CommentView(props: { readonly comment: TicketComment }) {
  const { comment } = props;

  const content = normalizeText(comment.content ?? '');

  return (
    <box flexDirection="column" paddingBottom={1}>
      <text>
        <span fg={comment.isInternal ? theme.magenta : theme.orange}>
          {comment.isInternal ? '[intern] ' : '[klant ziet dit] '}
        </span>

        <span fg={theme.muted}>{`${comment.date} · ${comment.author ?? 'systeem'} · ${comment.title ?? ''}`}</span>

        <span fg={theme.yellow}>{(comment.loggedMinutes ?? 0) > 0 ? ` · ${comment.loggedMinutes}m gelogd` : ''}</span>
      </text>

      {content === '' ? undefined : <text fg={theme.text}>{content}</text>}
    </box>
  );
}

function Detail(props: { readonly ticket: TicketDetail }) {
  const { ticket } = props;

  const reason = P.isNotNullish(ticket.nonBillableReason) ? ` (${ticket.nonBillableReason})` : '';

  const billable = Match.value(ticket.billable).pipe(
    Match.when(true, () => 'ja'),
    Match.when(false, () => `nee${reason}`),
    Match.orElse(() => '?'),
  );

  return (
    <box flexDirection="column" flexShrink={0}>
      <text fg={theme.text} attributes={TextAttributes.BOLD}>{`#${ticket.number ?? '?'} ${ticket.name}`}</text>

      <text>
        <span fg={STATE_COLOR[ticket.state] ?? theme.text}>{ticket.state}</span>

        <span
          fg={
            theme.muted
          }>{` · ${ticket.priority ?? ''} · ${ticket.client ?? ''} · melder ${ticket.contact ?? '—'} · behandelaar ${ticket.assignee ?? '—'}`}</span>
      </text>

      <text fg={theme.muted}>
        {`Gelogd ${ticket.loggedMinutes ?? 0}m · billable ${billable} · taak ${ticket.taskId ?? 'geen projecttaak gekoppeld'}`}
      </text>
    </box>
  );
}

function NoteOutcomeView(props: { readonly outcome: NoteOutcome }) {
  const { outcome } = props;

  return Match.value(outcome).pipe(
    Match.tagsExhaustive({
      Verified: ({ comment }) => (
        <text fg={theme.green} attributes={TextAttributes.BOLD}>
          {`✓ GEVERIFIEERD — interne notitie ${comment.commentId}, 0 minuten, status/toewijzing ongewijzigd`}
        </text>
      ),
      Mismatch: ({ problems }) => (
        <box flexDirection="column">
          <text fg={theme.red} attributes={TextAttributes.BOLD}>
            ✗ AFWIJKING
          </text>

          {problems.map((problem) => (
            <text key={problem} fg={theme.red}>{`• ${problem}`}</text>
          ))}
        </box>
      ),
      Unknown: ({ reason }) => (
        <box flexDirection="column">
          <text fg={theme.orange} attributes={TextAttributes.BOLD}>
            ? UITKOMST ONBEKEND — niet opnieuw verstuurd
          </text>

          <Line>{reason}</Line>

          <Muted>Controleer de notities (r herleest het ticket) voordat je iets opnieuw plaatst.</Muted>
        </box>
      ),
      Rejected: ({ reason }) => <text fg={theme.red}>{`✗ GEWEIGERD — ${reason}`}</text>,
    }),
  );
}

function TicketPane({ ticketId }: { readonly ticketId: TicketId }) {
  const atoms = useAtoms();

  const detail = Hooks.useAtomValue(atoms.ticketDetail(ticketId));

  const comments = Hooks.useAtomValue(atoms.ticketComments(ticketId));

  return (
    <box flexDirection="column" flexGrow={1} flexBasis={0} minHeight={0}>
      <Async result={detail} loading="GetTicketDetail…">
        {(value) => <Detail ticket={value} />}
      </Async>

      <box height={1} />

      <scrollbox flexGrow={1} flexBasis={0} minHeight={0}>
        <Async result={comments} loading="ListTicketComments…">
          {(value) =>
            value.length === 0 ? (
              <Muted>Geen reacties.</Muted>
            ) : (
              value.map((comment) => <CommentView key={comment.commentId} comment={comment} />)
            )
          }
        </Async>
      </scrollbox>
    </box>
  );
}

export function SupportView() {
  const atoms = useAtoms();

  const [filter, setFilter] = Hooks.useAtom(atoms.ticketFilter);

  const tickets = Hooks.useAtomValue(atoms.tickets);

  const refreshTickets = Hooks.useAtomRefresh(atoms.tickets);

  const [selected, setSelected] = Hooks.useAtom(atoms.selectedTicket);

  const [editing, setEditing] = Hooks.useAtom(atoms.editing);

  const info = Hooks.useAtomValue(atoms.info);

  const setTab = Hooks.useAtomSet(atoms.tab);

  const setDraft = Hooks.useAtomSet(atoms.bookingDraft);

  const setStatus = Hooks.useAtomSet(atoms.status);

  const [noteResult, sendNote] = Hooks.useAtom(atoms.submitNote);

  const [mode, setMode] = useState<Mode>('browse');

  const [note, setNote] = useState('');

  const [query, setQuery] = useState(filter.query);

  const [searching, setSearching] = useState(false);

  const textareaRef = useRef<TextareaRenderable>(null);

  const rows = AsyncResult.isSuccess(tickets) ? tickets.value : [];

  const index = Math.max(
    0,
    rows.findIndex((ticket) => Opt.contains(selected, ticket.ticketId as TicketId)),
  );

  const ticketId = Opt.orElse(selected, () => Opt.map(Opt.fromUndefinedOr(rows[0]), (row) => row.ticketId as TicketId));

  const detailAtom = Opt.match(ticketId, { onNone: () => atoms.noTicketDetail, onSome: atoms.ticketDetail });

  const commentsAtom = Opt.match(ticketId, { onNone: () => atoms.noTicketComments, onSome: atoms.ticketComments });

  const detailValue = Hooks.useAtomValue(detailAtom);

  const refreshComments = Hooks.useAtomRefresh(commentsAtom);

  const refreshDetail = Hooks.useAtomRefresh(detailAtom);

  const writesEnabled =
    AsyncResult.isSuccess(info) &&
    info.value.writeMode === 'direct-writes' &&
    info.value.callable.has('AddInternalComment');

  useEffect(() => {
    if (!AsyncResult.isSuccess(noteResult)) {
      return;
    }

    refreshComments();

    refreshDetail();
  }, [noteResult, refreshComments, refreshDetail]);

  function select(position: number) {
    const row = rows[Math.max(0, Math.min(rows.length - 1, position))];

    if (row !== undefined) {
      setSelected(Opt.some(row.ticketId as TicketId));
    }
  }

  function composeKey(key: KeyEvent) {
    if (key.ctrl && key.name === 's') {
      setNote(textareaRef.current?.plainText ?? note);

      setEditing(false);

      setMode('review');
    } else if (key.name === 'escape') {
      setNote(textareaRef.current?.plainText ?? note);

      setMode('browse');
    }
  }

  function reviewKey(key: KeyEvent) {
    if (key.name === 'e' || key.name === 'escape') {
      key.preventDefault();

      setMode('compose');

      setEditing(true);
    } else if (writesEnabled && key.name === 'y' && Opt.isSome(ticketId) && validateNote(note).length === 0) {
      sendNote({ ticketId: ticketId.value, note });

      setMode('result');
    }
  }

  function resultKey(key: KeyEvent) {
    if (key.name === 'r') {
      refreshComments();

      refreshDetail();
    } else if (key.name === 'n' && !noteResult.waiting) {
      sendNote(Atom.Reset);

      setNote('');

      setMode('browse');
    }
  }

  function browseKey(key: KeyEvent) {
    Match.value(key.name).pipe(
      Match.when(Match.is('up', 'k'), () => select(index - 1)),
      Match.when(Match.is('down', 'j'), () => select(index + 1)),
      Match.when('r', () => {
        refreshTickets();

        refreshComments();
      }),
      Match.when('g', () => {
        setFilter({ ...filter, includeClosed: !filter.includeClosed });
      }),
      Match.when('i', () => {
        if (!Opt.isSome(ticketId)) {
          return;
        }

        key.preventDefault();

        setMode('compose');

        setEditing(true);
      }),
      Match.when('a', () => {
        if (!Opt.isSome(ticketId)) {
          return;
        }

        setSelected(ticketId);

        setTab('reply');
      }),
      Match.when('b', () => {
        if (!AsyncResult.isSuccess(detailValue)) {
          return;
        }

        const task = parseTaskId(detailValue.value.taskId ?? '');

        if (Opt.isSome(task)) {
          setDraft((draft) => ({
            ...draft,
            task: Opt.some({
              taskId: task.value,
              label: `${detailValue.value.project ?? ''} / ${detailValue.value.task ?? ''} (ticket #${detailValue.value.number ?? '?'})`,
              rate: Opt.none(),
            }),
          }));

          setTab('book');
        } else {
          setStatus(
            'Ticket heeft geen projecttaak; tijd op ticket met starttijd is niet bewezen (logMinutes boekt op "nu").',
          );
        }
      }),
      Match.orElse(() => {
        if (key.sequence !== '/') {
          return;
        }

        key.preventDefault();

        setSearching(true);

        setEditing(true);
      }),
    );
  }

  useKeyboard((key) => {
    if (mode === 'compose') {
      composeKey(key);

      return;
    }

    if (editing) {
      return;
    }

    Match.value(mode).pipe(
      Match.when('browse', () => browseKey(key)),
      Match.when('review', () => reviewKey(key)),
      Match.when('result', () => resultKey(key)),
      Match.exhaustive,
    );
  });

  const noteArgs = ticketId.pipe(Opt.map((id) => internalNoteArguments({ ticketId: id, note: note.trim() })));

  function renderTickets() {
    return (
      <box flexDirection="row" flexGrow={1} flexBasis={0} minHeight={0} gap={1}>
        <Panel title={`Tickets · ${filter.includeClosed ? 'alle' : 'actief'}`} width="42%">
          <box flexDirection="row" height={1}>
            <text fg={theme.muted}>{'Filter '}</text>

            <input
              flexGrow={1}
              value={query}
              placeholder="/ nummer of tekst"
              focused={searching && editing}
              onInput={setQuery}
              onSubmit={() => {
                setSearching(false);

                setEditing(false);

                setFilter({ ...filter, query });
              }}
              focusedBackgroundColor={theme.raised}
            />
          </box>

          <Async result={tickets} loading="ListTickets…">
            {(value) =>
              value.length === 0 ? (
                <Muted>Geen tickets binnen dit filter (max 50; standaard zonder gesloten).</Muted>
              ) : (
                <scrollbox flexGrow={1}>
                  {value.map((ticket, position) => (
                    <TicketRow key={ticket.ticketId} ticket={ticket} active={position === index} />
                  ))}
                </scrollbox>
              )
            }
          </Async>
        </Panel>

        <Panel title="Ticket" flexGrow={1}>
          {Opt.isSome(ticketId) ? <TicketPane ticketId={ticketId.value} /> : <Muted>Selecteer een ticket.</Muted>}
        </Panel>
      </box>
    );
  }

  function renderNote() {
    if (mode === 'browse') {
      return;
    }

    return (
      <Panel
        title={mode === 'compose' ? 'Interne notitie · alleen voor agents' : 'Interne notitie · AddInternalComment'}
        borderColor={theme.magenta}
        height={mode === 'result' ? 9 : 12}>
        {Match.value(mode).pipe(
          Match.when('compose', () => (
            <box flexDirection="column" flexGrow={1}>
              <textarea
                ref={textareaRef}
                flexGrow={1}
                initialValue={note}
                placeholder="Interne notitie (niet zichtbaar voor de klant)…"
                focused={editing}
                backgroundColor={theme.raised}
                focusedBackgroundColor={theme.raised}
              />

              <Muted>Zonder logMinutes (zou op "nu" boeken) en zonder toewijzing. Ctrl+S review · Esc annuleer.</Muted>
            </box>
          )),
          Match.when('review', () => (
            <box flexDirection="column">
              {Opt.match(noteArgs, {
                onNone: () => undefined,
                onSome: (value) => <JsonBlock title="AddInternalComment" value={value} />,
              })}

              {validateNote(note).map((issue) => (
                <text key={issue} fg={theme.red}>{`• ${issue}`}</text>
              ))}

              <text fg={writesEnabled ? theme.green : theme.cyan}>
                {writesEnabled
                  ? 'y = plaatsen (één poging + readback) · e = bewerken'
                  : 'Writes staan uit; alleen review.'}
              </text>
            </box>
          )),
          Match.when('result', () => {
            if (noteResult.waiting) {
              return <Muted>Plaatsen… één poging, daarna readback.</Muted>;
            }

            return AsyncResult.match(noteResult, {
              onInitial: () => undefined,
              onFailure: ({ cause }) => <text fg={theme.red}>{`✗ ${failureMessage(cause)} (niets verstuurd)`}</text>,
              onSuccess: ({ value }) => <NoteOutcomeView outcome={value} />,
            });
          }),
          Match.exhaustive,
        )}
      </Panel>
    );
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      {renderTickets()}

      {renderNote()}

      <box flexDirection="row" height={1}>
        <Hint keys="↑/↓" label="ticket" />

        <Hint keys="/" label="filter" />

        <Hint keys="g" label="incl. gesloten" />

        <Hint keys="i" label="interne notitie" />

        <Hint keys="b" label="tijd boeken" />

        <Hint keys="a" label="klantantwoord (concept)" />

        <Hint keys="r" label="herlees" />
      </box>
    </box>
  );
}
