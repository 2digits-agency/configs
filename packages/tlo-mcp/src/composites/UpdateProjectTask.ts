import * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import { UpdateProjectTask as OrbitUpdateProjectTask } from '../orbit/projects.js';
import { ApiId, LocalDate, ProjectTaskId } from '../orbit/text.js';
import { Hours, Text, Username } from './AddProjectTask.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

export class ProjectTaskUpdated extends Schema.Class<ProjectTaskUpdated, { readonly brand: unique symbol }>(
  'ProjectTaskUpdated',
)({
  taskId: ProjectTaskId,
  message: Schema.String.annotate({ description: "Orbit's confirmation" }),
}) {}

/**
 * Orbit's `UpdateProjectTask` with each field typed and documented, instead of a `fieldsJson` string. One Orbit write
 * per call, so Executor approves every change separately.
 */
export const UpdateProjectTask = Tool.make('UpdateProjectTask', {
  description:
    "Change fields of a project task; fields left out stay unchanged. Moving task dates is how a project's end date moves earlier, because Orbit stretches the project end over its tasks. Use CloseProjectTask to close a task. Check the result with GetProject.",
  parameters: Schema.Struct({
    taskId: ProjectTaskId.annotate({ description: 'Project task api_id (starts with PT), from GetProject' }),
    changes: Schema.Struct({
      name: Text.annotate({ description: 'Task name as shown in the project and in time entries' }).pipe(
        Schema.optionalKey,
      ),
      description: Schema.String.annotate({ description: 'Task description' }).pipe(Schema.optionalKey),
      workloadHours: Hours.annotate({
        description: 'Budgeted hours; per invoicing period when the task is recurring',
      }).pipe(Schema.optionalKey),
      rateId: ApiId.annotate({ description: 'Rate card api_id from ListRates' }).pipe(Schema.optionalKey),
      rate: Schema.Finite.check(Schema.isGreaterThan(0))
        .annotate({ description: 'Hourly rate; only together with rateId, and only when the user gave one' })
        .pipe(Schema.optionalKey),
      // The JSON schema drops annotations of LocalDate's custom check, so describe the dates on their keys.
      startDate: LocalDate.annotateKey({ description: 'Start date as yyyy-MM-dd' }).pipe(Schema.optionalKey),
      endDate: LocalDate.pipe(Schema.NullOr)
        .annotateKey({
          description:
            'End date as yyyy-MM-dd, not before startDate; null clears it. A recurring task with an end date only bills the periods before it',
        })
        .pipe(Schema.optionalKey),
      recurring: Schema.Boolean.annotate({
        description:
          'SUBSCRIPTION projects only: the task repeats every invoicing period, with workloadHours per period',
      }).pipe(Schema.optionalKey),
      billingMode: Schema.Literals(['ESTIMATE', 'HOURS'])
        .annotate({
          description:
            'SUBSCRIPTION projects only: ESTIMATE bills the budgeted hours each period, HOURS the delivered hours',
        })
        .pipe(Schema.optionalKey),
      assignees: Schema.NonEmptyArray(
        Schema.Union([ApiId, Username]).annotate({
          description: 'User, group or division api_id, or a unique user name',
        }),
      )
        .pipe(Schema.NullOr)
        .annotate({
          description:
            'Who may book time on the task without being planned first. REPLACES the current list; null opens the task to everyone',
        })
        .pipe(Schema.optionalKey),
      retainerId: ApiId.pipe(Schema.NullOr)
        .annotate({
          description:
            "Retainer api_id of the project's client to charge the task's hours on; its uninvoiced hours move onto the retainer. null takes the task off its retainer. Billable tasks only",
        })
        .pipe(Schema.optionalKey),
      analyticalCategoryId: ApiId.pipe(Schema.NullOr)
        .annotate({ description: "Analytical category api_id, or null for none, so the rate card's category applies" })
        .pipe(Schema.optionalKey),
    })
      .check(Schema.isMinProperties(1))
      .annotate({ description: 'The fields to change; at least one' }),
  }),
  success: ProjectTaskUpdated,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const UpdateProjectTaskHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('UpdateProjectTask')(function* ({ taskId, changes }: Tool.Parameters<typeof UpdateProjectTask>) {
    const { startDate, endDate, rate, rateId } = changes;

    if (P.isNotUndefined(startDate) && P.isNotNullish(endDate) && endDate < startDate) {
      return yield* Effect.fail(
        OrbitReadError.make({ message: `endDate ${endDate} is before startDate ${startDate}.` }),
      );
    }

    if (P.isNotUndefined(rate) && P.isUndefined(rateId)) {
      return yield* Effect.fail(
        OrbitReadError.make({ message: 'rate needs rateId: Orbit only sets a rate with its card.' }),
      );
    }

    const message = yield* orbit.call(OrbitUpdateProjectTask, { taskId, fieldsJson: changes });

    return ProjectTaskUpdated.make({ taskId, message });
  }, Effect.mapError(toReadError));
});
