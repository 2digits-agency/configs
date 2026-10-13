import * as Data from 'effect/Data';
import * as P from 'effect/Predicate';
import type * as McpSchema from 'effect/ai/McpSchema';

/**
 * Evidence class of a capability. Only `proven-*` MCP tools are wired into flows; historical browser AJAX calls and
 * discovered-but-unproven MCP tools are listed for transparency and never called.
 */
export type Evidence = 'proven-mcp' | 'unproven-mcp' | 'historical-har';

/**
 * - `read`: called directly.
 * - `direct-write`: called once after exact-payload review (existing policy: acting-user time, simple internal note).
 * - `approval-only`: the TUI only drafts a change request; execution needs per-call Executor approval.
 * - `not-exposed`: never called.
 */
export type Access = 'read' | 'direct-write' | 'approval-only' | 'not-exposed';

export interface ToolPolicy {
  readonly name: string;
  readonly evidence: Evidence;
  readonly access: Access;
  /**
   * Input properties the flow relies on; their absence in `tools/list` disables the tool (schema drift).
   */
  readonly params: ReadonlyArray<string>;
  readonly note: string;
}

const PROVEN_MCP = 'proven-mcp';

const UNPROVEN_MCP = 'unproven-mcp';

const NOT_EXPOSED = 'not-exposed';

export const TOOL_POLICIES: ReadonlyArray<ToolPolicy> = [
  {
    name: 'GetTimesheetWeek',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['date', 'user'],
    note: 'Weekstaat: dagstatus OPEN/FINAL, uren, entries met api_id.',
  },
  {
    name: 'ListTimeEntries',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['dateFrom', 'dateTo', 'taskId', 'billable'],
    note: 'dateTo is inclusief; max 100 rijen.',
  },
  {
    name: 'GetTimeEntry',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['entryId'],
    note: 'Readback: bestemming, tijd, duur, billable, locks.',
  },
  {
    name: 'ListMyTasks',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['text'],
    note: 'Alleen toegewezen backlog, niet alle taken.',
  },
  {
    name: 'SearchProjectItems',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['text', 'projectId', 'itemType', 'openOnly'],
    note: 'Max 50 treffers; zoekt items, geen projectnamen.',
  },
  {
    name: 'ListProjects',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['text', 'states', 'pageSize'],
    note: 'mine=true betekent eigenaar, niet "waar ik op werk".',
  },
  {
    name: 'ListTickets',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['query', 'state', 'limit'],
    note: 'createdTo is exclusief; standaard alleen actieve tickets.',
  },
  {
    name: 'GetTicketDetail',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['ticketId'],
    note: 'Vereist TC-api_id, nooit het zichtbare ticketnummer.',
  },
  {
    name: 'ListTicketComments',
    evidence: PROVEN_MCP,
    access: 'read',
    params: ['ticketId', 'includeInternal', 'limit'],
    note: 'Klantantwoorden (ANSWER), interne notities, systeemregels.',
  },
  {
    name: 'CreateTimeEntry',
    evidence: PROVEN_MCP,
    access: 'direct-write',
    params: ['taskId', 'date', 'durationMinutes', 'description', 'billable'],
    note: 'Eigen uren; billable is boolean; starttijd altijd expliciet (anders 09:00).',
  },
  {
    name: 'AddInternalComment',
    evidence: PROVEN_MCP,
    access: 'direct-write',
    params: ['ticketId', 'note'],
    note: 'Alleen eenvoudige notitie: zonder logMinutes (boekt op "nu") en zonder assignToUser.',
  },
  {
    name: 'UpdateTimeEntry',
    evidence: PROVEN_MCP,
    access: 'approval-only',
    params: ['entryId', 'date', 'durationMinutes', 'description', 'taskId', 'billable'],
    note: 'Correctie: billable is string; succes bewijst niets zonder readback.',
  },
  {
    name: 'DeleteTimeEntry',
    evidence: PROVEN_MCP,
    access: 'approval-only',
    params: ['entryId'],
    note: 'Pas na geverifieerde vervanging; geblokkeerd voor gefactureerd/FINAL.',
  },
  {
    name: 'ReplyToTicket',
    evidence: PROVEN_MCP,
    access: 'approval-only',
    params: ['ticketId', 'message', 'waitForClient', 'followUpAction', 'followUpDate'],
    note: 'Klantzichtbaar: notificatie, standaard WAIT, heropent gesloten tickets.',
  },
  {
    name: 'StartTimer',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'In policy genoemd, nooit succesvol aangeroepen.',
  },
  {
    name: 'StopTimer',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'In policy genoemd, nooit succesvol aangeroepen.',
  },
  {
    name: 'CreateTodo',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'Boardkaart aanmaken: contract ontdekt, niet live bewezen.',
  },
  {
    name: 'UpdateTodo',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'Geen custom-field parameter; niet live bewezen.',
  },
  {
    name: 'MoveTodo',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'Niet live bewezen via MCP.',
  },
  {
    name: 'GetCustomFieldValues',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'Huidige field CODEs onbekend; niet bewezen.',
  },
  {
    name: 'SetCustomFieldValues',
    evidence: UNPROVEN_MCP,
    access: NOT_EXPOSED,
    params: [],
    note: 'Gebruik nooit HAR EXT_*-id’s als field codes.',
  },
];

