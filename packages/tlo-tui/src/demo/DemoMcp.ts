import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import type * as McpSchema from 'effect/ai/McpSchema';

import {
  type LocalDate,
  ORBIT_WEEKDAYS,
  addDays,
  clockFromMinutes,
  clockMinutes,
  daysBetween,
  formatDuration,
  localDateAt,
  parseClockTime,
  parseLocalDate,
  startOfWeek,
  weekDates,
  weekdayIndex,
} from '../domain/time.js';
import { McpCallError, McpClient } from '../mcp/McpClient.js';
import { TOOL_POLICIES } from '../orbit/Policy.js';

/*
 * Fictional data only. Every name below is invented and marked DEMO; responses mimic the text formats the real
 * Orbit tools return so the same parsers, flows and readback run against them.
 */

const PrettyJson = Schema.fromJsonString(Schema.Json, { space: 2 });

// Orbit's JSON contract uses explicit nulls, not omitted fields.
const JSON_NULL = Opt.getOrThrow(Schema.decodeOption(Schema.fromJsonString(Schema.Null))('null'));

function demoId(prefix: string, n: number): string {
  return `${prefix}DEMO${String(n).padStart(9, '0')}`;
}

function tableCell(value: string): string {
  return value.replaceAll('|', String.raw`\|`);
}

interface DemoTask {
  readonly id: string;
  readonly project: string;
  readonly task: string;
  readonly client: string;
  readonly rate: number;
  readonly mine: boolean;
}

interface DemoEntry {
  readonly id: string;
  date: LocalDate;
  start: string;
  durationMinutes: number;
  readonly taskId: string;
  readonly planned: boolean;
  description: string;
  billable: boolean;
  readonly history: Array<string>;
}

interface DemoComment {
  readonly commentId: string;
  readonly date: string;
  readonly isInternal: boolean;
  readonly author: string;
  readonly title: string;
  readonly content: string;
  readonly loggedMinutes: number;
  readonly type: string;
}

interface DemoTicket {
  readonly ticketId: string;
  readonly number: string;
  readonly name: string;
  state: string;
  readonly priority: string;
  readonly client: string;
  readonly contact: string;
  assignee: string | null;
  readonly taskId: string | null;
  readonly project: string | null;
  readonly comments: Array<DemoComment>;
  readonly createdDate: string;
}

const USER = { name: 'Demo Gebruiker', id: demoId('US', 1) };

const TASKS: ReadonlyArray<DemoTask> = [
  {
    id: demoId('PT', 1),
    project: '9001 DEMO Klant BV | Website onderhoud',
    task: 'Development',
    client: 'DEMO Klant BV',
    rate: 110,
    mine: true,
  },
  {
    id: demoId('PT', 2),
    project: '9001 DEMO Klant BV | Website onderhoud',
    task: 'Overleg',
    client: 'DEMO Klant BV',
    rate: 110,
    mine: true,
  },
  {
    id: demoId('PT', 3),
    project: '9002 DEMO Retail | Webshop koppeling',
    task: 'Koppeling bouwen',
    client: 'DEMO Retail',
    rate: 95,
    mine: true,
  },
  {
    id: demoId('PT', 4),
    project: '9003 DEMO Interne uren',
    task: 'Interne uren',
    client: 'DEMO Bureau',
    rate: 0,
    mine: false,
  },
  {
    id: demoId('PT', 5),
    project: '9004 DEMO Stand-up',
    task: 'Morning stand-up',
    client: 'DEMO Bureau',
    rate: 0,
    mine: true,
  },
];

export interface DemoOptions {
  readonly today?: LocalDate;
  /**
   * `timeout`: CreateTimeEntry commits but the answer is lost, as a dropped connection would.
   */
  readonly fault?: 'timeout';
}

function taskById(id: string): DemoTask | undefined {
  return TASKS.find((task) => task.id === id);
}

function label(entry: DemoEntry): string {
  const task = taskById(entry.taskId);

  const description = entry.description === '' ? '' : ` — ${entry.description}`;

  return `${task?.project ?? '?'} / ${task?.task ?? '?'}${description}`;
}

