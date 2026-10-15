import { useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import type { TicketId } from '../../domain/ids.js';
import { type SearchSource, taskLabel } from '../atoms.js';
import { Async, Hint, Muted, Panel } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';

const SOURCES: ReadonlyArray<{ readonly id: SearchSource; readonly label: string; readonly note: string }> = [
  { id: 'my-tasks', label: 'Mijn taken', note: 'ListMyTasks: alleen jouw toegewezen backlog.' },
  { id: 'project-items', label: 'Projecttaken', note: 'SearchProjectItems: max 50, alle zichtbare projecten.' },
  { id: 'projects', label: 'Projecten', note: 'ListProjects op naam/nummer/klant; Enter zoekt taken binnen project.' },
  { id: 'tickets', label: 'Tickets', note: 'ListTickets incl. gesloten, max 50; Enter opent in Support.' },
];

export function SearchView() {
  const atoms = useAtoms();

  const [request, setRequest] = Hooks.useAtom(atoms.searchRequest);

  const results = Hooks.useAtomValue(atoms.searchResults);

  const [editing, setEditing] = Hooks.useAtom(atoms.editing);

  const setTab = Hooks.useAtomSet(atoms.tab);

  const setDraft = Hooks.useAtomSet(atoms.bookingDraft);

  const setTicket = Hooks.useAtomSet(atoms.selectedTicket);

  const setStatus = Hooks.useAtomSet(atoms.status);

  const [source, setSource] = useState<SearchSource>(
    request.pipe(
      Opt.map((value) => value.source),
      Opt.getOrElse((): SearchSource => 'my-tasks'),
    ),
  );

  const [text, setText] = useState(
    request.pipe(
      Opt.map((value) => value.text),
      Opt.getOrElse(() => ''),
    ),
  );

  const [index, setIndex] = useState(0);

  function run(nextSource: SearchSource, nextText: string, projectId?: string) {
    setRequest(Opt.some({ source: nextSource, text: nextText, projectId }));

    setIndex(0);
  }

  const rows = AsyncResult.isSuccess(results) ? results.value : undefined;

  const count = rows === undefined || !('rows' in rows) ? 0 : rows.rows.length;

  function choose() {
    if (rows === undefined || !('rows' in rows)) {
      return;
    }

    Match.value(rows).pipe(
      Match.tagsExhaustive({
        Tasks: (rows) => {
          const row = rows.rows[index];

          if (row === undefined) {
            return;
          }

          setDraft((draft) => ({
            ...draft,
            task: Opt.some({ taskId: row.taskId, label: taskLabel(row.project, row.task), rate: row.rate }),
          }));

          setStatus(`Taak gekozen: ${row.task} (${row.taskId})`);

          setTab('book');
        },
        Projects: (rows) => {
          const row = rows.rows[index];

          if (row === undefined) {
            return;
          }

          setSource('project-items');

          setText('');

          run(
            'project-items',
            '',
            Opt.getOrElse(row.projectId, () => row.number),
          );
        },
        Tickets: (rows) => {
          const row = rows.rows[index];

          if (row === undefined) {
            return;
          }

          setTicket(Opt.some(row.ticketId as TicketId));

          setTab('support');
        },
      }),
    );
  }

  function marker(row: number) {
    return row === index ? '▸ ' : '  ';
  }

  function color(row: number) {
    return row === index ? theme.focus : theme.text;
  }

  useKeyboard((key) => {
    if (editing) {
      return;
    }

    Match.value(key.name).pipe(
      Match.when('tab', () => {
        const position = SOURCES.findIndex(({ id }) => id === source);

        const next = SOURCES[(position + (key.shift ? SOURCES.length - 1 : 1)) % SOURCES.length]?.id ?? 'my-tasks';

        setSource(next);
      }),
      Match.when(
        () => key.sequence === '/' || key.name === 'i',
        () => {
          key.preventDefault();

          setEditing(true);
        },
      ),
      Match.when(Match.is('up', 'k'), () => {
        setIndex(Math.max(0, index - 1));
      }),
      Match.when(Match.is('down', 'j'), () => {
        setIndex(Math.min(count - 1, index + 1));
      }),
      Match.when('return', () => {
        choose();
      }),
      Match.orElse(() => {}),
    );
  });

  const sourceInfo = SOURCES.find(({ id }) => id === source);

  return (
    <box flexDirection="column" flexGrow={1}>
      <box flexDirection="row" height={1} gap={1}>
        {SOURCES.map((option) => (
          <text
            key={option.id}
            fg={option.id === source ? theme.black : theme.muted}
            bg={option.id === source ? theme.cyan : undefined}
            attributes={option.id === source ? TextAttributes.BOLD : TextAttributes.NONE}>
            {` ${option.label} `}
          </text>
        ))}

        <text fg={theme.dim}>Tab wisselt bron</text>
      </box>

      <box
        border
        borderStyle="rounded"
        borderColor={editing ? theme.focus : theme.border}
        height={3}
        flexDirection="row"
        paddingLeft={1}>
        <text fg={theme.muted}>{'Zoek '}</text>

        <input
          flexGrow={1}
          value={text}
          placeholder="tekst — Enter zoekt (leeg = alles voor Mijn taken)"
          focused={editing}
          onInput={setText}
          onSubmit={() => {
            setEditing(false);

            run(source, text);
          }}
          textColor={theme.text}
          focusedBackgroundColor={theme.raised}
        />
      </box>

      <Muted>{sourceInfo?.note ?? ''} Niet gevonden is geen bewijs van afwezigheid (limieten, rechten, status).</Muted>

      <Panel title="Resultaten" flexGrow={1}>
        <Async result={results} loading="Zoeken…">
          {(value) => {
            if (!('rows' in value)) {
              return <Muted>Druk / om te zoeken.</Muted>;
            }

            if (value.rows.length === 0) {
              return <Muted>Geen treffers binnen deze bron en limiet.</Muted>;
            }

            if (P.isTagged(value, 'Tasks')) {
              return (
                <scrollbox flexGrow={1}>
                  {value.rows.map((row, position) => (
                    <text key={row.taskId} fg={color(position)} wrapMode="none">
                      {`${marker(position)}${row.task}`}

                      <span fg={theme.muted}>{`  ${row.project}`}</span>

                      <span fg={row.open ? theme.green : theme.red}>
                        {row.open ? '  open' : `  gesloten ${row.projectState}`}
                      </span>

                      <span fg={Opt.contains(row.rate, 0) ? theme.yellow : theme.dim}>
                        {Opt.match(row.rate, { onNone: () => '', onSome: (rate) => `  ${rate.toFixed(2)}/u` })}
                      </span>

                      <span fg={theme.dim}>{`  ${row.taskId}`}</span>
                    </text>
                  ))}
                </scrollbox>
              );
            }

            if (P.isTagged(value, 'Projects')) {
              return (
                <scrollbox flexGrow={1}>
                  {value.rows.map((row, position) => (
                    <text key={Opt.getOrElse(row.projectId, () => row.number)} fg={color(position)} wrapMode="none">
                      {`${marker(position)}${row.number} ${row.name}`}

                      <span fg={theme.muted}>{`  ${row.client}  ${row.state}  ${row.billing}`}</span>
                    </text>
                  ))}
                </scrollbox>
              );
            }

            return (
              <scrollbox flexGrow={1}>
                {value.rows.map((row, position) => (
                  <text key={row.ticketId} fg={color(position)} wrapMode="none">
                    {`${marker(position)}#${row.number ?? '?'} ${row.name}`}

                    <span fg={theme.muted}>{`  ${row.client ?? ''}  ${row.state}`}</span>
                  </text>
                ))}
              </scrollbox>
            );
          }}
        </Async>
      </Panel>

      <box flexDirection="row" height={1}>
        <Hint keys="/" label="zoeken" />

        <Hint keys="Tab" label="bron" />

        <Hint keys="↑/↓" label="kies" />

        <Hint keys="Enter" label="taak → Boeken · project → taken · ticket → Support" />
      </box>
    </box>
  );
}
