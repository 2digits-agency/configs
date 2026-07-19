#!/usr/bin/env node
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { cli } from './Cli';
import { CurrentWorkingDirService } from './services/CurrentWorkingDirService';
import { EslintDetectionService } from './services/EslintDetectionService';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { ProjectDetectionService } from './services/ProjectDetectionService';
import { TurborepoSetupService } from './services/TurborepoSetupService';

const MainLive = Layer.mergeAll(
  CurrentWorkingDirService.layer,
  PrettierSetupService.layer,
  EslintSetupService.layer,
  ProjectDetectionService.layer,
  EslintDetectionService.layer,
  TurborepoSetupService.layer,
  NodeServices.layer,
);

cli.pipe(Effect.provide(MainLive), NodeRuntime.runMain);
