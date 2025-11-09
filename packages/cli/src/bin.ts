#!/usr/bin/env node
import * as CliConfig from '@effect/cli/CliConfig';
import * as NodeContext from '@effect/platform-node/NodeContext';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { cli } from './Cli';
import { EslintDetectionService } from './services/EslintDetectionService';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { ProjectDetectionService } from './services/ProjectDetectionService';

const MainLive = Layer.mergeAll(
  CliConfig.layer(),
  PrettierSetupService.Default,
  EslintSetupService.Default,
  ProjectDetectionService.Default,
  EslintDetectionService.Default,
  NodeContext.layer,
);

cli(process.argv).pipe(Effect.provide(MainLive), NodeRuntime.runMain);
