import * as Schema from 'effect/Schema';

import { ApiId, Minutes, orbitJsonTool, Timestamp } from './text.js';

// ListTickets, GetTicketDetail and ListTicketComments return JSON inside a text block.

const NullableString = Schema.String.pipe(Schema.NullOr);

const NullableTimestamp = Timestamp.pipe(Schema.NullOr);

export class TicketSummary extends Schema.Class<TicketSummary, { readonly brand: unique symbol }>('TicketSummary')({
  ticketId: ApiId,
  number: Schema.String,
  name: Schema.String,
  state: Schema.String,
}) {}

export class TicketDetail extends Schema.Class<TicketDetail, { readonly brand: unique symbol }>('TicketDetail')({
  ticketId: ApiId,
  number: Schema.String,
  name: Schema.String,
  description: Schema.String,
  state: Schema.String,
  priority: Schema.String,
  category: NullableString,
  queue: NullableString,
  client: NullableString,
  clientId: ApiId.pipe(Schema.NullOr),
  contact: NullableString,
  owner: NullableString,
  assignee: NullableString,
  project: NullableString,
  projectId: ApiId.pipe(Schema.NullOr),
  task: NullableString,
  taskId: ApiId.pipe(Schema.NullOr),
  loggedMinutes: Minutes,
  invoicedMinutes: Minutes,
  billable: Schema.Boolean,
  slaResponseDue: NullableTimestamp,
  slaCloseDue: NullableTimestamp,
  followUpAction: NullableString,
  createdDate: Timestamp,
  closedDate: NullableTimestamp,
  lastClientInput: NullableTimestamp,
  lastAgentReply: NullableTimestamp,
  attachments: Schema.Array(Schema.Struct({ fileId: ApiId, name: Schema.String, downloadUrl: Schema.String })),
  otherOpenTicketsOfClient: Schema.Array(TicketSummary),
}) {}

export class TicketComment extends Schema.Class<TicketComment, { readonly brand: unique symbol }>('TicketComment')({
  commentId: ApiId,
  date: Timestamp,
  isInternal: Schema.Boolean,
  author: NullableString,
  title: NullableString,
  content: Schema.String,
  loggedMinutes: Minutes,
  timeEntryId: ApiId.pipe(Schema.NullOr),
}) {}

const TicketList = Schema.Struct({ count: Schema.Int, tickets: Schema.Array(TicketSummary) });

const CommentList = Schema.Struct({ count: Schema.Int, comments: Schema.Array(TicketComment) });

export const ListTickets = orbitJsonTool<{ readonly query: string; readonly state: string; readonly limit: number }>()(
  'ListTickets',
  TicketList,
);

export const GetTicketDetail = orbitJsonTool<{ readonly ticketId: string }>()('GetTicketDetail', TicketDetail);

export const ListTicketComments = orbitJsonTool<{ readonly ticketId: string; readonly limit: number }>()(
  'ListTicketComments',
  CommentList,
);
