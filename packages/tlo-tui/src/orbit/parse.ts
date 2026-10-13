import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { type BillableReadback, parseBillableReadback } from '../domain/billable.js';
import { type TaskId, type TimeEntryId, parseTaskId } from '../domain/ids.js';
import {
  type ClockTime,
  type LocalDate,
  ORBIT_WEEKDAYS,
  parseClockTime,
  parseDuration,
  parseLocalDate,
} from '../domain/time.js';

/*
 * Orbit tools return no `structuredContent`. Time registration tools answer in Markdown, ticket tools in JSON text.
 * Parsers here are tolerant of extra lines but return `None` when the shape they depend on is absent, so callers can
 * show the raw text and keep dependent writes disabled.
 */

interface WeekDay {
  readonly date: LocalDate;
  readonly state: string;
  readonly loggedMinutes: number;
  readonly plannedMinutes: number;
  readonly absenceMinutes: number;
  readonly capacityMinutes: number;
}

export interface WeekEntry {
  readonly id: TimeEntryId;
  readonly date: LocalDate;
  readonly start: ClockTime;
  readonly durationMinutes: number;
  readonly kind: 'logged' | 'planned';
  readonly tags: ReadonlyArray<string>;
  readonly label: string;
  readonly project: string;
  readonly task: string;
  readonly description: string;
}

export interface TimesheetWeek {
  readonly weekOf: LocalDate;
  readonly userName: string;
  readonly userId: string;
  readonly days: ReadonlyArray<WeekDay>;
  readonly entries: ReadonlyArray<WeekEntry>;
  readonly summary: string;
}

export interface TimeEntryDetail {
  readonly id: TimeEntryId;
  readonly userName: string;
  readonly date: LocalDate;
  readonly start: ClockTime;
  readonly durationMinutes: number;
  readonly kind: string;
  readonly taskName: string;
  readonly projectLabel: string;
  readonly taskId: Opt.Option<TaskId>;
  readonly client: string;
  readonly description: string;
  readonly billable: Opt.Option<BillableReadback>;
  readonly locks: string;
  readonly editable: boolean;
}

export interface ListedEntry {
  readonly id: TimeEntryId;
  readonly date: LocalDate;
  readonly start: ClockTime;
  readonly user: string;
  readonly durationMinutes: number;
  readonly planned: boolean;
  readonly label: string;
}

export interface TaskOption {
  readonly taskId: TaskId;
  readonly project: string;
  readonly task: string;
  readonly open: boolean;
  /**
   * Hourly rate when the source shows one. A `0.00` rate commonly reads back as "no (no rate)".
   */
  readonly rate: Opt.Option<number>;
  readonly remaining: string;
  readonly projectState: string;
}

export interface ProjectRow {
  readonly projectId: Opt.Option<string>;
  readonly number: string;
  readonly name: string;
  readonly client: string;
  readonly state: string;
  readonly billing: string;
}

interface MarkdownTable {
  readonly header: ReadonlyArray<string>;
  readonly rows: ReadonlyArray<ReadonlyArray<string>>;
}

function stripLinks(cell: string): string {
  return cell.replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
}

function splitRow(line: string): Array<string> {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => stripLinks(cell.replaceAll(String.raw`\|`, '|')));
}

/**
 * First Markdown table in `text`. Escaped pipes are cell content; ambiguous rows fail closed rather than shifting
 * fields.
 *
 * @param text
 */
function parseMarkdownTable(text: string): Opt.Option<MarkdownTable> {
  const lines = text.split('\n');

  const start = lines.findIndex(
    (line, index) => line.trimStart().startsWith('|') && /^\|[\s|:-]+\|$/.test(lines[index + 1]?.trim() ?? ''),
  );

  if (start === -1) {
    return Opt.none();
  }

  const header = splitRow(lines[start] ?? '');

  const rows: Array<Array<string>> = [];

  const body = lines.slice(start + 2);

  for (const line of body) {
    if (!line.trimStart().startsWith('|')) {
      break;
    }

    const row = splitRow(line);

    if (row.length !== header.length) {
      return Opt.none();
    }

    rows.push(row);
  }

  return Opt.some({ header, rows });
}

function minutes(value: string | undefined): Opt.Option<number> {
  return value === undefined ? Opt.none() : parseDuration(value);
}

const WEEK_HEADER = /^Timesheet week of (\d{4}-\d{2}-\d{2}) for (.+?) \(user api_id: ([A-Z0-9]+)\)/m;

const WEEK_ENTRY =
  /^- (Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}:\d{2}) (\d+h(?:\d{2})?)((?: \[[^\]]+\])*) (.*?)\(api_id: (AC[A-Z0-9]{13})\)\s*$/;

