#!/usr/bin/env node
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as CliConfig from 'effect/cli/CliConfig';

import { cli } from './Cli';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { TurborepoSetupService } from './services/TurborepoSetupService';

const MainLive = Layer.mergeAll(
  CliConfig.layer(),
  PrettierSetupService.layer,
  EslintSetupService.layer,
  TurborepoSetupService.layer,
  NodeServices.layer,
);

// oxlint-disable-next-line effecttsgo/strict-effect-provide -- the process entry point is where the layer belongs
cli.pipe(Effect.provide(MainLive), NodeRuntime.runMain);
