#!/usr/bin/env node
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';

import { run } from './cli/command.js';

// oxlint-disable-next-line effecttsgo/strict-effect-provide -- the process entry point is where the layer belongs
run(process.argv).pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain);
