# Project Context

## Purpose
**@2digits/config-monorepo** provides curated, opinionated default configurations for development tooling (ESLint, Prettier, TypeScript) used across the 2digits-agency ecosystem. Goals:
- Streamline developer workflow with zero-config defaults
- Maintain consistency across projects
- Support React, Next.js, Tailwind, GraphQL, and modern TypeScript patterns
- Minimize setup overhead via feature-flag factory functions

## Tech Stack
- **TypeScript 5.9.3** - Primary language
- **pnpm 10.20.0** - Package manager with strict catalog mode
- **Turbo 2.6.0** - Monorepo build orchestration
- **Vitest 4.0.8** - Testing framework
- **ESLint 9.39.1** - Linting (flat config format)
- **Prettier 3.6.2** - Code formatting
- **Effect 3.19.3** - Functional runtime (CLI package)
- **tsdown** - TypeScript bundler for package builds
- **Changesets** - Version management and changelog generation

## Project Conventions

### Code Style
- **Prettier:** 120 print width, single quotes, trailing commas, semicolons
- **Import Order:** builtins → React → Next → Expo → third-party → @2digits → @mod → aliases → relative
- **ESLint:** Flat config with 30+ plugins (typescript-eslint, react, unicorn, sonarjs, perfectionist, etc.)
- **Naming:** Camelcase functions/variables, PascalCase components/types, UPPER_SNAKE_CASE constants
- **Type Parameters:** Enforce single uppercase letter or descriptive PascalCase names (via custom rule)
- **Tailwind Functions:** Auto-sorted classes in tv(), cn(), cnBase(), classnames(), clsx(), cx()

### Architecture Patterns
- **Monorepo Structure:** Separate packages for eslint-config, prettier-config, tsconfig, eslint-plugin, constants, cli, renovate
- **Factory Functions:** Feature-flag based config builders (e.g., `twoDigits({ react: true, next: true })`)
- **Dual Exports:** ESM primary, CommonJS for prettier-config compatibility
- **Catalog Dependencies:** Centralized version management via pnpm catalog
- **Effect-Based CLI:** Dependency injection and error handling using Effect framework
- **Shared Constants:** Single source of truth for cross-package values (e.g., tailwindFunctions)

### Testing Strategy
- **Framework:** Vitest with coverage reporting
- **Fixture Testing:** ESLint configs tested via snapshot comparison (input → eslint --fix → output vs expected)
- **Rule Testing:** Custom ESLint rules use eslint-vitest-rule-tester
- **No Unit Tests:** Config packages (prettier, tsconfig, constants) validated through usage
- **Watch Mode:** `pnpm check:watch` for continuous validation during development

### Git Workflow
- **Branching:** Feature branches → main (base branch)
- **Changesets:** All changes require changeset files before PR merge
- **Commit Convention:** Changesets auto-commit enabled, commits include changeset prompts
- **Publishing:** `pnpm release` builds and publishes all packages with bumped versions
- **Main Protection:** All packages use `main` as base branch, no develop/staging branches
- **Monorepo Validation:** manypkg enforces workspace dependency versions

## Domain Context
- **Frontend Ecosystem Focus:** Primarily supports React, Next.js, Tailwind CSS, Storybook, GraphQL
- **2digits-Agency Conventions:** Import patterns favor @2digits scoped packages, internal @mod namespace
- **Tailwind Integration:** Preconfigured class sorting and function name detection
- **React Server Components:** Next.js-specific rules for RSC/client component boundaries
- **GraphQL:** @graphql-eslint integration for .graphql files and gql template literals
- **TanStack Ecosystem:** Query/Router specific linting rules included
- **Drizzle ORM:** Support for drizzle-kit conventions

## Important Constraints
- **ESLint 9+ Only:** Flat config format required, no eslintrc support
- **Strict Catalog Mode:** All cross-package dependencies must use catalog versions
- **pnpm Required:** Package manager cannot be substituted (uses pnpm-workspace.yaml features)
- **TypeScript Strict Mode:** All packages enforce strict type checking
- **Public Packages Only:** Only eslint-config, prettier-config, tsconfig, eslint-plugin, constants published to npm
- **Node.js Version:** Requires modern Node (engines fields specify compatibility)
- **No Native Polyfills:** Uses nolyfill to avoid unnecessary polyfills

## External Dependencies
- **npm Registry:** All packages published publicly to npm under @2digits scope
- **Changesets:** Version management and changelog automation
- **Renovate:** Automated dependency updates (configured via @2digits/renovate-config)
- **Turbo Remote Cache:** Optional build caching (not configured by default)
- **ESLint Plugin Ecosystem:** 30+ external ESLint plugins as peer dependencies
- **Prettier Plugin Ecosystem:** 5 prettier plugins (import-sort, jsdoc, oxc, tailwindcss, xml)
