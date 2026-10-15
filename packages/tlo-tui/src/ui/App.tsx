import { useState } from 'react';

import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes } from '@opentui/core';
import { useKeyboard, useRenderer } from '@opentui/react';
import * as Match from 'effect/Match';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import type { WriteMode } from '../orbit/Policy.js';
import { type Tab, TABS } from './atoms.js';
import { Badge, ErrorBox, Hint, Muted } from './components.js';
import { useAtoms } from './context.js';
import { theme } from './theme.js';
import { BookingView } from './views/BookingView.js';
import { CapabilitiesView } from './views/CapabilitiesView.js';
import { CorrectionsView } from './views/CorrectionsView.js';
import { ReplyView } from './views/ReplyView.js';
import { SearchView } from './views/SearchView.js';
import { SupportView } from './views/SupportView.js';
import { WeekView } from './views/WeekView.js';

function Header({
  source,
  endpoint,
  writeMode,
}: {
  readonly source: 'live' | 'demo';
  readonly endpoint: string;
  readonly writeMode: WriteMode;
}) {
  return (
    <box flexDirection="column" flexShrink={0}>
      {source === 'demo' ? (
        <box backgroundColor={theme.yellow} height={1} flexDirection="row" justifyContent="center">
          <text fg={theme.black} attributes={TextAttributes.BOLD}>
            DEMO-DATA · fictieve klanten, taken en tickets · niets gaat naar Orbit
          </text>
        </box>
      ) : undefined}

      <box flexDirection="row" height={1} backgroundColor={theme.raised} paddingLeft={1} paddingRight={1} gap={1}>
        <text fg={theme.accent} attributes={TextAttributes.BOLD}>
          TLO
        </text>

        <text fg={theme.muted}>Teamleader Orbit</text>

        <box flexGrow={1} />

        {source === 'demo' ? (
          <Badge label="DEMO" bg={theme.yellow} />
        ) : (
          <Badge label={`LIVE ${endpoint}`} bg={theme.green} />
        )}

        <Badge
          label={writeMode === 'read-only' ? 'READ-ONLY' : 'DIRECT: uren + interne notitie'}
          bg={writeMode === 'read-only' ? theme.cyan : theme.magenta}
        />

        <Badge label="TZ onbewezen" bg={theme.orange} />
      </box>
    </box>
  );
}

function TabBar({ active }: { readonly active: Tab }) {
  return (
    <box flexDirection="row" height={1} flexShrink={0} paddingLeft={1} gap={1}>
      {TABS.map((tab) =>
        tab.id === active ? (
          <text key={tab.id} fg={theme.black} bg={theme.accent} attributes={TextAttributes.BOLD}>
            {` ${tab.key} ${tab.label} `}
          </text>
        ) : (
          <text key={tab.id}>
            <span fg={theme.cyan}>{` ${tab.key}`}</span>

            <span fg={theme.muted}>{` ${tab.label} `}</span>
          </text>
        ),
      )}
    </box>
  );
}

const HELP: ReadonlyArray<readonly [string, string]> = [
  ['1–7', 'tab kiezen (Alt+cijfer tijdens typen)'],
  ['Esc', 'invoerveld verlaten'],
  ['Tab / ⇧Tab', 'volgend / vorig veld'],
  ['Ctrl+S', 'formulier naar review'],
  ['y', 'verstuur na review (alleen directe writes)'],
  ['r', 'herlezen (nooit opnieuw schrijven)'],
  ['?', 'deze hulp'],
  ['q', 'afsluiten'],
];

function Help() {
  return (
    <box
      position="absolute"
      top={4}
      left={8}
      width={64}
      border
      borderStyle="double"
      borderColor={theme.accent}
      backgroundColor={theme.panel}
      title=" Sneltoetsen "
      flexDirection="column"
      padding={1}
      zIndex={10}>
      {HELP.map(([keys, label]) => (
        <text key={keys}>
          <span fg={theme.cyan}>{keys.padEnd(14)}</span>

          <span fg={theme.text}>{label}</span>
        </text>
      ))}

      <text fg={theme.muted}>{''}</text>

      <text fg={theme.muted}>Correcties, verwijderingen en klantantwoorden worden alleen als concept opgeslagen.</text>
    </box>
  );
}

function Content({ tab }: { readonly tab: Tab }) {
  return Match.value(tab).pipe(
    Match.when('week', () => <WeekView />),
    Match.when('search', () => <SearchView />),
    Match.when('book', () => <BookingView />),
    Match.when('support', () => <SupportView />),
    Match.when('corrections', () => <CorrectionsView />),
    Match.when('reply', () => <ReplyView />),
    Match.when('capabilities', () => <CapabilitiesView />),
    Match.exhaustive,
  );
}

export function App() {
  const atoms = useAtoms();

  const renderer = useRenderer();

  const info = Hooks.useAtomValue(atoms.info);

  const [tab, setTab] = Hooks.useAtom(atoms.tab);

  const [editing, setEditing] = Hooks.useAtom(atoms.editing);

  const status = Hooks.useAtomValue(atoms.status);

  const [help, setHelp] = useState(false);

  useKeyboard((key) => {
    const target = TABS.find(({ key: shortcut }) => shortcut === key.name);

    const canSwitchTabs = key.meta || !editing;

    if (canSwitchTabs && target !== undefined) {
      key.preventDefault();

      key.stopPropagation();

      setEditing(false);

      setTab(target.id);

      return;
    }

    if (editing && key.name === 'escape') {
      setEditing(false);

      return;
    }

    if (editing) {
      return;
    }

    if (key.name === 'q') {
      renderer.destroy();
    } else if (key.sequence === '?') {
      setHelp((value) => !value);
    } else if (key.name === 'escape') {
      setHelp(false);
    }
  });

  if (AsyncResult.isInitial(info)) {
    return (
      <box padding={2}>
        <Muted>Verbinden met de lokale tlo-mcp gateway…</Muted>
      </box>
    );
  }

  if (AsyncResult.isFailure(info)) {
    return (
      <box padding={1} flexDirection="column" gap={1}>
        <text fg={theme.red} attributes={TextAttributes.BOLD}>
          Geen verbinding met TLO
        </text>

        <ErrorBox cause={info.cause} />

        <Muted>
          De TUI praat alleen met de lokale tlo-mcp gateway (127.0.0.1:4790) via de gateway-sleutel; hij doet zelf geen
          Orbit-login of token-refresh. Start de gateway (pitchfork of `vp exec tlo-mcp`) en probeer opnieuw, of start
          met --demo.
        </Muted>

        <Muted>q of Ctrl+C sluit af.</Muted>
      </box>
    );
  }

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={theme.bg}>
      <Header source={info.value.source} endpoint={info.value.endpoint} writeMode={info.value.writeMode} />

      <TabBar active={tab} />

      <box flexGrow={1} flexBasis={0} minHeight={0} flexDirection="column" paddingLeft={1} paddingRight={1}>
        <Content tab={tab} />
      </box>

      <box flexDirection="row" height={1} flexShrink={0} paddingLeft={1} backgroundColor={theme.raised}>
        {editing ? <Hint keys="Esc" label="klaar met typen" /> : <Hint keys="1-7" label="tabs" />}

        <Hint keys="?" label="hulp" />

        <Hint keys="q" label="stop" />

        <box flexGrow={1} />

        <text fg={theme.yellow}>{status}</text>
      </box>

      {help ? <Help /> : undefined}
    </box>
  );
}
