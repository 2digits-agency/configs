import plugin, { type CSSLanguageOptions } from '@eslint/css';
import { getPackageInfo } from 'local-pkg';
import { tailwind3, tailwind4 } from 'tailwind-csstree';

import { GLOB_CSS } from '../globs';
import type { OptionsCss, TypedFlatConfigItem } from '../types';

async function resolveTailwindSyntax(options?: OptionsCss) {
  if (options?.customSyntax) {
    return options.customSyntax as Exclude<CSSLanguageOptions['customSyntax'], undefined>;
  }

  if (options?.tailwindMajor === 3) {
    return tailwind3;
  }

  if (options?.tailwindMajor === 4) {
    return tailwind4;
  }

  try {
    const info = await getPackageInfo('tailwindcss');
    const version = info?.version ?? '';
    const major = Number.parseInt(version.split('.')[0] || '0', 10);

    if (Number.isFinite(major) && major >= 4) {
      return tailwind4;
    }
  } catch {}

  return tailwind3;
}

export async function css(options: OptionsCss = {}): Promise<Array<TypedFlatConfigItem>> {
  const customSyntax = await resolveTailwindSyntax(options);

  return [
    {
      name: '2digits:css',
      files: [GLOB_CSS],
      language: 'css/css',
      plugins: {
        css: plugin,
      },
      languageOptions: {
        tolerant: true,
        customSyntax,
      },
      rules: {
        ...plugin.configs.recommended.rules,

        ...options.overrides,
      },
    },
  ];
}
