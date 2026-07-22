declare module '@eslint-community/eslint-plugin-eslint-comments' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  const exprt: {
    configs: {
      recommended: ClassicConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };

  export = exprt;
}

declare module '@eslint-community/eslint-plugin-eslint-comments/configs' {
  import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';

  const exprt: {
    recommended: FlatConfig.Config;
  };

  export = exprt;
}

declare module 'eslint-plugin-tailwindcss' {
  import type { FlatConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  type PluginSettings = {
    attributes?: Array<string>;
    cssConfigPath: string;
    functions?: Array<string>;
    parseKeyFunctions?: Array<string>;
    ignoredKeys?: Array<string>;
    cacheMaxSize?: number;
    cacheMaxAge?: number;
  };

  const plugin: {
    meta: {
      name: string;
      version: string;
    };
    configs: {
      recommended: FlatConfig.Config;
    };
    rules: NonNullable<Linter.Plugin['rules']>;
  };

  export type { PluginSettings };
  export default plugin;
}

declare module 'eslint-plugin-drizzle' {
  import type { ClassicConfig, Linter } from '@typescript-eslint/utils/ts-eslint';

  const exprt: {
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
