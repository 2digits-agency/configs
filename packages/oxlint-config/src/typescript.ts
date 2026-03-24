import { defu } from 'defu';
import { defineConfig } from 'oxlint';

import { overridesConfig } from './configs/overrides';
import { typeAwareConfig } from './configs/type-aware';
import { typescriptRulesConfig } from './configs/typescript';

export const typescriptConfig = defineConfig(defu(typescriptRulesConfig, typeAwareConfig, overridesConfig));
