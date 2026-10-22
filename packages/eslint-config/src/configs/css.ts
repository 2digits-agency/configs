import plugin from '@eslint/css';
import { getPackageInfo } from 'local-pkg';
import { tailwind3, tailwind4 } from 'tailwind-csstree';

import { GLOB_CSS } from '../globs';
import type { OptionsCss, TypedFlatConfigItem } from '../types';

async function resolveTailwindSyntax({ customSyntax, tailwindMajor }: OptionsCss) {
  if (customSyntax) {
    return customSyntax;
  }

  const major = tailwindMajor ?? (await installedTailwindMajor());

  return major >= 4 ? tailwind4 : tailwind3;
}

async function installedTailwindMajor(): Promise<number> {
  try {
    const info = await getPackageInfo('tailwindcss');

    return Number.parseInt(info?.version ?? '0', 10);
  } catch {
    return 0;
  }
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
