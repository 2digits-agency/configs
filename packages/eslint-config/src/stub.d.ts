declare module '@next/eslint-plugin-next' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
      'core-web-vitals': ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module '@eslint-community/eslint-plugin-eslint-comments' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module '@eslint-community/eslint-plugin-eslint-comments/configs' {
  import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    recommended: FlatConfig.Config;
  };
  export = exprt;
}

declare module 'eslint-plugin-better-tailwindcss' {
  import type { ClassicConfig, Linter, FlatConfig } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: { plugins: string[]; rules: Record<string, any> };
      'recommended-error': { plugins: string[]; rules: Record<string, any> };
      'recommended-warn': { plugins: string[]; rules: Record<string, any> };
      stylistic: { plugins: string[]; rules: Record<string, any> };
      'stylistic-error': { plugins: string[]; rules: Record<string, any> };
      'stylistic-warn': { plugins: string[]; rules: Record<string, any> };
      correctness: { plugins: string[]; rules: Record<string, any> };
      'correctness-error': { plugins: string[]; rules: Record<string, any> };
      'correctness-warn': { plugins: string[]; rules: Record<string, any> };
    };
    rules: NonNullable<Linter.Plugin['rules']>;
    meta: {
      name: string;
    };
  };
  export = exprt;
}

declare module 'eslint-plugin-drizzle' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
      all: ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
    meta: {
      name: string;
      version: string;
    };
  };
  export = exprt;
}
