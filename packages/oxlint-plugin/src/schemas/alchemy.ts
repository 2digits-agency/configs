import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

/**
 * The kind of file each Domain block is declared in, as in `Account.aggregate.ts` or `CurrentActor.context.ts`.
 */
export const blockFileKinds = {
  Aggregate: 'aggregate',
  Api: 'api',
  Command: 'command',
  Event: 'event',
  ExternalSystem: 'external',
  Model: 'model',
  Policy: 'policy',
  Projection: 'projection',
  Query: 'query',
  Rejection: 'rejection',
  RequestContext: 'context',
  Saga: 'saga',
  Stream: 'stream',
  View: 'view',
} as const;

export const DomainBlock = Schema.Literals(R.keys(blockFileKinds));

export type DomainBlock = typeof DomainBlock.Type;

// Aggregate ids and middleware are no Domain blocks, but live in kind-suffixed files too.
const DomainFileKind = Schema.Literals([...R.values(blockFileKinds), 'id', 'middleware']);

export const DomainFileName = Schema.TemplateLiteral([
  Schema.String,
  '.',
  DomainFileKind,
  '.',
  Schema.Literals(['ts', 'tsx', 'mts', 'cts']),
]);

// Events and rejections may also live in the file of the block that records or returns them.
export const SharedBlock = DomainBlock.pick(['Event', 'Rejection']);

export const HostKind = DomainFileKind.pick(['command', 'external', 'stream']);

// What a `Domain.Api` serves of its model, by kind.
export const ApiMemberKind = Schema.Literals(['commands', 'views', 'streams', 'queries']);

// Events named after a field that changed, such as `BalanceSet` or `TicketChanged`.
export const FieldChangeEventName = Schema.TemplateLiteral([
  Schema.String,
  Schema.Literals(['Changed', 'Modified', 'Set', 'Updated']),
]);

// Commands named after a field they set, such as `SetRoster` or `UpdatePrices`.
export const FieldChangeCommandName = Schema.String.check(Schema.isPattern(/^(?:Change|Modify|Set|Update)[A-Z]/u));

export const StackFilename = Schema.Literals(['alchemy.run.ts', 'alchemy.run.mts']);

export const WorkerHandler = Schema.Literals([
  'alarm',
  'fetch',
  'queue',
  'rpc',
  'scheduled',
  'tail',
  'trace',
  'webSocketClose',
  'webSocketError',
  'webSocketMessage',
]);

export const RemovedApi = Schema.Literals(['Secret', 'Variable']);
