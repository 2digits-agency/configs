import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Record from 'effect/Record';
import * as Cookies from 'effect/unstable/http/Cookies';

import { TloConfig, type TloConfigShape } from '../services/TloConfig.js';

const DEFAULT_BASE_URL = 'https://socialbrothers.orbit.teamleader.eu';

export const TloConfigFromEnv = Effect.gen(function* () {
  const sessionToken = yield* Config.redacted('TLO_SESSION_TOKEN');
  const baseUrl = yield* Config.string('TLO_BASE_URL').pipe(Config.withDefault(DEFAULT_BASE_URL));
  const cookieHeader = yield* Config.string('TLO_COOKIES').pipe(Config.withDefault(''));
  const cookies = yield* Effect.fromResult(
    Cookies.setAll(Cookies.empty, Record.toEntries(Cookies.parseHeader(cookieHeader))),
  );

  return {
    baseUrl,
    sessionToken,
    cookies,
  } satisfies TloConfigShape;
});

export const TloConfigLive = Layer.effect(TloConfig, TloConfigFromEnv);
