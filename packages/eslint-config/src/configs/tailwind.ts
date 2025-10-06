import * as findUp from 'empathic/find';
import { getPackageInfo } from 'local-pkg';
import { findWorkspaceDir } from 'pkg-types';

import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

async function detectTailwindVersion() {
  try {
    const info = await getPackageInfo('tailwindcss');
    const version = info?.version ?? '';
    const major = Number.parseInt(version.split('.')[0] || '0', 10);

    return Number.isFinite(major) ? major : 3;
  } catch {
    return 3; // Default to v3 if detection fails
  }
}

async function findTailwindConfig(last?: string) {
  // First try to find tailwind.config files (v3 style)
  const v3Config = findUp.file('tailwind.config.ts', { last }) ?? findUp.file('tailwind.config.js', { last });
  if (v3Config) {
    return { configType: 'v3', configPath: v3Config };
  }

  // For v4, we might need to look for CSS entry files or other config patterns
  // For now, let the plugin auto-detect
  return { configType: 'auto', configPath: null };
}

export async function tailwind(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const [betterTailwindcss, { tailwindFunctions }, last, tailwindVersion] = await Promise.all([
    interopDefault(import('eslint-plugin-better-tailwindcss')),
    interopDefault(import('@2digits/constants')),
    findWorkspaceDir().catch(() => undefined),
    detectTailwindVersion(),
  ]);

  const { configType, configPath } = await findTailwindConfig(last);

  // Build settings based on Tailwind version and config detection
  const settings: Record<string, any> = {
    'better-tailwindcss': {
      callees: tailwindFunctions,
    },
  };

  // Add configuration based on detected type and version
  if (configPath) {
    if (tailwindVersion >= 4) {
      // For v4, check if config is actually an entry point CSS file
      if (configPath.endsWith('.css')) {
        settings['better-tailwindcss'].entryPoint = configPath;
      } else {
        settings['better-tailwindcss'].tailwindConfig = configPath;
      }
    } else {
      // For v3, always use tailwindConfig
      settings['better-tailwindcss'].tailwindConfig = configPath;
    }
  }

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:tailwind',
      plugins: {
        'better-tailwindcss': betterTailwindcss,
      },
      settings,
      rules: {
        ...betterTailwindcss.configs.recommended.rules,

        ...overrides,
      },
    },
  ];
}
