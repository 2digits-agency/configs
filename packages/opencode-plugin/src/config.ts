/* eslint-disable turbo/no-undeclared-env-vars */
import type { PluginInput } from '@opencode-ai/plugin';

import { DEFAULT_HOST, DEFAULT_MAX_ATTRIBUTE_LENGTH, DEFAULT_SESSION_WINDOW_MINUTES, LIB_NAME } from './constants.js';
import type { Config } from './types.js';
import {
  getProjectName,
  isValidCustomPropertiesJson,
  parseCustomProperties,
  parseDistinctId,
  parseNumber,
  parseTraceGrouping,
} from './utilities.js';

async function readGitEmail(ctx: PluginInput): Promise<string | undefined> {
  try {
    return parseDistinctId(await ctx.$`git config --get user.email`.text());
  } catch {
    return undefined;
  }
}

export async function buildConfig(ctx: PluginInput): Promise<Config> {
  const projectName = getProjectName(ctx.worktree || ctx.directory);
  const customProperties = parseCustomProperties(process.env.POSTHOG_LLMA_CUSTOM_PROPERTIES);

  if (!isValidCustomPropertiesJson(process.env.POSTHOG_LLMA_CUSTOM_PROPERTIES)) {
    console.warn(`${LIB_NAME}: ignoring invalid POSTHOG_LLMA_CUSTOM_PROPERTIES JSON`);
  }

  return {
    apiKey: process.env.POSTHOG_API_KEY ?? 'phc_qAbssQWcjrSz9NutSQsNrWWpQqLsTGo7ZnHchwa5C6Tb',
    host: process.env.POSTHOG_HOST ?? DEFAULT_HOST,
    enabled: process.env.POSTHOG_OPENCODE_ENABLED !== 'false',
    privacyMode: process.env.POSTHOG_LLMA_PRIVACY_MODE === 'true',
    traceGrouping: parseTraceGrouping(process.env.POSTHOG_LLMA_TRACE_GROUPING),
    sessionWindowMinutes: parseNumber(process.env.POSTHOG_LLMA_SESSION_WINDOW_MINUTES, DEFAULT_SESSION_WINDOW_MINUTES),
    maxAttributeLength: parseNumber(process.env.POSTHOG_MAX_ATTRIBUTE_LENGTH, DEFAULT_MAX_ATTRIBUTE_LENGTH),
    distinctId: parseDistinctId(process.env.POSTHOG_LLMA_DISTINCT_ID),
    gitEmail: await readGitEmail(ctx),
    projectName,
    customProperties,
  };
}
