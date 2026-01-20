import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import { TloConfig, type TloConfigShape } from '../services/TloConfig.js';

const DEFAULT_BASE_URL = 'https://socialbrothers.orbit.teamleader.eu';

function parseCookies(cookiesStr: Option.Option<string>): ReadonlyMap<string, string> {
  if (Option.isNone(cookiesStr)) {
    return new Map();
  }

  const entries = cookiesStr.value
    .split(';')
    .map((pair) => pair.trim().split('='))
    .filter((parts): parts is [string, string] => parts.length === 2);

  return new Map(entries);
}

export const TloConfigFromEnv = Effect.gen(function* () {
  const sessionToken = yield* Config.redacted('TLO_SESSION_TOKEN');
  const baseUrl = yield* Config.string('TLO_BASE_URL').pipe(Config.withDefault(DEFAULT_BASE_URL));
  const cookiesStr = yield* Config.option(Config.string('TLO_COOKIES'));

  return {
    baseUrl,
    sessionToken,
    cookies: parseCookies(cookiesStr),
  } satisfies TloConfigShape;
});

export const TloConfigLive = Layer.effect(TloConfig, TloConfigFromEnv);