/**
 * Browser AJAX writes seen in a historical HAR capture. Not MCP tools; no session lifecycle proven.
 */
export const HISTORICAL_HAR_WRITES: ReadonlyArray<{ readonly route: string; readonly note: string }> = [
  { route: 'POST /ajax/board/SetTodo', note: 'Kaart aanmaken/wijzigen (BOARDID, BOARDLISTID, NAME, OWNERID…).' },
  { route: 'POST /ajax/board/SetTodo (FULLFORM=1)', note: 'Schattingen via EXT_29287/EXT_29288/EXT_29780.' },
  { route: 'POST /ajax/board/MoveTodo', note: 'Status/volgorde (BOARDLISTID, SORTINDEX).' },
  { route: '/ajax/board/DeleteTodo', note: 'Gezien in capture, nooit blootgesteld.' },
];

export type ToolStatus =
  | { readonly _tag: 'Available' }
  | { readonly _tag: 'Missing' }
  | { readonly _tag: 'Drift'; readonly missingParams: ReadonlyArray<string> };

export const ToolStatus = Data.taggedEnum<ToolStatus>();

export interface Capability {
  readonly policy: ToolPolicy;
  readonly status: ToolStatus;
}

function inputProperties(tool: McpSchema.Tool): ReadonlySet<string> {
  const schema: unknown = tool.inputSchema;

  if (typeof schema !== 'object' || schema === null || !('properties' in schema)) {
    return new Set();
  }

  const { properties } = schema;

  return typeof properties === 'object' && properties !== null ? new Set(Object.keys(properties)) : new Set();
}

/**
 * Compares the gateway's live tool list with the policy. A tool whose expected inputs disappeared is treated as
 * unavailable rather than called with a guessed contract.
 *
 * @param tools
 */
export function assessCapabilities(tools: ReadonlyArray<McpSchema.Tool>): ReadonlyArray<Capability> {
  const byName = new Map(tools.map((tool) => [tool.name, tool]));

  return TOOL_POLICIES.map((policy) => {
    const tool = byName.get(policy.name);

    if (tool === undefined) {
      return { policy, status: ToolStatus.Missing() };
    }

    const properties = inputProperties(tool);

    const missingParams = policy.params.filter((param) => !properties.has(param));

    return {
      policy,
      status: missingParams.length === 0 ? ToolStatus.Available() : ToolStatus.Drift({ missingParams }),
    };
  });
}

export type WriteMode = 'direct-writes' | 'read-only';

/**
 * The client-side allowlist. It is defence in depth only: the gateway key itself is not scoped, and the gateway does
 * not enforce Executor policy.
 *
 * @param capabilities
 * @param mode
 */
export function callableTools(capabilities: ReadonlyArray<Capability>, mode: WriteMode): ReadonlySet<string> {
  return new Set(
    capabilities
      .filter(
        ({ policy, status }) =>
          P.isTagged(status, 'Available') &&
          policy.evidence === PROVEN_MCP &&
          (policy.access === 'read' || (policy.access === 'direct-write' && mode === 'direct-writes')),
      )
      .map(({ policy }) => policy.name),
  );
}
