#!/usr/bin/env node
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as CliConfig from 'effect/unstable/cli/CliConfig';

import { cli } from './Cli';
import { CurrentWorkingDirService } from './services/CurrentWorkingDirService';
import { EslintDetectionService } from './services/EslintDetectionService';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { ProjectDetectionService } from './services/ProjectDetectionService';
import { TurborepoSetupService } from './services/TurborepoSetupService';

const MainLive = Layer.mergeAll(
  CliConfig.layer(),
  CurrentWorkingDirService.Default,
  PrettierSetupService.Default,
  EslintSetupService.Default,
  ProjectDetectionService.Default,
  EslintDetectionService.Default,
  TurborepoSetupService.Default,
  NodeServices.layer,
);

// oxlint-disable-next-line effecttsgo/strict-effect-provide -- the process entry point is where the layer belongs
cli.pipe(Effect.provide(MainLive), NodeRuntime.runMain);
