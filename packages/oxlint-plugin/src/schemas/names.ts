import * as Schema from 'effect/Schema';

/**
 * A `.test` or `.spec` file name.
 */
export const TestFilename = Schema.String.check(Schema.isPattern(/\.(?:test|spec)\.[cm]?[jt]sx?$/u));

const StoryFilename = Schema.String.check(Schema.isPattern(/\.stories?\.[cm]?[jt]sx?$/u));

export const TestOrStoryFilename = Schema.Union([TestFilename, StoryFilename]);

export const DeclarationFile = Schema.String.check(Schema.isPattern(/\.d\.[cm]?ts$/u));

export const TypeScriptFile = Schema.String.check(Schema.isPattern(/\.[cm]?tsx?$/u));

export const ConstructorName = Schema.String.check(Schema.isPattern(/^\p{Lu}/u));

// Components (PascalCase) and hooks (`useX`) stay named.
export const ComponentOrHook = Schema.Union([ConstructorName, Schema.String.check(Schema.isPattern(/^use\p{Lu}/u))]);

export const ComponentName = Schema.String.check(Schema.isPattern(/^_?[A-Z]/u));

export const HookName = Schema.String.check(Schema.isPattern(/^use[A-Z0-9]/u));

export const GuardName = Schema.String.check(Schema.isPattern(/^is\p{Lu}/u));

export const ServiceConstructorName = Schema.String.check(Schema.isPattern(/^make[A-Z]/u));

// Static members of a `Context.Service` class that build the service: `make`, `layer` and variants such as `layerTest`.
export const ServiceConstructionMemberName = Schema.String.check(Schema.isPattern(/^(?:make|layer(?:[A-Z0-9_].*)?)$/u));

/**
 * Effect and Alchemy module namespaces are PascalCase; lowercase and SCREAMING_SNAKE exports such as `ALCHEMY_DEV` are
 * plain values.
 */
export const ModuleName = Schema.String.check(Schema.isPattern(/^\p{Lu}[^_]*$/u));

export const MinMax = Schema.Literals(['min', 'max'] satisfies ReadonlyArray<keyof Math>);

// Names that read as a bound rather than the clamped value, such as `min`, `maxWidth`, `upperBound` or `hi`.
export const BoundName = Schema.String.check(
  Schema.isPattern(/min|max|lower|upper|bound|limit|^(?:lo|hi|low|high)$/iu),
);

export const ErrorLikeName = Schema.Literals(['error', 'err', 'e', 'cause', 'exception', 'ex']);

export const StatusName = Schema.Literals(['status', 'statusCode']);

export const AsciiUppercase = Schema.String.check(Schema.isPattern(/[A-Z]/u));

// TypeScript utility types that narrow a union to some of its members.
export const UnionFilterName = Schema.Literals(['Extract', 'Exclude']);
