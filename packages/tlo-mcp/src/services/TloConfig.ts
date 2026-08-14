import * as Context from 'effect/Context';
import type * as Redacted from 'effect/Redacted';
import type * as Cookies from 'effect/unstable/http/Cookies';

export interface TloConfigShape {
  readonly baseUrl: string;
  readonly sessionToken: Redacted.Redacted;
  readonly cookies: Cookies.Cookies;
}

export class TloConfig extends Context.Service<TloConfig, TloConfigShape>()('@2digits/tlo-mcp/services/TloConfig') {}
