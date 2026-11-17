import * as Schema from 'effect/Schema';

export const DomainBlock = Schema.Literals([
  'Aggregate',
  'Api',
  'Command',
  'Event',
  'ExternalSystem',
  'Model',
  'Policy',
  'Projection',
  'Rejection',
  'RequestContext',
  'Saga',
  'Stream',
  'View',
]);

export type DomainBlock = typeof DomainBlock.Type;

export const DomainFileName = Schema.String.check(
  Schema.isPattern(
    /\.(?:aggregate|api|command|context|event|external|id|middleware|model|policy|projection|rejection|saga|stream|view)\.[cm]?tsx?$/u,
  ),
);

export const HostKind = Schema.Literals(['command', 'external', 'stream']);

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
