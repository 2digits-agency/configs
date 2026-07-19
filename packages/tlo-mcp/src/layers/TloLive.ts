import * as Layer from 'effect/Layer';
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient';

import { BoardServiceLive } from '../services/BoardService.js';
import { TeamLeaderClientLive } from '../services/TeamLeaderClient.js';
import { TimeServiceLive } from '../services/TimeService.js';
import { TloHttpClientLive } from '../services/TloHttpClient.js';

export const TloServicesLive = Layer.mergeAll(TimeServiceLive, BoardServiceLive);

export const TloClientLive = TeamLeaderClientLive.pipe(
  Layer.provide(TloHttpClientLive.pipe(Layer.provide(FetchHttpClient.layer))),
);

export const TloLive = TloServicesLive.pipe(Layer.provide(TloClientLive));
