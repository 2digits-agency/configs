import * as Layer from 'effect/Layer';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';

import { type BoardService, BoardServiceLive } from '../services/BoardService.js';
import { type TeamLeaderClient, TeamLeaderClientLive } from '../services/TeamLeaderClient.js';
import { type TimeService, TimeServiceLive } from '../services/TimeService.js';
import type { TloConfig } from '../services/TloConfig.js';
import { TloHttpClientLive } from '../services/TloHttpClient.js';

export const TloServicesLive = Layer.mergeAll(TimeServiceLive, BoardServiceLive);

export const TloClientLive: Layer.Layer<TeamLeaderClient, never, TloConfig> = TeamLeaderClientLive.pipe(
  Layer.provide(TloHttpClientLive.pipe(Layer.provide(FetchHttpClient.layer))),
);

export const TloLive: Layer.Layer<TimeService | BoardService, never, TloConfig> = TloServicesLive.pipe(
  Layer.provide(TloClientLive),
);
