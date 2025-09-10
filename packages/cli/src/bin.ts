#!/usr/bin/env node
import { CliConfig } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { cli } from './Cli';
import { ESLintSetupService } from './services/ESLintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { TurboSetupService } from './services/TurboSetupService';
import { TypeScriptSetupService } from './services/TypeScriptSetupService';
import { WorkspaceService } from './services/WorkspaceService';

const MainLive = Layer.mergeAll(
  CliConfig.layer(),
  PrettierSetupService.Default,
  WorkspaceService.Default,
  TypeScriptSetupService.Default,
  ESLintSetupService.Default,
  TurboSetupService.Default,
  NodeContext.layer,
);

cli(process.argv).pipe(Effect.provide(MainLive), NodeRuntime.runMain);
