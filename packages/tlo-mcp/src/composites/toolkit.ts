import * as Effect from 'effect/Effect';
import * as Toolkit from 'effect/ai/Toolkit';

import { AddProjectTask, AddProjectTaskHandler } from './AddProjectTask.js';
import { CloseProjectTask, CloseProjectTaskHandler } from './CloseProjectTask.js';
import { CloseTicketSilently, CloseTicketSilentlyHandler } from './CloseTicketSilently.js';
import { GetBoardContext, GetBoardContextHandler } from './GetBoardContext.js';
import { GetMyWorkday, GetMyWorkdayHandler } from './GetMyWorkday.js';
import { GetTicketContext, GetTicketContextHandler } from './GetTicketContext.js';
import { LinkTicketToProject, LinkTicketToProjectHandler } from './LinkTicketToProject.js';
import { SetTicketOwner, SetTicketOwnerHandler } from './SetTicketOwner.js';
import { UpdateProject, UpdateProjectHandler } from './UpdateProject.js';
import { UpdateProjectTask, UpdateProjectTaskHandler } from './UpdateProjectTask.js';

/**
 * Tools the gateway defines itself: read-only tools that combine several Orbit reads, and Orbit writes with stricter
 * schemas. Each write is still exactly one Orbit write, so each one is approved separately.
 */
export const CompositeTools = Toolkit.make(
  GetMyWorkday,
  GetTicketContext,
  GetBoardContext,
  AddProjectTask,
  CloseProjectTask,
  UpdateProject,
  UpdateProjectTask,
  CloseTicketSilently,
  SetTicketOwner,
  LinkTicketToProject,
);

export const CompositeToolsLive = CompositeTools.toLayer(
  Effect.all({
    GetMyWorkday: GetMyWorkdayHandler,
    GetTicketContext: GetTicketContextHandler,
    GetBoardContext: GetBoardContextHandler,
    AddProjectTask: AddProjectTaskHandler,
    CloseProjectTask: CloseProjectTaskHandler,
    UpdateProject: UpdateProjectHandler,
    UpdateProjectTask: UpdateProjectTaskHandler,
    CloseTicketSilently: CloseTicketSilentlyHandler,
    SetTicketOwner: SetTicketOwnerHandler,
    LinkTicketToProject: LinkTicketToProjectHandler,
  }),
);
