/* eslint-disable turbo/no-undeclared-env-vars */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildConfig } from '../src/config.js';

const ENV_KEYS = [
  'POSTHOG_OPENCODE_API_KEY',
  'POSTHOG_OPENCODE_HOST',
  'POSTHOG_OPENCODE_ENABLED',
  'POSTHOG_OPENCODE_LLMA_PRIVACY_MODE',
  'POSTHOG_OPENCODE_LLMA_TRACE_GROUPING',
  'POSTHOG_OPENCODE_LLMA_SESSION_WINDOW_MINUTES',
  'POSTHOG_OPENCODE_MAX_ATTRIBUTE_LENGTH',
  'POSTHOG_OPENCODE_LLMA_DISTINCT_ID',
  'POSTHOG_LLMA_CUSTOM_PROPERTIES',
] as const;

function createCtx(gitEmail: string) {
  const text = vi.fn<() => Promise<string>>().mockResolvedValue(gitEmail);
  const shell = vi.fn<() => { text: () => Promise<string> }>().mockReturnValue({ text });

  return {
    directory: '/tmp/project',
    worktree: '/tmp/project',
    $: shell,
  } as never;
}

describe(buildConfig, () => {
  afterEach(() => {
    vi.restoreAllMocks();

    for (const key of ENV_KEYS) {
      process.env[key] = undefined;
    }
  });

  it('builds config from env and git email', async () => {
    process.env.POSTHOG_OPENCODE_API_KEY = 'key';
    process.env.POSTHOG_OPENCODE_ENABLED = 'true';
    process.env.POSTHOG_OPENCODE_LLMA_PRIVACY_MODE = 'true';
    process.env.POSTHOG_OPENCODE_LLMA_TRACE_GROUPING = 'session';
    process.env.POSTHOG_OPENCODE_LLMA_SESSION_WINDOW_MINUTES = '30';
    process.env.POSTHOG_OPENCODE_MAX_ATTRIBUTE_LENGTH = '500';
    process.env.POSTHOG_OPENCODE_LLMA_DISTINCT_ID = 'custom-id';
    process.env.POSTHOG_LLMA_CUSTOM_PROPERTIES = '{"team":"core"}';

    const config = await buildConfig(createCtx('user@example.com\n'));

    expect(config).toMatchObject({
      apiKey: 'key',
      enabled: true,
      privacyMode: true,
      traceGrouping: 'session',
      sessionWindowMinutes: 30,
      maxAttributeLength: 500,
      distinctId: 'custom-id',
      gitEmail: 'user@example.com',
      projectName: 'project',
      customProperties: { team: 'core' },
    });
  });

  it('warns for invalid custom properties json only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    process.env.POSTHOG_LLMA_CUSTOM_PROPERTIES = '{';

    await buildConfig(createCtx(''));

    expect(warn).toHaveBeenCalledOnce();

    warn.mockClear();
    process.env.POSTHOG_LLMA_CUSTOM_PROPERTIES = '{}';

    await buildConfig(createCtx(''));

    expect(warn).not.toHaveBeenCalled();
  });
});
