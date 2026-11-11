import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as Tool from 'effect/ai/Tool';

import { Orbit } from '../orbit/Orbit.js';
import { CloseProjectTask as OrbitCloseProjectTask } from '../orbit/projects.js';
import { ProjectTaskId } from '../orbit/text.js';
import { OrbitReadError, toReadError } from './OrbitReadError.js';

export class ProjectTaskCloseResult extends Schema.Class<ProjectTaskCloseResult, { readonly brand: unique symbol }>(
  'ProjectTaskCloseResult',
)({
  taskId: ProjectTaskId,
  message: Schema.String.annotate({
    description:
      "Orbit's answer: a confirmation, or the warnings that stopped the close. Warnings mean the task is still open",
  }),
}) {}

/**
 * Orbit's `CloseProjectTask` with a documented `force`. One Orbit write per call, so Executor approves every close.
 */
export const CloseProjectTask = Tool.make('CloseProjectTask', {
  description:
    'Close (complete) a project task, for example one added by mistake; Orbit cannot delete tasks. Orbit first runs the Desk checks, such as remaining workload and open planning. Warnings are returned WITHOUT closing: show them to the user and call again with force true only when the user still wants to close it. Hard blockers, such as open planned hours, refuse even with force. ReopenProjectTask is not available through this gateway.',
  parameters: Schema.Struct({
    taskId: ProjectTaskId.annotate({ description: 'Project task api_id (starts with PT), from GetProject' }),
    force: Schema.Boolean.annotate({
      description: 'Close despite the warnings of a previous call. Only after the user confirmed those warnings',
    }).pipe(Schema.optionalKey),
  }),
  success: ProjectTaskCloseResult,
  failure: OrbitReadError,
  failureMode: 'return',
})
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true);

export const CloseProjectTaskHandler = Effect.gen(function* () {
  const orbit = yield* Orbit;

  return Effect.fn('CloseProjectTask')(function* (params: Tool.Parameters<typeof CloseProjectTask>) {
    const message = yield* orbit.call(OrbitCloseProjectTask, params);

    return ProjectTaskCloseResult.make({ taskId: params.taskId, message });
  }, Effect.mapError(toReadError));
});
