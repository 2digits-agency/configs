/* @jsxImportSource @gpuix/react */
import { Children, useState, type ReactNode } from 'react';

import type { StyleDesc } from '@gpuix/react';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Order from 'effect/Order';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { initialEntries, initialTickets, tasks } from './demo';
import {
  compareReadback,
  hours,
  reviewBooking,
  reviewSupport,
  shiftDate,
  weekRange,
  type BookingDraft,
  type ChangeRequest,
  type CreateArguments,
  type Entry,
} from './domain';
import { readTools, type LiveReader, type ReadTool } from './reads';

const C = {
  ink: '#172a38',
  muted: '#647786',
  border: '#dce5e9',
  canvas: '#f3f6f7',
  white: '#ffffff',
  teal: '#087f82',
  pale: '#e3f4f1',
  navy: '#102c3b',
  warn: '#9a5b14',
  amber: '#fff4df',
  red: '#b23d3d',
};

const row: StyleDesc = { display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' };

const column: StyleDesc = { display: 'flex', flexDirection: 'column', gap: 12 };

const card: StyleDesc = {
  ...column,
  padding: 18,
  backgroundColor: C.white,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: C.border,
};

const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

const kindLabels = { logged: 'Geschreven', planned: 'Gepland', absence: 'Afwezig' };

const kindDescriptions = {
  logged: 'Alleen daadwerkelijke registraties',
  planned: 'Reserveringen, geen geschreven uren',
  absence: 'Goedgekeurde afwezigheid',
};

const kindColors = { logged: C.teal, planned: '#789ece', absence: '#bac5ce' };

const supportLabels = {
  internal: {
    field: 'Interne notitie (demo)',
    review: 'notitie',
    tool: 'AddInternalComment',
    save: 'Simuleer interne notitie + readback',
  },
  customer: {
    field: 'Afzonderlijk klantantwoordconcept (demo)',
    review: 'klantantwoord',
    tool: 'ReplyToTicket',
    save: 'Bewaar klantantwoordconcept',
  },
};

function Text({
  children,
  size = 14,
  color = C.ink,
  bold = false,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  bold?: boolean;
}) {
  return (
    <text style={{ color, fontSize: size, fontWeight: bold ? 600 : 400 }}>
      {Children.toArray(children)
        .filter((child) => P.isString(child) || P.isNumber(child))
        .join('')}
    </text>
  );
}

function Action({
  children,
  onClick,
  active = false,
  disabled = false,
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <div
      testId={testId}
      role="button"
      aria-label={typeof children === 'string' ? children : undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'enter' || event.key === 'space')) {
          onClick();
        }
      }}
      style={{
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 14,
        paddingRight: 14,
        flexShrink: 0,
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: active ? C.teal : C.white,
        opacity: disabled ? 0.45 : 1,
        borderWidth: 1,
        borderColor: active ? C.teal : C.border,
        hover: { backgroundColor: active ? '#096f71' : C.pale },
      }}>
      <Text color={active ? C.white : C.ink} size={13} bold>
        {children}
      </Text>
    </div>
  );
}

function Notice({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, backgroundColor: warning ? C.amber : C.pale }}>
      <Text size={12} color={warning ? C.warn : C.teal}>
        {children}
      </Text>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  multiline = false,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  testId?: string;
}) {
  const style: StyleDesc = {
    width: '100%',
    height: multiline ? 84 : 38,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    backgroundColor: C.white,
    color: C.ink,
    fontSize: 13,
  };

  return (
    <div style={{ ...column, gap: 5 }}>
      <Text size={12} bold>
        {label}
      </Text>

      {multiline ? (
        <textarea
          aria-label={label}
          testId={testId}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.value ?? '')}
          style={style}
        />
      ) : (
        <input
          aria-label={label}
          testId={testId}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.value ?? '')}
          style={style}
        />
      )}
    </div>
  );
}

function Payload({ value }: { value: unknown }) {
  return (
    <div style={{ ...column, gap: 2, padding: 12, backgroundColor: C.canvas, borderRadius: 8 }}>
      {JSON.stringify(value, undefined, 2)
        .split('\n')
        .map((line, index) => (
          <text key={index} style={{ color: C.muted, fontSize: 11, fontFamily: 'Lilex' }}>
            {line}
          </text>
        ))}
    </div>
  );
}

function emptyDraft(date: string, taskId = ''): BookingDraft {
  return { taskId, date, start: '', minutes: '', description: '', billable: '' };
}

