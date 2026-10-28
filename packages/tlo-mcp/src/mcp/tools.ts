/**
 * Orbit tools the gateway exposes; every other upstream tool is hidden and cannot be called. Names must match Orbit
 * exactly. Startup logs a warning when Orbit no longer offers one.
 */
export const EXPOSED_TOOLS: ReadonlyArray<string> = [
  // Timesheet and time entries
  'GetTimesheetWeek',
  'GetTimesheetStatus',
  'ListTimeEntries',
  'GetTimeEntry',
  'CreateTimeEntry',
  'UpdateTimeEntry',
  'MoveTimeEntry',
  'SplitTimeEntry',
  'DeleteTimeEntry',
  'ConfirmPlannedEntry',
  'SubmitTimesheet',
  'GetRunningTimer',
  'StartTimer',
  'StopTimer',

  // Tasks and projects to book on
  'ListMyTasks',
  'SearchProjectItems',
  'ListPlannableTasks',
  'ListProjects',
  'GetProject',
  'GetProjectOpenItems',

  // Planning (read-only)
  'ListPlannedEntries',
  'GetPlannedEntry',
  'GetPlannerBoard',
  'ListAbsences',
  'ListReservations',
  'FindFreeCapacity',

  // Tickets
  'ListTickets',
  'GetTicket',
  'GetTicketDetail',
  'ListTicketComments',
  'AddInternalComment',
  'ReplyToTicket',
  'CloseTicket',

  // Boards and todos
  'ListBoards',
  'ListBoardLists',
  'ListTodos',
  'GetTodo',
  'GetTodoDetail',
  'MoveTodo',
  'ListMessages',
  'AddMessage',

  // Lookups
  'ListUsers',
  'SearchCrm',
];
