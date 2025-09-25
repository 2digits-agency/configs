import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Array, Effect, String } from 'effect';

export class VsCodeSetupService extends Effect.Service<VsCodeSetupService>()('VsCodeSetupService', {
  effect: Effect.gen(function* () {

    const setup = Effect.fn('VsCodeSetupService.setup')(function* () {
      yield* Effect.logInfo('🚀 Setting up VSCode configuration...');

      const cwd = process.cwd();

      // Ensure .vscode directory exists
      if (!fs.existsSync(path.join(cwd, '.vscode'))) {
        fs.mkdirSync(path.join(cwd, '.vscode'), { recursive: true });
      }

      yield* setupSettings();
      yield* setupExtensions();

      yield* Effect.logInfo('🎉 VSCode setup complete!');
    });

    const setupSettings = Effect.fn('VsCodeSetupService.setupSettings')(function* () {
      const cwd = process.cwd();
      const settingsPath = `${cwd}/.vscode/settings.json`;

      const vscodeSettings = {
        // ESLint configuration
        "eslint.enable": true,
        "eslint.format.enable": true,
        "eslint.run": "onType",
        "eslint.workingDirectories": ["."],

        // Disable the default formatter, use eslint instead
        "prettier.enable": false,
        "editor.formatOnSave": false,

        // Auto fix
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit",
          "source.organizeImports": "explicit"
        },

        // Silent the stylistic rules in your IDE, but still auto fix them
        "eslint.rules.customizations": [
          { "rule": "style/*", "severity": "off", "fixable": true },
          { "rule": "format/*", "severity": "off", "fixable": true },
          { "rule": "*-indent", "severity": "off", "fixable": true },
          { "rule": "*-spacing", "severity": "off", "fixable": true },
          { "rule": "*-spaces", "severity": "off", "fixable": true },
          { "rule": "*-order", "severity": "off", "fixable": true },
          { "rule": "*-dangle", "severity": "off", "fixable": true },
          { "rule": "*-newline", "severity": "off", "fixable": true },
          { "rule": "*quotes", "severity": "off", "fixable": true },
          { "rule": "*semi", "severity": "off", "fixable": true }
        ],

        // Enable eslint for all supported languages
        "eslint.validate": [
          "javascript",
          "javascriptreact",
          "typescript",
          "typescriptreact",
          "vue",
          "html",
          "markdown",
          "json",
          "json5",
          "jsonc",
          "yaml",
          "toml",
          "xml",
          "gql",
          "graphql",
          "astro",
          "svelte",
          "css",
          "less",
          "scss",
          "pcss",
          "postcss"
        ],

        // Editor settings
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit",
          "source.organizeImports": "explicit"
        },

        // File associations
        "files.associations": {
          ".eslintrc": "json",
          ".eslintignore": "ignore",
          ".prettierrc": "json"
        },

        // TypeScript settings
        "typescript.preferences.importModuleSpecifier": "relative",
        "typescript.suggest.autoImports": true,
        "typescript.updateImportsOnFileMove.enabled": "always",

        // Search settings
        "search.exclude": {
          "**/node_modules": true,
          "**/bower_components": true,
          "**/*.code-search": true,
          "**/dist": true,
          "**/build": true
        },

        // Git settings
        "git.confirmSync": false,
        "git.autofetch": true,

        // Performance settings
        "editor.largeFileOptimizations": true,
        "editor.renderWhitespace": "boundary",

        // Accessibility
        "editor.accessibilitySupport": "auto"
      };

      // Check if settings file exists
      if (fs.existsSync(settingsPath)) {
        // Read existing settings and merge
        const existingContent = fs.readFileSync(settingsPath, 'utf8');
        const existingSettings = (() => {
          try {
            return JSON.parse(existingContent);
          } catch {
            return {};
          }
        })();

        const mergedSettings = { ...existingSettings, ...vscodeSettings };

        fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
        yield* Effect.logInfo('✅ Updated .vscode/settings.json');
      } else {
        // Create new settings file
        fs.writeFileSync(settingsPath, JSON.stringify(vscodeSettings, null, 2));
        yield* Effect.logInfo('✅ Created .vscode/settings.json');
      }
    });

    const setupExtensions = Effect.fn('VsCodeSetupService.setupExtensions')(function* () {
      const cwd = process.cwd();
      const extensionsPath = `${cwd}/.vscode/extensions.json`;

      const recommendedExtensions = {
        "recommendations": [
          // ESLint & Prettier
          "esbenp.prettier-vscode",
          "dbaeumer.vscode-eslint",

          // TypeScript
          "ms-vscode.vscode-typescript-next",

          // General development
          "bradlc.vscode-tailwindcss",
          "ms-vscode.vscode-json",
          "redhat.vscode-yaml",
          "ms-vscode.vscode-css-peek",
          "zignd.html-css-class-completion",

          // Git & GitHub
          "ms-vscode.vscode-github-issue-notebooks",
          "github.vscode-github-actions",

          // Docker
          "ms-azuretools.vscode-docker",

          // Testing
          "ms-vscode.test-adapter-converter",

          // Icons
          "vscode-icons-team.vscode-icons",

          // Spell checking
          "streetsidesoftware.code-spell-checker",

          // Import organization
          "ms-vscode.vscode-import-cost",

          // Error lens
          "usernamehw.errorlens",

          // Bracket pair colorizer
          "ms-vscode.bracket-pair-colorizer-2"
        ],
        "unwantedRecommendations": [
          "ms-vscode.vscode-typescript"
        ]
      };

      if (fs.existsSync(extensionsPath)) {
        // Read existing extensions and merge
        const existingContent = fs.readFileSync(extensionsPath, 'utf8');
        const existingExtensions = (() => {
          try {
            return JSON.parse(existingContent);
          } catch {
            return { recommendations: [], unwantedRecommendations: [] };
          }
        })();

        const mergedRecommendations = Array.dedupe(
          String.Equivalence,
          [...existingExtensions.recommendations, ...recommendedExtensions.recommendations]
        );

        const mergedUnwanted = Array.dedupe(
          String.Equivalence,
          [...existingExtensions.unwantedRecommendations, ...recommendedExtensions.unwantedRecommendations]
        );

        const mergedExtensions = {
          recommendations: mergedRecommendations,
          unwantedRecommendations: mergedUnwanted
        };

        fs.writeFileSync(extensionsPath, JSON.stringify(mergedExtensions, null, 2));
        yield* Effect.logInfo('✅ Updated .vscode/extensions.json');
      } else {
        // Create new extensions file
        fs.writeFileSync(extensionsPath, JSON.stringify(recommendedExtensions, null, 2));
        yield* Effect.logInfo('✅ Created .vscode/extensions.json');
      }
    });

    return {
      setup,
      setupSettings,
      setupExtensions,
    };
  }),
  dependencies: [],
}) {}