function EntryDetails({ entry, onCorrect, onDelete }: { entry: Entry; onCorrect: () => void; onDelete: () => void }) {
  const locked = Boolean(entry.lock) || entry.kind !== 'logged';

  return (
    <div
      style={{
        ...column,
        width: 290,
        padding: 22,
        flexShrink: 0,
        backgroundColor: C.white,
        borderLeftWidth: 1,
        borderColor: C.border,
      }}>
      <Text size={12} color={C.muted} bold>
        ENTRYDETAIL / DEMO
      </Text>

      <Text size={23} bold>
        {tasks.find((task) => task.id === entry.taskId)?.project}
      </Text>

      <Text>{entry.description}</Text>

      <div style={{ ...column, marginTop: 12 }}>
        <Text color={C.muted} size={12}>
          Datum & starttijd — zone onbewezen
        </Text>

        <Text bold>{entry.date}</Text>

        <Text color={C.muted} size={12}>
          Duur
        </Text>

        <Text bold>{`${hours(entry.durationMinutes)} uur · ${entry.durationMinutes} minuten`}</Text>

        <Text color={C.muted} size={12}>
          Declarabiliteit (opgeslagen demo-waarde)
        </Text>

        <Text bold>{entry.billable ? 'Declarabel' : 'Niet-declarabel'}</Text>

        <Text color={C.muted} size={12}>
          Soort
        </Text>

        <Text bold>{kindLabels[entry.kind]}</Text>
      </div>

      {entry.lock && <Notice warning>{entry.lock} · niet ontgrendelen</Notice>}

      <div style={{ flexGrow: 1 }} />

      <Notice>Elke write eindigt pas na readback in Verified, Mismatch of Unknown.</Notice>

      <Action active disabled={locked} onClick={onCorrect} testId="correct-entry">
        Bereid correctie voor
      </Action>

      <Action disabled={locked} onClick={onDelete} testId="delete-concept">
        Verwijderconcept
      </Action>
    </div>
  );
}

