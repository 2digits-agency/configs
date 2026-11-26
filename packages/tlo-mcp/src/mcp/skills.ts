import md from 'dedent';
import * as McpServer from 'effect/ai/McpServer';
import * as Skill from 'effect/ai/Skill';

const OrbitTimesheets = Skill.make({
  frontmatter: {
    name: 'orbit-timesheets',
    description:
      'Review, correct and plan Teamleader Orbit time with the tlo-mcp tools: what to read first, which tasks and tickets to book on, and how to write entries safely. Use before creating, changing or deleting time entries, confirming planned entries or submitting a week.',
  },
  instructions: md`
    # Orbit timesheets and planning

    Times are Europe/Amsterdam and a week runs Monday to Sunday. Read before you write, and write only after the user approved the exact changes.

    ## Read first

    - \`GetMyWorkday\` shows a day, its week or a range in one call: OPEN/FINAL state, logged, planned and absence time against capacity, every entry with its api_id and lock, planned entries still to confirm, gaps, overlaps and the tasks you can book on with their remaining budget.
    - \`GetTimesheetWeek\` shows a week as Orbit does. A locked entry or a FINAL week cannot be changed.
    - \`ListMyTasks\` lists the tasks you can book on with their api_id and remaining budget. \`SearchProjectItems\` and \`GetProject\` find other project tasks; \`ListTickets\` and \`GetTicketContext\` find tickets.
    - Read an entry with \`GetTimeEntry\` before you change it. Its history shows who added or moved it; leave the user's own recent changes alone unless they ask.
    - Planning is read-only through this gateway: \`ListPlannedEntries\`, \`GetPlannerBoard\`, \`ListAbsences\`, \`ListReservations\` and \`FindFreeCapacity\`.

    ## What to book

    - Book on existing tasks and tickets only. When none fits, say so instead of adding a project task; use \`AddProjectTask\` only when the user asks for a new task.
    - Check the remaining budget first: Orbit refuses time on a task that has none left.
    - Time on a ticket is billable only when the ticket is linked to a project task. \`LinkTicketToProject\` links it and moves the ticket's uninvoiced time to that task.
    - Planned is not logged: a planned entry counts once \`ConfirmPlannedEntry\` confirmed it.
    - A task's name does not show what was done. Base each entry on evidence, such as a meeting, a commit or a message, and say when an entry is an estimate.
    - Count a meeting once. Leave a gap rather than inventing time to fill the day's capacity.
    - Write descriptions short and plain, as a colleague would.

    ## How to write

    1. List the exact calls first: entry api_id, task or ticket api_id, date and time, duration and description. Make them after the user approves. Every call is one Orbit write; the gateway never batches or replays them.
    2. Read the text of every result. Orbit reports a refusal as a normal result, not as an error, such as "Available time for this task is 0 minutes", "Cannot plan activity before start date of task" or "Insufficient time available".
    3. When a call fails and you cannot tell whether the write happened, such as after a 502, read the state with \`GetTimeEntry\` or \`ListTimeEntries\` first and try again at most once. Never repeat a write blindly.
    4. A rate-limited call has \`tlo-mcp/httpStatus\` 429 in its \`_meta\`, and \`tlo-mcp/retryAfter\` when Orbit sent one. Wait that long, or about a minute without it, before the next call, and never replay the limited call right away.
    5. Afterwards, read each changed week with \`GetTimesheetWeek\` and compare it with the plan. Report what differs and whether the week is still OPEN.
    6. Call \`SubmitTimesheet\` only when the user asks for it separately: it makes the week FINAL.

    ## Tickets

    \`ReplyToTicket\` is visible to the client and \`AddInternalComment\` only to colleagues; use either only when asked. \`CloseTicket\` sends the client a closing message and \`CloseTicketSilently\` does not.
  `,
});

export const ORBIT_TIMESHEETS_URI = 'skill://tlo-mcp/orbit-timesheets/SKILL.md';

/**
 * The Agent Skill the gateway serves next to the tools. Its `SKILL.md` is also a resource, so clients without the
 * Skills extension can read it.
 */
export const OrbitSkillsLive = McpServer.skill(OrbitTimesheets, { uri: ORBIT_TIMESHEETS_URI });
