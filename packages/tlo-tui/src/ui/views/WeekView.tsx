import { useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import {
  type LocalDate,
  addDays,
  formatDuration,
  isoWeekNumber,
  monthLabel,
  shortDateLabel,
  weekBoundaryNotes,
  weekDates,
  weekdayLabel,
} from '../../domain/time.js';
import type { TimeEntryDetail, TimesheetWeek, WeekEntry } from '../../orbit/parse.js';
import { Async, Hint, Muted, Panel } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';

function bar(logged: number, capacity: number, width = 9): string {
  if (capacity === 0) {
    return logged === 0 ? '·'.repeat(width) : '▇'.repeat(width);
  }

  const filled = Math.min(width, Math.round((logged / capacity) * width));

  return `${'▇'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function weekTitle(date: LocalDate): string {
  const dates = weekDates(date);

  const first = dates[0] ?? date;

  const last = dates[6] ?? date;

  const months = monthLabel(first) === monthLabel(last) ? '' : ` ${monthLabel(first)}`;

  return `Week ${isoWeekNumber(date)} · ${Number(first.slice(8))}${months} – ${Number(last.slice(8))} ${monthLabel(last)} ${last.slice(0, 4)}`;
}

function DayStrip({
  week,
  selected,
  today,
}: {
  readonly week: TimesheetWeek;
  readonly selected: LocalDate;
  readonly today: LocalDate;
}) {
  return (
    <box flexDirection="row" gap={1} height={5}>
      {week.days.map((day) => {
        const active = day.date === selected;

        const over = day.capacityMinutes > 0 && day.loggedMinutes >= day.capacityMinutes;

        const planned = day.plannedMinutes > 0 ? ` +${formatDuration(day.plannedMinutes)}p` : '';

        return (
          <box
            key={day.date}
            flexDirection="column"
            width={11}
            border
            borderStyle={active ? 'heavy' : 'single'}
            borderColor={active ? theme.focus : theme.border}
            paddingLeft={0}>
            <text
              fg={day.date === today ? theme.yellow : theme.text}
              attributes={active ? TextAttributes.BOLD : TextAttributes.NONE}>
              {`${weekdayLabel(day.date)} ${Number(day.date.slice(8))}${day.state === 'OPEN' ? '' : ' 🔒'}`}
            </text>

            <text fg={over ? theme.green : theme.cyan}>{bar(day.loggedMinutes, day.capacityMinutes)}</text>

            <text fg={theme.muted}>{`${formatDuration(day.loggedMinutes)}${planned}`}</text>
          </box>
        );
      })}
    </box>
  );
}

function EntryRow({ entry, active }: { readonly entry: WeekEntry; readonly active: boolean }) {
  const planned = entry.kind === 'planned';

  return (
    <box flexDirection="row" height={1} backgroundColor={active ? theme.raised : undefined}>
      <text fg={active ? theme.focus : theme.dim}>{active ? '▸ ' : '  '}</text>

      <text fg={theme.cyan} width={6}>
        {entry.start}
      </text>

      <text fg={planned ? theme.yellow : theme.text} width={6}>
        {formatDuration(entry.durationMinutes)}
      </text>

      <text fg={theme.black} bg={planned ? theme.yellow : theme.green} width={3}>
        {planned ? ' P ' : ' L '}
      </text>

      <text fg={theme.text} flexGrow={1} wrapMode="none">
        {` ${entry.project}`}

        <span fg={theme.muted}>{entry.task === '' ? '' : ` / ${entry.task}`}</span>

        <span fg={theme.dim}>{entry.description === '' ? '' : ` — ${entry.description}`}</span>
      </text>
    </box>
  );
}

function EntryDetail(props: { readonly detail: TimeEntryDetail }) {
  const { detail } = props;

  const billable = Opt.match(detail.billable, {
    onNone: () => ({ label: 'onleesbaar', color: theme.red }),
    onSome: (value) => {
      const reason = value.reason === undefined ? '' : ` (${value.reason})`;

      return {
        label: `${value.billable ? 'ja' : 'nee'}${reason}`,
        color: value.billable ? theme.green : theme.yellow,
      };
    },
  });

  const rows: ReadonlyArray<readonly [string, string, string?]> = [
    ['Entry', detail.id],
    ['Wanneer', `${detail.date} ${detail.start} · ${formatDuration(detail.durationMinutes)}`],
    ['Soort', detail.kind],
    ['Project', detail.projectLabel],
    ['Taak', `${detail.taskName} (${Opt.getOrElse(detail.taskId, () => 'onbekend')})`],
    ['Klant', detail.client],
    ['Omschrijving', detail.description === '' ? '—' : detail.description],
    ['Billable', billable.label, billable.color],
    ['Locks', detail.locks, detail.editable ? theme.green : theme.red],
  ];

  return (
    <box flexDirection="column">
      {rows.map(([label, value, color]) => (
        <text key={label}>
          <span fg={theme.muted}>{label.padEnd(13)}</span>

          <span fg={color ?? theme.text}>{value}</span>
        </text>
      ))}
    </box>
  );
}

export function WeekView() {
  const atoms = useAtoms();

  const [selected, setSelected] = Hooks.useAtom(atoms.selectedDate);

  const week = Hooks.useAtomValue(atoms.week);

  const refresh = Hooks.useAtomRefresh(atoms.week);

  const editing = Hooks.useAtomValue(atoms.editing);

  const setTab = Hooks.useAtomSet(atoms.tab);

  const setDraft = Hooks.useAtomSet(atoms.bookingDraft);

  const setCorrection = Hooks.useAtomSet(atoms.correctionTarget);

  const setStatus = Hooks.useAtomSet(atoms.status);

  const [index, setIndex] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);

  const { today } = atoms;

  const entries = AsyncResult.isSuccess(week)
    ? week.value.entries.filter((entry) => entry.date === selected)
    : ([] as const);

  const current = entries[Math.min(index, entries.length - 1)];

  const detailAtom = current === undefined ? undefined : atoms.entryDetail(current.id);

  function move(days: number) {
    setSelected(addDays(selected, days));

    setIndex(0);
  }

  useKeyboard((key) => {
    if (editing) {
      return;
    }

    Match.value(key.name).pipe(
      Match.when(Match.is('left', 'h'), () => move(-1)),
      Match.when(Match.is('right', 'l'), () => move(1)),
      Match.when('[', () => move(-7)),
      Match.when(']', () => move(7)),
      Match.when('t', () => {
        setSelected(today);

        setIndex(0);
      }),
      Match.when(Match.is('up', 'k'), () => setIndex(Math.max(0, index - 1))),
      Match.when(Match.is('down', 'j'), () => setIndex(Math.min(entries.length - 1, index + 1))),
      Match.when('return', () => setDetailOpen(!detailOpen)),
      Match.when('r', () => {
        refresh();

        setStatus('Week herlezen…');
      }),
      Match.when('b', () => {
        setDraft((draft) => ({ ...draft, date: selected }));

        setTab('book');
      }),
      Match.when('c', () => {
        if (current === undefined) {
          return;
        }

        setCorrection(Opt.some(current.id));

        setTab('corrections');
      }),
      Match.orElse(() => {}),
    );
  });

  const notes = weekBoundaryNotes(selected);

  return (
    <box flexDirection="column" flexGrow={1}>
      <Async result={week} loading="Weekstaat lezen (GetTimesheetWeek)…">
        {(value, waiting) => {
          const logged = value.days.reduce((total, day) => total + day.loggedMinutes, 0);

          const planned = value.days.reduce((total, day) => total + day.plannedMinutes, 0);

          const capacity = value.days.reduce((total, day) => total + day.capacityMinutes, 0);

          const day = value.days.find((candidate) => candidate.date === selected);

          return (
            <box flexDirection="column" flexGrow={1}>
              <box flexDirection="row" height={1} gap={2}>
                <text fg={theme.text} attributes={TextAttributes.BOLD}>
                  {weekTitle(selected)}
                </text>

                <text fg={theme.muted}>{value.userName}</text>

                <box flexGrow={1} />

                <text fg={theme.cyan}>{`${formatDuration(logged)} / ${formatDuration(capacity)} gelogd`}</text>

                <text fg={theme.yellow}>{planned > 0 ? `${formatDuration(planned)} gepland` : ''}</text>

                <text fg={theme.dim}>{waiting ? '↻' : ' '}</text>
              </box>

              <DayStrip week={value} selected={selected} today={today} />

              {notes.length === 0 ? undefined : (
                <box flexDirection="row" height={1} gap={2}>
                  {notes.map((note) => (
                    <text key={`${note._tag}-${'date' in note ? note.date : note.to}`} fg={theme.orange}>
                      {Match.value(note).pipe(
                        Match.tagsExhaustive({
                          OffsetTransition: (note) =>
                            `⚠ zomer/wintertijd ${shortDateLabel(note.date)} (${note.zone}; bron-TZ onbewezen)`,
                          MonthBoundary: (note) => `⚠ maandgrens ${monthLabel(note.from)}→${monthLabel(note.to)}`,
                          YearBoundary: (note) => `⚠ jaargrens ${note.from.slice(0, 4)}→${note.to.slice(0, 4)}`,
                        }),
                      )}
                    </text>
                  ))}
                </box>
              )}

              <box flexDirection="row" flexGrow={1} gap={1}>
                <Panel
                  title={`${shortDateLabel(selected)} · ${day?.state ?? '?'} · ${formatDuration(day?.loggedMinutes ?? 0)} gelogd`}
                  flexGrow={2}
                  borderColor={day?.state === 'OPEN' ? theme.border : theme.dim}>
                  {entries.length === 0 ? (
                    <Muted>Geen registraties op deze dag.</Muted>
                  ) : (
                    entries.map((entry, row) => (
                      <EntryRow key={entry.id} entry={entry} active={row === Math.min(index, entries.length - 1)} />
                    ))
                  )}
                </Panel>

                {detailOpen && detailAtom !== undefined ? (
                  <Panel title="Detail · GetTimeEntry" flexGrow={1}>
                    <DetailLoader atom={detailAtom} />
                  </Panel>
                ) : undefined}
              </box>
            </box>
          );
        }}
      </Async>

      <box flexDirection="row" height={1}>
        <Hint keys="←/→" label="dag" />

        <Hint keys="[ ]" label="week" />

        <Hint keys="t" label="vandaag" />

        <Hint keys="↑/↓" label="entry" />

        <Hint keys="Enter" label="detail" />

        <Hint keys="b" label="boek op deze dag" />

        <Hint keys="c" label="correctie (concept)" />

        <Hint keys="r" label="herlees" />
      </box>
    </box>
  );
}

function DetailLoader({ atom }: { readonly atom: ReturnType<ReturnType<typeof useAtoms>['entryDetail']> }) {
  const detail = Hooks.useAtomValue(atom);

  return <Async result={detail}>{(value) => <EntryDetail detail={value} />}</Async>;
}