function Booking({
  date,
  taskId,
  entry,
  entries,
  onClose,
  onBook,
  onRequest,
}: {
  date: string;
  taskId?: string;
  entry?: Entry;
  entries: Array<Entry>;
  onClose: () => void;
  onBook: (entry: Entry) => void;
  onRequest: (request: ChangeRequest) => void;
}) {
  const [draft, setDraft] = useState<BookingDraft>(
    entry
      ? {
          taskId: entry.taskId,
          date: entry.date.slice(0, 10),
          start: entry.date.slice(11),
          minutes: String(entry.durationMinutes),
          description: entry.description,
          billable: entry.billable ? 'true' : 'false',
        }
      : emptyDraft(date, taskId),
  );

  const [query, setQuery] = useState('');

  const [review, setReview] = useState<CreateArguments | undefined>();

  const [correction, setCorrection] = useState<Record<string, unknown> | undefined>();

  const [error, setError] = useState('');

  const [result, setResult] = useState('');

  const [writtenId, setWrittenId] = useState('');

  const [scenario, setScenario] = useState<'verified' | 'mismatch' | 'unknown'>('verified');

  function update(key: keyof BookingDraft, value: string) {
    if (result) {
      return;
    }

    setDraft((current) => ({ ...current, [key]: value }));

    setReview(undefined);

    setCorrection(undefined);
  }

  function prepare() {
    Effect.runSync(
      reviewBooking(draft, tasks, entries, entry).pipe(
        Effect.match({
          onFailure: (cause) => {
            setReview(undefined);

            setError(cause.message);
          },
          onSuccess: ({ args, updateArgs }) => {
            setError('');

            setReview(args);

            setCorrection(updateArgs);
          },
        }),
      ),
    );
  }

  function simulate() {
    if (!review || result) {
      return;
    }

    const stored: Entry = {
      ...review,
      id: `DEMO-NEW-${entries.length}`,
      kind: 'logged',
      billable: scenario === 'mismatch' ? !review.billable : review.billable,
    };

    setWrittenId(stored.id);

    onBook(stored);

    if (scenario === 'unknown') {
      setResult('Unknown — demo-uitkomst onbekend. Eerst teruglezen; geen write-retry.');

      return;
    }

    const mismatches = compareReadback(review, stored);

    setResult(
      mismatches.length > 0
        ? `Mismatch — ${mismatches.join(', ')} wijkt af. Stop; wijzig geen ticketbilling.`
        : 'Verified — demo-readback: taak, datum/start, duur, billable en omschrijving kloppen.',
    );
  }

  return (
    <div
      style={{
        ...column,
        padding: 20,
        width: 390,
        flexShrink: 0,
        backgroundColor: C.white,
        overflowY: 'scroll',
        height: '100%',
        borderLeftWidth: 1,
        borderColor: C.border,
      }}>
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <Text size={21} bold>
          {entry ? 'Uren corrigeren' : 'Uren boeken'}
        </Text>

        <Action onClick={onClose} testId="close-booking">
          Sluiten
        </Action>
      </div>

      <Notice warning>
        {entry
          ? 'Alleen een concept. Correcties vereisen Executor-browserapproval; die keten is nog niet gekoppeld.'
          : 'DEMO · alleen in geheugen. Geen Orbit-write of gatewayverbinding.'}
      </Notice>

      <Field
        label="Zoek project / taak"
        value={query}
        onChange={setQuery}
        testId="task-search"
        placeholder="Bijv. Portal"
      />

      <div style={{ ...column, gap: 5 }}>
        {tasks
          .filter((task) => `${task.project} ${task.title}`.toLowerCase().includes(query.toLowerCase()))
          .map((task) => (
            <Action
              key={task.id}
              testId={`pick-${task.id}`}
              active={draft.taskId === task.id}
              disabled={!task.open}
              onClick={() =>
                update('taskId', task.id)
              }>{`${task.project} · ${task.open ? task.title : 'Gesloten'}`}</Action>
          ))}
      </div>

      <div style={row}>
        <div style={{ width: 220, minWidth: 0, flexShrink: 1 }}>
          <Field label="Datum *" value={draft.date} onChange={(value) => update('date', value)} testId="book-date" />
        </div>

        <div style={{ width: 110, flexShrink: 0 }}>
          <Field
            label="Starttijd *"
            value={draft.start}
            onChange={(value) => update('start', value)}
            placeholder="uu:mm"
            testId="book-start"
          />
        </div>
      </div>

      <Field
        label="Duur in hele minuten *"
        value={draft.minutes}
        onChange={(value) => update('minutes', value)}
        testId="book-minutes"
        placeholder="Bijv. 60"
      />

      <Text size={12} bold>
        Declarabel * — expliciete keuze
      </Text>

      <div style={row}>
        <Action active={draft.billable === 'true'} onClick={() => update('billable', 'true')} testId="billable-yes">
          Ja
        </Action>

        <Action active={draft.billable === 'false'} onClick={() => update('billable', 'false')} testId="billable-no">
          Nee
        </Action>
      </div>

      <Field
        label="Omschrijving *"
        value={draft.description}
        onChange={(value) => update('description', value)}
        multiline
        testId="book-description"
      />

      <Text size={11} color={C.muted}>
        Orbit-kloktijd zonder zone. Europe/Amsterdam is alleen een voorkeur; geen UTC- of DST-conversie.
      </Text>

      {error && <Notice warning>{error}</Notice>}

      <Action active onClick={prepare} testId="review-booking">
        Controleer payload
      </Action>

      {review && (
        <>
          <Text bold size={13}>
            Review · {entry ? 'UpdateTimeEntry' : 'CreateTimeEntry'}
          </Text>

          {entry && (
            <>
              <Text size={12}>Oorspronkelijke entry</Text>

              <Payload
                value={{
                  date: entry.date,
                  durationMinutes: entry.durationMinutes,
                  billable: String(entry.billable),
                  taskId: entry.taskId,
                  description: entry.description,
                }}
              />
            </>
          )}

          <Payload value={entry ? correction : review} />

          {entry ? (
            <Action
              active
              disabled={Boolean(result)}
              testId="save-correction"
              onClick={() => {
                if (correction) {
                  onRequest({
                    tool: 'UpdateTimeEntry',
                    arguments: correction,
                    label: `Correctie ${entry.id}`,
                    status: 'Concept — niet verzonden',
                  });
                }

                setResult('Concept bewaard — niet aangevraagd of uitgevoerd.');
              }}>
              Bewaar wijzigingsconcept
            </Action>
          ) : (
            <>
              <Text size={12} bold>
                Test demo-readback
              </Text>

              <div style={row}>
                {(['verified', 'mismatch', 'unknown'] as const).map((value) => (
                  <Action
                    key={value}
                    active={scenario === value}
                    onClick={() => setScenario(value)}
                    testId={`scenario-${value}`}>
                    {value}
                  </Action>
                ))}
              </div>

              <Action active disabled={Boolean(result)} onClick={simulate} testId="simulate-booking">
                Simuleer boeken + readback
              </Action>

              {result.startsWith('Unknown') && (
                <Action
                  testId="readback-unknown"
                  onClick={() => {
                    const stored = entries.find((item) => item.id === writtenId);

                    if (stored) {
                      setResult(
                        compareReadback(review, stored).length > 0
                          ? 'Mismatch — stop.'
                          : 'Verified — bestaande demo-entry teruggelezen, niet opnieuw geschreven.',
                      );
                    }
                  }}>
                  Lees demo-entry terug
                </Action>
              )}
            </>
          )}
        </>
      )}

      {result && <Notice warning={!result.startsWith('Verified')}>{result}</Notice>}
    </div>
  );
}