function seedEntries(today: LocalDate): Array<DemoEntry> {
  const entries: Array<DemoEntry> = [];

  let counter = 1;

  function add(date: LocalDate, start: string, minutes: number, taskId: string, description = '', planned = false) {
    const task = taskById(taskId);

    entries.push({
      id: demoId('AC', counter++),
      date,
      start,
      durationMinutes: minutes,
      taskId,
      planned,
      description,
      billable: (task?.rate ?? 0) > 0,
      history: [`${date} 17:30 ${USER.name}: Entry Created`],
    });
  }

  const previousMonday = addDays(startOfWeek(today), -7);

  for (let offset = 0; offset < 14; offset++) {
    const date = addDays(previousMonday, offset);

    if (weekdayIndex(date) >= 5) {
      continue;
    }

    const future = daysBetween(today, date) > 0;

    const variant = offset % 3;

    if (future) {
      if (daysBetween(today, date) <= 2) {
        add(date, '09:00', 15, demoId('PT', 5), '', true);

        add(date, '09:15', 180, demoId('PT', 3), 'Planning: koppeling testen', true);
      }

      continue;
    }

    add(date, '09:00', 15, demoId('PT', 5));

    if (variant === 0) {
      add(date, '09:15', 165, demoId('PT', 1), 'Formulierfix en review');

      add(date, '13:00', 60, demoId('PT', 2), 'Weekoverleg DEMO Klant');

      add(date, '14:00', 120, demoId('PT', 3), 'Voorraadsync');
    } else if (variant === 1) {
      add(date, '09:15', 225, demoId('PT', 3), 'Orderexport');

      add(date, '13:30', 90, demoId('PT', 4), 'Kennissessie');
    } else {
      add(date, '09:15', 105, demoId('PT', 1), 'Performance-audit');

      add(date, '11:00', 60, demoId('PT', 2));

      add(date, '13:00', 150, demoId('PT', 1), 'Release voorbereiden');
    }
  }

  return entries;
}

function seedTickets(today: LocalDate): Array<DemoTicket> {
  const yesterday = addDays(today, -1);

  return [
    {
      ticketId: demoId('TC', 1),
      number: '7001',
      name: 'DEMO: contactformulier verstuurt niet',
      state: 'OPEN',
      priority: 'HIGH',
      client: 'DEMO Klant BV',
      contact: 'Demo Contactpersoon',
      assignee: USER.name,
      taskId: JSON_NULL,
      project: JSON_NULL,
      createdDate: `${yesterday} 10:12`,
      comments: [
        {
          commentId: demoId('CM', 2),
          date: `${today} 08:40`,
          isInternal: true,
          author: USER.name,
          title: 'New information was added',
          content: 'SMTP-log bekeken; mailer gaf 550.',
          loggedMinutes: 0,
          type: '',
        },
        {
          commentId: demoId('CM', 1),
          date: `${yesterday} 10:12`,
          isInternal: false,
          author: 'Demo Contactpersoon',
          title: 'New ticket',
          content: 'Het contactformulier geeft een foutmelding na versturen.',
          loggedMinutes: 0,
          type: 'ANSWER',
        },
      ],
    },
    {
      ticketId: demoId('TC', 2),
      number: '7002',
      name: 'DEMO: productfeed loopt achter',
      state: 'WAIT',
      priority: 'NORMAL',
      client: 'DEMO Retail',
      contact: 'Demo Inkoper',
      assignee: 'Demo Inkoper',
      taskId: demoId('PT', 3),
      project: '9002 DEMO Retail | Webshop koppeling',
      createdDate: `${addDays(today, -6)} 14:03`,
      comments: [
        {
          commentId: demoId('CM', 3),
          date: `${addDays(today, -5)} 09:30`,
          isInternal: false,
          author: USER.name,
          title: 'Answer',
          content: 'We hebben de sync-interval verlaagd. Zie je de nieuwe voorraad?',
          loggedMinutes: 30,
          type: 'ANSWER',
        },
      ],
    },
    {
      ticketId: demoId('TC', 3),
      number: '7003',
      name: 'DEMO: wachtwoord-reset mail komt niet aan',
      state: 'CLOSED',
      priority: 'LOW',
      client: 'DEMO Klant BV',
      contact: 'Demo Contactpersoon',
      assignee: USER.name,
      taskId: JSON_NULL,
      project: JSON_NULL,
      createdDate: `${addDays(today, -20)} 11:00`,
      comments: [],
    },
  ];
}

