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

declare module 'eslint-config-prettier' {
  import type { ClassicConfig } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: ClassicConfig.Config;

  export = exprt;
}

declare module 'eslint-plugin-react-compiler' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  declare const exprt: {
    rules: NonNullable<Linter.Plugin['rules']>;
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
