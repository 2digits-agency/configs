declare module 'eslint-plugin-react-refresh' {
  import type { ESLint } from 'eslint';

  const plugin: ESLint.Plugin;

  export default plugin;
}

declare module 'eslint-plugin-react-hooks' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module 'eslint-plugin-turbo' {
  import type { ESLint } from 'eslint';

  const plugin: ESLint.Plugin;

  export default plugin;
}

declare module 'eslint-plugin-react' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
      all: ClassicConfig.Config;
      'jsx-runtime': ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

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

declare module 'eslint-plugin-eslint-comments' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module 'eslint-plugin-tailwindcss' {
  import type { ClassicConfig, Linter, FlatConfig } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
      'flat/recommended': FlatConfig.ConfigArray;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module 'eslint-plugin-storybook' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
      csf: ClassicConfig.Config;
      'csf-strict': ClassicConfig.Config;
      'addon-interactions': ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module 'eslint-config-prettier' {
  import type { ClassicConfig } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: ClassicConfig.Config;

  export = exprt;
}

declare module 'eslint-plugin-unicorn' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
      all: ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}

declare module 'eslint-plugin-jsdoc' {
  import type { ClassicConfig, FlatConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    configs: {
      'flat/recommended': FlatConfig.Config;
      'flat/recommended-error': FlatConfig.Config;
      'flat/recommended-typescript': FlatConfig.Config;
      'flat/recommended-typescript-error': FlatConfig.Config;
      'flat/recommended-typescript-flavor': FlatConfig.Config;
      'flat/recommended-typescript-flavor-error': FlatConfig.Config;
    };
    environments: {
      globals: {
        globals: ClassicConfig.EnvironmentConfig;
      };
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };
  export = exprt;
}
