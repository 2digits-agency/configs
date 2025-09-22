#!/usr/bin/env node
import { CliConfig } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { cli } from './Cli';
import { PrettierSetupService } from './services/PrettierSetupService';
import { VSCodeSetupService } from './services/VSCodeSetupService';

const MainLive = Layer.mergeAll(
  CliConfig.layer(),
  PrettierSetupService.Default,
  VSCodeSetupService.Default,
  NodeContext.layer,
);

cli(process.argv).pipe(Effect.provide(MainLive), NodeRuntime.runMain);