function tool(name: string, params: ReadonlyArray<string>): McpSchema.Tool {
  return {
    name,
    description: `DEMO ${name}`,
    inputSchema: { type: 'object', properties: Object.fromEntries(params.map((param) => [param, {}])) },
  } as McpSchema.Tool;
}

function text(value: string): McpSchema.CallToolResult {
  return { content: [{ type: 'text', text: value }] } as McpSchema.CallToolResult;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * In-memory stand-in for the gateway. Writes mutate only this process's memory.
 *
 * @param options
 */
export function makeDemoMcpLayer(options: DemoOptions = {}) {
  return Layer.effect(
    McpClient,
    Effect.gen(function* () {
      const today =
        options.today ??
        (yield* DateTime.now.pipe(
          Effect.map(DateTime.toEpochMillis),
          Effect.map((millis) => localDateAt(millis)),
        ));

      const entries = seedEntries(today);

      const tickets = seedTickets(today);

      let nextEntry = 500;

      let nextComment = 500;

      const finalBefore = startOfWeek(today);

      function dayState(date: LocalDate) {
        return date < finalBefore ? 'FINAL' : 'OPEN';
      }

      function sorted() {
        return entries.toSorted(
          (a, b) => a.date.localeCompare(b.date) || clockMinutes(a.start as never) - clockMinutes(b.start as never),
        );
      }

      function week(date: LocalDate) {
        const days = weekDates(date);

        const rows = days.map((day, index) => {
          const own = entries.filter((entry) => entry.date === day);

          function sum(planned: boolean) {
            return own
              .filter((entry) => entry.planned === planned)
              .reduce((total, entry) => total + entry.durationMinutes, 0);
          }

          return `| ${ORBIT_WEEKDAYS[index]} ${day} | ${dayState(day)} | ${formatDuration(sum(false))} | ${formatDuration(sum(true))} | 0h | ${index < 5 ? '8h' : '0h'} |`;
        });

        const logged = entries
          .filter((entry) => days.includes(entry.date) && !entry.planned)
          .reduce((total, entry) => total + entry.durationMinutes, 0);

        const lines = sorted()
          .filter((entry) => days.includes(entry.date))
          .map(
            (entry) =>
              `- ${ORBIT_WEEKDAYS[weekdayIndex(entry.date)]} ${entry.start} ${formatDuration(entry.durationMinutes)}${entry.planned ? ' [PLANNED]' : ''} ${label(entry)}  (api_id: ${entry.id})`,
          );

        return [
          `Timesheet week of ${date} for ${USER.name} (user api_id: ${USER.id})`,
          '',
          '| Day | State | Logged | Planned | Absence | Capacity |',
          '|---|---|---|---|---|---|',
          ...rows,
          '',
          `Week total: ${formatDuration(logged)} logged of 40h capacity.`,
          '',
          'Entries:',
          ...lines,
          '',
          'Planned entries can be confirmed (ConfirmPlannedEntry) or refused (RefusePlannedEntry). Locked entries cannot be changed.',
        ].join('\n');
      }

      function entryDetail(entry: DemoEntry) {
        const task = taskById(entry.taskId);

        const final = dayState(entry.date) === 'FINAL';

        return [
          `Time entry (api_id: ${entry.id})`,
          `- User: ${USER.name} (api_id: ${USER.id})`,
          `- Date: ${entry.date} ${entry.start}, duration ${formatDuration(entry.durationMinutes)}`,
          `- Kind: ${entry.planned ? 'planned (not yet confirmed)' : 'logged time'}`,
          `- Task: ${task?.task ?? '?'} on [${task?.project ?? '?'}](jump:PROJECT:0)  (task api_id: ${entry.taskId})`,
          `- Client: ${task?.client ?? '?'}`,
          ...(entry.description === '' ? [] : [`- Description: ${entry.description}`]),
          `- Billable: ${entry.billable ? 'yes' : (task?.rate ?? 0) === 0 ? 'no (no rate)' : 'no'}`,
          `- Locks: ${final ? 'final week — entry is locked' : 'none — entry can be edited'}`,
          '- History:',
          ...entry.history.map((line) => `  - ${line}`),
        ].join('\n');
      }

      function ticketJson(ticket: DemoTicket, detail: boolean) {
        return {
          ticketId: ticket.ticketId,
          number: ticket.number,
          name: ticket.name,
          state: ticket.state,
          priority: ticket.priority,
          queue: 'DEMO Support',
          client: ticket.client,
          contact: ticket.contact,
          assignee: ticket.assignee,
          projectId: ticket.taskId === JSON_NULL ? JSON_NULL : demoId('PR', 2),
          project: ticket.project,
          loggedMinutes: ticket.comments.reduce((total, comment) => total + comment.loggedMinutes, 0),
          billable: true,
          slaMinutesRemaining: ticket.state === 'OPEN' ? 95 : JSON_NULL,
          createdDate: ticket.createdDate,
          lastClientInput: ticket.comments.find((comment) => !comment.isInternal)?.date ?? JSON_NULL,
          lastAgentReply: JSON_NULL,
          closedDate: ticket.state === 'CLOSED' ? `${today} 08:00` : JSON_NULL,
          ...(detail
            ? {
                description: ticket.comments.at(-1)?.content ?? '',
                taskId: ticket.taskId,
                task: ticket.taskId === JSON_NULL ? JSON_NULL : (taskById(ticket.taskId)?.task ?? JSON_NULL),
                nonBillableReason: JSON_NULL,
                followUpAction: JSON_NULL,
                followUpDate: JSON_NULL,
              }
            : {}),
        };
      }

      const handlers: Record<string, (args: Schema.JsonObject) => string | Schema.Json> = {
        GetTimesheetWeek: (args) => {
          const date = parseLocalDate(str(args.date));

          return Opt.isNone(date) ? 'Error: date must be yyyy-MM-dd.' : week(date.value);
        },
        GetTimeEntry: (args) => {
          const entry = entries.find((candidate) => candidate.id === args.entryId);

          return entry === undefined ? `Error: '${str(args.entryId)}' is not a valid time entry.` : entryDetail(entry);
        },
        ListTimeEntries: (args) => {
          const from = str(args.dateFrom);

          const to = str(args.dateTo);

          const rows = sorted()
            .toReversed()
            .filter((entry) => entry.date >= from && entry.date <= to)
            .filter((entry) => args.taskId === undefined || entry.taskId === args.taskId);

          return [
            `${rows.length} time entries:`,
            '',
            ...rows.map(
              (entry) =>
                `- ${entry.date} ${entry.start} | ${USER.name} | ${formatDuration(entry.durationMinutes)}${entry.planned ? ' [PLANNED]' : ''} | ${label(entry)}  (api_id: ${entry.id})`,
            ),
          ].join('\n');
        },
        ListMyTasks: (args) => {
          const filter = str(args.text).toLowerCase();

          const rows = TASKS.filter((task) => task.mine).filter((task) =>
            `${task.project} ${task.task}`.toLowerCase().includes(filter),
          );

          return [
            `${rows.length} assignable task(s):`,
            '',
            '| Project | Task | Remaining | api_id |',
            '|---|---|---|---|',
            ...rows.map((task) => `| ${tableCell(task.project)} | ${task.task} | 40h | ${task.id} |`),
          ].join('\n');
        },
        SearchProjectItems: (args) => {
          const filter = str(args.text).toLowerCase();

          const rows = TASKS.filter((task) => `${task.project} ${task.task}`.toLowerCase().includes(filter));

          return [
            `Found ${rows.length} matching project item(s):`,
            '',
            ...rows.flatMap((task) => {
              const [number = '', ...name] = task.project.split(' ');

              return [
                `- [TASK, open] "${task.task}" — 80.0h @ ${task.rate.toFixed(2)}/h`,
                `  In project [${number}](jump:PROJECT:0) "${name.join(' ')}" — OPEN (item api_id: ${task.id})`,
                '',
              ];
            }),
          ].join('\n');
        },
        ListProjects: (args) => {
          const filter = str(args.text).toLowerCase();

          const projects = [...new Set(TASKS.map((task) => task.project))].filter((project) =>
            project.toLowerCase().includes(filter),
          );

          return [
            `Found ${projects.length} project(s):`,
            '',
            '| Project | Name | Client | Owner | State | Billing | Budget | Invoiced | Remaining | End |',
            '|---|---|---|---|---|---|---:|---:|---:|---|',
            ...projects.map((project) => {
              const [number = '', ...name] = project.split(' ');

              const client = TASKS.find((task) => task.project === project)?.client ?? '';

              return `| [${number}](jump:PROJECT:0) | ${tableCell(name.join(' '))} | ${client} | ${USER.name} | OPEN | HOURS | 0.00 | 0.00 | 0.00 | |`;
            }),
            '',
            `api_ids: ${projects.map((_, index) => demoId('PR', index + 1)).join(', ')}`,
          ].join('\n');
        },
        ListTickets: (args) => {
          const states = str(args.state) === '' ? ['NEW', 'OPEN', 'WAIT'] : str(args.state).split('|');

          const query = str(args.query).toLowerCase();

          const rows = tickets
            .filter((ticket) => states.includes(ticket.state))
            .filter((ticket) => `${ticket.number} ${ticket.name}`.toLowerCase().includes(query));

          return { count: rows.length, tickets: rows.map((ticket) => ticketJson(ticket, false)) };
        },
        GetTicketDetail: (args) => {
          const ticket = tickets.find((candidate) => candidate.ticketId === args.ticketId);

          return ticket === undefined
            ? `Error: '${str(args.ticketId)}' is not a valid TICKET API ID for this account.`
            : ticketJson(ticket, true);
        },
        ListTicketComments: (args) => {
          const ticket = tickets.find((candidate) => candidate.ticketId === args.ticketId);

          return ticket === undefined
            ? `Error: '${str(args.ticketId)}' is not a valid TICKET API ID for this account.`
            : {
                ticketId: ticket.ticketId,
                count: ticket.comments.length,
                comments: ticket.comments.map((comment) => ({ ...comment, source: JSON_NULL, authorId: JSON_NULL })),
              };
        },
        CreateTimeEntry: (args) => {
          const [rawDate = '', rawTime = '09:00'] = str(args.date).split(' ', 2);

          const date = parseLocalDate(rawDate);

          const start = parseClockTime(rawTime);

          const task = taskById(str(args.taskId));

          const minutes = typeof args.durationMinutes === 'number' ? args.durationMinutes : 0;

          if (task === undefined || Opt.isNone(date) || Opt.isNone(start) || minutes <= 0) {
            return 'Error: invalid taskId, date or duration.';
          }

          if (dayState(date.value) === 'FINAL') {
            return `Error: ${date.value} is in a submitted (FINAL) week.`;
          }

          const entry: DemoEntry = {
            id: demoId('AC', nextEntry++),
            date: date.value,
            start: start.value,
            durationMinutes: minutes,
            taskId: task.id,
            planned: false,
            description: str(args.description),
            // Mirrors observed behaviour: zero-rate tasks read back as non-billable whatever was requested.
            billable: args.billable !== false && task.rate > 0,
            history: [`${today} ${clockFromMinutes(12 * 60)} ${USER.name}: Entry Created (DEMO)`],
          };

          entries.push(entry);

          return `Time entry created (api_id: ${entry.id}).`;
        },
        AddInternalComment: (args) => {
          const ticket = tickets.find((candidate) => candidate.ticketId === args.ticketId);

          if (ticket === undefined) {
            return `Error: '${str(args.ticketId)}' is not a valid TICKET API ID for this account.`;
          }

          const comment: DemoComment = {
            commentId: demoId('CM', nextComment++),
            date: `${today} 12:00`,
            isInternal: true,
            author: USER.name,
            title: 'New information was added',
            content: `   ${str(args.note)}   `,
            loggedMinutes: 0,
            type: '',
          };

          ticket.comments.unshift(comment);

          return `Internal note added (comment api_id: ${comment.commentId}).`;
        },
      };

      return McpClient.of({
        endpoint: 'demo://in-memory',
        serverName: 'tlo-tui DEMO',
        tools: TOOL_POLICIES.map((policy) => tool(policy.name, policy.params)),
        callTool: Effect.fn('DemoMcp.callTool')(function* (name, args) {
          const handler = handlers[name];

          if (handler === undefined) {
            return text(`Error: DEMO has no handler for ${name}.`);
          }

          const raw = handler(args);

          const answer = typeof raw === 'string' ? raw : yield* Schema.encodeEffect(PrettyJson)(raw).pipe(Effect.orDie);

          if (name === 'CreateTimeEntry' && options.fault === 'timeout' && !answer.startsWith('Error')) {
            return yield* McpCallError.make({ tool: name, message: 'DEMO: antwoord verloren.', delivery: 'unknown' });
          }

          return text(answer);
        }),
      });
    }),
  );
}
