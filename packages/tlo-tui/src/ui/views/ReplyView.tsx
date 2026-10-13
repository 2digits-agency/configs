import { useEffect, useRef, useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes, type TextareaRenderable, type KeyEvent } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Atom from 'effect/reactivity/Atom';

import type { TicketId } from '../../domain/ids.js';
import { type DraftResult, type FollowUpAction, draftCustomerReply } from '../../flows/ChangeRequest.js';
import type { TicketDetail } from '../../orbit/parse.js';
import { Async, Field, Hint, Muted, Panel } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';
import { ApprovalBanner, RequestView } from './CorrectionsView.js';

const FOLLOW_UPS: ReadonlyArray<FollowUpAction> = ['NONE', 'REMINDER', 'CLOSE'];

function Composer(props: { readonly ticket: TicketDetail }) {
  const atoms = useAtoms();

  const { ticket } = props;

  const [editing, setEditing] = Hooks.useAtom(atoms.editing);

  const [saved, save] = Hooks.useAtom(atoms.saveRequest);

  const textareaRef = useRef<TextareaRenderable>(null);

  const [message, setMessage] = useState('');

  const [waitForClient, setWaitForClient] = useState(true);

  const [followUp, setFollowUp] = useState<FollowUpAction>('NONE');

  const [followUpDate, setFollowUpDate] = useState('');

  const [focus, setFocus] = useState<'message' | 'date'>('message');

  const [draft, setDraft] = useState<DraftResult | undefined>(undefined);

  useEffect(() => {
    save(Atom.Reset);
  }, [save]);

  function reviewKey(key: KeyEvent, draft: DraftResult) {
    if (key.name === 'e' || key.name === 'escape') {
      setDraft(undefined);

      save(Atom.Reset);
    } else if (key.name === 's' && P.isTagged(draft, 'Ready') && !saved.waiting) {
      save(draft.request);
    }
  }

  function editKey(key: KeyEvent) {
    if (key.ctrl && key.name === 's') {
      const text = textareaRef.current?.plainText ?? message;

      setMessage(text);

      setEditing(false);

      setDraft(draftCustomerReply(ticket, { message: text, waitForClient, followUpAction: followUp, followUpDate }));

      return;
    }

    if (key.name === 'tab') {
      setMessage(textareaRef.current?.plainText ?? message);

      setFocus(focus === 'message' ? 'date' : 'message');

      setEditing(true);

      return;
    }

    if (editing) {
      return;
    }

    Match.value(key.name).pipe(
      Match.when('w', () => setWaitForClient(!waitForClient)),
      Match.when('f', () => setFollowUp(FOLLOW_UPS[(FOLLOW_UPS.indexOf(followUp) + 1) % FOLLOW_UPS.length] ?? 'NONE')),
      Match.when(Match.is('return', 'i'), () => {
        key.preventDefault();

        setEditing(true);
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

  return (
    <box flexDirection="column" flexGrow={1}>
      <text fg={theme.text} attributes={TextAttributes.BOLD}>
        {`#${ticket.number ?? '?'} ${ticket.name}`}

        <span fg={theme.muted}>{`  ${ticket.state} · ${ticket.client ?? ''} · melder ${ticket.contact ?? '—'}`}</span>
      </text>

      {ticket.state === 'CLOSED' ? (
        <text fg={theme.red} attributes={TextAttributes.BOLD}>
          Ticket is gesloten: antwoorden heropent het.
        </text>
      ) : undefined}

      {draft === undefined ? (
        <box flexDirection="column" flexGrow={1}>
          <textarea
            ref={textareaRef}
            flexGrow={1}
            initialValue={message}
            placeholder="Bericht aan de klant…"
            focused={editing && focus === 'message'}
            backgroundColor={theme.raised}
            focusedBackgroundColor={theme.raised}
          />

          <Field label="Wacht op klant" active={false} hint="w">
            <text fg={waitForClient ? theme.yellow : theme.green}>
              {waitForClient ? 'ja → terug naar melder, status WAIT' : 'nee → blijft OPEN bij behandelaar'}
            </text>
          </Field>

          <Field label="Follow-up" active={false} hint="f">
            <text fg={theme.text}>{followUp}</text>
          </Field>

          <Field label="Follow-up op" active={focus === 'date'} hint="yyyy-MM-dd">
            <input
              flexGrow={1}
              value={followUpDate}
              focused={editing && focus === 'date'}
              onInput={setFollowUpDate}
              placeholder={followUp === 'NONE' ? 'niet nodig' : 'verplicht'}
              focusedBackgroundColor={theme.raised}
            />
          </Field>

          <Muted>Geen logMinutes: tijd boek je apart met expliciete starttijd (tab 3).</Muted>
        </box>
      ) : P.isTagged(draft, 'Invalid') ? (
        <box flexDirection="column">
          {draft.issues.map((issue) => (
            <text key={issue} fg={theme.red}>{`• ${issue}`}</text>
          ))}
        </box>
      ) : (
        <RequestView request={draft.request} saved={saved} />
      )}
    </box>
  );
}

function Loader({ id }: { readonly id: TicketId }) {
  const atoms = useAtoms();

  const detail = Hooks.useAtomValue(atoms.ticketDetail(id));

  return (
    <Async result={detail} loading="GetTicketDetail…">
      {(ticket) => <Composer key={ticket.ticketId} ticket={ticket} />}
    </Async>
  );
}

export function ReplyView() {
  const atoms = useAtoms();

  const ticket = Hooks.useAtomValue(atoms.selectedTicket);

  const setTab = Hooks.useAtomSet(atoms.tab);

  useKeyboard((key) => {
    if (Opt.isNone(ticket) && key.name === 's') {
      setTab('support');
    }
  });

  return (
    <box flexDirection="column" flexGrow={1}>
      <ApprovalBanner title="KLANTCOMMUNICATIE · zichtbaar voor de klant · alleen concept" color={theme.red} />

      <Panel title="Klantantwoord · ReplyToTicket" flexGrow={1} borderColor={theme.red}>
        {Opt.match(ticket, {
          onNone: () => <Muted>Kies eerst een ticket in tab 4 (Support) en druk a. (s = naar Support)</Muted>,
          onSome: (id) => <Loader id={id} />,
        })}
      </Panel>

      <box flexDirection="row" height={1}>
        <Hint keys="i/Enter" label="typen" />

        <Hint keys="Tab" label="bericht ↔ datum" />

        <Hint keys="w" label="wacht op klant" />

        <Hint keys="f" label="follow-up" />

        <Hint keys="Ctrl+S" label="concept" />

        <Hint keys="s" label="opslaan" />
      </box>
    </box>
  );
}