function splitLabel(label: string): { project: string; task: string; description: string } {
  const [head = '', ...rest] = label.split(' — ');

  const slash = head.indexOf(' / ');

  return {
    project: (slash === -1 ? head : head.slice(0, slash)).trim(),
    task: slash === -1 ? '' : head.slice(slash + 3).trim(),
    description: rest.join(' — ').trim(),
  };
}

function parseWeekDays(table: MarkdownTable) {
  const days: Array<WeekDay> = [];

  const dateByWeekday = new Map<string, LocalDate>();

  for (const [day = '', state = '', logged, planned, absence, capacity] of table.rows) {
    const [weekday = '', rawDate = ''] = day.split(' ', 2);

    const date = parseLocalDate(rawDate);

    const values = [minutes(logged), minutes(planned), minutes(absence), minutes(capacity)];

    if (Opt.isNone(date) || values.some((element) => Opt.isNone(element))) {
      return Opt.none();
    }

    const [loggedMinutes = 0, plannedMinutes = 0, absenceMinutes = 0, capacityMinutes = 0] = values.map((value) =>
      Opt.getOrElse(value, () => 0),
    );

    dateByWeekday.set(weekday, date.value);

    days.push({ date: date.value, state, loggedMinutes, plannedMinutes, absenceMinutes, capacityMinutes });
  }

  if (days.length !== 7 || ORBIT_WEEKDAYS.some((weekday) => !dateByWeekday.has(weekday))) {
    return Opt.none();
  }

  return Opt.some({ days, dateByWeekday });
}

function parseWeekEntries(text: string, dateByWeekday: ReadonlyMap<string, LocalDate>): Opt.Option<Array<WeekEntry>> {
  const entries: Array<WeekEntry> = [];

  for (const line of text.split('\n')) {
    const match = WEEK_ENTRY.exec(line.trimEnd());

    if (match === null) {
      continue;
    }

    const [, weekday = '', time = '', duration = '', rawTags = '', label = '', id = ''] = match;

    const date = dateByWeekday.get(weekday);

    const start = parseClockTime(time);

    const durationMinutes = parseDuration(duration);

    if (date === undefined || Opt.isNone(start) || Opt.isNone(durationMinutes)) {
      return Opt.none();
    }

    const tags = rawTags
      .matchAll(/\[([^\]]+)\]/g)
      .map((tag) => tag[1] ?? '')
      .toArray();

    entries.push({
      id: id as TimeEntryId,
      date,
      start: start.value,
      durationMinutes: durationMinutes.value,
      kind: tags.includes('PLANNED') ? 'planned' : 'logged',
      tags,
      label: label.trim(),
      ...splitLabel(label.trim()),
    });
  }

  return Opt.some(entries);
}

export function parseTimesheetWeek(text: string): Opt.Option<TimesheetWeek> {
  const header = WEEK_HEADER.exec(text);

  const table = parseMarkdownTable(text);

  if (header === null || Opt.isNone(table)) {
    return Opt.none();
  }

  const weekOf = parseLocalDate(header[1] ?? '');

  const calendar = parseWeekDays(table.value);

  if (Opt.isNone(weekOf) || Opt.isNone(calendar)) {
    return Opt.none();
  }

  const entries = parseWeekEntries(text, calendar.value.dateByWeekday);

  if (Opt.isNone(entries)) {
    return Opt.none();
  }

  const summary = /^Week total: .*$/m.exec(text)?.[0] ?? '';

  return Opt.some({
    weekOf: weekOf.value,
    userName: header[2] ?? '',
    userId: header[3] ?? '',
    days: calendar.value.days,
    entries: entries.value,
    summary,
  });
}

function field(text: string, key: string): string | undefined {
  return new RegExp(`^- ${key}: (.*)$`, 'm').exec(text)?.[1]?.trim();
}

function detailTask(text: string) {
  const task = field(text, 'Task') ?? '';

  const taskMatch = /^(.*?) on \[([^\]]*)\]\([^)]*\)\s*(?:\(task api_id: ([A-Z0-9]+)\))?/.exec(task);

  return {
    taskName: taskMatch?.[1]?.trim() ?? task,
    projectLabel: taskMatch?.[2]?.trim() ?? '',
    taskId: parseTaskId(taskMatch?.[3] ?? ''),
  };
}

