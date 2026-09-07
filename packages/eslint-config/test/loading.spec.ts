import { describe, expect, it, vi } from 'vite-plus/test';

import { configPresets } from './presets';

const loaded = vi.hoisted(() => ({
  css: vi.fn<() => void>(),
  depend: vi.fn<() => void>(),
  react: vi.fn<() => void>(),
}));
const loadedReactPlugin = vi.hoisted(() => vi.fn<() => void>());

vi.mock(import('@eslint-react/eslint-plugin'), async (importOriginal) => {
  loadedReactPlugin();

  return importOriginal();
});

vi.mock(import('../src/configs/css'), () => {
  loaded.css();

  return { css: () => Promise.resolve([]) };
});
vi.mock(import('../src/configs/depend'), () => {
  loaded.depend();

  return { depend: () => [] };
});
vi.mock(import('../src/configs/react'), () => {
  loaded.react();

  return { react: () => Promise.resolve([]) };
});

describe('optional config loading', () => {
  it('loads optional modules only when enabled', async () => {
    const { twoDigits } = await import('../src');
    const options = configPresets[1].options;

    await twoDigits(options);

    for (const load of Object.values(loaded)) {
      expect(load).not.toHaveBeenCalled();
    }
    expect(loadedReactPlugin).not.toHaveBeenCalled();

    await twoDigits({ ...options, css: true, depend: true, react: true });

    for (const load of Object.values(loaded)) {
      expect(load).toHaveBeenCalledOnce();
    }

    const custom = await twoDigits(options, { plugins: { 'react-extra': {} } });

    expect(loadedReactPlugin).toHaveBeenCalledOnce();
    expect(custom.at(-1)?.rules).toHaveProperty('react-extra/no-unused-props', 'off');
  });

  it('honors package-local TypeScript roots and parser overrides', async () => {
    const { typescript } = await import('../src/configs/typescript');
    const root = '/workspace/packages/api';
    const configs = await typescript({ tsconfigRootDir: root });

    expect(configs[1]?.languageOptions?.parserOptions).toMatchObject({
      tsconfigRootDir: root,
      projectService: true,
    });

    const overridden = await typescript({
      tsconfigRootDir: root,
      parserOptions: { tsconfigRootDir: '/workspace/packages/web' },
    });

    expect(overridden[1]?.languageOptions?.parserOptions?.tsconfigRootDir).toBe('/workspace/packages/web');
  });
});