function LiveInspector({ reader }: { reader?: LiveReader }) {
  const [tool, setTool] = useState<ReadTool>('GetTimesheetWeek');

  const [argumentsText, setArgumentsText] = useState(JSON.stringify(readTools.GetTimesheetWeek, undefined, 2));

  const [result, setResult] = useState<unknown>();

  const [status, setStatus] = useState('Niet verbonden');

  const [busy, setBusy] = useState(false);

  function read() {
    if (!reader || busy) {
      return;
    }

    setBusy(true);

    setStatus('Read bezig…');

    setResult(undefined);

    Effect.runFork(
      Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.JsonObject))(argumentsText).pipe(
        Effect.flatMap((args) => reader.read(tool, args)),
        Effect.match({
          onFailure: () =>
            setStatus(
              'Read geweigerd of verbinding mislukt. Controleer JSON, lokale daemon, sleutelbestand en read-capability. Geen automatische retry.',
            ),
          onSuccess: (value) => {
            setResult(value);

            setStatus('MCP-envelope ontvangen — geen bewezen business-outputadapter');
          },
        }),
        Effect.ensuring(Effect.sync(() => setBusy(false))),
      ),
    );
  }

  return (
    <div style={column}>
      <Text size={27} bold>
        Live MCP · read-only
      </Text>

      <Notice warning>
        {reader
          ? 'Native inspector. Alleen de vaste read-allowlist kan worden aangeroepen. Resultaten blijven apart van demo-data.'
          : 'Browserpreview is uitsluitend DEMO. Native starten met --live om de lokale daemon read-only te inspecteren. Sleutels komen nooit in deze bundel.'}
      </Notice>

      <Text color={C.muted}>
        Bestaande MCP-reads, geen HAR-boardwrites of nieuwe capabilities. Maxima en rechten kunnen resultaten onvolledig
        maken.
      </Text>

      <div style={{ ...row, flexWrap: 'wrap' }}>
        {(Object.keys(readTools) as Array<ReadTool>).map((name) => (
          <Action
            key={name}
            active={tool === name}
            onClick={() => {
              setTool(name);

              setArgumentsText(JSON.stringify(readTools[name], undefined, 2));

              setResult(undefined);
            }}>
            {name}
          </Action>
        ))}
      </div>

      <Field
        label="Exacte read-argumenten (JSON)"
        multiline
        value={argumentsText}
        onChange={setArgumentsText}
        testId="live-arguments"
      />

      <Action
        active
        disabled={!reader || busy}
        onClick={() => {
          read();
        }}
        testId="live-read">
        Lees via lokale gateway
      </Action>

      <Text size={12}>{status}</Text>

      <Text size={12} color={C.muted}>
        TimeEntries: dateTo inclusief. Tickets: createdTo exclusief. Ticketdetail vraagt TC… API-ID, geen zichtbaar
        nummer. includeInternal en filter-billable zijn strings.
      </Text>

      {result !== undefined && <Payload value={result} />}
    </div>
  );
}

