import { Path } from '@effect/platform';
import { Effect } from 'effect';
import * as fs from 'node:fs/promises';

import { PackageManagerService } from './PackageManagerService';

export class VSCodeSetupService extends Effect.Service<VSCodeSetupService>()('VSCodeSetupService', {
  effect: Effect.gen(function* () {
    const path = yield* Path.Path;
    const pm = yield* PackageManagerService;

    const ensureDirectory = (dirPath: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            await fs.mkdir(dirPath, { recursive: true });
          } catch (error) {
            // Ignore EEXIST
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
          }
        },
        catch: (cause) => cause,
      });

    const readJsonIfExists = <T>(filePath: string) =>
      Effect.tryPromise({
        try: async () => {
          try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content) as T;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined as unknown as T;
            throw error;
          }
        },
        catch: (cause) => cause,
      });

    const writeJson = (filePath: string, data: unknown) =>
      Effect.tryPromise({
        try: async () => {
          const json = JSON.stringify(data, null, 2) + '\n';
          await fs.writeFile(filePath, json, 'utf8');
        },
        catch: (cause) => cause,
      });

    const setup = Effect.fn('VSCodeSetupService.setup')(function* () {
      yield* Effect.logInfo('🛠️  Configuring VS Code settings...');

      const root = yield* pm.resolveRoot();
      const vscodeDir = path.resolve(root, '.vscode');
      const settingsPath = path.resolve(vscodeDir, 'settings.json');
      const extensionsPath = path.resolve(vscodeDir, 'extensions.json');

      yield* ensureDirectory(vscodeDir);

      // Desired settings to enforce good ESLint + Prettier VSCode behavior
      const desiredSettings: Record<string, unknown> = {
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        'editor.formatOnSave': true,
        'editor.codeActionsOnSave': {
          'source.fixAll': 'explicit',
          'source.fixAll.eslint': 'explicit',
        },
        'eslint.useFlatConfig': true,
        'eslint.experimental.useFlatConfig': true,
        'eslint.workingDirectories': [{ mode: 'auto' }],
        'eslint.validate': ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'markdown'],
        'prettier.useEditorConfig': true,
      };

      const existingSettings = (yield* readJsonIfExists<Record<string, unknown>>(settingsPath)) ?? {};
      const nextSettings = { ...existingSettings, ...desiredSettings };

      // Sort keys for stability
      const sortedSettings = Object.keys(nextSettings)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (nextSettings as Record<string, unknown>)[key];
          return acc;
        }, {});

      yield* writeJson(settingsPath, sortedSettings);
      yield* Effect.logInfo(`✅ Updated ${settingsPath}`);

      // Extension recommendations
      type ExtensionsJson = { recommendations?: Array<string>; unwantedRecommendations?: Array<string> };
      const existingExtensions = (yield* readJsonIfExists<ExtensionsJson>(extensionsPath)) ?? {};

      const recommendations = new Set<string>(existingExtensions.recommendations ?? []);
      recommendations.add('esbenp.prettier-vscode');
      recommendations.add('dbaeumer.vscode-eslint');

      const nextExtensions: ExtensionsJson = {
        ...existingExtensions,
        recommendations: Array.from(recommendations).sort(),
      };

      yield* writeJson(extensionsPath, nextExtensions);
      yield* Effect.logInfo(`✅ Updated ${extensionsPath}`);

      yield* Effect.logInfo('🎉 VS Code setup complete!');
    });

    return { setup };
  }),
  dependencies: [Path.layer, PackageManagerService.Default],
}) {}

