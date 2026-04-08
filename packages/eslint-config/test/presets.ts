interface ConfigPreset {
  readonly name: string;
  readonly options: Record<string, boolean | undefined>;
}

export const configPresets = [
  {
    name: 'full',
    options: {
      css: true,
      depend: true,
      drizzle: true,
      graphql: true,
      next: true,
      pnpm: false,
      react: true,
      storybook: true,
      tailwind: true,
      tanstackQuery: false,
      tanstackRouter: false,
      ts: true,
      turbo: true,
      vitest: true,
      zod: true,
    },
  },
  {
    name: 'minimal',
    options: {
      css: false,
      depend: false,
      drizzle: false,
      graphql: false,
      next: false,
      pnpm: false,
      react: false,
      storybook: false,
      tailwind: false,
      tanstackQuery: false,
      tanstackRouter: false,
      ts: true,
      turbo: false,
      vitest: false,
      zod: false,
    },
  },
  {
    name: 'react-only',
    options: {
      css: false,
      depend: true,
      drizzle: false,
      graphql: false,
      next: false,
      pnpm: false,
      react: true,
      storybook: false,
      tailwind: false,
      tanstackQuery: false,
      tanstackRouter: false,
      ts: true,
      turbo: false,
      vitest: false,
      zod: false,
    },
  },
  {
    name: 'next-stack',
    options: {
      css: false,
      depend: true,
      drizzle: false,
      graphql: false,
      next: true,
      pnpm: false,
      react: true,
      storybook: false,
      tailwind: true,
      tanstackQuery: true,
      tanstackRouter: false,
      ts: true,
      turbo: false,
      vitest: true,
      zod: false,
    },
  },
] as const satisfies ReadonlyArray<ConfigPreset>;

export const factoryConfigPresets = [
  { name: 'default', options: {} },
  ...configPresets.map((preset) => {
    if (preset.name !== 'full') {
      return preset;
    }

    return {
      ...preset,
      options: {
        ...preset.options,
        tanstackQuery: true,
        tanstackRouter: true,
      },
    };
  }),
] as const;