export function App({ reader }: { reader?: LiveReader }) {
  const [view, setView] = useState<'week' | 'search' | 'support' | 'approvals' | 'live'>('week');

  const [date, setDate] = useState('2026-10-13');

  const [dayMode, setDayMode] = useState(false);

  const [entries, setEntries] = useState(initialEntries);

  const [tickets, setTickets] = useState(initialTickets);

  const [selectedEntry, setSelectedEntry] = useState<Entry | undefined>(initialEntries[2]);

  const [selectedTicketId, setSelectedTicketId] = useState(initialTickets[0].id);

  const [query, setQuery] = useState('');

  const [showClosed, setShowClosed] = useState(false);

  const [booking, setBooking] = useState<{ taskId?: string; entry?: Entry; key: number } | undefined>();

  const [requests, setRequests] = useState<Array<ChangeRequest>>([]);

  const [composer, setComposer] = useState<'internal' | 'customer'>('internal');

  const [note, setNote] = useState('');

  const [supportReview, setSupportReview] = useState<Record<string, unknown> | undefined>();

  const [replyRequest, setReplyRequest] = useState<ChangeRequest | undefined>();

  const [supportStatus, setSupportStatus] = useState('');

  const range = weekRange(date);

  const weekEntries = entries.filter(
    (entry) => entry.date.slice(0, 10) >= range.from && entry.date.slice(0, 10) < range.until,
  );

  const ticket = tickets.find((item) => item.id === selectedTicketId) ?? tickets[0];

  function openBooking(taskId?: string, entry?: Entry) {
    setBooking({ taskId, entry, key: (booking?.key ?? 0) + 1 });
  }

  function switchView(next: typeof view) {
    setView(next);

    setBooking(undefined);

    setQuery('');
  }

  function request(change: ChangeRequest) {
    setRequests([...requests, change]);
  }

  function ticketSelect(id: string) {
    setSelectedTicketId(id);

    setNote('');

    setSupportReview(undefined);

    setSupportStatus('');

    setComposer('internal');
  }

  function compose(next: typeof composer) {
    setComposer(next);

    setNote('');

    setSupportReview(undefined);

    setSupportStatus('');
  }

  function previewSupport() {
    Effect.runSync(
      reviewSupport(ticket, composer, note).pipe(
        Effect.match({
          onFailure: (cause) => setSupportStatus(cause.message),
          onSuccess: ({ reply, payload }) => {
            setSupportReview(payload);

            setReplyRequest(reply);

            setSupportStatus('');
          },
        }),
      ),
    );
  }

  function saveSupport() {
    if (!supportReview || supportStatus) {
      return;
    }

    if (composer === 'customer' && replyRequest) {
      request(replyRequest);

      setSupportStatus('Concept bewaard — geen klantnotificatie, geen approvalaanvraag, niet verzonden.');
    } else {
      const comment = { note: String(supportReview.note), internal: true };

      const updated = { ...ticket, comments: [...ticket.comments, comment] };

      setTickets(tickets.map((item) => (item.id === ticket.id ? updated : item)));

      const readback = updated.comments.at(-1);

      setSupportStatus(
        readback?.internal && readback.note === supportReview.note
          ? 'Verified — demo-notitie teruggelezen als intern, zonder urenboeking.'
          : 'Mismatch — stop.',
      );
    }
  }

  const nav = [
    ['week', '01', 'Timesheet'],
    ['search', '02', 'Taken zoeken'],
    ['support', '03', 'Support'],
    ['approvals', '04', 'Concepten'],
    ['live', '05', 'Live reads'],
  ] as const;

  return (
    <div
      style={{
        ...row,
        gap: 0,
        width: '100%',
        height: '100%',
        backgroundColor: C.canvas,
        fontFamily: 'IBM Plex Sans',
        alignItems: 'stretch',
      }}>
      <div style={{ ...column, width: 190, flexShrink: 0, padding: 18, backgroundColor: C.navy, gap: 26 }}>
        <div style={{ ...column, gap: 5, paddingTop: 15 }}>
          <Text color={C.white} size={27} bold>
            tlo.
          </Text>
        </div>

        <Text color="#92b4c1" size={12}>
          WORKSPACE / GPUIX
        </Text>

        <div style={{ ...column, gap: 8 }}>
          {nav.map(([id, number, label]) => (
            <div
              key={id}
              role="button"
              aria-label={label}
              tabIndex={0}
              testId={`nav-${id}`}
              onClick={() => switchView(id)}
              onKeyDown={(event) => {
                if (event.key === 'enter') {
                  switchView(id);
                }
              }}
              style={{
                ...row,
                padding: 12,
                borderRadius: 8,
                backgroundColor: view === id ? '#214857' : C.navy,
                cursor: 'pointer',
                hover: { backgroundColor: '#214857' },
              }}>
              <Text color="#7facb9" size={11}>
                {number}
              </Text>

              <Text color={C.white} size={13} bold={view === id}>
                {label}
              </Text>
            </div>
          ))}
        </div>

        <div style={{ flexGrow: 1 }} />

        <div style={{ ...column, gap: 7 }}>
          <Text color="#8bc9bf" size={12}>
            ● DEMO WORKSPACE
          </Text>

          <Text color="#92b4c1" size={11}>
            Fictieve data · sessiegeheugen
          </Text>

          <Text color="#92b4c1" size={11}>
            Geen OAuth in deze client
          </Text>

          <Text color="#92b4c1" size={11}>
            Geen live writes
          </Text>
        </div>
      </div>

      <div style={{ ...column, gap: 0, flexGrow: 1, minWidth: 0 }}>
        <div
          style={{
            ...row,
            justifyContent: 'space-between',
            padding: 14,
            backgroundColor: '#e4efef',
            borderBottomWidth: 1,
            borderColor: C.border,
          }}>
          <Text size={12} color={C.teal} bold>
            DEMO · Alle bedrijfsdata is fictief. Live reads staan apart.
          </Text>

          <Text size={11} color={C.muted}>
            TZ Orbit onbewezen · voorkeur Europe/Amsterdam
          </Text>
        </div>

        <div style={{ ...row, gap: 0, flexGrow: 1, minHeight: 0, alignItems: 'stretch' }}>
          <div key={view} style={{ ...column, flexGrow: 1, minWidth: 0, padding: 26, overflowY: 'scroll' }}>
            {view === 'week' && (
              <>
                <div style={{ ...row, justifyContent: 'space-between' }}>
                  <div style={{ ...column, gap: 5 }}>
                    <Text size={27} bold>
                      Goed overzicht. Rust in je week.
                    </Text>

                    <Text color={C.muted}>12–18 oktober is gevuld met fictieve voorbeelddata.</Text>
                  </div>

                  <Action active onClick={() => openBooking()} testId="new-booking">
                    + Uren boeken
                  </Action>
                </div>

                <div style={{ ...row, marginTop: 10 }}>
                  {(['logged', 'planned', 'absence'] as const).map((kind) => (
                    <div key={kind} style={{ ...card, flexGrow: 1, gap: 5 }}>
                      <Text size={12} color={C.muted}>
                        {kindLabels[kind]}
                      </Text>

                      <Text size={27} color={kind === 'logged' ? C.teal : C.ink} bold>
                        {hours(
                          weekEntries
                            .filter((entry) => entry.kind === kind)
                            .reduce((sum, entry) => sum + entry.durationMinutes, 0),
                        )}
                      </Text>

                      <Text size={11} color={C.muted}>
                        {kindDescriptions[kind]}
                      </Text>
                    </div>
                  ))}
                </div>

                <div style={{ ...row, justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={row}>
                    <Action onClick={() => setDate(shiftDate(date, -7))} testId="previous-week">
                      ‹
                    </Action>

                    <Text bold>{`${range.from} — ${shiftDate(range.until, -1)}`}</Text>

                    <Action onClick={() => setDate(shiftDate(date, 7))} testId="next-week">
                      ›
                    </Action>
                  </div>

                  <div style={row}>
                    <Action active={!dayMode} onClick={() => setDayMode(false)} testId="week-mode">
                      Week
                    </Action>

                    <Action active={dayMode} onClick={() => setDayMode(true)} testId="day-mode">
                      Dag
                    </Action>
                  </div>
                </div>

                <div style={{ ...row, alignItems: 'stretch', gap: 6 }}>
                  {days.map((day, index) => {
                    const value = shiftDate(range.from, index);

                    const total = weekEntries
                      .filter((entry) => entry.kind === 'logged' && entry.date.startsWith(value))
                      .reduce((sum, entry) => sum + entry.durationMinutes, 0);

                    return (
                      <div
                        key={day}
                        role="button"
                        aria-label={`${day} ${value}`}
                        tabIndex={0}
                        testId={`day-${index}`}
                        onClick={() => setDate(value)}
                        onKeyDown={(event) => {
                          if (event.key === 'enter') {
                            setDate(value);
                          }
                        }}
                        style={{
                          ...column,
                          gap: 6,
                          flexGrow: 1,
                          padding: 14,
                          borderRadius: 9,
                          backgroundColor: date === value ? C.teal : C.white,
                          cursor: 'pointer',
                          borderWidth: 1,
                          borderColor: date === value ? C.teal : C.border,
                        }}>
                        <Text size={12} color={date === value ? C.white : C.muted}>
                          {`${day} ${value.slice(8)}`}
                        </Text>

                        <Text bold color={date === value ? C.white : C.ink}>
                          {hours(total)}
                        </Text>
                      </div>
                    );
                  })}
                </div>

                <div style={card}>
                  <div style={{ ...row, justifyContent: 'space-between' }}>
                    <Text size={17} bold>
                      {dayMode ? `Dagregistraties · ${date}` : 'Registraties deze week'}
                    </Text>

                    <Text size={12} color={C.muted}>
                      Selecteer voor details
                    </Text>
                  </div>

                  {Arr.sort(
                    weekEntries.filter((entry) => !dayMode || entry.date.startsWith(date)),
                    Order.mapInput(Order.String, (entry: Entry) => entry.date),
                  ).map((entry) => (
                    <div
                      key={entry.id}
                      role="button"
                      aria-label={entry.description}
                      tabIndex={0}
                      testId={`entry-${entry.id}`}
                      onClick={() => setSelectedEntry(entry)}
                      onKeyDown={(event) => {
                        if (event.key === 'enter') {
                          setSelectedEntry(entry);
                        }
                      }}
                      style={{
                        ...row,
                        padding: 12,
                        backgroundColor: selectedEntry?.id === entry.id ? C.pale : C.white,
                        borderRadius: 8,
                        cursor: 'pointer',
                        hover: { backgroundColor: C.canvas },
                      }}>
                      <div
                        style={{
                          width: 4,
                          height: 40,
                          backgroundColor: kindColors[entry.kind],
                          borderRadius: 2,
                        }}
                      />

                      <div style={{ width: 82 }}>
                        <Text size={12} bold>
                          {entry.date.slice(5, 10)}
                        </Text>

                        <Text size={12} color={C.muted}>
                          {entry.date.slice(11)}
                        </Text>
                      </div>

                      <div style={{ ...column, gap: 4, flexGrow: 1 }}>
                        <Text bold>{tasks.find((task) => task.id === entry.taskId)?.project}</Text>

                        <Text size={12} color={C.muted}>
                          {entry.description}
                        </Text>
                      </div>

                      <div style={{ ...column, gap: 4, alignItems: 'flex-end' }}>
                        <Text bold>{hours(entry.durationMinutes)}</Text>

                        <Text size={11} color={entry.lock ? C.warn : C.muted}>
                          {entry.lock ? 'Vergrendeld' : kindLabels[entry.kind]}
                        </Text>
                      </div>
                    </div>
                  ))}

                  {!weekEntries.some((entry) => !dayMode || entry.date.startsWith(date)) && (
                    <Notice>
                      Geen demo-entries voor deze periode. Kies de week van 12 oktober of simuleer een boeking.
                    </Notice>
                  )}
                </div>

                <Notice>
                  Geschreven, gepland en afwezig blijven gescheiden. Geen som die planning dubbel telt als gewerkt.
                </Notice>
              </>
            )}

            {view === 'search' && (
              <>
                <Text size={27} bold>
                  Vind de juiste bestemming
                </Text>

                <Text color={C.muted}>
                  Project → concrete taak. Ticket en boardkaart zijn niet automatisch boekbaar.
                </Text>

                <Field
                  label="Zoek taken, projectnamen of ticketnummers (demo)"
                  value={query}
                  onChange={setQuery}
                  placeholder="Portal, componenten, 1042…"
                  testId="global-search"
                />

                <div style={card}>
                  <Text size={17} bold>
                    Projecttaken · demo
                  </Text>

                  {tasks
                    .filter((task) => `${task.project} ${task.title}`.toLowerCase().includes(query.toLowerCase()))
                    .map((task) => (
                      <div key={task.id} style={{ ...row, padding: 10, justifyContent: 'space-between' }}>
                        <div style={{ ...column, gap: 5 }}>
                          <Text bold>{`${task.project} · ${task.title}`}</Text>

                          <Text size={12} color={C.muted}>
                            {`${task.budget} · ${task.id}`}
                          </Text>
                        </div>

                        <Action disabled={!task.open} onClick={() => openBooking(task.id)} testId={`book-${task.id}`}>
                          {task.open ? 'Boek hier' : 'Gesloten'}
                        </Action>
                      </div>
                    ))}
                </div>

                <div style={card}>
                  <Text size={17} bold>
                    Supporttickets · demo
                  </Text>

                  {tickets
                    .filter((item) =>
                      `${item.number} ${item.title} ${item.client}`.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((item) => (
                      <div key={item.id} style={{ ...row, justifyContent: 'space-between', padding: 10 }}>
                        <div style={{ ...column, gap: 5 }}>
                          <Text bold>{`#${item.number} · ${item.title}`}</Text>

                          <Text size={12} color={C.muted}>
                            {`${item.client} · ${item.taskId ? 'Gekoppelde demo-taak' : 'Geen bevestigde boekingstaak'}`}
                          </Text>
                        </div>

                        <Action
                          onClick={() => {
                            ticketSelect(item.id);

                            setView('support');
                          }}>
                          Open
                        </Action>
                      </div>
                    ))}
                </div>

                <Notice warning>
                  Live zoekscope: ListMyTasks = toegewezen backlog; ListProjects zoekt projectnamen; SearchProjectItems
                  zoekt projectregels (max 50). Niets gevonden bewijst geen afwezigheid.
                </Notice>
              </>
            )}

            {view === 'support' && (
              <>
                <div style={{ ...row, justifyContent: 'space-between' }}>
                  <Text size={27} bold>
                    Support, met duidelijke grenzen
                  </Text>

                  <Action active={showClosed} onClick={() => setShowClosed(!showClosed)} testId="show-closed">
                    {showClosed ? 'Inclusief gesloten' : 'Alleen actief'}
                  </Action>
                </div>

                <div style={{ ...row, flexWrap: 'wrap', alignItems: 'stretch' }}>
                  {tickets
                    .filter((item) => showClosed || item.status !== 'CLOSED')
                    .map((item) => (
                      <Action
                        key={item.id}
                        active={ticket.id === item.id}
                        onClick={() => ticketSelect(item.id)}
                        testId={`ticket-${item.number}`}>
                        {`#${item.number} · ${item.client} · ${item.status}`}
                      </Action>
                    ))}
                </div>

                <div style={card}>
                  <Text size={20} bold>
                    {`#${ticket.number} · ${ticket.title}`}
                  </Text>

                  <Text color={C.muted}>{`${ticket.client} · ${ticket.priority} · ${ticket.status}`}</Text>

                  <Text size={11} color={C.muted}>
                    {`Zichtbaar nummer #${ticket.number} ≠ API-ID ${ticket.id}`}
                  </Text>

                  {ticket.comments.map((comment, index) => (
                    <div
                      key={index}
                      style={{
                        ...column,
                        padding: 14,
                        borderRadius: 8,
                        backgroundColor: comment.internal ? C.pale : C.canvas,
                        gap: 5,
                      }}>
                      <Text size={11} color={comment.internal ? C.teal : C.muted} bold>
                        {comment.internal ? 'INTERN · DEMO' : 'KLANTZICHTBAAR · DEMO'}
                      </Text>

                      <Text>{comment.note}</Text>
                    </div>
                  ))}

                  <div style={row}>
                    <Action
                      active={composer === 'internal'}
                      onClick={() => compose('internal')}
                      testId="compose-internal">
                      Interne notitie
                    </Action>

                    <Action
                      active={composer === 'customer'}
                      onClick={() => compose('customer')}
                      testId="compose-customer">
                      Klantantwoord
                    </Action>
                  </div>

                  <Notice warning={composer === 'customer'}>
                    {composer === 'customer'
                      ? 'KLANTCOMMUNICATIE · kan de klant notificeren, WAIT zetten en CLOSED heropenen. Alleen een concept; Executor-approval vereist.'
                      : 'Interne notitie zonder logMinutes. Een tijdstip in de tekst bepaalt geen registratietijd. Boek uren afzonderlijk met expliciete starttijd.'}
                  </Notice>

                  <Field
                    label={supportLabels[composer].field}
                    value={note}
                    onChange={(value) => {
                      setNote(value);

                      setSupportReview(undefined);

                      setSupportStatus('');
                    }}
                    multiline
                    testId="support-note"
                  />

                  <div style={row}>
                    <Action active onClick={previewSupport} testId="review-support">
                      Controleer {supportLabels[composer].review}
                    </Action>

                    <Action disabled={!ticket.taskId} onClick={() => openBooking(ticket.taskId)} testId="support-book">
                      {ticket.taskId ? 'Boek apart uren' : 'Geen boekbare taak'}
                    </Action>
                  </div>

                  {supportReview && (
                    <>
                      <Payload
                        value={{
                          tool: supportLabels[composer].tool,
                          arguments: supportReview,
                        }}
                      />

                      <Action active disabled={Boolean(supportStatus)} onClick={saveSupport} testId="save-support">
                        {supportLabels[composer].save}
                      </Action>
                    </>
                  )}

                  {supportStatus && <Notice warning={!supportStatus.startsWith('Verified')}>{supportStatus}</Notice>}
                </div>
              </>
            )}

            {view === 'approvals' && (
              <>
                <Text size={27} bold>
                  Wijzigingsconcepten
                </Text>

                <Notice warning>
                  NIET aangevraagd. Geen approvalUrl/requestId: de Executor-approvalketen is nog onbewezen. Een lokale
                  bevestiging geeft geen toestemming.
                </Notice>

                <Text color={C.muted}>
                  Correcties, verwijderen en klantantwoorden zijn afzonderlijke concrete calls. Readback is na elke
                  echte uitvoering verplicht; geen automatische write-retry.
                </Text>

                {requests.length === 0 && (
                  <div style={card}>
                    <Text size={19} bold>
                      Nog geen concepten
                    </Text>

                    <Text color={C.muted}>
                      Selecteer een geschreven entry om een correctie voor te bereiden, of stel in Support een
                      klantantwoord op.
                    </Text>
                  </div>
                )}

                {requests.map((item, index) => (
                  <div key={index} style={card}>
                    <Text size={17} bold>
                      {item.label}
                    </Text>

                    <Text size={12} color={C.warn}>
                      {item.status}
                    </Text>

                    <Payload value={{ tool: item.tool, arguments: item.arguments }} />

                    <Notice>
                      Na toekomstige approval: bestemming, datum/starttijd, duur, billing, commentzichtbaarheid en
                      ticketstatus teruglezen. Vervanging eerst verifiëren, pas daarna apart verwijderen.
                    </Notice>
                  </div>
                ))}

                <div style={card}>
                  <Text bold>Capabilities</Text>

                  <Text size={13}>
                    Bewezen MCP: timesheet / taken / projecten / ticketreads; CreateTimeEntry en AddInternalComment
                    historisch bewezen, maar hier alleen demo.
                  </Text>

                  <Text size={13} color={C.muted}>
                    HAR-boardwrites en EXT_* zijn historische browserdata. Boardmutaties, timers, ontgrendelen en
                    planningwrites blijven buiten deze variant.
                  </Text>
                </div>
              </>
            )}

            {view === 'live' && <LiveInspector reader={reader} />}
          </div>

          {booking ? (
            <Booking
              key={booking.key}
              date={date}
              taskId={booking.taskId}
              entry={booking.entry}
              entries={entries}
              onClose={() => setBooking(undefined)}
              onBook={(item) => {
                setEntries([...entries, item]);

                setSelectedEntry(item);
              }}
              onRequest={request}
            />
          ) : (
            view === 'week' &&
            selectedEntry && (
              <EntryDetails
                entry={selectedEntry}
                onCorrect={() => openBooking(selectedEntry.taskId, selectedEntry)}
                onDelete={() => {
                  request({
                    tool: 'DeleteTimeEntry',
                    arguments: { entryId: selectedEntry.id },
                    label: `Verwijderconcept ${selectedEntry.id}`,
                    status: 'Concept — niet verzonden',
                  });

                  setView('approvals');
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
