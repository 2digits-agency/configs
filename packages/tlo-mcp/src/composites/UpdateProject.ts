import * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import { UpdateProject as OrbitUpdateProject } from '../orbit/projects.js';
import { ApiId, LocalDate, ProjectId, UserId } from '../orbit/text.js';
import { ProjectNumber, Text } from './AddProjectTask.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

export class ProjectUpdated extends Schema.Class<ProjectUpdated, { readonly brand: unique symbol }>('ProjectUpdated')({
  project: Schema.String.annotate({ description: 'The project as given: api_id or project number' }),
  message: Schema.String.annotate({ description: "Orbit's confirmation" }),
}) {}

/**
 * Orbit's `UpdateProject` with each header field typed and documented, instead of a `fieldsJson` string. One Orbit
 * write per call, so Executor approves every change separately.
 */
export const UpdateProject = Tool.make('UpdateProject', {
  description:
    "Change header fields of a project; fields left out stay unchanged. Orbit recalculates the end date to cover the project's tasks and milestones, so an endDate before those dates does not stick: move the task dates with UpdateProjectTask first. The billing mode, retainer, client entity, color and custom fields cannot be changed here. Check the result with GetProject.",
  parameters: Schema.Struct({
    project: Schema.Union([ProjectId, ProjectNumber]).annotate({ description: 'Project api_id or project number' }),
    changes: Schema.Struct({
      name: Text.annotate({ description: 'Project name' }).pipe(Schema.optionalKey),
      description: Schema.String.annotate({ description: 'Project description' }).pipe(Schema.optionalKey),
      purchaseOrder: Schema.String.annotate({ description: "The client's purchase order (PO) number" }).pipe(
        Schema.optionalKey,
      ),
      // The JSON schema drops annotations of LocalDate's custom check, so describe the dates on their keys.
      startDate: LocalDate.annotateKey({ description: 'Start date as yyyy-MM-dd' }).pipe(Schema.optionalKey),
      endDate: LocalDate.pipe(Schema.NullOr)
        .annotateKey({ description: 'End date as yyyy-MM-dd, not before startDate; null clears it' })
        .pipe(Schema.optionalKey),
      fixedPrice: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0))
        .annotate({
          description:
            'The agreed fixed price (billing budget). FIXED-price projects only: other billing modes calculate their budget from the project content',
        })
        .pipe(Schema.optionalKey),
      ownerId: UserId.pipe(Schema.NullOr)
        .annotate({ description: 'User api_id of the new owner (starts with US), or null to remove the owner' })
        .pipe(Schema.optionalKey),
      folderId: ApiId.annotate({ description: 'Folder api_id' }).pipe(Schema.optionalKey),
      dealId: ApiId.pipe(Schema.NullOr)
        .annotate({ description: 'Deal api_id, or null to unlink the deal' })
        .pipe(Schema.optionalKey),
      analyticalCategoryId: ApiId.pipe(Schema.NullOr)
        .annotate({
          description: "Analytical category api_id, or null for none, so the project folder's category applies",
        })
        .pipe(Schema.optionalKey),
    })
      .check(Schema.isMinProperties(1))
      .annotate({ description: 'The fields to change; at least one' }),
  }),
  success: ProjectUpdated,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const UpdateProjectHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('UpdateProject')(function* ({ project, changes }: Tool.Parameters<typeof UpdateProject>) {
    const { startDate, endDate } = changes;

    if (P.isNotUndefined(startDate) && P.isNotNullish(endDate) && endDate < startDate) {
      return yield* Effect.fail(
        OrbitReadError.make({ message: `endDate ${endDate} is before startDate ${startDate}.` }),
      );
    }

    const message = yield* orbit.call(OrbitUpdateProject, { projectId: project, fieldsJson: changes });

    return ProjectUpdated.make({ project, message });
  }, Effect.mapError(toReadError));
});