export function parseTimeEntryDetail(text: string): Opt.Option<TimeEntryDetail> {
  const id = /^Time entry \(api_id: (AC[A-Z0-9]{13})\)/m.exec(text)?.[1];

  const when = /^(\d{4}-\d{2}-\d{2}) (\d{1,2}:\d{2}), duration (\S+)$/.exec(field(text, 'Date') ?? '');

  if (id === undefined || when === null) {
    return Opt.none();
  }

  const date = parseLocalDate(when[1] ?? '');

  const start = parseClockTime(when[2] ?? '');

  const durationMinutes = parseDuration(when[3] ?? '');

  if (Opt.isNone(date) || Opt.isNone(start) || Opt.isNone(durationMinutes)) {
    return Opt.none();
  }

  const locks = field(text, 'Locks') ?? '';

  return Opt.some({
    id: id as TimeEntryId,
    userName: (field(text, 'User') ?? '').replace(/\s*\(api_id: .*\)$/, ''),
    date: date.value,
    start: start.value,
    durationMinutes: durationMinutes.value,
    kind: field(text, 'Kind') ?? '',
    ...detailTask(text),
    client: field(text, 'Client') ?? '',
    description: field(text, 'Description') ?? '',
    billable: Opt.flatMap(Opt.fromUndefinedOr(field(text, 'Billable')), parseBillableReadback),
    locks,
    editable: /^none\b/i.test(locks),
  });
}

const LISTED_ENTRY =
  /^- (\d{4}-\d{2}-\d{2}) (\d{1,2}:\d{2}) \| (.+?) \| (\d+h(?:\d{2})?)((?: \[[^\]]+\])*) \| (.*?)\(api_id: (AC[A-Z0-9]{13})\)\s*$/;

/**
 * `ListTimeEntries` output. Returns an empty list for an explicit zero count.
 *
 * @param text
 */
export function parseTimeEntryList(text: string): Opt.Option<ReadonlyArray<ListedEntry>> {
  const count = /^(\d+) time entr(?:y|ies)/m.exec(text);

  if (count === null) {
    return Opt.none();
  }

  const entries: Array<ListedEntry> = [];

  for (const line of text.split('\n')) {
    const match = LISTED_ENTRY.exec(line.trimEnd());

    if (match === null) {
      continue;
    }

    const date = parseLocalDate(match[1] ?? '');

    const start = parseClockTime(match[2] ?? '');

    const durationMinutes = parseDuration(match[4] ?? '');

    if (Opt.isNone(date) || Opt.isNone(start) || Opt.isNone(durationMinutes)) {
      return Opt.none();
    }

    entries.push({
      id: (match[7] ?? '') as TimeEntryId,
      date: date.value,
      start: start.value,
      user: match[3] ?? '',
      durationMinutes: durationMinutes.value,
      planned: (match[5] ?? '').includes('[PLANNED]'),
      label: (match[6] ?? '').trim(),
    });
  }

  return entries.length === Number(count[1]) ? Opt.some(entries) : Opt.none();
}

export function parseMyTasks(text: string): Opt.Option<ReadonlyArray<TaskOption>> {
  const count = /^(\d+) assignable task/m.exec(text);

  if (count?.[1] === '0') {
    return Opt.some([]);
  }

  return Opt.flatMap(parseMarkdownTable(text), ({ header, rows }) => {
    function index(name: string) {
      return header.findIndex((cell) => cell.toLowerCase() === name);
    }

    const [project = -1, task = -1, remaining = -1, apiId = -1] = ['project', 'task', 'remaining', 'api_id'].map(
      (element) => index(element),
    );

    if ([project, task, apiId].some((value) => value < 0)) {
      return Opt.none();
    }

    const options: Array<TaskOption> = [];

    for (const row of rows) {
      const taskId = parseTaskId(row[apiId] ?? '');

      if (Opt.isNone(taskId)) {
        return Opt.none();
      }

      options.push({
        taskId: taskId.value,
        project: row[project] ?? '',
        task: row[task] ?? '',
        open: true,
        rate: Opt.none(),
        remaining: row[remaining] ?? '',
        projectState: '',
      });
    }

    return Opt.some(options);
  });
}

const ITEM_HEAD = /^- \[(\w+)(, open)?\] "(.*)" — (.*)$/;

const ITEM_PROJECT = /^\s+In project \[([^\]]+)\]\([^)]*\) "(.*)" — (\w+) \(item api_id: ([A-Z0-9]{15})\)/;

/**
 * `SearchProjectItems` output; keeps only TASK items, which are the bookable kind.
 *
 * @param text
 */
