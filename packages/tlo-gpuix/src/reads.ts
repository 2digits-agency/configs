import type * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

export class ReadError extends Schema.TaggedError<ReadError>()('ReadError', { message: Schema.String }) {}

/**
 * Shared metadata only. This module cannot access credentials or the network.
 */
export const readTools = {
  GetTimesheetWeek: { date: '2026-10-13' },
  ListTimeEntries: { dateFrom: '2026-10-12', dateTo: '2026-10-18' },
  GetTimeEntry: { entryId: '' },
  ListMyTasks: {},
  ListProjects: { text: '' },
  GetProject: { projectId: '' },
  SearchProjectItems: { text: '', itemType: 'TASK', openOnly: true },
  ListTickets: { query: '' },
  GetTicketDetail: { ticketId: '' },
  ListTicketComments: { ticketId: '', includeInternal: 'true' },
  ListTodos: { search: '' },
  GetTodo: { todoId: '' },
} satisfies Record<string, Record<string, unknown>>;

export type ReadTool = keyof typeof readTools;

export interface LiveReader {
  read: (name: ReadTool, args: Record<string, unknown>) => Effect.Effect<unknown, ReadError>;
}
