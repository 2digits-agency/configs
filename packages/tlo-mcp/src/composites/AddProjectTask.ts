import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { AddProjectTask as OrbitAddProjectTask, ProjectTaskAdded } from '../orbit/AddProjectTask.js';
import type { OrbitShape } from '../orbit/Orbit.js';
import { ApiId, LocalDate } from '../orbit/text.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

const Text = Schema.String.check(Schema.isTrimmed(), Schema.isNonEmpty());

const Hours = Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0));

/**
 * Orbit's `AddProjectTask` with typed, documented parameters. It is still one Orbit write per call, so Executor
 * approves every task separately; the gateway replaces the forwarded tool of the same name.
 */
export const AddProjectTask = Tool.make('AddProjectTask', {
  description:
    'Add a work task to a DRAFT or OPEN project, so time can be booked on it. Check GetProject first: it lists the chapters and existing tasks, so you do not add a duplicate. Orbit extends the project end date when endDate is later. If the result is unexpected, check GetProject before calling again: a repeated call adds a second task.',
  parameters: Schema.Struct({
    projectId: Text.annotate({ description: 'Project api_id (starts with PR) or the project number, such as "2238"' }),
    name: Text.annotate({ description: 'Task name as shown in the project and in time entries' }),
    description: Text.annotate({ description: 'Task description' }).pipe(Schema.optionalKey),
    workloadHours: Hours.annotate({
      description: 'Budgeted hours; per invoicing period when recurring. Omit for no budget',
    }).pipe(Schema.optionalKey),
    // The JSON schema drops annotations of LocalDate's custom check, so describe the dates on their keys.
    startDate: LocalDate.annotateKey({ description: 'Start date as yyyy-MM-dd' }).pipe(Schema.optionalKey),
    endDate: LocalDate.annotateKey({
      description: 'End date as yyyy-MM-dd, not before startDate. A date after the project end extends the project',
    }).pipe(Schema.optionalKey),
    assignees: Schema.NonEmptyArray(
      Text.check(Schema.isPattern(/^[^,]+$/)).annotate({
        description: 'User api_id or unique user name, or a group or division api_id',
      }),
    )
      .annotate({
        description:
          'Who may book time on the task without being planned first (Desk "Assign this task to"). Omit to leave it open to everyone',
      })
      .pipe(Schema.optionalKey),
    chapterId: ApiId.annotate({ description: 'Chapter api_id from GetProject; omit for the root level' }).pipe(
      Schema.optionalKey,
    ),
    rateId: ApiId.annotate({
      description:
        'Rate card api_id from ListRates whose name matches the work. Omit when none matches: the default card applies',
    }).pipe(Schema.optionalKey),
    rate: Schema.Finite.check(Schema.isGreaterThan(0))
      .annotate({ description: 'Hourly rate; only when the user gave one' })
      .pipe(Schema.optionalKey),
    nonBillable: Schema.Boolean.annotate({
      description: 'Only when the user explicitly asks for a non-billable task',
    }).pipe(Schema.optionalKey),
    recurring: Schema.Boolean.annotate({
      description: 'SUBSCRIPTION projects only: the task repeats every invoicing period',
    }).pipe(Schema.optionalKey),
    billingMode: Schema.Literals(['ESTIMATE', 'HOURS'])
      .annotate({
        description:
          'SUBSCRIPTION projects only: ESTIMATE bills the budgeted hours each period, HOURS the delivered hours. Omit for the account default',
      })
      .pipe(Schema.optionalKey),
    retainerId: Schema.Union([ApiId, Schema.Literal('NONE')])
      .annotate({
        description:
          'Retainer api_id to charge the hours on, or NONE for no retainer. Omit for the default: the project retainer on HOURS projects',
      })
      .pipe(Schema.optionalKey),
  }),
  success: ProjectTaskAdded,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, false);

export const addProjectTask = Effect.fn('AddProjectTask')(function* (
  orbit: OrbitShape,
  { startDate, endDate, assignees, ...params }: Tool.Parameters<typeof AddProjectTask>,
) {
  if (startDate !== undefined && endDate !== undefined && endDate < startDate) {
    return yield* Effect.fail(OrbitReadError.make({ message: `endDate ${endDate} is before startDate ${startDate}.` }));
  }

  return yield* orbit.call(OrbitAddProjectTask, {
    ...params,
    ...(startDate === undefined ? {} : { startDt: startDate }),
    ...(endDate === undefined ? {} : { endDt: endDate }),
    ...(assignees === undefined ? {} : { assignedTo: Arr.join(assignees, ',') }),
  });
}, Effect.mapError(toReadError));