export function parseProjectItems(text: string): Opt.Option<ReadonlyArray<TaskOption>> {
  if (!/^Found \d+ matching project item/m.test(text)) {
    return /no (?:matching )?project items?/i.test(text) ? Opt.some([]) : Opt.none();
  }

  const lines = text.split('\n');

  const options: Array<TaskOption> = [];

  for (const [index, line] of lines.entries()) {
    const head = ITEM_HEAD.exec(line);

    const project = ITEM_PROJECT.exec(lines[index + 1] ?? '');

    if (head === null || project === null || head[1] !== 'TASK') {
      continue;
    }

    const taskId = parseTaskId(project[4] ?? '');

    if (Opt.isNone(taskId)) {
      continue;
    }

    const rate = /@ (\d+(?:\.\d+)?)\/h/.exec(head[4] ?? '');

    options.push({
      taskId: taskId.value,
      project: `${project[1] ?? ''} ${project[2] ?? ''}`.trim(),
      task: head[3] ?? '',
      open: head[2] !== undefined,
      rate: rate === null ? Opt.none() : Opt.some(Number(rate[1])),
      remaining: /^([\d.]+h)/.exec(head[4] ?? '')?.[1] ?? '',
      projectState: project[3] ?? '',
    });
  }

  return Opt.some(options);
}

export function parseProjects(text: string): Opt.Option<ReadonlyArray<ProjectRow>> {
  if (/^Found 0 project/m.test(text)) {
    return Opt.some([]);
  }

  return Opt.map(parseMarkdownTable(text), ({ header, rows }) => {
    const ids = /^api_ids: (.*)$/m
      .exec(text)?.[1]
      ?.split(/[,\s]+/)
      .filter((id) => /^PR[A-Z0-9]{13}$/.test(id));

    function at(row: ReadonlyArray<string>, name: string) {
      return row[header.findIndex((cell) => cell.toLowerCase() === name)] ?? '';
    }

    return rows.map((row, index) => ({
      // Only trust positional ids when the counts line up.
      projectId: ids?.length === rows.length ? Opt.fromUndefinedOr(ids[index]) : Opt.none(),
      number: at(row, 'project'),
      name: at(row, 'name'),
      client: at(row, 'client'),
      state: at(row, 'state'),
      billing: at(row, 'billing'),
    }));
  });
}

function Nullable<T extends Schema.Top>(schema: T) {
  return schema.pipe(Schema.NullOr, Schema.optionalKey);
}

export const TicketSummary = Schema.Struct({
  ticketId: Schema.String,
  number: Nullable(Schema.String),
  name: Schema.String,
  state: Schema.String,
  priority: Nullable(Schema.String),
  queue: Nullable(Schema.String),
  client: Nullable(Schema.String),
  contact: Nullable(Schema.String),
  assignee: Nullable(Schema.String),
  projectId: Nullable(Schema.String),
  project: Nullable(Schema.String),
  loggedMinutes: Nullable(Schema.Finite),
  billable: Nullable(Schema.Boolean),
  slaMinutesRemaining: Nullable(Schema.Finite),
  createdDate: Nullable(Schema.String),
  lastClientInput: Nullable(Schema.String),
  lastAgentReply: Nullable(Schema.String),
  closedDate: Nullable(Schema.String),
});

export type TicketSummary = typeof TicketSummary.Type;

const TicketList = Schema.fromJsonString(Schema.Struct({ count: Schema.Finite, tickets: Schema.Array(TicketSummary) }));

export const TicketDetail = Schema.Struct({
  ...TicketSummary.fields,
  description: Nullable(Schema.String),
  taskId: Nullable(Schema.String),
  task: Nullable(Schema.String),
  nonBillableReason: Nullable(Schema.String),
  followUpAction: Nullable(Schema.String),
  followUpDate: Nullable(Schema.String),
});

export type TicketDetail = typeof TicketDetail.Type;

export const TicketComment = Schema.Struct({
  commentId: Schema.String,
  date: Schema.String,
  type: Nullable(Schema.String),
  isInternal: Schema.Boolean,
  author: Nullable(Schema.String),
  title: Nullable(Schema.String),
  content: Nullable(Schema.String),
  loggedMinutes: Nullable(Schema.Finite),
});

export type TicketComment = typeof TicketComment.Type;

const CommentList = Schema.fromJsonString(
  Schema.Struct({ ticketId: Schema.String, count: Schema.Finite, comments: Schema.Array(TicketComment) }),
);

export function parseTickets(text: string): Opt.Option<ReadonlyArray<TicketSummary>> {
  return Opt.map(Schema.decodeOption(TicketList)(text), (list) => list.tickets);
}

export function parseTicketDetail(text: string): Opt.Option<TicketDetail> {
  return Schema.decodeOption(Schema.fromJsonString(TicketDetail))(text);
}

export function parseTicketComments(text: string): Opt.Option<ReadonlyArray<TicketComment>> {
  return Opt.map(Schema.decodeOption(CommentList)(text), (list) => list.comments);
}

/**
 * Normalises whitespace for note readback comparison; Orbit pads comment content with spaces.
 *
 * @param text
 */
export function normalizeText(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}
