#!/usr/bin/env node
import { CliConfig } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { cli } from './Cli';
import { PrettierSetupService } from './services/PrettierSetupService';

const MainLive = Layer.mergeAll(CliConfig.layer(), PrettierSetupService.Default, NodeContext.layer);

cli(process.argv).pipe(Effect.provide(MainLive), NodeRuntime.runMain);
