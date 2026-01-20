import * as Context from 'effect/Context';
import type * as Redacted from 'effect/Redacted';

export interface TloConfigShape {
  readonly baseUrl: string;
  readonly sessionToken: Redacted.Redacted;
  readonly cookies: ReadonlyMap<string, string>;
}

export class TloConfig extends Context.Tag('@2digits/tlo-mcp/services/TloConfig')<TloConfig, TloConfigShape>() {}
