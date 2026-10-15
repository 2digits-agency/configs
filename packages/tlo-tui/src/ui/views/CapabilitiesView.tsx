import * as Hooks from '@effect/atom-react/Hooks';
import { TextAttributes } from '@opentui/core';
import * as Match from 'effect/Match';

import { type Access, type Capability, HISTORICAL_HAR_WRITES } from '../../orbit/Policy.js';
import { Async, Muted, Panel } from '../components.js';
import { useAtoms } from '../context.js';
import { theme } from '../theme.js';

const ACCESS: Record<Access, { readonly label: string; readonly color: string }> = {
  read: { label: 'lezen', color: theme.green },
  'direct-write': { label: 'direct na review', color: theme.magenta },
  'approval-only': { label: 'alleen concept', color: theme.yellow },
  'not-exposed': { label: 'niet gebouwd', color: theme.dim },
};

function Row({ capability, callable }: { readonly capability: Capability; readonly callable: boolean }) {
  const { policy, status } = capability;

  const access = ACCESS[policy.access];

  const gateway = Match.value(status).pipe(
    Match.tagsExhaustive({
      Available: () => ({ label: 'aanwezig', color: theme.green }),
      Missing: () => ({ label: 'ontbreekt', color: theme.red }),
      Drift: ({ missingParams }) => ({ label: `drift: ${missingParams.join(',')}`, color: theme.red }),
    }),
  );

  return (
    <box flexDirection="row" height={1}>
      <text fg={callable ? theme.green : theme.dim} width={3}>
        {callable ? ' ●' : ' ○'}
      </text>

      <text fg={theme.text} width={22}>
        {policy.name}
      </text>

      <text fg={access.color} width={18}>
        {access.label}
      </text>

      <text fg={gateway.color} width={14}>
        {gateway.label}
      </text>

      <text fg={theme.muted} flexGrow={1} wrapMode="none">
        {policy.note}
      </text>
    </box>
  );
}

export function CapabilitiesView() {
  const atoms = useAtoms();

  const info = Hooks.useAtomValue(atoms.info);

  return (
    <Async result={info}>
      {(value) => {
        const proven = value.capabilities.filter(({ policy }) => policy.evidence === 'proven-mcp');

        const unproven = value.capabilities.filter(({ policy }) => policy.evidence === 'unproven-mcp');

        return (
          <box flexDirection="column" flexGrow={1}>
            <Panel title="Verbinding">
              <text>
                <span fg={theme.muted}>Bron </span>

                <span fg={value.source === 'demo' ? theme.yellow : theme.green}>
                  {value.source === 'demo' ? 'DEMO (in-memory, fictief)' : `lokale gateway ${value.endpoint}`}
                </span>
              </text>

              <Muted>
                Auth: gateway-sleutel (Bearer) uit ~/.config/2digits/tlo-mcp/gateway.key. Orbit OAuth en token-refresh
                blijven in tlo-mcp; deze TUI start geen tweede refresh-proces.
              </Muted>

              <Muted>
                De allowlist hieronder is client-side. De gatewaysleutel zelf is niet beperkt en de gateway handhaaft
                geen Executor-policy — daarom zijn correcties, verwijderingen en klantantwoorden hier alleen concept.
              </Muted>

              <Muted>
                Tijd: Orbit-klokwaarden hebben geen offset; de bron-tijdzone is onbewezen. Datums/tijden worden niet
                geconverteerd; DST-dagen worden gemarkeerd.
              </Muted>
            </Panel>

            <Panel title="Bewezen MCP-tools (● = aanroepbaar in deze sessie)">
              {proven.map((capability) => (
                <Row
                  key={capability.policy.name}
                  capability={capability}
                  callable={value.callable.has(capability.policy.name)}
                />
              ))}
            </Panel>

            <box flexDirection="row" gap={1} flexGrow={1}>
              <Panel title="Onbewezen MCP · niet gebouwd" flexGrow={1}>
                {unproven.map((capability) => (
                  <Row key={capability.policy.name} capability={capability} callable={false} />
                ))}
              </Panel>

              <Panel title="Historische HAR board-writes · geen MCP" flexGrow={1} borderColor={theme.dim}>
                {HISTORICAL_HAR_WRITES.map((write) => (
                  <text key={write.route}>
                    <span fg={theme.dim} attributes={TextAttributes.STRIKETHROUGH}>
                      {write.route}
                    </span>

                    <span fg={theme.muted}>{`  ${write.note}`}</span>
                  </text>
                ))}

                <Muted>Browser-AJAX uit een oude capture; sessie/refresh onbewezen. Boards blijven read-only.</Muted>
              </Panel>
            </box>
          </box>
        );
      }}
    </Async>
  );
}
