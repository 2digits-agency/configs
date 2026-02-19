/* eslint-disable */
/* prettier-ignore */
import type { Linter } from 'eslint'

export interface RuleOptions {
  /**
   * Require curly braces around if statement bodies
   * @see https://github.com/2digits-agency/configs/tree/main/packages/eslint-plugin/src/rules/if-curly.ts
   */
  '@2digits/if-curly'?: Linter.RuleEntry<[]>
  /**
   * Disallow passing function references to array methods
   * @see https://github.com/2digits-agency/configs/tree/main/packages/eslint-plugin/src/rules/prefer-inline-array-callbacks.ts
   */
  '@2digits/prefer-inline-array-callbacks'?: Linter.RuleEntry<[]>
  /**
   * Discourage hoisting event handlers only used once in JSX; prefer inlining
   * @see https://github.com/2digits-agency/configs/tree/main/packages/eslint-plugin/src/rules/prefer-inline-handlers.ts
   */
  '@2digits/prefer-inline-handlers'?: Linter.RuleEntry<[]>
  /**
   * Enforce giving proper names to type parameters when there are two or more
   * @see https://github.com/2digits-agency/configs/tree/main/packages/eslint-plugin/src/rules/type-param-names.ts
   */
  '@2digits/type-param-names'?: Linter.RuleEntry<[]>
  /**
   * Enforce getter and setter pairs in objects and classes
   * @see https://eslint.org/docs/latest/rules/accessor-pairs
   */
  'accessor-pairs'?: Linter.RuleEntry<AccessorPairs>
  /**
   * Having line breaks styles to object, array and named imports
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/consistent-chaining.md
   */
  'antfu/consistent-chaining'?: Linter.RuleEntry<AntfuConsistentChaining>
  /**
   * Having line breaks styles to object, array and named imports
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/consistent-list-newline.md
   */
  'antfu/consistent-list-newline'?: Linter.RuleEntry<AntfuConsistentListNewline>
  /**
   * Enforce Anthony's style of curly bracket
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/curly.md
   */
  'antfu/curly'?: Linter.RuleEntry<[]>
  /**
   * Newline after if
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/if-newline.md
   */
  'antfu/if-newline'?: Linter.RuleEntry<[]>
  /**
   * Fix duplication in imports
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/import-dedupe.md
   */
  'antfu/import-dedupe'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent indentation in `unindent` template tag
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/indent-unindent.md
   */
  'antfu/indent-unindent'?: Linter.RuleEntry<AntfuIndentUnindent>
  /**
   * Prevent importing modules in `dist` folder
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/no-import-dist.test.ts
   */
  'antfu/no-import-dist'?: Linter.RuleEntry<[]>
  /**
   * Prevent importing modules in `node_modules` folder by relative or absolute path
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/no-import-node-modules-by-path.test.ts
   */
  'antfu/no-import-node-modules-by-path'?: Linter.RuleEntry<[]>
  /**
   * Prevent using top-level await
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/no-top-level-await.test.ts
   */
  'antfu/no-top-level-await'?: Linter.RuleEntry<[]>
  /**
   * Do not use `exports =`
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/no-ts-export-equal.test.ts
   */
  'antfu/no-ts-export-equal'?: Linter.RuleEntry<[]>
  /**
   * Enforce top-level functions to be declared with function keyword
   * @see https://github.com/antfu/eslint-plugin-antfu/blob/main/src/rules/top-level-function.md
   */
  'antfu/top-level-function'?: Linter.RuleEntry<[]>
  /**
   * Enforce linebreaks after opening and before closing array brackets
   * @see https://eslint.org/docs/latest/rules/array-bracket-newline
   * @deprecated
   */
  'array-bracket-newline'?: Linter.RuleEntry<ArrayBracketNewline>
  /**
   * Enforce consistent spacing inside array brackets
   * @see https://eslint.org/docs/latest/rules/array-bracket-spacing
   * @deprecated
   */
  'array-bracket-spacing'?: Linter.RuleEntry<ArrayBracketSpacing>
  /**
   * Enforce `return` statements in callbacks of array methods
   * @see https://eslint.org/docs/latest/rules/array-callback-return
   */
  'array-callback-return'?: Linter.RuleEntry<ArrayCallbackReturn>
  /**
   * Enforce line breaks after each array element
   * @see https://eslint.org/docs/latest/rules/array-element-newline
   * @deprecated
   */
  'array-element-newline'?: Linter.RuleEntry<ArrayElementNewline>
  /**
   * Require braces around arrow function bodies
   * @see https://eslint.org/docs/latest/rules/arrow-body-style
   */
  'arrow-body-style'?: Linter.RuleEntry<ArrowBodyStyle>
  /**
   * Require parentheses around arrow function arguments
   * @see https://eslint.org/docs/latest/rules/arrow-parens
   * @deprecated
   */
  'arrow-parens'?: Linter.RuleEntry<ArrowParens>
  /**
   * Enforce consistent spacing before and after the arrow in arrow functions
   * @see https://eslint.org/docs/latest/rules/arrow-spacing
   * @deprecated
   */
  'arrow-spacing'?: Linter.RuleEntry<ArrowSpacing>
  /**
   * Enforce the use of variables within the scope they are defined
   * @see https://eslint.org/docs/latest/rules/block-scoped-var
   */
  'block-scoped-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow or enforce spaces inside of blocks after opening block and before closing block
   * @see https://eslint.org/docs/latest/rules/block-spacing
   * @deprecated
   */
  'block-spacing'?: Linter.RuleEntry<BlockSpacing>
  /**
   * Transforms the negation of a conjunction !(A && B) into the equivalent !A || !B according to De Morgan’s law
   * @see https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-conjunction.md
   */
  'boolean/no-negated-conjunction'?: Linter.RuleEntry<[]>
  /**
   * Transforms the negation of a disjunction !(A || B) into the equivalent !A && !B according to De Morgan’s law
   * @see https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-disjunction.md
   */
  'boolean/no-negated-disjunction'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent brace style for blocks
   * @see https://eslint.org/docs/latest/rules/brace-style
   * @deprecated
   */
  'brace-style'?: Linter.RuleEntry<BraceStyle>
  /**
   * Require `return` statements after callbacks
   * @see https://eslint.org/docs/latest/rules/callback-return
   * @deprecated
   */
  'callback-return'?: Linter.RuleEntry<CallbackReturn>
  /**
   * Enforce camelcase naming convention
   * @see https://eslint.org/docs/latest/rules/camelcase
   */
  'camelcase'?: Linter.RuleEntry<Camelcase>
  /**
   * Enforce or disallow capitalization of the first letter of a comment
   * @see https://eslint.org/docs/latest/rules/capitalized-comments
   */
  'capitalized-comments'?: Linter.RuleEntry<CapitalizedComments>
  /**
   * Enforce that class methods utilize `this`
   * @see https://eslint.org/docs/latest/rules/class-methods-use-this
   */
  'class-methods-use-this'?: Linter.RuleEntry<ClassMethodsUseThis>
  /**
   * Require or disallow trailing commas
   * @see https://eslint.org/docs/latest/rules/comma-dangle
   * @deprecated
   */
  'comma-dangle'?: Linter.RuleEntry<CommaDangle>
  /**
   * Enforce consistent spacing before and after commas
   * @see https://eslint.org/docs/latest/rules/comma-spacing
   * @deprecated
   */
  'comma-spacing'?: Linter.RuleEntry<CommaSpacing>
  /**
   * Enforce consistent comma style
   * @see https://eslint.org/docs/latest/rules/comma-style
   * @deprecated
   */
  'comma-style'?: Linter.RuleEntry<CommaStyle>
  /**
   * require a `eslint-enable` comment for every `eslint-disable` comment
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/disable-enable-pair.html
   */
  'comments/disable-enable-pair'?: Linter.RuleEntry<CommentsDisableEnablePair>
  /**
   * disallow a `eslint-enable` comment for multiple `eslint-disable` comments
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-aggregating-enable.html
   */
  'comments/no-aggregating-enable'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate `eslint-disable` comments
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-duplicate-disable.html
   */
  'comments/no-duplicate-disable'?: Linter.RuleEntry<[]>
  /**
   * disallow `eslint-disable` comments about specific rules
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-restricted-disable.html
   */
  'comments/no-restricted-disable'?: Linter.RuleEntry<CommentsNoRestrictedDisable>
  /**
   * disallow `eslint-disable` comments without rule names
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-unlimited-disable.html
   */
  'comments/no-unlimited-disable'?: Linter.RuleEntry<[]>
  /**
   * disallow unused `eslint-disable` comments
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-unused-disable.html
   */
  'comments/no-unused-disable'?: Linter.RuleEntry<[]>
  /**
   * disallow unused `eslint-enable` comments
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-unused-enable.html
   */
  'comments/no-unused-enable'?: Linter.RuleEntry<[]>
  /**
   * disallow ESLint directive-comments
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/no-use.html
   */
  'comments/no-use'?: Linter.RuleEntry<CommentsNoUse>
  /**
   * require include descriptions in ESLint directive-comments
   * @see https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/require-description.html
   */
  'comments/require-description'?: Linter.RuleEntry<CommentsRequireDescription>
  /**
   * Enforce a maximum cyclomatic complexity allowed in a program
   * @see https://eslint.org/docs/latest/rules/complexity
   */
  'complexity'?: Linter.RuleEntry<Complexity>
  /**
   * Enforce consistent spacing inside computed property brackets
   * @see https://eslint.org/docs/latest/rules/computed-property-spacing
   * @deprecated
   */
  'computed-property-spacing'?: Linter.RuleEntry<ComputedPropertySpacing>
  /**
   * Require `return` statements to either always or never specify values
   * @see https://eslint.org/docs/latest/rules/consistent-return
   */
  'consistent-return'?: Linter.RuleEntry<ConsistentReturn>
  /**
   * Enforce consistent naming when capturing the current execution context
   * @see https://eslint.org/docs/latest/rules/consistent-this
   */
  'consistent-this'?: Linter.RuleEntry<ConsistentThis>
  /**
   * Require `super()` calls in constructors
   * @see https://eslint.org/docs/latest/rules/constructor-super
   */
  'constructor-super'?: Linter.RuleEntry<[]>
  /**
   * Enforce use of fallback fonts and a generic font last
   * @see https://github.com/eslint/css/blob/main/docs/rules/font-family-fallbacks.md
   */
  'css/font-family-fallbacks'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate @import rules
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-duplicate-imports.md
   */
  'css/no-duplicate-imports'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate selectors within keyframe blocks
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-duplicate-keyframe-selectors.md
   */
  'css/no-duplicate-keyframe-selectors'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty blocks
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-empty-blocks.md
   */
  'css/no-empty-blocks'?: Linter.RuleEntry<[]>
  /**
   * Disallow !important flags
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-important.md
   */
  'css/no-important'?: Linter.RuleEntry<[]>
  /**
   * Disallow invalid placement of at-rules
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-invalid-at-rule-placement.md
   */
  'css/no-invalid-at-rule-placement'?: Linter.RuleEntry<[]>
  /**
   * Disallow invalid at-rules
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-invalid-at-rules.md
   */
  'css/no-invalid-at-rules'?: Linter.RuleEntry<[]>
  /**
   * Disallow invalid named grid areas
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-invalid-named-grid-areas.md
   */
  'css/no-invalid-named-grid-areas'?: Linter.RuleEntry<[]>
  /**
   * Disallow invalid properties
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-invalid-properties.md
   */
  'css/no-invalid-properties'?: Linter.RuleEntry<CssNoInvalidProperties>
  /**
   * Disallow unmatchable selectors
   * @see https://github.com/eslint/css/blob/main/docs/rules/no-unmatchable-selectors.md
   */
  'css/no-unmatchable-selectors'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of logical properties
   * @see https://github.com/eslint/css/blob/main/docs/rules/prefer-logical-properties.md
   */
  'css/prefer-logical-properties'?: Linter.RuleEntry<CssPreferLogicalProperties>
  /**
   * Enforce the use of relative font units
   * @see https://github.com/eslint/css/blob/main/docs/rules/relative-font-units.md
   */
  'css/relative-font-units'?: Linter.RuleEntry<CssRelativeFontUnits>
  /**
   * Disallow and limit CSS selectors
   * @see https://github.com/eslint/css/blob/main/docs/rules/selector-complexity.md
   */
  'css/selector-complexity'?: Linter.RuleEntry<CssSelectorComplexity>
  /**
   * Enforce the use of baseline features
   * @see https://github.com/eslint/css/blob/main/docs/rules/use-baseline.md
   */
  'css/use-baseline'?: Linter.RuleEntry<CssUseBaseline>
  /**
   * Require use of layers
   * @see https://github.com/eslint/css/blob/main/docs/rules/use-layers.md
   */
  'css/use-layers'?: Linter.RuleEntry<CssUseLayers>
  /**
   * Enforce consistent brace style for all control statements
   * @see https://eslint.org/docs/latest/rules/curly
   */
  'curly'?: Linter.RuleEntry<Curly>
  /**
   * Require `default` cases in `switch` statements
   * @see https://eslint.org/docs/latest/rules/default-case
   */
  'default-case'?: Linter.RuleEntry<DefaultCase>
  /**
   * Enforce `default` clauses in `switch` statements to be last
   * @see https://eslint.org/docs/latest/rules/default-case-last
   */
  'default-case-last'?: Linter.RuleEntry<[]>
  /**
   * Enforce default parameters to be last
   * @see https://eslint.org/docs/latest/rules/default-param-last
   */
  'default-param-last'?: Linter.RuleEntry<[]>
  /**
   * Bans a list of dependencies from being used
   * @see https://github.com/es-tooling/eslint-plugin-depend/blob/main/docs/rules/ban-dependencies.md
   */
  'depend/ban-dependencies'?: Linter.RuleEntry<DependBanDependencies>
  /**
   * Enforce consistent newlines before and after dots
   * @see https://eslint.org/docs/latest/rules/dot-location
   * @deprecated
   */
  'dot-location'?: Linter.RuleEntry<DotLocation>
  /**
   * Enforce dot notation whenever possible
   * @see https://eslint.org/docs/latest/rules/dot-notation
   */
  'dot-notation'?: Linter.RuleEntry<DotNotation>
  /**
   * Enforce that `delete` method is used with `where` to avoid deleting all the rows in a table.
   * @see https://github.com/drizzle-team/eslint-plugin-drizzle
   */
  'drizzle/enforce-delete-with-where'?: Linter.RuleEntry<DrizzleEnforceDeleteWithWhere>
  /**
   * Enforce that `update` method is used with `where` to avoid deleting all the rows in a table.
   * @see https://github.com/drizzle-team/eslint-plugin-drizzle
   */
  'drizzle/enforce-update-with-where'?: Linter.RuleEntry<DrizzleEnforceUpdateWithWhere>
  /**
   * Require or disallow newline at the end of files
   * @see https://eslint.org/docs/latest/rules/eol-last
   * @deprecated
   */
  'eol-last'?: Linter.RuleEntry<EolLast>
  /**
   * Require the use of `===` and `!==`
   * @see https://eslint.org/docs/latest/rules/eqeqeq
   */
  'eqeqeq'?: Linter.RuleEntry<Eqeqeq>
  /**
   * Enforce `for` loop update clause moving the counter in the right direction
   * @see https://eslint.org/docs/latest/rules/for-direction
   */
  'for-direction'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing between function identifiers and their invocations
   * @see https://eslint.org/docs/latest/rules/func-call-spacing
   * @deprecated
   */
  'func-call-spacing'?: Linter.RuleEntry<FuncCallSpacing>
  /**
   * Require function names to match the name of the variable or property to which they are assigned
   * @see https://eslint.org/docs/latest/rules/func-name-matching
   */
  'func-name-matching'?: Linter.RuleEntry<FuncNameMatching>
  /**
   * Require or disallow named `function` expressions
   * @see https://eslint.org/docs/latest/rules/func-names
   */
  'func-names'?: Linter.RuleEntry<FuncNames>
  /**
   * Enforce the consistent use of either `function` declarations or expressions assigned to variables
   * @see https://eslint.org/docs/latest/rules/func-style
   */
  'func-style'?: Linter.RuleEntry<FuncStyle>
  /**
   * Enforce line breaks between arguments of a function call
   * @see https://eslint.org/docs/latest/rules/function-call-argument-newline
   * @deprecated
   */
  'function-call-argument-newline'?: Linter.RuleEntry<FunctionCallArgumentNewline>
  /**
   * Enforce consistent line breaks inside function parentheses
   * @see https://eslint.org/docs/latest/rules/function-paren-newline
   * @deprecated
   */
  'function-paren-newline'?: Linter.RuleEntry<FunctionParenNewline>
  /**
   * Enforce consistent spacing around `*` operators in generator functions
   * @see https://eslint.org/docs/latest/rules/generator-star-spacing
   * @deprecated
   */
  'generator-star-spacing'?: Linter.RuleEntry<GeneratorStarSpacing>
  /**
   * Enforce `return` statements in getters
   * @see https://eslint.org/docs/latest/rules/getter-return
   */
  'getter-return'?: Linter.RuleEntry<GetterReturn>
  /**
   * enforce naming convention to action name.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/action-name-casing.html
   */
  'github-action/action-name-casing'?: Linter.RuleEntry<GithubActionActionNameCasing>
  /**
   * enforce naming convention to job id.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/job-id-casing.html
   */
  'github-action/job-id-casing'?: Linter.RuleEntry<GithubActionJobIdCasing>
  /**
   * enforce maximum jobs per action file.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/max-jobs-per-action.html
   */
  'github-action/max-jobs-per-action'?: Linter.RuleEntry<GithubActionMaxJobsPerAction>
  /**
   * disallow using external job.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/no-external-job.html
   */
  'github-action/no-external-job'?: Linter.RuleEntry<[]>
  /**
   * disallow using invalid key.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/no-invalid-key.html
   */
  'github-action/no-invalid-key'?: Linter.RuleEntry<[]>
  /**
   * disallow using top level env.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/no-top-level-env.html
   */
  'github-action/no-top-level-env'?: Linter.RuleEntry<[]>
  /**
   * disallow using top level permissions.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/no-top-level-permissions.html
   */
  'github-action/no-top-level-permissions'?: Linter.RuleEntry<[]>
  /**
   * enforce action file extension.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/prefer-file-extension.html
   */
  'github-action/prefer-file-extension'?: Linter.RuleEntry<GithubActionPreferFileExtension>
  /**
   * enforce the style of job step uses.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/prefer-step-uses-style.html
   */
  'github-action/prefer-step-uses-style'?: Linter.RuleEntry<GithubActionPreferStepUsesStyle>
  /**
   * require a string action name.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/require-action-name.html
   */
  'github-action/require-action-name'?: Linter.RuleEntry<[]>
  /**
   * require a string action run-name.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/require-action-run-name.html
   */
  'github-action/require-action-run-name'?: Linter.RuleEntry<[]>
  /**
   * require a string job name.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/require-job-name.html
   */
  'github-action/require-job-name'?: Linter.RuleEntry<[]>
  /**
   * require a string job step name.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/require-job-step-name.html
   */
  'github-action/require-job-step-name'?: Linter.RuleEntry<[]>
  /**
   * disallow invalid timeout-minutes.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/valid-timeout-minutes.html
   */
  'github-action/valid-timeout-minutes'?: Linter.RuleEntry<GithubActionValidTimeoutMinutes>
  /**
   * disallow invalid trigger events.
   * @see https://eslint-plugin-github-action.ntnyq.com/rules/valid-trigger-events.html
   */
  'github-action/valid-trigger-events'?: Linter.RuleEntry<[]>
  /**
   * Require `require()` calls to be placed at top-level module scope
   * @see https://eslint.org/docs/latest/rules/global-require
   * @deprecated
   */
  'global-require'?: Linter.RuleEntry<[]>
  /**
   * Enforce arrange in alphabetical order for type fields, enum values, input object fields, operation selections and more.
   * @see https://the-guild.dev/graphql/eslint/rules/alphabetize
   */
  'gql/alphabetize'?: Linter.RuleEntry<GqlAlphabetize>
  /**
   * Require all comments to follow the same style (either block or inline).
   * @see https://the-guild.dev/graphql/eslint/rules/description-style
   */
  'gql/description-style'?: Linter.RuleEntry<GqlDescriptionStyle>
  /**
   * A GraphQL document is only valid for execution if all definitions are either operation or fragment definitions.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/executable-definitions
   */
  'gql/executable-definitions'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if all fields selected are defined by the parent type, or are an allowed meta field such as `__typename`.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/fields-on-correct-type
   */
  'gql/fields-on-correct-type'?: Linter.RuleEntry<[]>
  /**
   * Fragments use a type condition to determine if they apply, since fragments can only be spread into a composite type (object, interface, or union), the type condition must also be a composite type.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/fragments-on-composite-type
   */
  'gql/fragments-on-composite-type'?: Linter.RuleEntry<[]>
  /**
   * Require mutation argument to be always called "input" and input type to be called Mutation name + "Input".
Using the same name for all input parameters will make your schemas easier to consume and more predictable. Using the same name as mutation for InputType will make it easier to find mutations that InputType belongs to.
   * @see https://the-guild.dev/graphql/eslint/rules/input-name
   */
  'gql/input-name'?: Linter.RuleEntry<GqlInputName>
  /**
   * A GraphQL field is only valid if all supplied arguments are defined by that field.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/known-argument-names
   */
  'gql/known-argument-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if all `@directive`s are known by the schema and legally positioned.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/known-directives
   */
  'gql/known-directives'?: Linter.RuleEntry<GqlKnownDirectives>
  /**
   * A GraphQL document is only valid if all `...Fragment` fragment spreads refer to fragments defined in the same document.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/known-fragment-names
   */
  'gql/known-fragment-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if referenced types (specifically variable definitions and fragment conditions) are defined by the type schema.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/known-type-names
   */
  'gql/known-type-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document that contains an anonymous operation (the `query` short-hand) is only valid if it contains only that one operation definition.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/lone-anonymous-operation
   */
  'gql/lone-anonymous-operation'?: Linter.RuleEntry<[]>
  /**
   * Require queries, mutations, subscriptions or fragments to be located in separate files.
   * @see https://the-guild.dev/graphql/eslint/rules/lone-executable-definition
   */
  'gql/lone-executable-definition'?: Linter.RuleEntry<GqlLoneExecutableDefinition>
  /**
   * A GraphQL document is only valid if it contains only one schema definition.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/lone-schema-definition
   */
  'gql/lone-schema-definition'?: Linter.RuleEntry<[]>
  /**
   * This rule allows you to enforce that the file name should match the operation name.
   * @see https://the-guild.dev/graphql/eslint/rules/match-document-filename
   */
  'gql/match-document-filename'?: Linter.RuleEntry<GqlMatchDocumentFilename>
  /**
   * Require names to follow specified conventions.
   * @see https://the-guild.dev/graphql/eslint/rules/naming-convention
   */
  'gql/naming-convention'?: Linter.RuleEntry<GqlNamingConvention>
  /**
   * Require name for your GraphQL operations. This is useful since most GraphQL client libraries are using the operation name for caching purposes.
   * @see https://the-guild.dev/graphql/eslint/rules/no-anonymous-operations
   */
  'gql/no-anonymous-operations'?: Linter.RuleEntry<[]>
  /**
   * Enforce that deprecated fields or enum values are not in use by operations.
   * @see https://the-guild.dev/graphql/eslint/rules/no-deprecated
   */
  'gql/no-deprecated'?: Linter.RuleEntry<[]>
  /**
   * Checks for duplicate fields in selection set, variables in operation definition, or in arguments set of a field.
   * @see https://the-guild.dev/graphql/eslint/rules/no-duplicate-fields
   */
  'gql/no-duplicate-fields'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL fragment is only valid when it does not have cycles in fragments usage.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/no-fragment-cycles
   */
  'gql/no-fragment-cycles'?: Linter.RuleEntry<[]>
  /**
   * Requires to use `"""` or `"` for adding a GraphQL description instead of `#`.
Allows to use hashtag for comments, as long as it's not attached to an AST definition.
   * @see https://the-guild.dev/graphql/eslint/rules/no-hashtag-description
   */
  'gql/no-hashtag-description'?: Linter.RuleEntry<[]>
  /**
   * Disallow fragments that are used only in one place.
   * @see https://the-guild.dev/graphql/eslint/rules/no-one-place-fragments
   */
  'gql/no-one-place-fragments'?: Linter.RuleEntry<[]>
  /**
   * Disallow using root types `mutation` and/or `subscription`.
   * @see https://the-guild.dev/graphql/eslint/rules/no-root-type
   */
  'gql/no-root-type'?: Linter.RuleEntry<GqlNoRootType>
  /**
   * Avoid scalar result type on mutation type to make sure to return a valid state.
   * @see https://the-guild.dev/graphql/eslint/rules/no-scalar-result-type-on-mutation
   */
  'gql/no-scalar-result-type-on-mutation'?: Linter.RuleEntry<[]>
  /**
   * Enforces users to avoid using the type name in a field name while defining your schema.
   * @see https://the-guild.dev/graphql/eslint/rules/no-typename-prefix
   */
  'gql/no-typename-prefix'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL operation is only valid if all variables encountered, both directly and via fragment spreads, are defined by that operation.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/no-undefined-variables
   */
  'gql/no-undefined-variables'?: Linter.RuleEntry<[]>
  /**
   * Requires all types to be reachable at some level by root level fields.
   * @see https://the-guild.dev/graphql/eslint/rules/no-unreachable-types
   */
  'gql/no-unreachable-types'?: Linter.RuleEntry<[]>
  /**
   * Requires all fields to be used at some level by siblings operations.
   * @see https://the-guild.dev/graphql/eslint/rules/no-unused-fields
   */
  'gql/no-unused-fields'?: Linter.RuleEntry<GqlNoUnusedFields>
  /**
   * A GraphQL document is only valid if all fragment definitions are spread within operations, or spread within other fragments spread within operations.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/no-unused-fragments
   */
  'gql/no-unused-fragments'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL operation is only valid if all variables defined by an operation are used, either directly or within a spread fragment.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/no-unused-variables
   */
  'gql/no-unused-variables'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL subscription is valid only if it contains a single root field.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/one-field-subscriptions
   */
  'gql/one-field-subscriptions'?: Linter.RuleEntry<[]>
  /**
   * A selection set is only valid if all fields (including spreading any fragments) either correspond to distinct response names or can be merged without ambiguity.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/overlapping-fields-can-be-merged
   */
  'gql/overlapping-fields-can-be-merged'?: Linter.RuleEntry<[]>
  /**
   * A fragment spread is only valid if the type condition could ever possibly be true: if there is a non-empty intersection of the possible parent types, and possible types which pass the type condition.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/possible-fragment-spread
   */
  'gql/possible-fragment-spread'?: Linter.RuleEntry<[]>
  /**
   * A type extension is only valid if the type is defined and has the same kind.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/possible-type-extension
   */
  'gql/possible-type-extension'?: Linter.RuleEntry<[]>
  /**
   * A field or directive is only valid if all required (non-null without a default value) field arguments have been provided.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/provided-required-arguments
   */
  'gql/provided-required-arguments'?: Linter.RuleEntry<[]>
  /**
   * Set of rules to follow Relay specification for Arguments.

- A field that returns a Connection type must include forward pagination arguments (`first` and `after`), backward pagination arguments (`last` and `before`), or both

Forward pagination arguments

- `first` takes a non-negative integer
- `after` takes the Cursor type

Backward pagination arguments

- `last` takes a non-negative integer
- `before` takes the Cursor type
   * @see https://the-guild.dev/graphql/eslint/rules/relay-arguments
   */
  'gql/relay-arguments'?: Linter.RuleEntry<GqlRelayArguments>
  /**
   * Set of rules to follow Relay specification for Connection types.

- Any type whose name ends in "Connection" is considered by spec to be a `Connection type`
- Connection type must be an Object type
- Connection type must contain a field `edges` that return a list type that wraps an edge type
- Connection type must contain a field `pageInfo` that return a non-null `PageInfo` Object type
   * @see https://the-guild.dev/graphql/eslint/rules/relay-connection-types
   */
  'gql/relay-connection-types'?: Linter.RuleEntry<[]>
  /**
   * Set of rules to follow Relay specification for Edge types.

- A type that is returned in list form by a connection type's `edges` field is considered by this spec to be an Edge type
- Edge type must be an Object type
- Edge type must contain a field `node` that return either Scalar, Enum, Object, Interface, Union, or a non-null wrapper around one of those types. Notably, this field cannot return a list
- Edge type must contain a field `cursor` that return either String, Scalar, or a non-null wrapper around one of those types
- Edge type name must end in "Edge" _(optional)_
- Edge type's field `node` must implement `Node` interface _(optional)_
- A list type should only wrap an edge type _(optional)_
   * @see https://the-guild.dev/graphql/eslint/rules/relay-edge-types
   */
  'gql/relay-edge-types'?: Linter.RuleEntry<GqlRelayEdgeTypes>
  /**
   * Set of rules to follow Relay specification for `PageInfo` object.

- `PageInfo` must be an Object type
- `PageInfo` must contain fields `hasPreviousPage` and `hasNextPage`, that return non-null Boolean
- `PageInfo` must contain fields `startCursor` and `endCursor`, that return either String or Scalar, which can be null if there are no results
   * @see https://the-guild.dev/graphql/eslint/rules/relay-page-info
   */
  'gql/relay-page-info'?: Linter.RuleEntry<[]>
  /**
   * Require deletion date on `@deprecated` directive. Suggest removing deprecated things after deprecated date.
   * @see https://the-guild.dev/graphql/eslint/rules/require-deprecation-date
   */
  'gql/require-deprecation-date'?: Linter.RuleEntry<GqlRequireDeprecationDate>
  /**
   * Require all deprecation directives to specify a reason.
   * @see https://the-guild.dev/graphql/eslint/rules/require-deprecation-reason
   */
  'gql/require-deprecation-reason'?: Linter.RuleEntry<[]>
  /**
   * Enforce descriptions in type definitions and operations.
   * @see https://the-guild.dev/graphql/eslint/rules/require-description
   */
  'gql/require-description'?: Linter.RuleEntry<GqlRequireDescription>
  /**
   * Allow the client in one round-trip not only to call mutation but also to get a wagon of data to update their application.
> Currently, no errors are reported for result type `union`, `interface` and `scalar`.
   * @see https://the-guild.dev/graphql/eslint/rules/require-field-of-type-query-in-mutation-result
   */
  'gql/require-field-of-type-query-in-mutation-result'?: Linter.RuleEntry<[]>
  /**
   * Require fragments to be imported via an import expression.
   * @see https://the-guild.dev/graphql/eslint/rules/require-import-fragment
   */
  'gql/require-import-fragment'?: Linter.RuleEntry<[]>
  /**
   * Require `input` or `type` fields to be non-nullable with `@oneOf` directive.
   * @see https://the-guild.dev/graphql/eslint/rules/require-nullable-fields-with-oneof
   */
  'gql/require-nullable-fields-with-oneof'?: Linter.RuleEntry<[]>
  /**
   * Require nullable fields in root types.
   * @see https://the-guild.dev/graphql/eslint/rules/require-nullable-result-in-root
   */
  'gql/require-nullable-result-in-root'?: Linter.RuleEntry<[]>
  /**
   * Enforce selecting specific fields when they are available on the GraphQL type.
   * @see https://the-guild.dev/graphql/eslint/rules/require-selections
   */
  'gql/require-selections'?: Linter.RuleEntry<GqlRequireSelections>
  /**
   * Enforce types with `@oneOf` directive have `error` and `ok` fields.
   * @see https://the-guild.dev/graphql/eslint/rules/require-type-pattern-with-oneof
   */
  'gql/require-type-pattern-with-oneof'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is valid only if all leaf fields (fields without sub selections) are of scalar or enum types.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/scalar-leafs
   */
  'gql/scalar-leafs'?: Linter.RuleEntry<[]>
  /**
   * Limit the complexity of the GraphQL operations solely by their depth. Based on [graphql-depth-limit](https://npmjs.com/package/graphql-depth-limit).
   * @see https://the-guild.dev/graphql/eslint/rules/selection-set-depth
   */
  'gql/selection-set-depth'?: Linter.RuleEntry<GqlSelectionSetDepth>
  /**
   * Requires output types to have one unique identifier unless they do not have a logical one. Exceptions can be used to ignore output types that do not have unique identifiers.
   * @see https://the-guild.dev/graphql/eslint/rules/strict-id-in-types
   */
  'gql/strict-id-in-types'?: Linter.RuleEntry<GqlStrictIdInTypes>
  /**
   * A GraphQL field or directive is only valid if all supplied arguments are uniquely named.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-argument-names
   */
  'gql/unique-argument-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if all defined directives have unique names.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-directive-names
   */
  'gql/unique-directive-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if all non-repeatable directives at a given location are uniquely named.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-directive-names-per-location
   */
  'gql/unique-directive-names-per-location'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL enum type is only valid if all its values are uniquely named.
> This rule disallows case-insensitive enum values duplicates too.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-enum-value-names
   */
  'gql/unique-enum-value-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL complex type is only valid if all its fields are uniquely named.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-field-definition-names
   */
  'gql/unique-field-definition-names'?: Linter.RuleEntry<[]>
  /**
   * Enforce unique fragment names across your project.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-fragment-name
   */
  'gql/unique-fragment-name'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL input object value is only valid if all supplied fields are uniquely named.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-input-field-names
   */
  'gql/unique-input-field-names'?: Linter.RuleEntry<[]>
  /**
   * Enforce unique operation names across your project.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-operation-name
   */
  'gql/unique-operation-name'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if it has only one type per operation.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-operation-types
   */
  'gql/unique-operation-types'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if all defined types have unique names.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-type-names
   */
  'gql/unique-type-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL operation is only valid if all its variables are uniquely named.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/unique-variable-names
   */
  'gql/unique-variable-names'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL document is only valid if all value literals are of the type expected at their position.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/value-literals-of-correct-type
   */
  'gql/value-literals-of-correct-type'?: Linter.RuleEntry<[]>
  /**
   * A GraphQL operation is only valid if all the variables it defines are of input types (scalar, enum, or input object).
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/variables-are-input-types
   */
  'gql/variables-are-input-types'?: Linter.RuleEntry<[]>
  /**
   * Variables passed to field arguments conform to type.
> This rule is a wrapper around a `graphql-js` validation function.
   * @see https://the-guild.dev/graphql/eslint/rules/variables-in-allowed-position
   */
  'gql/variables-in-allowed-position'?: Linter.RuleEntry<[]>
  /**
   * Require grouped accessor pairs in object literals and classes
   * @see https://eslint.org/docs/latest/rules/grouped-accessor-pairs
   */
  'grouped-accessor-pairs'?: Linter.RuleEntry<GroupedAccessorPairs>
  /**
   * Require `for-in` loops to include an `if` statement
   * @see https://eslint.org/docs/latest/rules/guard-for-in
   */
  'guard-for-in'?: Linter.RuleEntry<[]>
  /**
   * Require error handling in callbacks
   * @see https://eslint.org/docs/latest/rules/handle-callback-err
   * @deprecated
   */
  'handle-callback-err'?: Linter.RuleEntry<HandleCallbackErr>
  /**
   * Disallow specified identifiers
   * @see https://eslint.org/docs/latest/rules/id-blacklist
   * @deprecated
   */
  'id-blacklist'?: Linter.RuleEntry<IdBlacklist>
  /**
   * Disallow specified identifiers
   * @see https://eslint.org/docs/latest/rules/id-denylist
   */
  'id-denylist'?: Linter.RuleEntry<IdDenylist>
  /**
   * Enforce minimum and maximum identifier lengths
   * @see https://eslint.org/docs/latest/rules/id-length
   */
  'id-length'?: Linter.RuleEntry<IdLength>
  /**
   * Require identifiers to match a specified regular expression
   * @see https://eslint.org/docs/latest/rules/id-match
   */
  'id-match'?: Linter.RuleEntry<IdMatch>
  /**
   * Enforce the location of arrow function bodies
   * @see https://eslint.org/docs/latest/rules/implicit-arrow-linebreak
   * @deprecated
   */
  'implicit-arrow-linebreak'?: Linter.RuleEntry<ImplicitArrowLinebreak>
  /**
   * Enforce consistent indentation
   * @see https://eslint.org/docs/latest/rules/indent
   * @deprecated
   */
  'indent'?: Linter.RuleEntry<Indent>
  /**
   * Enforce consistent indentation
   * @see https://eslint.org/docs/latest/rules/indent-legacy
   * @deprecated
   */
  'indent-legacy'?: Linter.RuleEntry<IndentLegacy>
  /**
   * Require or disallow initialization in variable declarations
   * @see https://eslint.org/docs/latest/rules/init-declarations
   */
  'init-declarations'?: Linter.RuleEntry<InitDeclarations>
  /**
   * Checks that `@access` tags have a valid value.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-access.md#repos-sticky-header
   */
  'jsdoc/check-access'?: Linter.RuleEntry<[]>
  /**
   * Reports invalid alignment of JSDoc block asterisks.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-alignment.md#repos-sticky-header
   */
  'jsdoc/check-alignment'?: Linter.RuleEntry<JsdocCheckAlignment>
  /**
   * @deprecated - Use `getJsdocProcessorPlugin` processor; ensures that (JavaScript) samples within `@example` tags adhere to ESLint rules.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-examples.md#repos-sticky-header
   */
  'jsdoc/check-examples'?: Linter.RuleEntry<JsdocCheckExamples>
  /**
   * Reports invalid padding inside JSDoc blocks.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-indentation.md#repos-sticky-header
   */
  'jsdoc/check-indentation'?: Linter.RuleEntry<JsdocCheckIndentation>
  /**
   * Reports invalid alignment of JSDoc block lines.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-line-alignment.md#repos-sticky-header
   */
  'jsdoc/check-line-alignment'?: Linter.RuleEntry<JsdocCheckLineAlignment>
  /**
   * Checks for dupe `@param` names, that nested param names have roots, and that parameter names in function declarations match JSDoc param names.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-param-names.md#repos-sticky-header
   */
  'jsdoc/check-param-names'?: Linter.RuleEntry<JsdocCheckParamNames>
  /**
   * Ensures that property names in JSDoc are not duplicated on the same block and that nested properties have defined roots.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-property-names.md#repos-sticky-header
   */
  'jsdoc/check-property-names'?: Linter.RuleEntry<JsdocCheckPropertyNames>
  /**
   * Reports against syntax not valid for the mode (e.g., Google Closure Compiler in non-Closure mode).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-syntax.md#repos-sticky-header
   */
  'jsdoc/check-syntax'?: Linter.RuleEntry<[]>
  /**
   * Reports invalid block tag names.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-tag-names.md#repos-sticky-header
   */
  'jsdoc/check-tag-names'?: Linter.RuleEntry<JsdocCheckTagNames>
  /**
   * Checks that any `@template` names are actually used in the connected `@typedef` or type alias.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-template-names.md#repos-sticky-header
   */
  'jsdoc/check-template-names'?: Linter.RuleEntry<[]>
  /**
   * Reports types deemed invalid (customizable and with defaults, for preventing and/or recommending replacements).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-types.md#repos-sticky-header
   */
  'jsdoc/check-types'?: Linter.RuleEntry<JsdocCheckTypes>
  /**
   * This rule checks the values for a handful of tags: `@version`, `@since`, `@license` and `@author`.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-values.md#repos-sticky-header
   */
  'jsdoc/check-values'?: Linter.RuleEntry<JsdocCheckValues>
  /**
   * Converts non-JSDoc comments preceding or following nodes into JSDoc ones
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/convert-to-jsdoc-comments.md#repos-sticky-header
   */
  'jsdoc/convert-to-jsdoc-comments'?: Linter.RuleEntry<JsdocConvertToJsdocComments>
  /**
   * Checks tags that are expected to be empty (e.g., `@abstract` or `@async`), reporting if they have content
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/empty-tags.md#repos-sticky-header
   */
  'jsdoc/empty-tags'?: Linter.RuleEntry<JsdocEmptyTags>
  /**
   * Reports use of JSDoc tags in non-tag positions (in the default "typescript" mode).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/escape-inline-tags.md#repos-sticky-header
   */
  'jsdoc/escape-inline-tags'?: Linter.RuleEntry<JsdocEscapeInlineTags>
  /**
   * Prohibits use of `@implements` on non-constructor functions (to enforce the tag only being used on classes/constructors).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/implements-on-classes.md#repos-sticky-header
   */
  'jsdoc/implements-on-classes'?: Linter.RuleEntry<JsdocImplementsOnClasses>
  /**
   * Reports if JSDoc `import()` statements point to a package which is not listed in `dependencies` or `devDependencies`
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/imports-as-dependencies.md#repos-sticky-header
   */
  'jsdoc/imports-as-dependencies'?: Linter.RuleEntry<[]>
  /**
   * This rule reports doc comments that only restate their attached name.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/informative-docs.md#repos-sticky-header
   */
  'jsdoc/informative-docs'?: Linter.RuleEntry<JsdocInformativeDocs>
  /**
   * Enforces minimum number of newlines before JSDoc comment blocks
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/lines-before-block.md#repos-sticky-header
   */
  'jsdoc/lines-before-block'?: Linter.RuleEntry<JsdocLinesBeforeBlock>
  /**
   * Enforces a regular expression pattern on descriptions.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/match-description.md#repos-sticky-header
   */
  'jsdoc/match-description'?: Linter.RuleEntry<JsdocMatchDescription>
  /**
   * Reports the name portion of a JSDoc tag if matching or not matching a given regular expression.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/match-name.md#repos-sticky-header
   */
  'jsdoc/match-name'?: Linter.RuleEntry<JsdocMatchName>
  /**
   * Controls how and whether JSDoc blocks can be expressed as single or multiple line blocks.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/multiline-blocks.md#repos-sticky-header
   */
  'jsdoc/multiline-blocks'?: Linter.RuleEntry<JsdocMultilineBlocks>
  /**
   * This rule checks for multi-line-style comments which fail to meet the criteria of a JSDoc block.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-bad-blocks.md#repos-sticky-header
   */
  'jsdoc/no-bad-blocks'?: Linter.RuleEntry<JsdocNoBadBlocks>
  /**
   * If tags are present, this rule will prevent empty lines in the block description. If no tags are present, this rule will prevent extra empty lines in the block description.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-blank-block-descriptions.md#repos-sticky-header
   */
  'jsdoc/no-blank-block-descriptions'?: Linter.RuleEntry<[]>
  /**
   * Removes empty blocks with nothing but possibly line breaks
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-blank-blocks.md#repos-sticky-header
   */
  'jsdoc/no-blank-blocks'?: Linter.RuleEntry<JsdocNoBlankBlocks>
  /**
   * This rule reports defaults being used on the relevant portion of `@param` or `@default`.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-defaults.md#repos-sticky-header
   */
  'jsdoc/no-defaults'?: Linter.RuleEntry<JsdocNoDefaults>
  /**
   * Reports when certain comment structures are always expected.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-missing-syntax.md#repos-sticky-header
   */
  'jsdoc/no-missing-syntax'?: Linter.RuleEntry<JsdocNoMissingSyntax>
  /**
   * Prevents use of multiple asterisks at the beginning of lines.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-multi-asterisks.md#repos-sticky-header
   */
  'jsdoc/no-multi-asterisks'?: Linter.RuleEntry<JsdocNoMultiAsterisks>
  /**
   * Reports when certain comment structures are present.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-restricted-syntax.md#repos-sticky-header
   */
  'jsdoc/no-restricted-syntax'?: Linter.RuleEntry<JsdocNoRestrictedSyntax>
  /**
   * This rule reports types being used on `@param` or `@returns` (redundant with TypeScript).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-types.md#repos-sticky-header
   */
  'jsdoc/no-types'?: Linter.RuleEntry<JsdocNoTypes>
  /**
   * Besides some expected built-in types, prohibits any types not specified as globals or within `@typedef`.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/no-undefined-types.md#repos-sticky-header
   */
  'jsdoc/no-undefined-types'?: Linter.RuleEntry<JsdocNoUndefinedTypes>
  /**
   * Prefer `@import` tags to inline `import()` statements.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/prefer-import-tag.md#repos-sticky-header
   */
  'jsdoc/prefer-import-tag'?: Linter.RuleEntry<JsdocPreferImportTag>
  /**
   * Reports use of `any` or `*` type
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/reject-any-type.md#repos-sticky-header
   */
  'jsdoc/reject-any-type'?: Linter.RuleEntry<[]>
  /**
   * Reports use of `Function` type
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/reject-function-type.md#repos-sticky-header
   */
  'jsdoc/reject-function-type'?: Linter.RuleEntry<[]>
  /**
   * Requires that each JSDoc line starts with an `*`.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-asterisk-prefix.md#repos-sticky-header
   */
  'jsdoc/require-asterisk-prefix'?: Linter.RuleEntry<JsdocRequireAsteriskPrefix>
  /**
   * Requires that all functions (and potentially other contexts) have a description.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-description.md#repos-sticky-header
   */
  'jsdoc/require-description'?: Linter.RuleEntry<JsdocRequireDescription>
  /**
   * Requires that block description, explicit `@description`, and `@param`/`@returns` tag descriptions are written in complete sentences.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-description-complete-sentence.md#repos-sticky-header
   */
  'jsdoc/require-description-complete-sentence'?: Linter.RuleEntry<JsdocRequireDescriptionCompleteSentence>
  /**
   * Requires that all functions (and potentially other contexts) have examples.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-example.md#repos-sticky-header
   */
  'jsdoc/require-example'?: Linter.RuleEntry<JsdocRequireExample>
  /**
   * Checks that all files have one `@file`, `@fileoverview`, or `@overview` tag at the beginning of the file.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-file-overview.md#repos-sticky-header
   */
  'jsdoc/require-file-overview'?: Linter.RuleEntry<JsdocRequireFileOverview>
  /**
   * Requires a hyphen before the `@param` description (and optionally before `@property` descriptions).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-hyphen-before-param-description.md#repos-sticky-header
   */
  'jsdoc/require-hyphen-before-param-description'?: Linter.RuleEntry<JsdocRequireHyphenBeforeParamDescription>
  /**
   * Checks for presence of JSDoc comments, on functions and potentially other contexts (optionally limited to exports).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-jsdoc.md#repos-sticky-header
   */
  'jsdoc/require-jsdoc'?: Linter.RuleEntry<JsdocRequireJsdoc>
  /**
   * Requires a description for `@next` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-next-description.md#repos-sticky-header
   */
  'jsdoc/require-next-description'?: Linter.RuleEntry<[]>
  /**
   * Requires a type for `@next` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-next-type.md#repos-sticky-header
   */
  'jsdoc/require-next-type'?: Linter.RuleEntry<[]>
  /**
   * Requires that all function parameters are documented with a `@param` tag.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param.md#repos-sticky-header
   */
  'jsdoc/require-param'?: Linter.RuleEntry<JsdocRequireParam>
  /**
   * Requires that each `@param` tag has a `description` value.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param-description.md#repos-sticky-header
   */
  'jsdoc/require-param-description'?: Linter.RuleEntry<JsdocRequireParamDescription>
  /**
   * Requires that all `@param` tags have names.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param-name.md#repos-sticky-header
   */
  'jsdoc/require-param-name'?: Linter.RuleEntry<JsdocRequireParamName>
  /**
   * Requires that each `@param` tag has a type value (in curly brackets).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-param-type.md#repos-sticky-header
   */
  'jsdoc/require-param-type'?: Linter.RuleEntry<JsdocRequireParamType>
  /**
   * Requires that all `@typedef` and `@namespace` tags have `@property` when their type is a plain `object`, `Object`, or `PlainObject`.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property.md#repos-sticky-header
   */
  'jsdoc/require-property'?: Linter.RuleEntry<[]>
  /**
   * Requires that each `@property` tag has a `description` value.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property-description.md#repos-sticky-header
   */
  'jsdoc/require-property-description'?: Linter.RuleEntry<[]>
  /**
   * Requires that all `@property` tags have names.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property-name.md#repos-sticky-header
   */
  'jsdoc/require-property-name'?: Linter.RuleEntry<[]>
  /**
   * Requires that each `@property` tag has a type value (in curly brackets).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-property-type.md#repos-sticky-header
   */
  'jsdoc/require-property-type'?: Linter.RuleEntry<[]>
  /**
   * Requires that Promise rejections are documented with `@rejects` tags.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-rejects.md#repos-sticky-header
   */
  'jsdoc/require-rejects'?: Linter.RuleEntry<JsdocRequireRejects>
  /**
   * Requires that returns are documented with `@returns`.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns.md#repos-sticky-header
   */
  'jsdoc/require-returns'?: Linter.RuleEntry<JsdocRequireReturns>
  /**
   * Requires a return statement in function body if a `@returns` tag is specified in JSDoc comment(and reports if multiple `@returns` tags are present).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns-check.md#repos-sticky-header
   */
  'jsdoc/require-returns-check'?: Linter.RuleEntry<JsdocRequireReturnsCheck>
  /**
   * Requires that the `@returns` tag has a `description` value (not including `void`/`undefined` type returns).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns-description.md#repos-sticky-header
   */
  'jsdoc/require-returns-description'?: Linter.RuleEntry<JsdocRequireReturnsDescription>
  /**
   * Requires that `@returns` tag has type value (in curly brackets).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-returns-type.md#repos-sticky-header
   */
  'jsdoc/require-returns-type'?: Linter.RuleEntry<JsdocRequireReturnsType>
  /**
   * Requires tags be present, optionally for specific contexts
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-tags.md#repos-sticky-header
   */
  'jsdoc/require-tags'?: Linter.RuleEntry<JsdocRequireTags>
  /**
   * Requires `@template` tags be present when type parameters are used.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-template.md#repos-sticky-header
   */
  'jsdoc/require-template'?: Linter.RuleEntry<JsdocRequireTemplate>
  /**
   * Requires a description for `@template` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-template-description.md#repos-sticky-header
   */
  'jsdoc/require-template-description'?: Linter.RuleEntry<[]>
  /**
   * Requires that throw statements are documented with `@throws` tags.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-throws.md#repos-sticky-header
   */
  'jsdoc/require-throws'?: Linter.RuleEntry<JsdocRequireThrows>
  /**
   * Requires a description for `@throws` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-throws-description.md#repos-sticky-header
   */
  'jsdoc/require-throws-description'?: Linter.RuleEntry<[]>
  /**
   * Requires a type for `@throws` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-throws-type.md#repos-sticky-header
   */
  'jsdoc/require-throws-type'?: Linter.RuleEntry<[]>
  /**
   * Requires yields are documented with `@yields` tags.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-yields.md#repos-sticky-header
   */
  'jsdoc/require-yields'?: Linter.RuleEntry<JsdocRequireYields>
  /**
   * Ensures that if a `@yields` is present that a `yield` (or `yield` with a value) is present in the function body (or that if a `@next` is present that there is a yield with a return value present).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-yields-check.md#repos-sticky-header
   */
  'jsdoc/require-yields-check'?: Linter.RuleEntry<JsdocRequireYieldsCheck>
  /**
   * Requires a description for `@yields` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-yields-description.md#repos-sticky-header
   */
  'jsdoc/require-yields-description'?: Linter.RuleEntry<[]>
  /**
   * Requires a type for `@yields` tags
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-yields-type.md#repos-sticky-header
   */
  'jsdoc/require-yields-type'?: Linter.RuleEntry<[]>
  /**
   * Sorts tags by a specified sequence according to tag name, optionally adding line breaks between tag groups.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/sort-tags.md#repos-sticky-header
   */
  'jsdoc/sort-tags'?: Linter.RuleEntry<JsdocSortTags>
  /**
   * Enforces lines (or no lines) before, after, or between tags.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/tag-lines.md#repos-sticky-header
   */
  'jsdoc/tag-lines'?: Linter.RuleEntry<JsdocTagLines>
  /**
   * Auto-escape certain characters that are input within block and tag descriptions.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/text-escaping.md#repos-sticky-header
   */
  'jsdoc/text-escaping'?: Linter.RuleEntry<JsdocTextEscaping>
  /**
   * Prefers either function properties or method signatures
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/ts-method-signature-style.md#repos-sticky-header
   */
  'jsdoc/ts-method-signature-style'?: Linter.RuleEntry<JsdocTsMethodSignatureStyle>
  /**
   * Warns against use of the empty object type
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/ts-no-empty-object-type.md#repos-sticky-header
   */
  'jsdoc/ts-no-empty-object-type'?: Linter.RuleEntry<[]>
  /**
   * Catches unnecessary template expressions such as string expressions within a template literal.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/ts-no-unnecessary-template-expression.md#repos-sticky-header
   */
  'jsdoc/ts-no-unnecessary-template-expression'?: Linter.RuleEntry<JsdocTsNoUnnecessaryTemplateExpression>
  /**
   * Prefers function types over call signatures when there are no other properties.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/ts-prefer-function-type.md#repos-sticky-header
   */
  'jsdoc/ts-prefer-function-type'?: Linter.RuleEntry<JsdocTsPreferFunctionType>
  /**
   * Formats JSDoc type values.
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/type-formatting.md#repos-sticky-header
   */
  'jsdoc/type-formatting'?: Linter.RuleEntry<JsdocTypeFormatting>
  /**
   * Requires all types/namepaths to be valid JSDoc, Closure compiler, or TypeScript types (configurable in settings).
   * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/valid-types.md#repos-sticky-header
   */
  'jsdoc/valid-types'?: Linter.RuleEntry<JsdocValidTypes>
  /**
   * enforce line breaks after opening and before closing array brackets
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/array-bracket-newline.html
   */
  'jsonc/array-bracket-newline'?: Linter.RuleEntry<JsoncArrayBracketNewline>
  /**
   * disallow or enforce spaces inside of brackets
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/array-bracket-spacing.html
   */
  'jsonc/array-bracket-spacing'?: Linter.RuleEntry<JsoncArrayBracketSpacing>
  /**
   * enforce line breaks between array elements
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/array-element-newline.html
   */
  'jsonc/array-element-newline'?: Linter.RuleEntry<JsoncArrayElementNewline>
  /**
   * apply jsonc rules similar to your configured ESLint core rules
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/auto.html
   */
  'jsonc/auto'?: Linter.RuleEntry<[]>
  /**
   * require or disallow trailing commas
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/comma-dangle.html
   */
  'jsonc/comma-dangle'?: Linter.RuleEntry<JsoncCommaDangle>
  /**
   * enforce consistent comma style
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/comma-style.html
   */
  'jsonc/comma-style'?: Linter.RuleEntry<JsoncCommaStyle>
  /**
   * enforce consistent indentation
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/indent.html
   */
  'jsonc/indent'?: Linter.RuleEntry<JsoncIndent>
  /**
   * enforce naming convention to property key names
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/key-name-casing.html
   */
  'jsonc/key-name-casing'?: Linter.RuleEntry<JsoncKeyNameCasing>
  /**
   * enforce consistent spacing between keys and values in object literal properties
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/key-spacing.html
   */
  'jsonc/key-spacing'?: Linter.RuleEntry<JsoncKeySpacing>
  /**
   * disallow BigInt literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-bigint-literals.html
   */
  'jsonc/no-bigint-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow binary expression
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-binary-expression.html
   */
  'jsonc/no-binary-expression'?: Linter.RuleEntry<[]>
  /**
   * disallow binary numeric literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-binary-numeric-literals.html
   */
  'jsonc/no-binary-numeric-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow comments
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-comments.html
   */
  'jsonc/no-comments'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate keys in object literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-dupe-keys.html
   */
  'jsonc/no-dupe-keys'?: Linter.RuleEntry<[]>
  /**
   * disallow escape sequences in identifiers.
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-escape-sequence-in-identifier.html
   */
  'jsonc/no-escape-sequence-in-identifier'?: Linter.RuleEntry<[]>
  /**
   * disallow leading or trailing decimal points in numeric literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-floating-decimal.html
   */
  'jsonc/no-floating-decimal'?: Linter.RuleEntry<[]>
  /**
   * disallow hexadecimal numeric literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-hexadecimal-numeric-literals.html
   */
  'jsonc/no-hexadecimal-numeric-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow Infinity
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-infinity.html
   */
  'jsonc/no-infinity'?: Linter.RuleEntry<[]>
  /**
   * disallow irregular whitespace
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-irregular-whitespace.html
   */
  'jsonc/no-irregular-whitespace'?: Linter.RuleEntry<JsoncNoIrregularWhitespace>
  /**
   * disallow multiline strings
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-multi-str.html
   */
  'jsonc/no-multi-str'?: Linter.RuleEntry<[]>
  /**
   * disallow NaN
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-nan.html
   */
  'jsonc/no-nan'?: Linter.RuleEntry<[]>
  /**
   * disallow number property keys
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-number-props.html
   */
  'jsonc/no-number-props'?: Linter.RuleEntry<[]>
  /**
   * disallow numeric separators
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-numeric-separators.html
   */
  'jsonc/no-numeric-separators'?: Linter.RuleEntry<[]>
  /**
   * disallow legacy octal literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-octal.html
   */
  'jsonc/no-octal'?: Linter.RuleEntry<[]>
  /**
   * disallow octal escape sequences in string literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-octal-escape.html
   */
  'jsonc/no-octal-escape'?: Linter.RuleEntry<[]>
  /**
   * disallow octal numeric literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-octal-numeric-literals.html
   */
  'jsonc/no-octal-numeric-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow parentheses around the expression
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-parenthesized.html
   */
  'jsonc/no-parenthesized'?: Linter.RuleEntry<[]>
  /**
   * disallow plus sign
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-plus-sign.html
   */
  'jsonc/no-plus-sign'?: Linter.RuleEntry<[]>
  /**
   * disallow RegExp literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-regexp-literals.html
   */
  'jsonc/no-regexp-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow sparse arrays
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-sparse-arrays.html
   */
  'jsonc/no-sparse-arrays'?: Linter.RuleEntry<[]>
  /**
   * disallow template literals
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-template-literals.html
   */
  'jsonc/no-template-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow `undefined`
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-undefined-value.html
   */
  'jsonc/no-undefined-value'?: Linter.RuleEntry<[]>
  /**
   * disallow Unicode code point escape sequences.
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-unicode-codepoint-escapes.html
   */
  'jsonc/no-unicode-codepoint-escapes'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary escape usage
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/no-useless-escape.html
   */
  'jsonc/no-useless-escape'?: Linter.RuleEntry<JsoncNoUselessEscape>
  /**
   * enforce consistent line breaks inside braces
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/object-curly-newline.html
   */
  'jsonc/object-curly-newline'?: Linter.RuleEntry<JsoncObjectCurlyNewline>
  /**
   * enforce consistent spacing inside braces
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/object-curly-spacing.html
   */
  'jsonc/object-curly-spacing'?: Linter.RuleEntry<JsoncObjectCurlySpacing>
  /**
   * enforce placing object properties on separate lines
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/object-property-newline.html
   */
  'jsonc/object-property-newline'?: Linter.RuleEntry<JsoncObjectPropertyNewline>
  /**
   * require quotes around object literal property names
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/quote-props.html
   */
  'jsonc/quote-props'?: Linter.RuleEntry<JsoncQuoteProps>
  /**
   * enforce use of double or single quotes
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/quotes.html
   */
  'jsonc/quotes'?: Linter.RuleEntry<JsoncQuotes>
  /**
   * require array values to be sorted
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/sort-array-values.html
   */
  'jsonc/sort-array-values'?: Linter.RuleEntry<JsoncSortArrayValues>
  /**
   * require object keys to be sorted
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/sort-keys.html
   */
  'jsonc/sort-keys'?: Linter.RuleEntry<JsoncSortKeys>
  /**
   * disallow spaces after unary operators
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/space-unary-ops.html
   */
  'jsonc/space-unary-ops'?: Linter.RuleEntry<JsoncSpaceUnaryOps>
  /**
   * disallow invalid number for JSON
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/valid-json-number.html
   */
  'jsonc/valid-json-number'?: Linter.RuleEntry<[]>
  /**
   * disallow parsing errors in Vue custom blocks
   * @see https://ota-meshi.github.io/eslint-plugin-jsonc/rules/vue-custom-block/no-parsing-error.html
   */
  'jsonc/vue-custom-block/no-parsing-error'?: Linter.RuleEntry<[]>
  /**
   * Enforce the consistent use of either double or single quotes in JSX attributes
   * @see https://eslint.org/docs/latest/rules/jsx-quotes
   * @deprecated
   */
  'jsx-quotes'?: Linter.RuleEntry<JsxQuotes>
  /**
   * Enforce consistent spacing between keys and values in object literal properties
   * @see https://eslint.org/docs/latest/rules/key-spacing
   * @deprecated
   */
  'key-spacing'?: Linter.RuleEntry<KeySpacing>
  /**
   * Enforce consistent spacing before and after keywords
   * @see https://eslint.org/docs/latest/rules/keyword-spacing
   * @deprecated
   */
  'keyword-spacing'?: Linter.RuleEntry<KeywordSpacing>
  /**
   * Enforce position of line comments
   * @see https://eslint.org/docs/latest/rules/line-comment-position
   * @deprecated
   */
  'line-comment-position'?: Linter.RuleEntry<LineCommentPosition>
  /**
   * Enforce consistent linebreak style
   * @see https://eslint.org/docs/latest/rules/linebreak-style
   * @deprecated
   */
  'linebreak-style'?: Linter.RuleEntry<LinebreakStyle>
  /**
   * Require empty lines around comments
   * @see https://eslint.org/docs/latest/rules/lines-around-comment
   * @deprecated
   */
  'lines-around-comment'?: Linter.RuleEntry<LinesAroundComment>
  /**
   * Require or disallow newlines around directives
   * @see https://eslint.org/docs/latest/rules/lines-around-directive
   * @deprecated
   */
  'lines-around-directive'?: Linter.RuleEntry<LinesAroundDirective>
  /**
   * Require or disallow an empty line between class members
   * @see https://eslint.org/docs/latest/rules/lines-between-class-members
   * @deprecated
   */
  'lines-between-class-members'?: Linter.RuleEntry<LinesBetweenClassMembers>
  /**
   * Require or disallow logical assignment operator shorthand
   * @see https://eslint.org/docs/latest/rules/logical-assignment-operators
   */
  'logical-assignment-operators'?: Linter.RuleEntry<LogicalAssignmentOperators>
  /**
   * Require languages for fenced code blocks
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/fenced-code-language.md
   */
  'markdown/fenced-code-language'?: Linter.RuleEntry<MarkdownFencedCodeLanguage>
  /**
   * Enforce heading levels increment by one
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/heading-increment.md
   */
  'markdown/heading-increment'?: Linter.RuleEntry<MarkdownHeadingIncrement>
  /**
   * Disallow bare URLs
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-bare-urls.md
   */
  'markdown/no-bare-urls'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate definitions
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-duplicate-definitions.md
   */
  'markdown/no-duplicate-definitions'?: Linter.RuleEntry<MarkdownNoDuplicateDefinitions>
  /**
   * Disallow duplicate headings in the same document
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-duplicate-headings.md
   */
  'markdown/no-duplicate-headings'?: Linter.RuleEntry<MarkdownNoDuplicateHeadings>
  /**
   * Disallow empty definitions
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-empty-definitions.md
   */
  'markdown/no-empty-definitions'?: Linter.RuleEntry<MarkdownNoEmptyDefinitions>
  /**
   * Disallow empty images
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-empty-images.md
   */
  'markdown/no-empty-images'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty links
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-empty-links.md
   */
  'markdown/no-empty-links'?: Linter.RuleEntry<[]>
  /**
   * Disallow HTML tags
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-html.md
   */
  'markdown/no-html'?: Linter.RuleEntry<MarkdownNoHtml>
  /**
   * Disallow invalid label references
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-invalid-label-refs.md
   */
  'markdown/no-invalid-label-refs'?: Linter.RuleEntry<[]>
  /**
   * Disallow headings without a space after the hash characters
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-missing-atx-heading-space.md
   */
  'markdown/no-missing-atx-heading-space'?: Linter.RuleEntry<MarkdownNoMissingAtxHeadingSpace>
  /**
   * Disallow missing label references
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-missing-label-refs.md
   */
  'markdown/no-missing-label-refs'?: Linter.RuleEntry<MarkdownNoMissingLabelRefs>
  /**
   * Disallow link fragments that do not reference valid headings
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-missing-link-fragments.md
   */
  'markdown/no-missing-link-fragments'?: Linter.RuleEntry<MarkdownNoMissingLinkFragments>
  /**
   * Disallow multiple H1 headings in the same document
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-multiple-h1.md
   */
  'markdown/no-multiple-h1'?: Linter.RuleEntry<MarkdownNoMultipleH1>
  /**
   * Disallow URLs that match defined reference identifiers
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-reference-like-urls.md
   */
  'markdown/no-reference-like-urls'?: Linter.RuleEntry<[]>
  /**
   * Disallow reversed link and image syntax
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-reversed-media-syntax.md
   */
  'markdown/no-reversed-media-syntax'?: Linter.RuleEntry<[]>
  /**
   * Disallow spaces around emphasis markers
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-space-in-emphasis.md
   */
  'markdown/no-space-in-emphasis'?: Linter.RuleEntry<MarkdownNoSpaceInEmphasis>
  /**
   * Disallow unused definitions
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/no-unused-definitions.md
   */
  'markdown/no-unused-definitions'?: Linter.RuleEntry<MarkdownNoUnusedDefinitions>
  /**
   * Require alternative text for images
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/require-alt-text.md
   */
  'markdown/require-alt-text'?: Linter.RuleEntry<[]>
  /**
   * Disallow data rows in a GitHub Flavored Markdown table from having more cells than the header row
   * @see https://github.com/eslint/markdown/blob/main/docs/rules/table-column-count.md
   */
  'markdown/table-column-count'?: Linter.RuleEntry<MarkdownTableColumnCount>
  /**
   * Enforce a maximum number of classes per file
   * @see https://eslint.org/docs/latest/rules/max-classes-per-file
   */
  'max-classes-per-file'?: Linter.RuleEntry<MaxClassesPerFile>
  /**
   * Enforce a maximum depth that blocks can be nested
   * @see https://eslint.org/docs/latest/rules/max-depth
   */
  'max-depth'?: Linter.RuleEntry<MaxDepth>
  /**
   * Enforce a maximum line length
   * @see https://eslint.org/docs/latest/rules/max-len
   * @deprecated
   */
  'max-len'?: Linter.RuleEntry<MaxLen>
  /**
   * Enforce a maximum number of lines per file
   * @see https://eslint.org/docs/latest/rules/max-lines
   */
  'max-lines'?: Linter.RuleEntry<MaxLines>
  /**
   * Enforce a maximum number of lines of code in a function
   * @see https://eslint.org/docs/latest/rules/max-lines-per-function
   */
  'max-lines-per-function'?: Linter.RuleEntry<MaxLinesPerFunction>
  /**
   * Enforce a maximum depth that callbacks can be nested
   * @see https://eslint.org/docs/latest/rules/max-nested-callbacks
   */
  'max-nested-callbacks'?: Linter.RuleEntry<MaxNestedCallbacks>
  /**
   * Enforce a maximum number of parameters in function definitions
   * @see https://eslint.org/docs/latest/rules/max-params
   */
  'max-params'?: Linter.RuleEntry<MaxParams>
  /**
   * Enforce a maximum number of statements allowed in function blocks
   * @see https://eslint.org/docs/latest/rules/max-statements
   */
  'max-statements'?: Linter.RuleEntry<MaxStatements>
  /**
   * Enforce a maximum number of statements allowed per line
   * @see https://eslint.org/docs/latest/rules/max-statements-per-line
   * @deprecated
   */
  'max-statements-per-line'?: Linter.RuleEntry<MaxStatementsPerLine>
  /**
   * Enforce a particular style for multiline comments
   * @see https://eslint.org/docs/latest/rules/multiline-comment-style
   * @deprecated
   */
  'multiline-comment-style'?: Linter.RuleEntry<MultilineCommentStyle>
  /**
   * Enforce newlines between operands of ternary expressions
   * @see https://eslint.org/docs/latest/rules/multiline-ternary
   * @deprecated
   */
  'multiline-ternary'?: Linter.RuleEntry<MultilineTernary>
  /**
   * Require constructor names to begin with a capital letter
   * @see https://eslint.org/docs/latest/rules/new-cap
   */
  'new-cap'?: Linter.RuleEntry<NewCap>
  /**
   * Enforce or disallow parentheses when invoking a constructor with no arguments
   * @see https://eslint.org/docs/latest/rules/new-parens
   * @deprecated
   */
  'new-parens'?: Linter.RuleEntry<NewParens>
  /**
   * Require or disallow an empty line after variable declarations
   * @see https://eslint.org/docs/latest/rules/newline-after-var
   * @deprecated
   */
  'newline-after-var'?: Linter.RuleEntry<NewlineAfterVar>
  /**
   * Require an empty line before `return` statements
   * @see https://eslint.org/docs/latest/rules/newline-before-return
   * @deprecated
   */
  'newline-before-return'?: Linter.RuleEntry<[]>
  /**
   * Require a newline after each call in a method chain
   * @see https://eslint.org/docs/latest/rules/newline-per-chained-call
   * @deprecated
   */
  'newline-per-chained-call'?: Linter.RuleEntry<NewlinePerChainedCall>
  /**
   * Enforce font-display behavior with Google Fonts.
   * @see https://nextjs.org/docs/messages/google-font-display
   */
  'next/google-font-display'?: Linter.RuleEntry<[]>
  /**
   * Ensure `preconnect` is used with Google Fonts.
   * @see https://nextjs.org/docs/messages/google-font-preconnect
   */
  'next/google-font-preconnect'?: Linter.RuleEntry<[]>
  /**
   * Enforce `id` attribute on `next/script` components with inline content.
   * @see https://nextjs.org/docs/messages/inline-script-id
   */
  'next/inline-script-id'?: Linter.RuleEntry<[]>
  /**
   * Prefer `@next/third-parties/google` when using the inline script for Google Analytics and Tag Manager.
   * @see https://nextjs.org/docs/messages/next-script-for-ga
   */
  'next/next-script-for-ga'?: Linter.RuleEntry<[]>
  /**
   * Prevent assignment to the `module` variable.
   * @see https://nextjs.org/docs/messages/no-assign-module-variable
   */
  'next/no-assign-module-variable'?: Linter.RuleEntry<[]>
  /**
   * Prevent Client Components from being async functions.
   * @see https://nextjs.org/docs/messages/no-async-client-component
   */
  'next/no-async-client-component'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `next/script`'s `beforeInteractive` strategy outside of `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-before-interactive-script-outside-document
   */
  'next/no-before-interactive-script-outside-document'?: Linter.RuleEntry<[]>
  /**
   * Prevent manual stylesheet tags.
   * @see https://nextjs.org/docs/messages/no-css-tags
   */
  'next/no-css-tags'?: Linter.RuleEntry<[]>
  /**
   * Prevent importing `next/document` outside of `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-document-import-in-page
   */
  'next/no-document-import-in-page'?: Linter.RuleEntry<[]>
  /**
   * Prevent duplicate usage of `<Head>` in `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-duplicate-head
   */
  'next/no-duplicate-head'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `<head>` element.
   * @see https://nextjs.org/docs/messages/no-head-element
   */
  'next/no-head-element'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `next/head` in `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-head-import-in-document
   */
  'next/no-head-import-in-document'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `<a>` elements to navigate to internal Next.js pages.
   * @see https://nextjs.org/docs/messages/no-html-link-for-pages
   */
  'next/no-html-link-for-pages'?: Linter.RuleEntry<NextNoHtmlLinkForPages>
  /**
   * Prevent usage of `<img>` element due to slower LCP and higher bandwidth.
   * @see https://nextjs.org/docs/messages/no-img-element
   */
  'next/no-img-element'?: Linter.RuleEntry<[]>
  /**
   * Prevent page-only custom fonts.
   * @see https://nextjs.org/docs/messages/no-page-custom-font
   */
  'next/no-page-custom-font'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `next/script` in `next/head` component.
   * @see https://nextjs.org/docs/messages/no-script-component-in-head
   */
  'next/no-script-component-in-head'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `styled-jsx` in `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-styled-jsx-in-document
   */
  'next/no-styled-jsx-in-document'?: Linter.RuleEntry<[]>
  /**
   * Prevent synchronous scripts.
   * @see https://nextjs.org/docs/messages/no-sync-scripts
   */
  'next/no-sync-scripts'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `<title>` with `Head` component from `next/document`.
   * @see https://nextjs.org/docs/messages/no-title-in-document-head
   */
  'next/no-title-in-document-head'?: Linter.RuleEntry<[]>
  /**
   * Prevent common typos in Next.js data fetching functions.
   */
  'next/no-typos'?: Linter.RuleEntry<[]>
  /**
   * Prevent duplicate polyfills from Polyfill.io.
   * @see https://nextjs.org/docs/messages/no-unwanted-polyfillio
   */
  'next/no-unwanted-polyfillio'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `alert`, `confirm`, and `prompt`
   * @see https://eslint.org/docs/latest/rules/no-alert
   */
  'no-alert'?: Linter.RuleEntry<[]>
  /**
   * Disallow `Array` constructors
   * @see https://eslint.org/docs/latest/rules/no-array-constructor
   */
  'no-array-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow using an async function as a Promise executor
   * @see https://eslint.org/docs/latest/rules/no-async-promise-executor
   */
  'no-async-promise-executor'?: Linter.RuleEntry<[]>
  /**
   * Disallow `await` inside of loops
   * @see https://eslint.org/docs/latest/rules/no-await-in-loop
   */
  'no-await-in-loop'?: Linter.RuleEntry<[]>
  /**
   * Disallow bitwise operators
   * @see https://eslint.org/docs/latest/rules/no-bitwise
   */
  'no-bitwise'?: Linter.RuleEntry<NoBitwise>
  /**
   * Disallow use of the `Buffer()` constructor
   * @see https://eslint.org/docs/latest/rules/no-buffer-constructor
   * @deprecated
   */
  'no-buffer-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `arguments.caller` or `arguments.callee`
   * @see https://eslint.org/docs/latest/rules/no-caller
   */
  'no-caller'?: Linter.RuleEntry<[]>
  /**
   * Disallow lexical declarations in case clauses
   * @see https://eslint.org/docs/latest/rules/no-case-declarations
   */
  'no-case-declarations'?: Linter.RuleEntry<[]>
  /**
   * Disallow `catch` clause parameters from shadowing variables in the outer scope
   * @see https://eslint.org/docs/latest/rules/no-catch-shadow
   * @deprecated
   */
  'no-catch-shadow'?: Linter.RuleEntry<[]>
  /**
   * Disallow reassigning class members
   * @see https://eslint.org/docs/latest/rules/no-class-assign
   */
  'no-class-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow comparing against `-0`
   * @see https://eslint.org/docs/latest/rules/no-compare-neg-zero
   */
  'no-compare-neg-zero'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignment operators in conditional expressions
   * @see https://eslint.org/docs/latest/rules/no-cond-assign
   */
  'no-cond-assign'?: Linter.RuleEntry<NoCondAssign>
  /**
   * Disallow arrow functions where they could be confused with comparisons
   * @see https://eslint.org/docs/latest/rules/no-confusing-arrow
   * @deprecated
   */
  'no-confusing-arrow'?: Linter.RuleEntry<NoConfusingArrow>
  /**
   * Disallow the use of `console`
   * @see https://eslint.org/docs/latest/rules/no-console
   */
  'no-console'?: Linter.RuleEntry<NoConsole>
  /**
   * Disallow reassigning `const`, `using`, and `await using` variables
   * @see https://eslint.org/docs/latest/rules/no-const-assign
   */
  'no-const-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow expressions where the operation doesn't affect the value
   * @see https://eslint.org/docs/latest/rules/no-constant-binary-expression
   */
  'no-constant-binary-expression'?: Linter.RuleEntry<[]>
  /**
   * Disallow constant expressions in conditions
   * @see https://eslint.org/docs/latest/rules/no-constant-condition
   */
  'no-constant-condition'?: Linter.RuleEntry<NoConstantCondition>
  /**
   * Disallow returning value from constructor
   * @see https://eslint.org/docs/latest/rules/no-constructor-return
   */
  'no-constructor-return'?: Linter.RuleEntry<[]>
  /**
   * Disallow `continue` statements
   * @see https://eslint.org/docs/latest/rules/no-continue
   */
  'no-continue'?: Linter.RuleEntry<[]>
  /**
   * Disallow control characters in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-control-regex
   */
  'no-control-regex'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `debugger`
   * @see https://eslint.org/docs/latest/rules/no-debugger
   */
  'no-debugger'?: Linter.RuleEntry<[]>
  /**
   * Disallow deleting variables
   * @see https://eslint.org/docs/latest/rules/no-delete-var
   */
  'no-delete-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow equal signs explicitly at the beginning of regular expressions
   * @see https://eslint.org/docs/latest/rules/no-div-regex
   */
  'no-div-regex'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate arguments in `function` definitions
   * @see https://eslint.org/docs/latest/rules/no-dupe-args
   */
  'no-dupe-args'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate class members
   * @see https://eslint.org/docs/latest/rules/no-dupe-class-members
   */
  'no-dupe-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate conditions in if-else-if chains
   * @see https://eslint.org/docs/latest/rules/no-dupe-else-if
   */
  'no-dupe-else-if'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate keys in object literals
   * @see https://eslint.org/docs/latest/rules/no-dupe-keys
   */
  'no-dupe-keys'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate case labels
   * @see https://eslint.org/docs/latest/rules/no-duplicate-case
   */
  'no-duplicate-case'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate module imports
   * @see https://eslint.org/docs/latest/rules/no-duplicate-imports
   */
  'no-duplicate-imports'?: Linter.RuleEntry<NoDuplicateImports>
  /**
   * Disallow `else` blocks after `return` statements in `if` statements
   * @see https://eslint.org/docs/latest/rules/no-else-return
   */
  'no-else-return'?: Linter.RuleEntry<NoElseReturn>
  /**
   * Disallow empty block statements
   * @see https://eslint.org/docs/latest/rules/no-empty
   */
  'no-empty'?: Linter.RuleEntry<NoEmpty>
  /**
   * Disallow empty character classes in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-empty-character-class
   */
  'no-empty-character-class'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty functions
   * @see https://eslint.org/docs/latest/rules/no-empty-function
   */
  'no-empty-function'?: Linter.RuleEntry<NoEmptyFunction>
  /**
   * Disallow empty destructuring patterns
   * @see https://eslint.org/docs/latest/rules/no-empty-pattern
   */
  'no-empty-pattern'?: Linter.RuleEntry<NoEmptyPattern>
  /**
   * Disallow empty static blocks
   * @see https://eslint.org/docs/latest/rules/no-empty-static-block
   */
  'no-empty-static-block'?: Linter.RuleEntry<[]>
  /**
   * Disallow `null` comparisons without type-checking operators
   * @see https://eslint.org/docs/latest/rules/no-eq-null
   */
  'no-eq-null'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `eval()`
   * @see https://eslint.org/docs/latest/rules/no-eval
   */
  'no-eval'?: Linter.RuleEntry<NoEval>
  /**
   * Disallow reassigning exceptions in `catch` clauses
   * @see https://eslint.org/docs/latest/rules/no-ex-assign
   */
  'no-ex-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow extending native types
   * @see https://eslint.org/docs/latest/rules/no-extend-native
   */
  'no-extend-native'?: Linter.RuleEntry<NoExtendNative>
  /**
   * Disallow unnecessary calls to `.bind()`
   * @see https://eslint.org/docs/latest/rules/no-extra-bind
   */
  'no-extra-bind'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary boolean casts
   * @see https://eslint.org/docs/latest/rules/no-extra-boolean-cast
   */
  'no-extra-boolean-cast'?: Linter.RuleEntry<NoExtraBooleanCast>
  /**
   * Disallow unnecessary labels
   * @see https://eslint.org/docs/latest/rules/no-extra-label
   */
  'no-extra-label'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary parentheses
   * @see https://eslint.org/docs/latest/rules/no-extra-parens
   * @deprecated
   */
  'no-extra-parens'?: Linter.RuleEntry<NoExtraParens>
  /**
   * Disallow unnecessary semicolons
   * @see https://eslint.org/docs/latest/rules/no-extra-semi
   * @deprecated
   */
  'no-extra-semi'?: Linter.RuleEntry<[]>
  /**
   * Disallow fallthrough of `case` statements
   * @see https://eslint.org/docs/latest/rules/no-fallthrough
   */
  'no-fallthrough'?: Linter.RuleEntry<NoFallthrough>
  /**
   * Disallow leading or trailing decimal points in numeric literals
   * @see https://eslint.org/docs/latest/rules/no-floating-decimal
   * @deprecated
   */
  'no-floating-decimal'?: Linter.RuleEntry<[]>
  /**
   * Disallow reassigning `function` declarations
   * @see https://eslint.org/docs/latest/rules/no-func-assign
   */
  'no-func-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignments to native objects or read-only global variables
   * @see https://eslint.org/docs/latest/rules/no-global-assign
   */
  'no-global-assign'?: Linter.RuleEntry<NoGlobalAssign>
  /**
   * Disallow shorthand type conversions
   * @see https://eslint.org/docs/latest/rules/no-implicit-coercion
   */
  'no-implicit-coercion'?: Linter.RuleEntry<NoImplicitCoercion>
  /**
   * Disallow declarations in the global scope
   * @see https://eslint.org/docs/latest/rules/no-implicit-globals
   */
  'no-implicit-globals'?: Linter.RuleEntry<NoImplicitGlobals>
  /**
   * Disallow the use of `eval()`-like methods
   * @see https://eslint.org/docs/latest/rules/no-implied-eval
   */
  'no-implied-eval'?: Linter.RuleEntry<[]>
  /**
   * Disallow assigning to imported bindings
   * @see https://eslint.org/docs/latest/rules/no-import-assign
   */
  'no-import-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow inline comments after code
   * @see https://eslint.org/docs/latest/rules/no-inline-comments
   */
  'no-inline-comments'?: Linter.RuleEntry<NoInlineComments>
  /**
   * Disallow variable or `function` declarations in nested blocks
   * @see https://eslint.org/docs/latest/rules/no-inner-declarations
   */
  'no-inner-declarations'?: Linter.RuleEntry<NoInnerDeclarations>
  /**
   * Disallow invalid regular expression strings in `RegExp` constructors
   * @see https://eslint.org/docs/latest/rules/no-invalid-regexp
   */
  'no-invalid-regexp'?: Linter.RuleEntry<NoInvalidRegexp>
  /**
   * Disallow use of `this` in contexts where the value of `this` is `undefined`
   * @see https://eslint.org/docs/latest/rules/no-invalid-this
   */
  'no-invalid-this'?: Linter.RuleEntry<NoInvalidThis>
  /**
   * Disallow irregular whitespace
   * @see https://eslint.org/docs/latest/rules/no-irregular-whitespace
   */
  'no-irregular-whitespace'?: Linter.RuleEntry<NoIrregularWhitespace>
  /**
   * Disallow the use of the `__iterator__` property
   * @see https://eslint.org/docs/latest/rules/no-iterator
   */
  'no-iterator'?: Linter.RuleEntry<[]>
  /**
   * Disallow labels that share a name with a variable
   * @see https://eslint.org/docs/latest/rules/no-label-var
   */
  'no-label-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow labeled statements
   * @see https://eslint.org/docs/latest/rules/no-labels
   */
  'no-labels'?: Linter.RuleEntry<NoLabels>
  /**
   * Disallow unnecessary nested blocks
   * @see https://eslint.org/docs/latest/rules/no-lone-blocks
   */
  'no-lone-blocks'?: Linter.RuleEntry<[]>
  /**
   * Disallow `if` statements as the only statement in `else` blocks
   * @see https://eslint.org/docs/latest/rules/no-lonely-if
   */
  'no-lonely-if'?: Linter.RuleEntry<[]>
  /**
   * Disallow function declarations that contain unsafe references inside loop statements
   * @see https://eslint.org/docs/latest/rules/no-loop-func
   */
  'no-loop-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow literal numbers that lose precision
   * @see https://eslint.org/docs/latest/rules/no-loss-of-precision
   */
  'no-loss-of-precision'?: Linter.RuleEntry<[]>
  /**
   * Disallow magic numbers
   * @see https://eslint.org/docs/latest/rules/no-magic-numbers
   */
  'no-magic-numbers'?: Linter.RuleEntry<NoMagicNumbers>
  /**
   * Disallow characters which are made with multiple code points in character class syntax
   * @see https://eslint.org/docs/latest/rules/no-misleading-character-class
   */
  'no-misleading-character-class'?: Linter.RuleEntry<NoMisleadingCharacterClass>
  /**
   * Disallow mixed binary operators
   * @see https://eslint.org/docs/latest/rules/no-mixed-operators
   * @deprecated
   */
  'no-mixed-operators'?: Linter.RuleEntry<NoMixedOperators>
  /**
   * Disallow `require` calls to be mixed with regular variable declarations
   * @see https://eslint.org/docs/latest/rules/no-mixed-requires
   * @deprecated
   */
  'no-mixed-requires'?: Linter.RuleEntry<NoMixedRequires>
  /**
   * Disallow mixed spaces and tabs for indentation
   * @see https://eslint.org/docs/latest/rules/no-mixed-spaces-and-tabs
   * @deprecated
   */
  'no-mixed-spaces-and-tabs'?: Linter.RuleEntry<NoMixedSpacesAndTabs>
  /**
   * Disallow use of chained assignment expressions
   * @see https://eslint.org/docs/latest/rules/no-multi-assign
   */
  'no-multi-assign'?: Linter.RuleEntry<NoMultiAssign>
  /**
   * Disallow multiple spaces
   * @see https://eslint.org/docs/latest/rules/no-multi-spaces
   * @deprecated
   */
  'no-multi-spaces'?: Linter.RuleEntry<NoMultiSpaces>
  /**
   * Disallow multiline strings
   * @see https://eslint.org/docs/latest/rules/no-multi-str
   */
  'no-multi-str'?: Linter.RuleEntry<[]>
  /**
   * Disallow multiple empty lines
   * @see https://eslint.org/docs/latest/rules/no-multiple-empty-lines
   * @deprecated
   */
  'no-multiple-empty-lines'?: Linter.RuleEntry<NoMultipleEmptyLines>
  /**
   * Disallow assignments to native objects or read-only global variables
   * @see https://eslint.org/docs/latest/rules/no-native-reassign
   * @deprecated
   */
  'no-native-reassign'?: Linter.RuleEntry<NoNativeReassign>
  /**
   * Disallow negated conditions
   * @see https://eslint.org/docs/latest/rules/no-negated-condition
   */
  'no-negated-condition'?: Linter.RuleEntry<[]>
  /**
   * Disallow negating the left operand in `in` expressions
   * @see https://eslint.org/docs/latest/rules/no-negated-in-lhs
   * @deprecated
   */
  'no-negated-in-lhs'?: Linter.RuleEntry<[]>
  /**
   * Disallow nested ternary expressions
   * @see https://eslint.org/docs/latest/rules/no-nested-ternary
   */
  'no-nested-ternary'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators outside of assignments or comparisons
   * @see https://eslint.org/docs/latest/rules/no-new
   */
  'no-new'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with the `Function` object
   * @see https://eslint.org/docs/latest/rules/no-new-func
   */
  'no-new-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with global non-constructor functions
   * @see https://eslint.org/docs/latest/rules/no-new-native-nonconstructor
   */
  'no-new-native-nonconstructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow `Object` constructors
   * @see https://eslint.org/docs/latest/rules/no-new-object
   * @deprecated
   */
  'no-new-object'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with calls to `require`
   * @see https://eslint.org/docs/latest/rules/no-new-require
   * @deprecated
   */
  'no-new-require'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with the `Symbol` object
   * @see https://eslint.org/docs/latest/rules/no-new-symbol
   * @deprecated
   */
  'no-new-symbol'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with the `String`, `Number`, and `Boolean` objects
   * @see https://eslint.org/docs/latest/rules/no-new-wrappers
   */
  'no-new-wrappers'?: Linter.RuleEntry<[]>
  /**
   * Disallow `\8` and `\9` escape sequences in string literals
   * @see https://eslint.org/docs/latest/rules/no-nonoctal-decimal-escape
   */
  'no-nonoctal-decimal-escape'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling global object properties as functions
   * @see https://eslint.org/docs/latest/rules/no-obj-calls
   */
  'no-obj-calls'?: Linter.RuleEntry<[]>
  /**
   * Disallow calls to the `Object` constructor without an argument
   * @see https://eslint.org/docs/latest/rules/no-object-constructor
   */
  'no-object-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow octal literals
   * @see https://eslint.org/docs/latest/rules/no-octal
   */
  'no-octal'?: Linter.RuleEntry<[]>
  /**
   * Disallow octal escape sequences in string literals
   * @see https://eslint.org/docs/latest/rules/no-octal-escape
   */
  'no-octal-escape'?: Linter.RuleEntry<[]>
  /**
   * Disallow reassigning function parameters
   * @see https://eslint.org/docs/latest/rules/no-param-reassign
   */
  'no-param-reassign'?: Linter.RuleEntry<NoParamReassign>
  /**
   * Disallow string concatenation with `__dirname` and `__filename`
   * @see https://eslint.org/docs/latest/rules/no-path-concat
   * @deprecated
   */
  'no-path-concat'?: Linter.RuleEntry<[]>
  /**
   * Disallow the unary operators `++` and `--`
   * @see https://eslint.org/docs/latest/rules/no-plusplus
   */
  'no-plusplus'?: Linter.RuleEntry<NoPlusplus>
  /**
   * Disallow the use of `process.env`
   * @see https://eslint.org/docs/latest/rules/no-process-env
   * @deprecated
   */
  'no-process-env'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `process.exit()`
   * @see https://eslint.org/docs/latest/rules/no-process-exit
   * @deprecated
   */
  'no-process-exit'?: Linter.RuleEntry<[]>
  /**
   * Disallow returning values from Promise executor functions
   * @see https://eslint.org/docs/latest/rules/no-promise-executor-return
   */
  'no-promise-executor-return'?: Linter.RuleEntry<NoPromiseExecutorReturn>
  /**
   * Disallow the use of the `__proto__` property
   * @see https://eslint.org/docs/latest/rules/no-proto
   */
  'no-proto'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling some `Object.prototype` methods directly on objects
   * @see https://eslint.org/docs/latest/rules/no-prototype-builtins
   */
  'no-prototype-builtins'?: Linter.RuleEntry<[]>
  /**
   * Disallow variable redeclaration
   * @see https://eslint.org/docs/latest/rules/no-redeclare
   */
  'no-redeclare'?: Linter.RuleEntry<NoRedeclare>
  /**
   * Disallow multiple spaces in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-regex-spaces
   */
  'no-regex-spaces'?: Linter.RuleEntry<[]>
  /**
   * Disallow specified names in exports
   * @see https://eslint.org/docs/latest/rules/no-restricted-exports
   */
  'no-restricted-exports'?: Linter.RuleEntry<NoRestrictedExports>
  /**
   * Disallow specified global variables
   * @see https://eslint.org/docs/latest/rules/no-restricted-globals
   */
  'no-restricted-globals'?: Linter.RuleEntry<NoRestrictedGlobals>
  /**
   * Disallow specified modules when loaded by `import`
   * @see https://eslint.org/docs/latest/rules/no-restricted-imports
   */
  'no-restricted-imports'?: Linter.RuleEntry<NoRestrictedImports>
  /**
   * Disallow specified modules when loaded by `require`
   * @see https://eslint.org/docs/latest/rules/no-restricted-modules
   * @deprecated
   */
  'no-restricted-modules'?: Linter.RuleEntry<NoRestrictedModules>
  /**
   * Disallow certain properties on certain objects
   * @see https://eslint.org/docs/latest/rules/no-restricted-properties
   */
  'no-restricted-properties'?: Linter.RuleEntry<NoRestrictedProperties>
  /**
   * Disallow specified syntax
   * @see https://eslint.org/docs/latest/rules/no-restricted-syntax
   */
  'no-restricted-syntax'?: Linter.RuleEntry<NoRestrictedSyntax>
  /**
   * Disallow assignment operators in `return` statements
   * @see https://eslint.org/docs/latest/rules/no-return-assign
   */
  'no-return-assign'?: Linter.RuleEntry<NoReturnAssign>
  /**
   * Disallow unnecessary `return await`
   * @see https://eslint.org/docs/latest/rules/no-return-await
   * @deprecated
   */
  'no-return-await'?: Linter.RuleEntry<[]>
  /**
   * Disallow `javascript:` URLs
   * @see https://eslint.org/docs/latest/rules/no-script-url
   */
  'no-script-url'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignments where both sides are exactly the same
   * @see https://eslint.org/docs/latest/rules/no-self-assign
   */
  'no-self-assign'?: Linter.RuleEntry<NoSelfAssign>
  /**
   * Disallow comparisons where both sides are exactly the same
   * @see https://eslint.org/docs/latest/rules/no-self-compare
   */
  'no-self-compare'?: Linter.RuleEntry<[]>
  /**
   * Disallow comma operators
   * @see https://eslint.org/docs/latest/rules/no-sequences
   */
  'no-sequences'?: Linter.RuleEntry<NoSequences>
  /**
   * Disallow returning values from setters
   * @see https://eslint.org/docs/latest/rules/no-setter-return
   */
  'no-setter-return'?: Linter.RuleEntry<[]>
  /**
   * Disallow variable declarations from shadowing variables declared in the outer scope
   * @see https://eslint.org/docs/latest/rules/no-shadow
   */
  'no-shadow'?: Linter.RuleEntry<NoShadow>
  /**
   * Disallow identifiers from shadowing restricted names
   * @see https://eslint.org/docs/latest/rules/no-shadow-restricted-names
   */
  'no-shadow-restricted-names'?: Linter.RuleEntry<NoShadowRestrictedNames>
  /**
   * Disallow spacing between function identifiers and their applications (deprecated)
   * @see https://eslint.org/docs/latest/rules/no-spaced-func
   * @deprecated
   */
  'no-spaced-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow sparse arrays
   * @see https://eslint.org/docs/latest/rules/no-sparse-arrays
   */
  'no-sparse-arrays'?: Linter.RuleEntry<[]>
  /**
   * Disallow synchronous methods
   * @see https://eslint.org/docs/latest/rules/no-sync
   * @deprecated
   */
  'no-sync'?: Linter.RuleEntry<NoSync>
  /**
   * Disallow all tabs
   * @see https://eslint.org/docs/latest/rules/no-tabs
   * @deprecated
   */
  'no-tabs'?: Linter.RuleEntry<NoTabs>
  /**
   * Disallow template literal placeholder syntax in regular strings
   * @see https://eslint.org/docs/latest/rules/no-template-curly-in-string
   */
  'no-template-curly-in-string'?: Linter.RuleEntry<[]>
  /**
   * Disallow ternary operators
   * @see https://eslint.org/docs/latest/rules/no-ternary
   */
  'no-ternary'?: Linter.RuleEntry<[]>
  /**
   * Disallow `this`/`super` before calling `super()` in constructors
   * @see https://eslint.org/docs/latest/rules/no-this-before-super
   */
  'no-this-before-super'?: Linter.RuleEntry<[]>
  /**
   * Disallow throwing literals as exceptions
   * @see https://eslint.org/docs/latest/rules/no-throw-literal
   */
  'no-throw-literal'?: Linter.RuleEntry<[]>
  /**
   * Disallow trailing whitespace at the end of lines
   * @see https://eslint.org/docs/latest/rules/no-trailing-spaces
   * @deprecated
   */
  'no-trailing-spaces'?: Linter.RuleEntry<NoTrailingSpaces>
  /**
   * Disallow `let` or `var` variables that are read but never assigned
   * @see https://eslint.org/docs/latest/rules/no-unassigned-vars
   */
  'no-unassigned-vars'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of undeclared variables unless mentioned in `/*global *\/` comments
   * @see https://eslint.org/docs/latest/rules/no-undef
   */
  'no-undef'?: Linter.RuleEntry<NoUndef>
  /**
   * Disallow initializing variables to `undefined`
   * @see https://eslint.org/docs/latest/rules/no-undef-init
   */
  'no-undef-init'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `undefined` as an identifier
   * @see https://eslint.org/docs/latest/rules/no-undefined
   */
  'no-undefined'?: Linter.RuleEntry<[]>
  /**
   * Disallow dangling underscores in identifiers
   * @see https://eslint.org/docs/latest/rules/no-underscore-dangle
   */
  'no-underscore-dangle'?: Linter.RuleEntry<NoUnderscoreDangle>
  /**
   * Disallow confusing multiline expressions
   * @see https://eslint.org/docs/latest/rules/no-unexpected-multiline
   */
  'no-unexpected-multiline'?: Linter.RuleEntry<[]>
  /**
   * Disallow unmodified loop conditions
   * @see https://eslint.org/docs/latest/rules/no-unmodified-loop-condition
   */
  'no-unmodified-loop-condition'?: Linter.RuleEntry<[]>
  /**
   * Disallow ternary operators when simpler alternatives exist
   * @see https://eslint.org/docs/latest/rules/no-unneeded-ternary
   */
  'no-unneeded-ternary'?: Linter.RuleEntry<NoUnneededTernary>
  /**
   * Disallow unreachable code after `return`, `throw`, `continue`, and `break` statements
   * @see https://eslint.org/docs/latest/rules/no-unreachable
   */
  'no-unreachable'?: Linter.RuleEntry<[]>
  /**
   * Disallow loops with a body that allows only one iteration
   * @see https://eslint.org/docs/latest/rules/no-unreachable-loop
   */
  'no-unreachable-loop'?: Linter.RuleEntry<NoUnreachableLoop>
  /**
   * Disallow control flow statements in `finally` blocks
   * @see https://eslint.org/docs/latest/rules/no-unsafe-finally
   */
  'no-unsafe-finally'?: Linter.RuleEntry<[]>
  /**
   * Disallow negating the left operand of relational operators
   * @see https://eslint.org/docs/latest/rules/no-unsafe-negation
   */
  'no-unsafe-negation'?: Linter.RuleEntry<NoUnsafeNegation>
  /**
   * Disallow use of optional chaining in contexts where the `undefined` value is not allowed
   * @see https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining
   */
  'no-unsafe-optional-chaining'?: Linter.RuleEntry<NoUnsafeOptionalChaining>
  /**
   * Disallow unused expressions
   * @see https://eslint.org/docs/latest/rules/no-unused-expressions
   */
  'no-unused-expressions'?: Linter.RuleEntry<NoUnusedExpressions>
  /**
   * Disallow unused labels
   * @see https://eslint.org/docs/latest/rules/no-unused-labels
   */
  'no-unused-labels'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused private class members
   * @see https://eslint.org/docs/latest/rules/no-unused-private-class-members
   */
  'no-unused-private-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused variables
   * @see https://eslint.org/docs/latest/rules/no-unused-vars
   */
  'no-unused-vars'?: Linter.RuleEntry<NoUnusedVars>
  /**
   * Disallow the use of variables before they are defined
   * @see https://eslint.org/docs/latest/rules/no-use-before-define
   */
  'no-use-before-define'?: Linter.RuleEntry<NoUseBeforeDefine>
  /**
   * Disallow variable assignments when the value is not used
   * @see https://eslint.org/docs/latest/rules/no-useless-assignment
   */
  'no-useless-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless backreferences in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-useless-backreference
   */
  'no-useless-backreference'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary calls to `.call()` and `.apply()`
   * @see https://eslint.org/docs/latest/rules/no-useless-call
   */
  'no-useless-call'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary `catch` clauses
   * @see https://eslint.org/docs/latest/rules/no-useless-catch
   */
  'no-useless-catch'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary computed property keys in objects and classes
   * @see https://eslint.org/docs/latest/rules/no-useless-computed-key
   */
  'no-useless-computed-key'?: Linter.RuleEntry<NoUselessComputedKey>
  /**
   * Disallow unnecessary concatenation of literals or template literals
   * @see https://eslint.org/docs/latest/rules/no-useless-concat
   */
  'no-useless-concat'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary constructors
   * @see https://eslint.org/docs/latest/rules/no-useless-constructor
   */
  'no-useless-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary escape characters
   * @see https://eslint.org/docs/latest/rules/no-useless-escape
   */
  'no-useless-escape'?: Linter.RuleEntry<NoUselessEscape>
  /**
   * Disallow renaming import, export, and destructured assignments to the same name
   * @see https://eslint.org/docs/latest/rules/no-useless-rename
   */
  'no-useless-rename'?: Linter.RuleEntry<NoUselessRename>
  /**
   * Disallow redundant return statements
   * @see https://eslint.org/docs/latest/rules/no-useless-return
   */
  'no-useless-return'?: Linter.RuleEntry<[]>
  /**
   * Require `let` or `const` instead of `var`
   * @see https://eslint.org/docs/latest/rules/no-var
   */
  'no-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow `void` operators
   * @see https://eslint.org/docs/latest/rules/no-void
   */
  'no-void'?: Linter.RuleEntry<NoVoid>
  /**
   * Disallow specified warning terms in comments
   * @see https://eslint.org/docs/latest/rules/no-warning-comments
   */
  'no-warning-comments'?: Linter.RuleEntry<NoWarningComments>
  /**
   * Disallow whitespace before properties
   * @see https://eslint.org/docs/latest/rules/no-whitespace-before-property
   * @deprecated
   */
  'no-whitespace-before-property'?: Linter.RuleEntry<[]>
  /**
   * Disallow `with` statements
   * @see https://eslint.org/docs/latest/rules/no-with
   */
  'no-with'?: Linter.RuleEntry<[]>
  /**
   * require `return` statements after callbacks
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/callback-return.md
   */
  'node/callback-return'?: Linter.RuleEntry<NodeCallbackReturn>
  /**
   * enforce either `module.exports` or `exports`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/exports-style.md
   */
  'node/exports-style'?: Linter.RuleEntry<NodeExportsStyle>
  /**
   * enforce the style of file extensions in `import` declarations
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/file-extension-in-import.md
   */
  'node/file-extension-in-import'?: Linter.RuleEntry<NodeFileExtensionInImport>
  /**
   * require `require()` calls to be placed at top-level module scope
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/global-require.md
   */
  'node/global-require'?: Linter.RuleEntry<[]>
  /**
   * require error handling in callbacks
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/handle-callback-err.md
   */
  'node/handle-callback-err'?: Linter.RuleEntry<NodeHandleCallbackErr>
  /**
   * require correct usage of hashbang
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/hashbang.md
   */
  'node/hashbang'?: Linter.RuleEntry<NodeHashbang>
  /**
   * enforce Node.js-style error-first callback pattern is followed
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-callback-literal.md
   */
  'node/no-callback-literal'?: Linter.RuleEntry<[]>
  /**
   * disallow deprecated APIs
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-deprecated-api.md
   */
  'node/no-deprecated-api'?: Linter.RuleEntry<NodeNoDeprecatedApi>
  /**
   * disallow the assignment to `exports`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-exports-assign.md
   */
  'node/no-exports-assign'?: Linter.RuleEntry<[]>
  /**
   * disallow `import` declarations which import extraneous modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-extraneous-import.md
   */
  'node/no-extraneous-import'?: Linter.RuleEntry<NodeNoExtraneousImport>
  /**
   * disallow `require()` expressions which import extraneous modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-extraneous-require.md
   */
  'node/no-extraneous-require'?: Linter.RuleEntry<NodeNoExtraneousRequire>
  /**
   * disallow third-party modules which are hiding core modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-hide-core-modules.md
   * @deprecated
   */
  'node/no-hide-core-modules'?: Linter.RuleEntry<NodeNoHideCoreModules>
  /**
   * disallow `import` declarations which import missing modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-missing-import.md
   */
  'node/no-missing-import'?: Linter.RuleEntry<NodeNoMissingImport>
  /**
   * disallow `require()` expressions which import missing modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-missing-require.md
   */
  'node/no-missing-require'?: Linter.RuleEntry<NodeNoMissingRequire>
  /**
   * disallow `require` calls to be mixed with regular variable declarations
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-mixed-requires.md
   */
  'node/no-mixed-requires'?: Linter.RuleEntry<NodeNoMixedRequires>
  /**
   * disallow `new` operators with calls to `require`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-new-require.md
   */
  'node/no-new-require'?: Linter.RuleEntry<[]>
  /**
   * disallow string concatenation with `__dirname` and `__filename`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-path-concat.md
   */
  'node/no-path-concat'?: Linter.RuleEntry<[]>
  /**
   * disallow the use of `process.env`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-process-env.md
   */
  'node/no-process-env'?: Linter.RuleEntry<NodeNoProcessEnv>
  /**
   * disallow the use of `process.exit()`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-process-exit.md
   */
  'node/no-process-exit'?: Linter.RuleEntry<[]>
  /**
   * disallow specified modules when loaded by `import` declarations
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-restricted-import.md
   */
  'node/no-restricted-import'?: Linter.RuleEntry<NodeNoRestrictedImport>
  /**
   * disallow specified modules when loaded by `require`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-restricted-require.md
   */
  'node/no-restricted-require'?: Linter.RuleEntry<NodeNoRestrictedRequire>
  /**
   * disallow synchronous methods
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-sync.md
   */
  'node/no-sync'?: Linter.RuleEntry<NodeNoSync>
  /**
   * disallow top-level `await` in published modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-top-level-await.md
   */
  'node/no-top-level-await'?: Linter.RuleEntry<NodeNoTopLevelAwait>
  /**
   * disallow `bin` files that npm ignores
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-unpublished-bin.md
   */
  'node/no-unpublished-bin'?: Linter.RuleEntry<NodeNoUnpublishedBin>
  /**
   * disallow `import` declarations which import private modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-unpublished-import.md
   */
  'node/no-unpublished-import'?: Linter.RuleEntry<NodeNoUnpublishedImport>
  /**
   * disallow `require()` expressions which import private modules
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-unpublished-require.md
   */
  'node/no-unpublished-require'?: Linter.RuleEntry<NodeNoUnpublishedRequire>
  /**
   * disallow unsupported ECMAScript built-ins on the specified version
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-unsupported-features/es-builtins.md
   */
  'node/no-unsupported-features/es-builtins'?: Linter.RuleEntry<NodeNoUnsupportedFeaturesEsBuiltins>
  /**
   * disallow unsupported ECMAScript syntax on the specified version
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-unsupported-features/es-syntax.md
   */
  'node/no-unsupported-features/es-syntax'?: Linter.RuleEntry<NodeNoUnsupportedFeaturesEsSyntax>
  /**
   * disallow unsupported Node.js built-in APIs on the specified version
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-unsupported-features/node-builtins.md
   */
  'node/no-unsupported-features/node-builtins'?: Linter.RuleEntry<NodeNoUnsupportedFeaturesNodeBuiltins>
  /**
   * enforce either `Buffer` or `require("buffer").Buffer`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/buffer.md
   */
  'node/prefer-global/buffer'?: Linter.RuleEntry<NodePreferGlobalBuffer>
  /**
   * enforce either `console` or `require("console")`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/console.md
   */
  'node/prefer-global/console'?: Linter.RuleEntry<NodePreferGlobalConsole>
  /**
   * enforce either `crypto` or `require("crypto").webcrypto`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/crypto.md
   */
  'node/prefer-global/crypto'?: Linter.RuleEntry<NodePreferGlobalCrypto>
  /**
   * enforce either `process` or `require("process")`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/process.md
   */
  'node/prefer-global/process'?: Linter.RuleEntry<NodePreferGlobalProcess>
  /**
   * enforce either `TextDecoder` or `require("util").TextDecoder`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/text-decoder.md
   */
  'node/prefer-global/text-decoder'?: Linter.RuleEntry<NodePreferGlobalTextDecoder>
  /**
   * enforce either `TextEncoder` or `require("util").TextEncoder`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/text-encoder.md
   */
  'node/prefer-global/text-encoder'?: Linter.RuleEntry<NodePreferGlobalTextEncoder>
  /**
   * enforce either global timer functions or `require("timers")`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/timers.md
   */
  'node/prefer-global/timers'?: Linter.RuleEntry<NodePreferGlobalTimers>
  /**
   * enforce either `URL` or `require("url").URL`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/url.md
   */
  'node/prefer-global/url'?: Linter.RuleEntry<NodePreferGlobalUrl>
  /**
   * enforce either `URLSearchParams` or `require("url").URLSearchParams`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/url-search-params.md
   */
  'node/prefer-global/url-search-params'?: Linter.RuleEntry<NodePreferGlobalUrlSearchParams>
  /**
   * enforce using the `node:` protocol when importing Node.js builtin modules.
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-node-protocol.md
   */
  'node/prefer-node-protocol'?: Linter.RuleEntry<NodePreferNodeProtocol>
  /**
   * enforce `require("dns").promises`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-promises/dns.md
   */
  'node/prefer-promises/dns'?: Linter.RuleEntry<[]>
  /**
   * enforce `require("fs").promises`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-promises/fs.md
   */
  'node/prefer-promises/fs'?: Linter.RuleEntry<[]>
  /**
   * require that `process.exit()` expressions use the same code path as `throw`
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/process-exit-as-throw.md
   */
  'node/process-exit-as-throw'?: Linter.RuleEntry<[]>
  /**
   * require correct usage of hashbang
   * @see https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/hashbang.md
   * @deprecated
   */
  'node/shebang'?: Linter.RuleEntry<NodeShebang>
  /**
   * Enforce the location of single-line statements
   * @see https://eslint.org/docs/latest/rules/nonblock-statement-body-position
   * @deprecated
   */
  'nonblock-statement-body-position'?: Linter.RuleEntry<NonblockStatementBodyPosition>
  /**
   * Enforce consistent line breaks after opening and before closing braces
   * @see https://eslint.org/docs/latest/rules/object-curly-newline
   * @deprecated
   */
  'object-curly-newline'?: Linter.RuleEntry<ObjectCurlyNewline>
  /**
   * Enforce consistent spacing inside braces
   * @see https://eslint.org/docs/latest/rules/object-curly-spacing
   * @deprecated
   */
  'object-curly-spacing'?: Linter.RuleEntry<ObjectCurlySpacing>
  /**
   * Enforce placing object properties on separate lines
   * @see https://eslint.org/docs/latest/rules/object-property-newline
   * @deprecated
   */
  'object-property-newline'?: Linter.RuleEntry<ObjectPropertyNewline>
  /**
   * Require or disallow method and property shorthand syntax for object literals
   * @see https://eslint.org/docs/latest/rules/object-shorthand
   */
  'object-shorthand'?: Linter.RuleEntry<ObjectShorthand>
  /**
   * Enforce variables to be declared either together or separately in functions
   * @see https://eslint.org/docs/latest/rules/one-var
   */
  'one-var'?: Linter.RuleEntry<OneVar>
  /**
   * Require or disallow newlines around variable declarations
   * @see https://eslint.org/docs/latest/rules/one-var-declaration-per-line
   * @deprecated
   */
  'one-var-declaration-per-line'?: Linter.RuleEntry<OneVarDeclarationPerLine>
  /**
   * Require or disallow assignment operator shorthand where possible
   * @see https://eslint.org/docs/latest/rules/operator-assignment
   */
  'operator-assignment'?: Linter.RuleEntry<OperatorAssignment>
  /**
   * Enforce consistent linebreak style for operators
   * @see https://eslint.org/docs/latest/rules/operator-linebreak
   * @deprecated
   */
  'operator-linebreak'?: Linter.RuleEntry<OperatorLinebreak>
  /**
   * Require or disallow padding within blocks
   * @see https://eslint.org/docs/latest/rules/padded-blocks
   * @deprecated
   */
  'padded-blocks'?: Linter.RuleEntry<PaddedBlocks>
  /**
   * Require or disallow padding lines between statements
   * @see https://eslint.org/docs/latest/rules/padding-line-between-statements
   * @deprecated
   */
  'padding-line-between-statements'?: Linter.RuleEntry<PaddingLineBetweenStatements>
  /**
   * Enforce using "catalog:" in `package.json`
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/json/json-enforce-catalog.test.ts
   */
  'pnpm/json-enforce-catalog'?: Linter.RuleEntry<PnpmJsonEnforceCatalog>
  /**
   * Prefer having pnpm settings in `pnpm-workspace.yaml` instead of `package.json`. This requires pnpm v10.6+, see https://github.com/orgs/pnpm/discussions/9037.
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/json/json-prefer-workspace-settings.test.ts
   */
  'pnpm/json-prefer-workspace-settings'?: Linter.RuleEntry<PnpmJsonPreferWorkspaceSettings>
  /**
   * Enforce using valid catalog in `package.json`
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/json/json-valid-catalog.test.ts
   */
  'pnpm/json-valid-catalog'?: Linter.RuleEntry<PnpmJsonValidCatalog>
  /**
   * Enforce settings in `pnpm-workspace.yaml`
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/yaml/yaml-enforce-settings.test.ts
   */
  'pnpm/yaml-enforce-settings'?: Linter.RuleEntry<PnpmYamlEnforceSettings>
  /**
   * Disallow duplicate catalog items in `pnpm-workspace.yaml`
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/yaml/yaml-no-duplicate-catalog-item.test.ts
   */
  'pnpm/yaml-no-duplicate-catalog-item'?: Linter.RuleEntry<PnpmYamlNoDuplicateCatalogItem>
  /**
   * Disallow unused catalogs in `pnpm-workspace.yaml`
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/yaml/yaml-no-unused-catalog-item.test.ts
   */
  'pnpm/yaml-no-unused-catalog-item'?: Linter.RuleEntry<[]>
  /**
   * Ensure all package patterns in `pnpm-workspace.yaml` match at least one directory
   * @see https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/eslint-plugin-pnpm/src/rules/yaml/yaml-valid-packages.test.ts
   */
  'pnpm/yaml-valid-packages'?: Linter.RuleEntry<[]>
  /**
   * Require using arrow functions for callbacks
   * @see https://eslint.org/docs/latest/rules/prefer-arrow-callback
   */
  'prefer-arrow-callback'?: Linter.RuleEntry<PreferArrowCallback>
  /**
   * Require `const` declarations for variables that are never reassigned after declared
   * @see https://eslint.org/docs/latest/rules/prefer-const
   */
  'prefer-const'?: Linter.RuleEntry<PreferConst>
  /**
   * Require destructuring from arrays and/or objects
   * @see https://eslint.org/docs/latest/rules/prefer-destructuring
   */
  'prefer-destructuring'?: Linter.RuleEntry<PreferDestructuring>
  /**
   * Disallow the use of `Math.pow` in favor of the `**` operator
   * @see https://eslint.org/docs/latest/rules/prefer-exponentiation-operator
   */
  'prefer-exponentiation-operator'?: Linter.RuleEntry<[]>
  /**
   * Enforce using named capture group in regular expression
   * @see https://eslint.org/docs/latest/rules/prefer-named-capture-group
   */
  'prefer-named-capture-group'?: Linter.RuleEntry<[]>
  /**
   * Disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and hexadecimal literals
   * @see https://eslint.org/docs/latest/rules/prefer-numeric-literals
   */
  'prefer-numeric-literals'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of `Object.prototype.hasOwnProperty.call()` and prefer use of `Object.hasOwn()`
   * @see https://eslint.org/docs/latest/rules/prefer-object-has-own
   */
  'prefer-object-has-own'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `Object.assign` with an object literal as the first argument and prefer the use of object spread instead
   * @see https://eslint.org/docs/latest/rules/prefer-object-spread
   */
  'prefer-object-spread'?: Linter.RuleEntry<[]>
  /**
   * Require using Error objects as Promise rejection reasons
   * @see https://eslint.org/docs/latest/rules/prefer-promise-reject-errors
   */
  'prefer-promise-reject-errors'?: Linter.RuleEntry<PreferPromiseRejectErrors>
  /**
   * Require `Reflect` methods where applicable
   * @see https://eslint.org/docs/latest/rules/prefer-reflect
   * @deprecated
   */
  'prefer-reflect'?: Linter.RuleEntry<PreferReflect>
  /**
   * Disallow use of the `RegExp` constructor in favor of regular expression literals
   * @see https://eslint.org/docs/latest/rules/prefer-regex-literals
   */
  'prefer-regex-literals'?: Linter.RuleEntry<PreferRegexLiterals>
  /**
   * Require rest parameters instead of `arguments`
   * @see https://eslint.org/docs/latest/rules/prefer-rest-params
   */
  'prefer-rest-params'?: Linter.RuleEntry<[]>
  /**
   * Require spread operators instead of `.apply()`
   * @see https://eslint.org/docs/latest/rules/prefer-spread
   */
  'prefer-spread'?: Linter.RuleEntry<[]>
  /**
   * Require template literals instead of string concatenation
   * @see https://eslint.org/docs/latest/rules/prefer-template
   */
  'prefer-template'?: Linter.RuleEntry<[]>
  /**
   * Disallow losing originally caught error when re-throwing custom errors
   * @see https://eslint.org/docs/latest/rules/preserve-caught-error
   */
  'preserve-caught-error'?: Linter.RuleEntry<PreserveCaughtError>
  /**
   * Require quotes around object literal property names
   * @see https://eslint.org/docs/latest/rules/quote-props
   * @deprecated
   */
  'quote-props'?: Linter.RuleEntry<QuoteProps>
  /**
   * Enforce the consistent use of either backticks, double, or single quotes
   * @see https://eslint.org/docs/latest/rules/quotes
   * @deprecated
   */
  'quotes'?: Linter.RuleEntry<Quotes>
  /**
   * Enforce the use of the radix argument when using `parseInt()`
   * @see https://eslint.org/docs/latest/rules/radix
   */
  'radix'?: Linter.RuleEntry<Radix>
  /**
   * Surfaces diagnostics from React Forget
   */
  'react-compiler/react-compiler'?: Linter.RuleEntry<ReactCompilerReactCompiler>
  /**
   * Disallows DOM elements from using 'dangerouslySetInnerHTML'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-dangerously-set-innerhtml
   */
  'react-dom/no-dangerously-set-innerhtml'?: Linter.RuleEntry<[]>
  /**
   * Disallows DOM elements from using 'dangerouslySetInnerHTML' and 'children' at the same time.
   * @see https://eslint-react.xyz/docs/rules/dom-no-dangerously-set-innerhtml-with-children
   */
  'react-dom/no-dangerously-set-innerhtml-with-children'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'findDOMNode'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-find-dom-node
   */
  'react-dom/no-find-dom-node'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'flushSync'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-flush-sync
   */
  'react-dom/no-flush-sync'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'ReactDOM.hydrate()' with 'hydrateRoot()'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-hydrate
   */
  'react-dom/no-hydrate'?: Linter.RuleEntry<[]>
  /**
   * Enforces an explicit 'type' attribute for 'button' elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-missing-button-type
   */
  'react-dom/no-missing-button-type'?: Linter.RuleEntry<[]>
  /**
   * Enforces an explicit 'sandbox' attribute for 'iframe' elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-missing-iframe-sandbox
   */
  'react-dom/no-missing-iframe-sandbox'?: Linter.RuleEntry<[]>
  /**
   * Enforces the absence of a 'namespace' in React elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-namespace
   */
  'react-dom/no-namespace'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'ReactDOM.render()' with 'createRoot(node).render()'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-render
   */
  'react-dom/no-render'?: Linter.RuleEntry<[]>
  /**
   * Disallows the return value of 'ReactDOM.render'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-render-return-value
   */
  'react-dom/no-render-return-value'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'javascript:' URLs as attribute values.
   * @see https://eslint-react.xyz/docs/rules/dom-no-script-url
   */
  'react-dom/no-script-url'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of string style prop in JSX. Use an object instead.
   * @see https://eslint-react.xyz/docs/rules/dom-no-string-style-prop
   */
  'react-dom/no-string-style-prop'?: Linter.RuleEntry<[]>
  /**
   * Disallows unknown 'DOM' properties.
   * @see https://eslint-react.xyz/docs/rules/dom-no-unknown-property
   */
  'react-dom/no-unknown-property'?: Linter.RuleEntry<ReactDomNoUnknownProperty>
  /**
   * Enforces that the 'sandbox' attribute for 'iframe' elements is not set to unsafe combinations.
   * @see https://eslint-react.xyz/docs/rules/dom-no-unsafe-iframe-sandbox
   */
  'react-dom/no-unsafe-iframe-sandbox'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'target="_blank"' without 'rel="noreferrer noopener"'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-unsafe-target-blank
   */
  'react-dom/no-unsafe-target-blank'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'useFormState' with 'useActionState'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-use-form-state
   */
  'react-dom/no-use-form-state'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'children' in void DOM elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-void-elements-with-children
   */
  'react-dom/no-void-elements-with-children'?: Linter.RuleEntry<[]>
  /**
   * Enforces importing React DOM via a namespace import.
   * @see https://eslint-react.xyz/docs/rules/dom-prefer-namespace-import
   */
  'react-dom/prefer-namespace-import'?: Linter.RuleEntry<[]>
  /**
   * Prevents unintentional '$' sign before expression.
   * @see https://eslint-react.xyz/docs/rules/jsx-dollar
   */
  'react-extra/jsx-dollar'?: Linter.RuleEntry<[]>
  /**
   * Enforces 'key' prop placement before spread props.
   * @see https://eslint-react.xyz/docs/rules/jsx-key-before-spread
   */
  'react-extra/jsx-key-before-spread'?: Linter.RuleEntry<[]>
  /**
   * Prevents comment strings (e.g., beginning with '//' or '/*') from being accidentally inserted into a JSX element's text nodes.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-comment-textnodes
   */
  'react-extra/jsx-no-comment-textnodes'?: Linter.RuleEntry<[]>
  /**
   * Disallows duplicate props in JSX elements.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-duplicate-props
   */
  'react-extra/jsx-no-duplicate-props'?: Linter.RuleEntry<[]>
  /**
   * Disallows immediately-invoked function expressions in JSX.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-iife
   */
  'react-extra/jsx-no-iife'?: Linter.RuleEntry<[]>
  /**
   * Prevents using variables in JSX that are not defined in the scope.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-undef
   */
  'react-extra/jsx-no-undef'?: Linter.RuleEntry<[]>
  /**
   * Enforces shorthand syntax for boolean props.
   * @see https://eslint-react.xyz/docs/rules/jsx-shorthand-boolean
   */
  'react-extra/jsx-shorthand-boolean'?: Linter.RuleEntry<ReactExtraJsxShorthandBoolean>
  /**
   * Enforces shorthand syntax for fragment elements.
   * @see https://eslint-react.xyz/docs/rules/jsx-shorthand-fragment
   */
  'react-extra/jsx-shorthand-fragment'?: Linter.RuleEntry<ReactExtraJsxShorthandFragment>
  /**
   * Marks React variables as used when JSX is present.
   * @see https://eslint-react.xyz/docs/rules/jsx-uses-react
   */
  'react-extra/jsx-uses-react'?: Linter.RuleEntry<[]>
  /**
   * Marks JSX element variables as used.
   * @see https://eslint-react.xyz/docs/rules/jsx-uses-vars
   */
  'react-extra/jsx-uses-vars'?: Linter.RuleEntry<[]>
  /**
   * Disallows accessing 'this.state' inside 'setState' calls.
   * @see https://eslint-react.xyz/docs/rules/no-access-state-in-setstate
   */
  'react-extra/no-access-state-in-setstate'?: Linter.RuleEntry<[]>
  /**
   * Disallows using an item's index in the array as its key.
   * @see https://eslint-react.xyz/docs/rules/no-array-index-key
   */
  'react-extra/no-array-index-key'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.count' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-count
   */
  'react-extra/no-children-count'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.forEach' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-for-each
   */
  'react-extra/no-children-for-each'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.map' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-map
   */
  'react-extra/no-children-map'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.only' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-only
   */
  'react-extra/no-children-only'?: Linter.RuleEntry<[]>
  /**
   * Disallows passing 'children' as a prop.
   * @see https://eslint-react.xyz/docs/rules/no-children-prop
   */
  'react-extra/no-children-prop'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.toArray' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-to-array
   */
  'react-extra/no-children-to-array'?: Linter.RuleEntry<[]>
  /**
   * Disallows class components except for error boundaries.
   * @see https://eslint-react.xyz/docs/rules/no-class-component
   */
  'react-extra/no-class-component'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'cloneElement'.
   * @see https://eslint-react.xyz/docs/rules/no-clone-element
   */
  'react-extra/no-clone-element'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillMount' with 'UNSAFE_componentWillMount'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-mount
   */
  'react-extra/no-component-will-mount'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillReceiveProps' with 'UNSAFE_componentWillReceiveProps'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-receive-props
   */
  'react-extra/no-component-will-receive-props'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillUpdate' with 'UNSAFE_componentWillUpdate'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-update
   */
  'react-extra/no-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of '<Context.Provider>' with '<Context>'.
   * @see https://eslint-react.xyz/docs/rules/no-context-provider
   */
  'react-extra/no-context-provider'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'createRef' in function components.
   * @see https://eslint-react.xyz/docs/rules/no-create-ref
   */
  'react-extra/no-create-ref'?: Linter.RuleEntry<[]>
  /**
   * Disallows the 'defaultProps' property in favor of ES6 default parameters.
   * @see https://eslint-react.xyz/docs/rules/no-default-props
   */
  'react-extra/no-default-props'?: Linter.RuleEntry<[]>
  /**
   * Disallows direct mutation of 'this.state'.
   * @see https://eslint-react.xyz/docs/rules/no-direct-mutation-state
   */
  'react-extra/no-direct-mutation-state'?: Linter.RuleEntry<[]>
  /**
   * Prevents duplicate 'key' props on sibling elements when rendering lists.
   * @see https://eslint-react.xyz/docs/rules/no-duplicate-key
   */
  'react-extra/no-duplicate-key'?: Linter.RuleEntry<[]>
  /**
   * Disallows certain props on components.
   * @see https://eslint-react.xyz/docs/rules/no-forbidden-props
   * @deprecated
   */
  'react-extra/no-forbidden-props'?: Linter.RuleEntry<ReactExtraNoForbiddenProps>
  /**
   * Replaces usage of 'forwardRef' with passing 'ref' as a prop.
   * @see https://eslint-react.xyz/docs/rules/no-forward-ref
   */
  'react-extra/no-forward-ref'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'key' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-key
   */
  'react-extra/no-implicit-key'?: Linter.RuleEntry<[]>
  /**
   * Prevents problematic leaked values from being rendered.
   * @see https://eslint-react.xyz/docs/rules/no-leaked-conditional-rendering
   */
  'react-extra/no-leaked-conditional-rendering'?: Linter.RuleEntry<[]>
  /**
   * Enforces that all components have a 'displayName' that can be used in DevTools.
   * @see https://eslint-react.xyz/docs/rules/no-missing-component-display-name
   */
  'react-extra/no-missing-component-display-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces that all contexts have a 'displayName' that can be used in DevTools.
   * @see https://eslint-react.xyz/docs/rules/no-missing-context-display-name
   */
  'react-extra/no-missing-context-display-name'?: Linter.RuleEntry<[]>
  /**
   * Disallows missing 'key' on items in list rendering.
   * @see https://eslint-react.xyz/docs/rules/no-missing-key
   */
  'react-extra/no-missing-key'?: Linter.RuleEntry<[]>
  /**
   * Prevents incorrect usage of 'captureOwnerStack'.
   * @see https://eslint-react.xyz/docs/rules/no-misused-capture-owner-stack
   */
  'react-extra/no-misused-capture-owner-stack'?: Linter.RuleEntry<[]>
  /**
   * Disallows nesting component definitions inside other components.
   * @see https://eslint-react.xyz/docs/rules/no-nested-component-definitions
   */
  'react-extra/no-nested-component-definitions'?: Linter.RuleEntry<[]>
  /**
   * Disallows nesting lazy component declarations inside other components.
   * @see https://eslint-react.xyz/docs/rules/no-nested-lazy-component-declarations
   */
  'react-extra/no-nested-lazy-component-declarations'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'propTypes' in favor of TypeScript or another type-checking solution.
   * @see https://eslint-react.xyz/docs/rules/no-prop-types
   */
  'react-extra/no-prop-types'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'shouldComponentUpdate' when extending 'React.PureComponent'.
   * @see https://eslint-react.xyz/docs/rules/no-redundant-should-component-update
   */
  'react-extra/no-redundant-should-component-update'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentDidMount' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-did-mount
   */
  'react-extra/no-set-state-in-component-did-mount'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentDidUpdate' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-did-update
   */
  'react-extra/no-set-state-in-component-did-update'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentWillUpdate' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-will-update
   */
  'react-extra/no-set-state-in-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Replaces string refs with callback refs.
   * @see https://eslint-react.xyz/docs/rules/no-string-refs
   */
  'react-extra/no-string-refs'?: Linter.RuleEntry<[]>
  /**
   * Disallows unnecessary 'key' props on nested child elements when rendering lists.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-key
   */
  'react-extra/no-unnecessary-key'?: Linter.RuleEntry<[]>
  /**
   * Disallows unnecessary usage of 'useCallback'.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-use-callback
   */
  'react-extra/no-unnecessary-use-callback'?: Linter.RuleEntry<[]>
  /**
   * Disallows unnecessary usage of 'useMemo'.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-use-memo
   */
  'react-extra/no-unnecessary-use-memo'?: Linter.RuleEntry<[]>
  /**
   * Enforces that a function with the 'use' prefix uses at least one Hook inside it.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-use-prefix
   */
  'react-extra/no-unnecessary-use-prefix'?: Linter.RuleEntry<[]>
  /**
   * Disallows unnecessary usage of 'useRef'.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-use-ref
   */
  'react-extra/no-unnecessary-use-ref'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillMount' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-mount
   */
  'react-extra/no-unsafe-component-will-mount'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillReceiveProps' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-receive-props
   */
  'react-extra/no-unsafe-component-will-receive-props'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillUpdate' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-update
   */
  'react-extra/no-unsafe-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Prevents non-stable values (i.e., object literals) from being used as a value for 'Context.Provider'.
   * @see https://eslint-react.xyz/docs/rules/no-unstable-context-value
   */
  'react-extra/no-unstable-context-value'?: Linter.RuleEntry<[]>
  /**
   * Prevents using referential-type values as default props in object destructuring.
   * @see https://eslint-react.xyz/docs/rules/no-unstable-default-props
   */
  'react-extra/no-unstable-default-props'?: Linter.RuleEntry<ReactExtraNoUnstableDefaultProps>
  /**
   * Warns about unused class component methods and properties.
   * @see https://eslint-react.xyz/docs/rules/no-unused-class-component-members
   */
  'react-extra/no-unused-class-component-members'?: Linter.RuleEntry<[]>
  /**
   * Warns about component props that are defined but never used.
   * @see https://eslint-react.xyz/docs/rules/no-unused-props
   */
  'react-extra/no-unused-props'?: Linter.RuleEntry<[]>
  /**
   * Warns about unused class component state.
   * @see https://eslint-react.xyz/docs/rules/no-unused-state
   */
  'react-extra/no-unused-state'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'useContext' with 'use'.
   * @see https://eslint-react.xyz/docs/rules/no-use-context
   */
  'react-extra/no-use-context'?: Linter.RuleEntry<[]>
  /**
   * Disallows useless 'forwardRef' calls on components that don't use 'ref's.
   * @see https://eslint-react.xyz/docs/rules/no-useless-forward-ref
   */
  'react-extra/no-useless-forward-ref'?: Linter.RuleEntry<[]>
  /**
   * Disallows useless fragment elements.
   * @see https://eslint-react.xyz/docs/rules/no-useless-fragment
   */
  'react-extra/no-useless-fragment'?: Linter.RuleEntry<ReactExtraNoUselessFragment>
  /**
   * Enforces destructuring assignment for component props and context.
   * @see https://eslint-react.xyz/docs/rules/prefer-destructuring-assignment
   */
  'react-extra/prefer-destructuring-assignment'?: Linter.RuleEntry<[]>
  /**
   * Enforces importing React via a namespace import.
   * @see https://eslint-react.xyz/docs/rules/prefer-namespace-import
   */
  'react-extra/prefer-namespace-import'?: Linter.RuleEntry<[]>
  /**
   * Enforces read-only props in components.
   * @see https://eslint-react.xyz/docs/rules/prefer-read-only-props
   */
  'react-extra/prefer-read-only-props'?: Linter.RuleEntry<[]>
  /**
   * Enforces wrapping function calls made inside 'useState' in an 'initializer function'.
   * @see https://eslint-react.xyz/docs/rules/prefer-use-state-lazy-initialization
   */
  'react-extra/prefer-use-state-lazy-initialization'?: Linter.RuleEntry<[]>
  /**
   * Disallows direct calls to the ['set' function](https://react.dev/reference/react/useState#setstate) of 'useState' in 'useEffect'.
   * @see https://eslint-react.xyz/docs/rules/hooks-extra-no-direct-set-state-in-use-effect
   */
  'react-hooks-extra/no-direct-set-state-in-use-effect'?: Linter.RuleEntry<[]>
  /**
   * Verifies that automatic effect dependencies are compiled if opted-in
   */
  'react-hooks/automatic-effect-dependencies'?: Linter.RuleEntry<ReactHooksAutomaticEffectDependencies>
  /**
   * Validates against calling capitalized functions/methods instead of using JSX
   */
  'react-hooks/capitalized-calls'?: Linter.RuleEntry<ReactHooksCapitalizedCalls>
  /**
   * Validates against higher order functions defining nested components or hooks. Components and hooks should be defined at the module level
   */
  'react-hooks/component-hook-factories'?: Linter.RuleEntry<ReactHooksComponentHookFactories>
  /**
   * Validates the compiler configuration options
   */
  'react-hooks/config'?: Linter.RuleEntry<ReactHooksConfig>
  /**
   * Validates usage of error boundaries instead of try/catch for errors in child components
   */
  'react-hooks/error-boundaries'?: Linter.RuleEntry<ReactHooksErrorBoundaries>
  /**
   * verifies the list of dependencies for Hooks like useEffect and similar
   * @see https://github.com/facebook/react/issues/14920
   */
  'react-hooks/exhaustive-deps'?: Linter.RuleEntry<ReactHooksExhaustiveDeps>
  /**
   * Validates usage of fbt
   */
  'react-hooks/fbt'?: Linter.RuleEntry<ReactHooksFbt>
  /**
   * Validates usage of `fire`
   */
  'react-hooks/fire'?: Linter.RuleEntry<ReactHooksFire>
  /**
   * Validates configuration of [gating mode](https://react.dev/reference/react-compiler/gating)
   */
  'react-hooks/gating'?: Linter.RuleEntry<ReactHooksGating>
  /**
   * Validates against assignment/mutation of globals during render, part of ensuring that [side effects must render outside of render](https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
   */
  'react-hooks/globals'?: Linter.RuleEntry<ReactHooksGlobals>
  /**
   * Validates the rules of hooks
   */
  'react-hooks/hooks'?: Linter.RuleEntry<ReactHooksHooks>
  /**
   * Validates against mutating props, state, and other values that [are immutable](https://react.dev/reference/rules/components-and-hooks-must-be-pure#props-and-state-are-immutable)
   */
  'react-hooks/immutability'?: Linter.RuleEntry<ReactHooksImmutability>
  /**
   * Validates against usage of libraries which are incompatible with memoization (manual or automatic)
   */
  'react-hooks/incompatible-library'?: Linter.RuleEntry<ReactHooksIncompatibleLibrary>
  /**
   * Internal invariants
   */
  'react-hooks/invariant'?: Linter.RuleEntry<ReactHooksInvariant>
  /**
   * Validates that effect dependencies are memoized
   */
  'react-hooks/memoized-effect-dependencies'?: Linter.RuleEntry<ReactHooksMemoizedEffectDependencies>
  /**
   * Validates against deriving values from state in an effect
   */
  'react-hooks/no-deriving-state-in-effects'?: Linter.RuleEntry<ReactHooksNoDerivingStateInEffects>
  /**
   * Validates that existing manual memoized is preserved by the compiler. React Compiler will only compile components and hooks if its inference [matches or exceeds the existing manual memoization](https://react.dev/learn/react-compiler/introduction#what-should-i-do-about-usememo-usecallback-and-reactmemo)
   */
  'react-hooks/preserve-manual-memoization'?: Linter.RuleEntry<ReactHooksPreserveManualMemoization>
  /**
   * Validates that [components/hooks are pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure) by checking that they do not call known-impure functions
   */
  'react-hooks/purity'?: Linter.RuleEntry<ReactHooksPurity>
  /**
   * Validates correct usage of refs, not reading/writing during render. See the "pitfalls" section in [`useRef()` usage](https://react.dev/reference/react/useRef#usage)
   */
  'react-hooks/refs'?: Linter.RuleEntry<ReactHooksRefs>
  /**
   * Validates against suppression of other rules
   */
  'react-hooks/rule-suppression'?: Linter.RuleEntry<ReactHooksRuleSuppression>
  /**
   * enforces the Rules of Hooks
   * @see https://react.dev/reference/rules/rules-of-hooks
   */
  'react-hooks/rules-of-hooks'?: Linter.RuleEntry<ReactHooksRulesOfHooks>
  /**
   * Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance
   */
  'react-hooks/set-state-in-effect'?: Linter.RuleEntry<ReactHooksSetStateInEffect>
  /**
   * Validates against setting state during render, which can trigger additional renders and potential infinite render loops
   */
  'react-hooks/set-state-in-render'?: Linter.RuleEntry<ReactHooksSetStateInRender>
  /**
   * Validates that components are static, not recreated every render. Components that are recreated dynamically can reset state and trigger excessive re-rendering
   */
  'react-hooks/static-components'?: Linter.RuleEntry<ReactHooksStaticComponents>
  /**
   * Validates against invalid syntax
   */
  'react-hooks/syntax'?: Linter.RuleEntry<ReactHooksSyntax>
  /**
   * Unimplemented features
   */
  'react-hooks/todo'?: Linter.RuleEntry<ReactHooksTodo>
  /**
   * Validates against syntax that we do not plan to support in React Compiler
   */
  'react-hooks/unsupported-syntax'?: Linter.RuleEntry<ReactHooksUnsupportedSyntax>
  /**
   * Validates usage of the useMemo() hook against common mistakes. See [`useMemo()` docs](https://react.dev/reference/react/useMemo) for more information.
   */
  'react-hooks/use-memo'?: Linter.RuleEntry<ReactHooksUseMemo>
  /**
   * Validates that useMemos always return a value and that the result of the useMemo is used by the component/hook. See [`useMemo()` docs](https://react.dev/reference/react/useMemo) for more information.
   */
  'react-hooks/void-use-memo'?: Linter.RuleEntry<ReactHooksVoidUseMemo>
  /**
   * Enforces naming conventions for components.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-component-name
   */
  'react-naming-convention/component-name'?: Linter.RuleEntry<ReactNamingConventionComponentName>
  /**
   * Enforces the context name to be a valid component name with the suffix 'Context'.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-context-name
   */
  'react-naming-convention/context-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces consistent file-naming conventions.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-filename
   */
  'react-naming-convention/filename'?: Linter.RuleEntry<ReactNamingConventionFilename>
  /**
   * Enforces consistent use of the JSX file extension.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-filename-extension
   */
  'react-naming-convention/filename-extension'?: Linter.RuleEntry<ReactNamingConventionFilenameExtension>
  /**
   * Enforces identifier names assigned from 'useId' calls to be either 'id' or end with 'Id'.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-id-name
   */
  'react-naming-convention/id-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces identifier names assigned from 'useRef' calls to be either 'ref' or end with 'Ref'.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-ref-name
   */
  'react-naming-convention/ref-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces destructuring and symmetric naming of the 'useState' hook value and setter.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-use-state
   */
  'react-naming-convention/use-state'?: Linter.RuleEntry<ReactNamingConventionUseState>
  /**
   * Validate and transform React Client/Server Function definitions.
   * @see https://eslint-react.xyz/docs/rules/function-definition
   */
  'react-rsc/function-definition'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'addEventListener' in a component or custom hook has a corresponding 'removeEventListener'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-event-listener
   */
  'react-web-api/no-leaked-event-listener'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'setInterval' in a component or custom hook has a corresponding 'clearInterval'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-interval
   */
  'react-web-api/no-leaked-interval'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'ResizeObserver' created in a component or custom hook has a corresponding 'ResizeObserver.disconnect()'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-resize-observer
   */
  'react-web-api/no-leaked-resize-observer'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'setTimeout' in a component or custom hook has a corresponding 'clearTimeout'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-timeout
   */
  'react-web-api/no-leaked-timeout'?: Linter.RuleEntry<[]>
  /**
   * disallow confusing quantifiers
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/confusing-quantifier.html
   */
  'regexp/confusing-quantifier'?: Linter.RuleEntry<[]>
  /**
   * enforce consistent escaping of control characters
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/control-character-escape.html
   */
  'regexp/control-character-escape'?: Linter.RuleEntry<[]>
  /**
   * enforce single grapheme in string literal
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/grapheme-string-literal.html
   */
  'regexp/grapheme-string-literal'?: Linter.RuleEntry<[]>
  /**
   * enforce consistent usage of hexadecimal escape
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/hexadecimal-escape.html
   */
  'regexp/hexadecimal-escape'?: Linter.RuleEntry<RegexpHexadecimalEscape>
  /**
   * enforce into your favorite case
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/letter-case.html
   */
  'regexp/letter-case'?: Linter.RuleEntry<RegexpLetterCase>
  /**
   * enforce match any character style
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/match-any.html
   */
  'regexp/match-any'?: Linter.RuleEntry<RegexpMatchAny>
  /**
   * enforce use of escapes on negation
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/negation.html
   */
  'regexp/negation'?: Linter.RuleEntry<[]>
  /**
   * disallow elements that contradict assertions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-contradiction-with-assertion.html
   */
  'regexp/no-contradiction-with-assertion'?: Linter.RuleEntry<[]>
  /**
   * disallow control characters
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-control-character.html
   */
  'regexp/no-control-character'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate characters in the RegExp character class
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-characters-character-class.html
   */
  'regexp/no-dupe-characters-character-class'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate disjunctions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-dupe-disjunctions.html
   */
  'regexp/no-dupe-disjunctions'?: Linter.RuleEntry<RegexpNoDupeDisjunctions>
  /**
   * disallow alternatives without elements
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-alternative.html
   */
  'regexp/no-empty-alternative'?: Linter.RuleEntry<[]>
  /**
   * disallow capturing group that captures empty.
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-capturing-group.html
   */
  'regexp/no-empty-capturing-group'?: Linter.RuleEntry<[]>
  /**
   * disallow character classes that match no characters
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-character-class.html
   */
  'regexp/no-empty-character-class'?: Linter.RuleEntry<[]>
  /**
   * disallow empty group
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-group.html
   */
  'regexp/no-empty-group'?: Linter.RuleEntry<[]>
  /**
   * disallow empty lookahead assertion or empty lookbehind assertion
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-lookarounds-assertion.html
   */
  'regexp/no-empty-lookarounds-assertion'?: Linter.RuleEntry<[]>
  /**
   * disallow empty string literals in character classes
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-empty-string-literal.html
   */
  'regexp/no-empty-string-literal'?: Linter.RuleEntry<[]>
  /**
   * disallow escape backspace (`[\b]`)
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-escape-backspace.html
   */
  'regexp/no-escape-backspace'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary nested lookaround assertions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-extra-lookaround-assertions.html
   */
  'regexp/no-extra-lookaround-assertions'?: Linter.RuleEntry<[]>
  /**
   * disallow invalid regular expression strings in `RegExp` constructors
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invalid-regexp.html
   */
  'regexp/no-invalid-regexp'?: Linter.RuleEntry<[]>
  /**
   * disallow invisible raw character
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-invisible-character.html
   */
  'regexp/no-invisible-character'?: Linter.RuleEntry<[]>
  /**
   * disallow lazy quantifiers at the end of an expression
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-lazy-ends.html
   */
  'regexp/no-lazy-ends'?: Linter.RuleEntry<RegexpNoLazyEnds>
  /**
   * disallow legacy RegExp features
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-legacy-features.html
   */
  'regexp/no-legacy-features'?: Linter.RuleEntry<RegexpNoLegacyFeatures>
  /**
   * disallow capturing groups that do not behave as one would expect
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-misleading-capturing-group.html
   */
  'regexp/no-misleading-capturing-group'?: Linter.RuleEntry<RegexpNoMisleadingCapturingGroup>
  /**
   * disallow multi-code-point characters in character classes and quantifiers
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-misleading-unicode-character.html
   */
  'regexp/no-misleading-unicode-character'?: Linter.RuleEntry<RegexpNoMisleadingUnicodeCharacter>
  /**
   * disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll`
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-missing-g-flag.html
   */
  'regexp/no-missing-g-flag'?: Linter.RuleEntry<RegexpNoMissingGFlag>
  /**
   * disallow non-standard flags
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-non-standard-flag.html
   */
  'regexp/no-non-standard-flag'?: Linter.RuleEntry<[]>
  /**
   * disallow obscure character ranges
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-obscure-range.html
   */
  'regexp/no-obscure-range'?: Linter.RuleEntry<RegexpNoObscureRange>
  /**
   * disallow octal escape sequence
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-octal.html
   */
  'regexp/no-octal'?: Linter.RuleEntry<[]>
  /**
   * disallow optional assertions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-optional-assertion.html
   */
  'regexp/no-optional-assertion'?: Linter.RuleEntry<[]>
  /**
   * disallow backreferences that reference a group that might not be matched
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-potentially-useless-backreference.html
   */
  'regexp/no-potentially-useless-backreference'?: Linter.RuleEntry<[]>
  /**
   * disallow standalone backslashes (`\`)
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-standalone-backslash.html
   */
  'regexp/no-standalone-backslash'?: Linter.RuleEntry<[]>
  /**
   * disallow exponential and polynomial backtracking
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-backtracking.html
   */
  'regexp/no-super-linear-backtracking'?: Linter.RuleEntry<RegexpNoSuperLinearBacktracking>
  /**
   * disallow quantifiers that cause quadratic moves
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-move.html
   */
  'regexp/no-super-linear-move'?: Linter.RuleEntry<RegexpNoSuperLinearMove>
  /**
   * disallow trivially nested assertions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-trivially-nested-assertion.html
   */
  'regexp/no-trivially-nested-assertion'?: Linter.RuleEntry<[]>
  /**
   * disallow nested quantifiers that can be rewritten as one quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-trivially-nested-quantifier.html
   */
  'regexp/no-trivially-nested-quantifier'?: Linter.RuleEntry<[]>
  /**
   * disallow unused capturing group
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-unused-capturing-group.html
   */
  'regexp/no-unused-capturing-group'?: Linter.RuleEntry<RegexpNoUnusedCapturingGroup>
  /**
   * disallow assertions that are known to always accept (or reject)
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-assertions.html
   */
  'regexp/no-useless-assertions'?: Linter.RuleEntry<[]>
  /**
   * disallow useless backreferences in regular expressions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-backreference.html
   */
  'regexp/no-useless-backreference'?: Linter.RuleEntry<[]>
  /**
   * disallow character class with one character
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-character-class.html
   */
  'regexp/no-useless-character-class'?: Linter.RuleEntry<RegexpNoUselessCharacterClass>
  /**
   * disallow useless `$` replacements in replacement string
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-dollar-replacements.html
   */
  'regexp/no-useless-dollar-replacements'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary escape characters in RegExp
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-escape.html
   */
  'regexp/no-useless-escape'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary regex flags
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-flag.html
   */
  'regexp/no-useless-flag'?: Linter.RuleEntry<RegexpNoUselessFlag>
  /**
   * disallow unnecessarily non-greedy quantifiers
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-lazy.html
   */
  'regexp/no-useless-lazy'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary non-capturing group
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-non-capturing-group.html
   */
  'regexp/no-useless-non-capturing-group'?: Linter.RuleEntry<RegexpNoUselessNonCapturingGroup>
  /**
   * disallow quantifiers that can be removed
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-quantifier.html
   */
  'regexp/no-useless-quantifier'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary character ranges
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-range.html
   */
  'regexp/no-useless-range'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary elements in expression character classes
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-set-operand.html
   */
  'regexp/no-useless-set-operand'?: Linter.RuleEntry<[]>
  /**
   * disallow string disjunction of single characters in `\q{...}`
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-string-literal.html
   */
  'regexp/no-useless-string-literal'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary `{n,m}` quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-two-nums-quantifier.html
   */
  'regexp/no-useless-two-nums-quantifier'?: Linter.RuleEntry<[]>
  /**
   * disallow quantifiers with a maximum of zero
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-zero-quantifier.html
   */
  'regexp/no-zero-quantifier'?: Linter.RuleEntry<[]>
  /**
   * disallow the alternatives of lookarounds that end with a non-constant quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/optimal-lookaround-quantifier.html
   */
  'regexp/optimal-lookaround-quantifier'?: Linter.RuleEntry<[]>
  /**
   * require optimal quantifiers for concatenated quantifiers
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/optimal-quantifier-concatenation.html
   */
  'regexp/optimal-quantifier-concatenation'?: Linter.RuleEntry<RegexpOptimalQuantifierConcatenation>
  /**
   * enforce using character class
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-character-class.html
   */
  'regexp/prefer-character-class'?: Linter.RuleEntry<RegexpPreferCharacterClass>
  /**
   * enforce using `\d`
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-d.html
   */
  'regexp/prefer-d'?: Linter.RuleEntry<RegexpPreferD>
  /**
   * enforces escape of replacement `$` character (`$$`).
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-escape-replacement-dollar-char.html
   */
  'regexp/prefer-escape-replacement-dollar-char'?: Linter.RuleEntry<[]>
  /**
   * prefer lookarounds over capturing group that do not replace
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-lookaround.html
   */
  'regexp/prefer-lookaround'?: Linter.RuleEntry<RegexpPreferLookaround>
  /**
   * enforce using named backreferences
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-backreference.html
   */
  'regexp/prefer-named-backreference'?: Linter.RuleEntry<[]>
  /**
   * enforce using named capture groups
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-capture-group.html
   */
  'regexp/prefer-named-capture-group'?: Linter.RuleEntry<[]>
  /**
   * enforce using named replacement
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-named-replacement.html
   */
  'regexp/prefer-named-replacement'?: Linter.RuleEntry<RegexpPreferNamedReplacement>
  /**
   * enforce using `+` quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-plus-quantifier.html
   */
  'regexp/prefer-plus-quantifier'?: Linter.RuleEntry<[]>
  /**
   * prefer predefined assertion over equivalent lookarounds
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-predefined-assertion.html
   */
  'regexp/prefer-predefined-assertion'?: Linter.RuleEntry<[]>
  /**
   * enforce using quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-quantifier.html
   */
  'regexp/prefer-quantifier'?: Linter.RuleEntry<RegexpPreferQuantifier>
  /**
   * enforce using `?` quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-question-quantifier.html
   */
  'regexp/prefer-question-quantifier'?: Linter.RuleEntry<[]>
  /**
   * enforce using character class range
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-range.html
   */
  'regexp/prefer-range'?: Linter.RuleEntry<RegexpPreferRange>
  /**
   * enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-exec.html
   */
  'regexp/prefer-regexp-exec'?: Linter.RuleEntry<[]>
  /**
   * enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-test.html
   */
  'regexp/prefer-regexp-test'?: Linter.RuleEntry<[]>
  /**
   * enforce using result array `groups`
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-result-array-groups.html
   */
  'regexp/prefer-result-array-groups'?: Linter.RuleEntry<RegexpPreferResultArrayGroups>
  /**
   * prefer character class set operations instead of lookarounds
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-set-operation.html
   */
  'regexp/prefer-set-operation'?: Linter.RuleEntry<[]>
  /**
   * enforce using `*` quantifier
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-star-quantifier.html
   */
  'regexp/prefer-star-quantifier'?: Linter.RuleEntry<[]>
  /**
   * enforce use of unicode codepoint escapes
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-unicode-codepoint-escapes.html
   */
  'regexp/prefer-unicode-codepoint-escapes'?: Linter.RuleEntry<[]>
  /**
   * enforce using `\w`
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-w.html
   */
  'regexp/prefer-w'?: Linter.RuleEntry<[]>
  /**
   * enforce the use of the `u` flag
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/require-unicode-regexp.html
   */
  'regexp/require-unicode-regexp'?: Linter.RuleEntry<[]>
  /**
   * enforce the use of the `v` flag
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/require-unicode-sets-regexp.html
   */
  'regexp/require-unicode-sets-regexp'?: Linter.RuleEntry<[]>
  /**
   * require simplify set operations
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/simplify-set-operations.html
   */
  'regexp/simplify-set-operations'?: Linter.RuleEntry<[]>
  /**
   * sort alternatives if order doesn't matter
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-alternatives.html
   */
  'regexp/sort-alternatives'?: Linter.RuleEntry<[]>
  /**
   * enforces elements order in character class
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-character-class-elements.html
   */
  'regexp/sort-character-class-elements'?: Linter.RuleEntry<RegexpSortCharacterClassElements>
  /**
   * require regex flags to be sorted
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/sort-flags.html
   */
  'regexp/sort-flags'?: Linter.RuleEntry<[]>
  /**
   * disallow not strictly valid regular expressions
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/strict.html
   */
  'regexp/strict'?: Linter.RuleEntry<[]>
  /**
   * enforce consistent usage of unicode escape or unicode codepoint escape
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/unicode-escape.html
   */
  'regexp/unicode-escape'?: Linter.RuleEntry<RegexpUnicodeEscape>
  /**
   * enforce consistent naming of unicode properties
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/unicode-property.html
   */
  'regexp/unicode-property'?: Linter.RuleEntry<RegexpUnicodeProperty>
  /**
   * use the `i` flag if it simplifies the pattern
   * @see https://ota-meshi.github.io/eslint-plugin-regexp/rules/use-ignore-case.html
   */
  'regexp/use-ignore-case'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignments that can lead to race conditions due to usage of `await` or `yield`
   * @see https://eslint.org/docs/latest/rules/require-atomic-updates
   */
  'require-atomic-updates'?: Linter.RuleEntry<RequireAtomicUpdates>
  /**
   * Disallow async functions which have no `await` expression
   * @see https://eslint.org/docs/latest/rules/require-await
   */
  'require-await'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of `u` or `v` flag on regular expressions
   * @see https://eslint.org/docs/latest/rules/require-unicode-regexp
   */
  'require-unicode-regexp'?: Linter.RuleEntry<RequireUnicodeRegexp>
  /**
   * Require generator functions to contain `yield`
   * @see https://eslint.org/docs/latest/rules/require-yield
   */
  'require-yield'?: Linter.RuleEntry<[]>
  /**
   * Enforce spacing between rest and spread operators and their expressions
   * @see https://eslint.org/docs/latest/rules/rest-spread-spacing
   * @deprecated
   */
  'rest-spread-spacing'?: Linter.RuleEntry<RestSpreadSpacing>
  /**
   * Require or disallow semicolons instead of ASI
   * @see https://eslint.org/docs/latest/rules/semi
   * @deprecated
   */
  'semi'?: Linter.RuleEntry<Semi>
  /**
   * Enforce consistent spacing before and after semicolons
   * @see https://eslint.org/docs/latest/rules/semi-spacing
   * @deprecated
   */
  'semi-spacing'?: Linter.RuleEntry<SemiSpacing>
  /**
   * Enforce location of semicolons
   * @see https://eslint.org/docs/latest/rules/semi-style
   * @deprecated
   */
  'semi-style'?: Linter.RuleEntry<SemiStyle>
  /**
   * Alternatives in regular expressions should be grouped when used with anchors
   * @see https://sonarsource.github.io/rspec/#/rspec/S5850/javascript
   */
  'sonar/anchor-precedence'?: Linter.RuleEntry<[]>
  /**
   * Arguments to built-in functions should match documented types
   * @see https://sonarsource.github.io/rspec/#/rspec/S3782/javascript
   */
  'sonar/argument-type'?: Linter.RuleEntry<[]>
  /**
   * Parameters should be passed in the correct order
   * @see https://sonarsource.github.io/rspec/#/rspec/S2234/javascript
   */
  'sonar/arguments-order'?: Linter.RuleEntry<[]>
  /**
   * "arguments" should not be accessed directly
   * @see https://sonarsource.github.io/rspec/#/rspec/S3513/javascript
   */
  'sonar/arguments-usage'?: Linter.RuleEntry<[]>
  /**
   * Callbacks of array methods should have return statements
   * @see https://sonarsource.github.io/rspec/#/rspec/S3796/javascript
   */
  'sonar/array-callback-without-return'?: Linter.RuleEntry<[]>
  /**
   * Array constructors should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1528/javascript
   */
  'sonar/array-constructor'?: Linter.RuleEntry<[]>
  /**
   * Braces and parentheses should be used consistently with arrow functions
   * @see https://sonarsource.github.io/rspec/#/rspec/S3524/javascript
   */
  'sonar/arrow-function-convention'?: Linter.RuleEntry<SonarArrowFunctionConvention>
  /**
   * Tests should include assertions
   * @see https://sonarsource.github.io/rspec/#/rspec/S2699/javascript
   */
  'sonar/assertions-in-tests'?: Linter.RuleEntry<[]>
  /**
   * Creating public APIs is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6333/javascript
   */
  'sonar/aws-apigateway-public-api'?: Linter.RuleEntry<[]>
  /**
   * Allowing public network access to cloud resources is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6329/javascript
   */
  'sonar/aws-ec2-rds-dms-public'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted EBS volumes is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6275/javascript
   */
  'sonar/aws-ec2-unencrypted-ebs-volume'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted EFS file systems is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6332/javascript
   */
  'sonar/aws-efs-unencrypted'?: Linter.RuleEntry<[]>
  /**
   * Policies granting all privileges are security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6302/javascript
   */
  'sonar/aws-iam-all-privileges'?: Linter.RuleEntry<[]>
  /**
   * Policies granting access to all resources of an account are security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6304/javascript
   */
  'sonar/aws-iam-all-resources-accessible'?: Linter.RuleEntry<[]>
  /**
   * AWS IAM policies should limit the scope of permissions given
   * @see https://sonarsource.github.io/rspec/#/rspec/S6317/javascript
   */
  'sonar/aws-iam-privilege-escalation'?: Linter.RuleEntry<[]>
  /**
   * Policies authorizing public access to resources are security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6270/javascript
   */
  'sonar/aws-iam-public-access'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted Opensearch domains is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6308/javascript
   */
  'sonar/aws-opensearchservice-domain'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted RDS DB resources is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6303/javascript
   */
  'sonar/aws-rds-unencrypted-databases'?: Linter.RuleEntry<[]>
  /**
   * Administration services access should be restricted to specific IP addresses
   * @see https://sonarsource.github.io/rspec/#/rspec/S6321/javascript
   */
  'sonar/aws-restricted-ip-admin-access'?: Linter.RuleEntry<[]>
  /**
   * Granting access to S3 buckets to all or authenticated users is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6265/javascript
   */
  'sonar/aws-s3-bucket-granted-access'?: Linter.RuleEntry<[]>
  /**
   * Authorizing HTTP communications with S3 buckets is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6249/javascript
   */
  'sonar/aws-s3-bucket-insecure-http'?: Linter.RuleEntry<[]>
  /**
   * Allowing public ACLs or policies on a S3 bucket is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6281/javascript
   */
  'sonar/aws-s3-bucket-public-access'?: Linter.RuleEntry<[]>
  /**
   * Disabling server-side encryption of S3 buckets is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6245/javascript
   * @deprecated
   */
  'sonar/aws-s3-bucket-server-encryption'?: Linter.RuleEntry<[]>
  /**
   * Disabling versioning of S3 buckets is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6252/javascript
   */
  'sonar/aws-s3-bucket-versioning'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted SageMaker notebook instances is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6319/javascript
   */
  'sonar/aws-sagemaker-unencrypted-notebook'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted SNS topics is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6327/javascript
   */
  'sonar/aws-sns-unencrypted-topics'?: Linter.RuleEntry<[]>
  /**
   * Using unencrypted SQS queues is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6330/javascript
   */
  'sonar/aws-sqs-unencrypted-queue'?: Linter.RuleEntry<[]>
  /**
   * Bitwise operators should not be used in boolean contexts
   * @see https://sonarsource.github.io/rspec/#/rspec/S1529/javascript
   */
  'sonar/bitwise-operators'?: Linter.RuleEntry<[]>
  /**
   * Variables should be used in the blocks where they are declared
   * @see https://sonarsource.github.io/rspec/#/rspec/S2392/javascript
   */
  'sonar/block-scoped-var'?: Linter.RuleEntry<[]>
  /**
   * Optional boolean parameters should have default value
   * @see https://sonarsource.github.io/rspec/#/rspec/S4798/javascript
   */
  'sonar/bool-param-default'?: Linter.RuleEntry<[]>
  /**
   * Function call arguments should not start on new lines
   * @see https://sonarsource.github.io/rspec/#/rspec/S1472/javascript
   */
  'sonar/call-argument-line'?: Linter.RuleEntry<[]>
  /**
   * Disabling Certificate Transparency monitoring is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5742/javascript
   * @deprecated
   */
  'sonar/certificate-transparency'?: Linter.RuleEntry<[]>
  /**
   * Chai assertions should have only one reason to succeed
   * @see https://sonarsource.github.io/rspec/#/rspec/S6092/javascript
   */
  'sonar/chai-determinate-assertion'?: Linter.RuleEntry<[]>
  /**
   * Class names should comply with a naming convention
   * @see https://sonarsource.github.io/rspec/#/rspec/S101/javascript
   */
  'sonar/class-name'?: Linter.RuleEntry<SonarClassName>
  /**
   * Class methods should be used instead of "prototype" assignments
   * @see https://sonarsource.github.io/rspec/#/rspec/S3525/javascript
   */
  'sonar/class-prototype'?: Linter.RuleEntry<[]>
  /**
   * Cognitive Complexity of functions should not be too high
   * @see https://sonarsource.github.io/rspec/#/rspec/S3776/javascript
   */
  'sonar/cognitive-complexity'?: Linter.RuleEntry<SonarCognitiveComplexity>
  /**
   * Comma and logical OR operators should not be used in switch cases
   * @see https://sonarsource.github.io/rspec/#/rspec/S3616/javascript
   */
  'sonar/comma-or-logical-or-case'?: Linter.RuleEntry<[]>
  /**
   * Track comments matching a regular expression
   * @see https://sonarsource.github.io/rspec/#/rspec/S124/javascript
   */
  'sonar/comment-regex'?: Linter.RuleEntry<SonarCommentRegex>
  /**
   * Regular expression quantifiers and character classes should be used concisely
   * @see https://sonarsource.github.io/rspec/#/rspec/S6353/javascript
   */
  'sonar/concise-regex'?: Linter.RuleEntry<[]>
  /**
   * A conditionally executed single line should be denoted by indentation
   * @see https://sonarsource.github.io/rspec/#/rspec/S3973/javascript
   * @deprecated
   */
  'sonar/conditional-indentation'?: Linter.RuleEntry<[]>
  /**
   * Allowing confidential information to be logged is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5757/javascript
   */
  'sonar/confidential-information-logging'?: Linter.RuleEntry<[]>
  /**
   * Objects should not be created to be dropped immediately without being used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1848/javascript
   */
  'sonar/constructor-for-side-effects'?: Linter.RuleEntry<[]>
  /**
   * Allowing requests with excessive content length is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5693/javascript
   */
  'sonar/content-length'?: Linter.RuleEntry<SonarContentLength>
  /**
   * Disabling content security policy fetch directives is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5728/javascript
   */
  'sonar/content-security-policy'?: Linter.RuleEntry<[]>
  /**
   * Creating cookies without the "HttpOnly" flag is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S3330/javascript
   */
  'sonar/cookie-no-httponly'?: Linter.RuleEntry<[]>
  /**
   * Writing cookies is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S2255/javascript
   * @deprecated
   */
  'sonar/cookies'?: Linter.RuleEntry<[]>
  /**
   * Having a permissive Cross-Origin Resource Sharing policy is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5122/javascript
   */
  'sonar/cors'?: Linter.RuleEntry<[]>
  /**
   * Disabling CSRF protections is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4502/javascript
   */
  'sonar/csrf'?: Linter.RuleEntry<[]>
  /**
   * Cyclomatic Complexity of functions should not be too high
   * @see https://sonarsource.github.io/rspec/#/rspec/S1541/javascript
   */
  'sonar/cyclomatic-complexity'?: Linter.RuleEntry<SonarCyclomaticComplexity>
  /**
   * Variables and functions should not be declared in the global scope
   * @see https://sonarsource.github.io/rspec/#/rspec/S3798/javascript
   */
  'sonar/declarations-in-global-scope'?: Linter.RuleEntry<[]>
  /**
   * Deprecated APIs should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1874/javascript
   */
  'sonar/deprecation'?: Linter.RuleEntry<[]>
  /**
   * Destructuring syntax should be used for assignments
   * @see https://sonarsource.github.io/rspec/#/rspec/S3514/javascript
   */
  'sonar/destructuring-assignment-syntax'?: Linter.RuleEntry<[]>
  /**
   * Strict equality operators should not be used with dissimilar types
   * @see https://sonarsource.github.io/rspec/#/rspec/S3403/javascript
   */
  'sonar/different-types-comparison'?: Linter.RuleEntry<[]>
  /**
   * Disabling auto-escaping in template engines is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5247/javascript
   */
  'sonar/disabled-auto-escaping'?: Linter.RuleEntry<[]>
  /**
   * Using remote artifacts without integrity checks is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5725/javascript
   */
  'sonar/disabled-resource-integrity'?: Linter.RuleEntry<[]>
  /**
   * Disabling Mocha timeouts should be explicit
   * @see https://sonarsource.github.io/rspec/#/rspec/S6080/javascript
   */
  'sonar/disabled-timeout'?: Linter.RuleEntry<[]>
  /**
   * Allowing browsers to perform DNS prefetching is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5743/javascript
   * @deprecated
   */
  'sonar/dns-prefetching'?: Linter.RuleEntry<[]>
  /**
   * Character classes in regular expressions should not contain the same character twice
   * @see https://sonarsource.github.io/rspec/#/rspec/S5869/javascript
   */
  'sonar/duplicates-in-character-class'?: Linter.RuleEntry<[]>
  /**
   * Templates should not be constructed dynamically
   * @see https://sonarsource.github.io/rspec/#/rspec/S7790/javascript
   */
  'sonar/dynamically-constructed-templates'?: Linter.RuleEntry<[]>
  /**
   * "if ... else if" constructs should end with "else" clauses
   * @see https://sonarsource.github.io/rspec/#/rspec/S126/javascript
   */
  'sonar/elseif-without-else'?: Linter.RuleEntry<[]>
  /**
   * Repeated patterns in regular expressions should not match the empty string
   * @see https://sonarsource.github.io/rspec/#/rspec/S5842/javascript
   */
  'sonar/empty-string-repetition'?: Linter.RuleEntry<[]>
  /**
   * Encrypting data is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4787/javascript
   * @deprecated
   */
  'sonar/encryption'?: Linter.RuleEntry<[]>
  /**
   * Encryption algorithms should be used with secure mode and padding scheme
   * @see https://sonarsource.github.io/rspec/#/rspec/S5542/javascript
   */
  'sonar/encryption-secure-mode'?: Linter.RuleEntry<[]>
  /**
   * Replacement strings should reference existing regular expression groups
   * @see https://sonarsource.github.io/rspec/#/rspec/S6328/javascript
   */
  'sonar/existing-groups'?: Linter.RuleEntry<[]>
  /**
   * Expressions should not be too complex
   * @see https://sonarsource.github.io/rspec/#/rspec/S1067/javascript
   */
  'sonar/expression-complexity'?: Linter.RuleEntry<SonarExpressionComplexity>
  /**
   * Track lack of copyright and license headers
   * @see https://sonarsource.github.io/rspec/#/rspec/S1451/javascript
   */
  'sonar/file-header'?: Linter.RuleEntry<SonarFileHeader>
  /**
   * Default export names and file names should match
   * @see https://sonarsource.github.io/rspec/#/rspec/S3317/javascript
   */
  'sonar/file-name-differ-from-class'?: Linter.RuleEntry<[]>
  /**
   * Setting loose POSIX file permissions is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S2612/javascript
   */
  'sonar/file-permissions'?: Linter.RuleEntry<[]>
  /**
   * File uploads should be restricted
   * @see https://sonarsource.github.io/rspec/#/rspec/S2598/javascript
   */
  'sonar/file-uploads'?: Linter.RuleEntry<[]>
  /**
   * Track uses of "FIXME" tags
   * @see https://sonarsource.github.io/rspec/#/rspec/S1134/javascript
   */
  'sonar/fixme-tag'?: Linter.RuleEntry<[]>
  /**
   * "for...in" loops should filter properties before acting on them
   * @see https://sonarsource.github.io/rspec/#/rspec/S1535/javascript
   */
  'sonar/for-in'?: Linter.RuleEntry<[]>
  /**
   * A "for" loop update clause should move the counter in the right direction
   * @see https://sonarsource.github.io/rspec/#/rspec/S2251/javascript
   */
  'sonar/for-loop-increment-sign'?: Linter.RuleEntry<[]>
  /**
   * Disabling content security policy frame-ancestors directive is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5732/javascript
   */
  'sonar/frame-ancestors'?: Linter.RuleEntry<[]>
  /**
   * Functions should not be defined inside loops
   * @see https://sonarsource.github.io/rspec/#/rspec/S1515/javascript
   */
  'sonar/function-inside-loop'?: Linter.RuleEntry<[]>
  /**
   * Function and method names should comply with a naming convention
   * @see https://sonarsource.github.io/rspec/#/rspec/S100/javascript
   */
  'sonar/function-name'?: Linter.RuleEntry<SonarFunctionName>
  /**
   * Functions should always return the same type
   * @see https://sonarsource.github.io/rspec/#/rspec/S3800/javascript
   */
  'sonar/function-return-type'?: Linter.RuleEntry<[]>
  /**
   * Future reserved words should not be used as identifiers
   * @see https://sonarsource.github.io/rspec/#/rspec/S1527/javascript
   */
  'sonar/future-reserved-words'?: Linter.RuleEntry<[]>
  /**
   * Generators should explicitly "yield" a value
   * @see https://sonarsource.github.io/rspec/#/rspec/S3531/javascript
   */
  'sonar/generator-without-yield'?: Linter.RuleEntry<[]>
  /**
   * Credentials should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S6437/javascript
   */
  'sonar/hardcoded-secret-signatures'?: Linter.RuleEntry<[]>
  /**
   * Using weak hashing algorithms is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4790/javascript
   */
  'sonar/hashing'?: Linter.RuleEntry<[]>
  /**
   * Statically serving hidden files is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5691/javascript
   */
  'sonar/hidden-files'?: Linter.RuleEntry<[]>
  /**
   * "in" should not be used with primitive types
   * @see https://sonarsource.github.io/rspec/#/rspec/S3785/javascript
   */
  'sonar/in-operator-type-error'?: Linter.RuleEntry<[]>
  /**
   * Functions should be called consistently with or without "new"
   * @see https://sonarsource.github.io/rspec/#/rspec/S3686/javascript
   */
  'sonar/inconsistent-function-call'?: Linter.RuleEntry<[]>
  /**
   * "indexOf" checks should not be for positive numbers
   * @see https://sonarsource.github.io/rspec/#/rspec/S2692/javascript
   */
  'sonar/index-of-compare-to-positive-number'?: Linter.RuleEntry<[]>
  /**
   * Creating cookies without the "secure" flag is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S2092/javascript
   */
  'sonar/insecure-cookie'?: Linter.RuleEntry<[]>
  /**
   * JWT should be signed and verified with strong cipher algorithms
   * @see https://sonarsource.github.io/rspec/#/rspec/S5659/javascript
   */
  'sonar/insecure-jwt-token'?: Linter.RuleEntry<[]>
  /**
   * Assertion arguments should be passed in the correct order
   * @see https://sonarsource.github.io/rspec/#/rspec/S3415/javascript
   */
  'sonar/inverted-assertion-arguments'?: Linter.RuleEntry<[]>
  /**
   * React components should not render non-boolean condition values
   * @see https://sonarsource.github.io/rspec/#/rspec/S6439/javascript
   */
  'sonar/jsx-no-leaked-render'?: Linter.RuleEntry<[]>
  /**
   * Only "while", "do", "for" and "switch" statements should be labelled
   * @see https://sonarsource.github.io/rspec/#/rspec/S1439/javascript
   */
  'sonar/label-position'?: Linter.RuleEntry<[]>
  /**
   * Authorizing an opened window to access back to the originating window is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5148/javascript
   */
  'sonar/link-with-target-blank'?: Linter.RuleEntry<[]>
  /**
   * Files should not have too many lines of code
   * @see https://sonarsource.github.io/rspec/#/rspec/S104/javascript
   */
  'sonar/max-lines'?: Linter.RuleEntry<SonarMaxLines>
  /**
   * Functions should not have too many lines of code
   * @see https://sonarsource.github.io/rspec/#/rspec/S138/javascript
   */
  'sonar/max-lines-per-function'?: Linter.RuleEntry<SonarMaxLinesPerFunction>
  /**
   * "switch" statements should not have too many "case" clauses
   * @see https://sonarsource.github.io/rspec/#/rspec/S1479/javascript
   */
  'sonar/max-switch-cases'?: Linter.RuleEntry<SonarMaxSwitchCases>
  /**
   * Union types should not have too many elements
   * @see https://sonarsource.github.io/rspec/#/rspec/S4622/javascript
   */
  'sonar/max-union-size'?: Linter.RuleEntry<SonarMaxUnionSize>
  /**
   * "for" loop increment clauses should modify the loops' counters
   * @see https://sonarsource.github.io/rspec/#/rspec/S1994/javascript
   */
  'sonar/misplaced-loop-counter'?: Linter.RuleEntry<[]>
  /**
   * Control flow statements "if", "for", "while", "switch" and "try" should not be nested too deeply
   * @see https://sonarsource.github.io/rspec/#/rspec/S134/javascript
   */
  'sonar/nested-control-flow'?: Linter.RuleEntry<SonarNestedControlFlow>
  /**
   * "new" should only be used with functions and classes
   * @see https://sonarsource.github.io/rspec/#/rspec/S2999/javascript
   */
  'sonar/new-operator-misuse'?: Linter.RuleEntry<SonarNewOperatorMisuse>
  /**
   * All branches in a conditional structure should not have exactly the same implementation
   * @see https://sonarsource.github.io/rspec/#/rspec/S3923/javascript
   */
  'sonar/no-all-duplicated-branches'?: Linter.RuleEntry<[]>
  /**
   * "Array.prototype.sort()" and "Array.prototype.toSorted()" should use a compare function
   * @see https://sonarsource.github.io/rspec/#/rspec/S2871/javascript
   */
  'sonar/no-alphabetical-sort'?: Linter.RuleEntry<[]>
  /**
   * Disabling Angular built-in sanitization is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6268/javascript
   */
  'sonar/no-angular-bypass-sanitization'?: Linter.RuleEntry<[]>
  /**
   * "delete" should not be used on arrays
   * @see https://sonarsource.github.io/rspec/#/rspec/S2870/javascript
   */
  'sonar/no-array-delete'?: Linter.RuleEntry<[]>
  /**
   * Array indexes should be numeric
   * @see https://sonarsource.github.io/rspec/#/rspec/S3579/javascript
   */
  'sonar/no-associative-arrays'?: Linter.RuleEntry<[]>
  /**
   * Constructors should not contain asynchronous operations
   * @see https://sonarsource.github.io/rspec/#/rspec/S7059/javascript
   */
  'sonar/no-async-constructor'?: Linter.RuleEntry<[]>
  /**
   * Built-in objects should not be overridden
   * @see https://sonarsource.github.io/rspec/#/rspec/S2424/javascript
   */
  'sonar/no-built-in-override'?: Linter.RuleEntry<[]>
  /**
   * "switch" statements should not contain non-case labels
   * @see https://sonarsource.github.io/rspec/#/rspec/S1219/javascript
   */
  'sonar/no-case-label-in-switch'?: Linter.RuleEntry<[]>
  /**
   * Using clear-text protocols is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5332/javascript
   */
  'sonar/no-clear-text-protocols'?: Linter.RuleEntry<[]>
  /**
   * Tests should not execute any code after "done()" is called
   * @see https://sonarsource.github.io/rspec/#/rspec/S6079/javascript
   */
  'sonar/no-code-after-done'?: Linter.RuleEntry<[]>
  /**
   * Mergeable "if" statements should be combined
   * @see https://sonarsource.github.io/rspec/#/rspec/S1066/javascript
   */
  'sonar/no-collapsible-if'?: Linter.RuleEntry<[]>
  /**
   * Collection size and array length comparisons should make sense
   * @see https://sonarsource.github.io/rspec/#/rspec/S3981/javascript
   */
  'sonar/no-collection-size-mischeck'?: Linter.RuleEntry<[]>
  /**
   * Sections of code should not be commented out
   * @see https://sonarsource.github.io/rspec/#/rspec/S125/javascript
   */
  'sonar/no-commented-code'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not contain control characters
   * @see https://sonarsource.github.io/rspec/#/rspec/S6324/javascript
   */
  'sonar/no-control-regex'?: Linter.RuleEntry<[]>
  /**
   * Unused assignments should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1854/javascript
   */
  'sonar/no-dead-store'?: Linter.RuleEntry<[]>
  /**
   * "delete" should be used only with object properties
   * @see https://sonarsource.github.io/rspec/#/rspec/S3001/javascript
   */
  'sonar/no-delete-var'?: Linter.RuleEntry<[]>
  /**
   * Union and intersection types should not include duplicated constituents
   * @see https://sonarsource.github.io/rspec/#/rspec/S4621/javascript
   */
  'sonar/no-duplicate-in-composite'?: Linter.RuleEntry<[]>
  /**
   * String literals should not be duplicated
   * @see https://sonarsource.github.io/rspec/#/rspec/S1192/javascript
   */
  'sonar/no-duplicate-string'?: Linter.RuleEntry<SonarNoDuplicateString>
  /**
   * Two branches in a conditional structure should not have exactly the same implementation
   * @see https://sonarsource.github.io/rspec/#/rspec/S1871/javascript
   */
  'sonar/no-duplicated-branches'?: Linter.RuleEntry<[]>
  /**
   * Collection elements should not be replaced unconditionally
   * @see https://sonarsource.github.io/rspec/#/rspec/S4143/javascript
   */
  'sonar/no-element-overwrite'?: Linter.RuleEntry<[]>
  /**
   * Reluctant quantifiers in regular expressions should be followed by an expression that can't match the empty string
   * @see https://sonarsource.github.io/rspec/#/rspec/S6019/javascript
   */
  'sonar/no-empty-after-reluctant'?: Linter.RuleEntry<[]>
  /**
   * Alternation in regular expressions should not contain empty alternatives
   * @see https://sonarsource.github.io/rspec/#/rspec/S6323/javascript
   */
  'sonar/no-empty-alternatives'?: Linter.RuleEntry<[]>
  /**
   * Empty character classes should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2639/javascript
   */
  'sonar/no-empty-character-class'?: Linter.RuleEntry<[]>
  /**
   * Empty collections should not be accessed or iterated
   * @see https://sonarsource.github.io/rspec/#/rspec/S4158/javascript
   */
  'sonar/no-empty-collection'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not contain empty groups
   * @see https://sonarsource.github.io/rspec/#/rspec/S6331/javascript
   */
  'sonar/no-empty-group'?: Linter.RuleEntry<[]>
  /**
   * Test files should contain at least one test case
   * @see https://sonarsource.github.io/rspec/#/rspec/S2187/javascript
   */
  'sonar/no-empty-test-file'?: Linter.RuleEntry<[]>
  /**
   * Equality operators should not be used in "for" loop termination conditions
   * @see https://sonarsource.github.io/rspec/#/rspec/S888/javascript
   */
  'sonar/no-equals-in-for-termination'?: Linter.RuleEntry<[]>
  /**
   * Exclusive tests should not be committed to version control
   * @see https://sonarsource.github.io/rspec/#/rspec/S6426/javascript
   */
  'sonar/no-exclusive-tests'?: Linter.RuleEntry<[]>
  /**
   * Function calls should not pass extra arguments
   * @see https://sonarsource.github.io/rspec/#/rspec/S930/javascript
   */
  'sonar/no-extra-arguments'?: Linter.RuleEntry<[]>
  /**
   * Switch cases should end with an unconditional "break" statement
   * @see https://sonarsource.github.io/rspec/#/rspec/S128/javascript
   */
  'sonar/no-fallthrough'?: Linter.RuleEntry<[]>
  /**
   * "for in" should not be used with iterables
   * @see https://sonarsource.github.io/rspec/#/rspec/S4139/javascript
   */
  'sonar/no-for-in-iterable'?: Linter.RuleEntry<[]>
  /**
   * Function declarations should not be made within blocks
   * @see https://sonarsource.github.io/rspec/#/rspec/S1530/javascript
   */
  'sonar/no-function-declaration-in-block'?: Linter.RuleEntry<[]>
  /**
   * The global "this" object should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2990/javascript
   */
  'sonar/no-global-this'?: Linter.RuleEntry<[]>
  /**
   * Special identifiers should not be bound or assigned
   * @see https://sonarsource.github.io/rspec/#/rspec/S2137/javascript
   */
  'sonar/no-globals-shadowing'?: Linter.RuleEntry<[]>
  /**
   * Boolean expressions should not be gratuitous
   * @see https://sonarsource.github.io/rspec/#/rspec/S2589/javascript
   */
  'sonar/no-gratuitous-expressions'?: Linter.RuleEntry<[]>
  /**
   * Using hardcoded IP addresses is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S1313/javascript
   */
  'sonar/no-hardcoded-ip'?: Linter.RuleEntry<[]>
  /**
   * Credentials should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S2068/javascript
   */
  'sonar/no-hardcoded-passwords'?: Linter.RuleEntry<SonarNoHardcodedPasswords>
  /**
   * Secrets should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S6418/javascript
   */
  'sonar/no-hardcoded-secrets'?: Linter.RuleEntry<SonarNoHardcodedSecrets>
  /**
   * React's useState hook should not be used directly in the render function or body of a component
   * @see https://sonarsource.github.io/rspec/#/rspec/S6442/javascript
   */
  'sonar/no-hook-setter-in-body'?: Linter.RuleEntry<[]>
  /**
   * "if/else if" chains and "switch" cases should not have the same condition
   * @see https://sonarsource.github.io/rspec/#/rspec/S1862/javascript
   */
  'sonar/no-identical-conditions'?: Linter.RuleEntry<[]>
  /**
   * Identical expressions should not be used on both sides of a binary operator
   * @see https://sonarsource.github.io/rspec/#/rspec/S1764/javascript
   */
  'sonar/no-identical-expressions'?: Linter.RuleEntry<[]>
  /**
   * Functions should not have identical implementations
   * @see https://sonarsource.github.io/rspec/#/rspec/S4144/javascript
   */
  'sonar/no-identical-functions'?: Linter.RuleEntry<SonarNoIdenticalFunctions>
  /**
   * Exceptions should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S2486/javascript
   */
  'sonar/no-ignored-exceptions'?: Linter.RuleEntry<[]>
  /**
   * Return values from functions without side effects should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S2201/javascript
   */
  'sonar/no-ignored-return'?: Linter.RuleEntry<[]>
  /**
   * Dependencies should be explicit
   * @see https://sonarsource.github.io/rspec/#/rspec/S4328/javascript
   */
  'sonar/no-implicit-dependencies'?: Linter.RuleEntry<SonarNoImplicitDependencies>
  /**
   * Variables should be declared explicitly
   * @see https://sonarsource.github.io/rspec/#/rspec/S2703/javascript
   */
  'sonar/no-implicit-global'?: Linter.RuleEntry<[]>
  /**
   * "in" should not be used on arrays
   * @see https://sonarsource.github.io/rspec/#/rspec/S4619/javascript
   */
  'sonar/no-in-misuse'?: Linter.RuleEntry<[]>
  /**
   * Assertions should be complete
   * @see https://sonarsource.github.io/rspec/#/rspec/S2970/javascript
   */
  'sonar/no-incomplete-assertions'?: Linter.RuleEntry<[]>
  /**
   * Functions should use "return" consistently
   * @see https://sonarsource.github.io/rspec/#/rspec/S3801/javascript
   */
  'sonar/no-inconsistent-returns'?: Linter.RuleEntry<[]>
  /**
   * Strings and non-strings should not be added
   * @see https://sonarsource.github.io/rspec/#/rspec/S3402/javascript
   */
  'sonar/no-incorrect-string-concat'?: Linter.RuleEntry<[]>
  /**
   * Users should not use internal APIs
   * @see https://sonarsource.github.io/rspec/#/rspec/S6627/javascript
   */
  'sonar/no-internal-api-use'?: Linter.RuleEntry<[]>
  /**
   * Using intrusive permissions is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5604/javascript
   */
  'sonar/no-intrusive-permissions'?: Linter.RuleEntry<SonarNoIntrusivePermissions>
  /**
   * Regular expressions should be syntactically valid
   * @see https://sonarsource.github.io/rspec/#/rspec/S5856/javascript
   */
  'sonar/no-invalid-regexp'?: Linter.RuleEntry<[]>
  /**
   * Function returns should not be invariant
   * @see https://sonarsource.github.io/rspec/#/rspec/S3516/javascript
   */
  'sonar/no-invariant-returns'?: Linter.RuleEntry<[]>
  /**
   * Boolean checks should not be inverted
   * @see https://sonarsource.github.io/rspec/#/rspec/S1940/javascript
   */
  'sonar/no-inverted-boolean-check'?: Linter.RuleEntry<[]>
  /**
   * Forwarding client IP address is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5759/javascript
   */
  'sonar/no-ip-forward'?: Linter.RuleEntry<[]>
  /**
   * Labels should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1119/javascript
   */
  'sonar/no-labels'?: Linter.RuleEntry<[]>
  /**
   * Literals should not be used as functions
   * @see https://sonarsource.github.io/rspec/#/rspec/S6958/javascript
   */
  'sonar/no-literal-call'?: Linter.RuleEntry<[]>
  /**
   * Allowing browsers to sniff MIME types is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5734/javascript
   */
  'sonar/no-mime-sniff'?: Linter.RuleEntry<[]>
  /**
   * Array-mutating methods should not be used misleadingly
   * @see https://sonarsource.github.io/rspec/#/rspec/S4043/javascript
   */
  'sonar/no-misleading-array-reverse'?: Linter.RuleEntry<[]>
  /**
   * Unicode Grapheme Clusters should be avoided inside regex character classes
   * @see https://sonarsource.github.io/rspec/#/rspec/S5868/javascript
   */
  'sonar/no-misleading-character-class'?: Linter.RuleEntry<[]>
  /**
   * Allowing mixed-content is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5730/javascript
   */
  'sonar/no-mixed-content'?: Linter.RuleEntry<[]>
  /**
   * Assignments should not be made from within sub-expressions
   * @see https://sonarsource.github.io/rspec/#/rspec/S1121/javascript
   */
  'sonar/no-nested-assignment'?: Linter.RuleEntry<[]>
  /**
   * Ternary operators should not be nested
   * @see https://sonarsource.github.io/rspec/#/rspec/S3358/javascript
   */
  'sonar/no-nested-conditional'?: Linter.RuleEntry<[]>
  /**
   * Functions should not be nested too deeply
   * @see https://sonarsource.github.io/rspec/#/rspec/S2004/javascript
   */
  'sonar/no-nested-functions'?: Linter.RuleEntry<SonarNoNestedFunctions>
  /**
   * Increment (++) and decrement (--) operators should not be used in a method call or mixed with other operators in an expression
   * @see https://sonarsource.github.io/rspec/#/rspec/S881/javascript
   */
  'sonar/no-nested-incdec'?: Linter.RuleEntry<[]>
  /**
   * "switch" statements should not be nested
   * @see https://sonarsource.github.io/rspec/#/rspec/S1821/javascript
   */
  'sonar/no-nested-switch'?: Linter.RuleEntry<[]>
  /**
   * Template literals should not be nested
   * @see https://sonarsource.github.io/rspec/#/rspec/S4624/javascript
   */
  'sonar/no-nested-template-literals'?: Linter.RuleEntry<[]>
  /**
   * Searching OS commands in PATH is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4036/javascript
   */
  'sonar/no-os-command-from-path'?: Linter.RuleEntry<[]>
  /**
   * Initial values of parameters, caught exceptions, and loop variables should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S1226/javascript
   */
  'sonar/no-parameter-reassignment'?: Linter.RuleEntry<[]>
  /**
   * Wrapper objects should not be used for primitive types
   * @see https://sonarsource.github.io/rspec/#/rspec/S1533/javascript
   */
  'sonar/no-primitive-wrappers'?: Linter.RuleEntry<[]>
  /**
   * Assignments should not be redundant
   * @see https://sonarsource.github.io/rspec/#/rspec/S4165/javascript
   */
  'sonar/no-redundant-assignments'?: Linter.RuleEntry<[]>
  /**
   * Boolean literals should not be used in comparisons
   * @see https://sonarsource.github.io/rspec/#/rspec/S1125/javascript
   */
  'sonar/no-redundant-boolean'?: Linter.RuleEntry<[]>
  /**
   * Jump statements should not be redundant
   * @see https://sonarsource.github.io/rspec/#/rspec/S3626/javascript
   */
  'sonar/no-redundant-jump'?: Linter.RuleEntry<[]>
  /**
   * Optional property declarations should not use both '?' and 'undefined' syntax
   * @see https://sonarsource.github.io/rspec/#/rspec/S4782/javascript
   */
  'sonar/no-redundant-optional'?: Linter.RuleEntry<[]>
  /**
   * Redundant pairs of parentheses should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1110/javascript
   * @deprecated
   */
  'sonar/no-redundant-parentheses'?: Linter.RuleEntry<[]>
  /**
   * Variables should be defined before being used
   * @see https://sonarsource.github.io/rspec/#/rspec/S3827/javascript
   */
  'sonar/no-reference-error'?: Linter.RuleEntry<[]>
  /**
   * Disabling strict HTTP no-referrer policy is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5736/javascript
   */
  'sonar/no-referrer-policy'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not contain multiple spaces
   * @see https://sonarsource.github.io/rspec/#/rspec/S6326/javascript
   */
  'sonar/no-regex-spaces'?: Linter.RuleEntry<[]>
  /**
   * "import" should be used to include external code
   * @see https://sonarsource.github.io/rspec/#/rspec/S3533/javascript
   */
  'sonar/no-require-or-define'?: Linter.RuleEntry<[]>
  /**
   * Primitive return types should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4324/javascript
   */
  'sonar/no-return-type-any'?: Linter.RuleEntry<[]>
  /**
   * Assertions should not be given twice the same argument
   * @see https://sonarsource.github.io/rspec/#/rspec/S5863/javascript
   */
  'sonar/no-same-argument-assert'?: Linter.RuleEntry<[]>
  /**
   * Conditionals should start on new lines
   * @see https://sonarsource.github.io/rspec/#/rspec/S3972/javascript
   */
  'sonar/no-same-line-conditional'?: Linter.RuleEntry<[]>
  /**
   * Methods should not contain selector parameters
   * @see https://sonarsource.github.io/rspec/#/rspec/S2301/javascript
   */
  'sonar/no-selector-parameter'?: Linter.RuleEntry<[]>
  /**
   * Static Assets should not serve session cookies
   * @see https://sonarsource.github.io/rspec/#/rspec/S8441/javascript
   */
  'sonar/no-session-cookies-on-static-assets'?: Linter.RuleEntry<[]>
  /**
   * Tests should not be skipped without providing a reason
   * @see https://sonarsource.github.io/rspec/#/rspec/S1607/javascript
   */
  'sonar/no-skipped-tests'?: Linter.RuleEntry<[]>
  /**
   * "if" statements should be preferred over "switch" when simpler
   * @see https://sonarsource.github.io/rspec/#/rspec/S1301/javascript
   */
  'sonar/no-small-switch'?: Linter.RuleEntry<[]>
  /**
   * Track uses of "NOSONAR" comments
   * @see https://sonarsource.github.io/rspec/#/rspec/S1291/javascript
   */
  'sonar/no-sonar-comments'?: Linter.RuleEntry<[]>
  /**
   * Tabulation characters should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S105/javascript
   * @deprecated
   */
  'sonar/no-tab'?: Linter.RuleEntry<[]>
  /**
   * HTML "<table>" should not be used for layout purposes
   * @see https://sonarsource.github.io/rspec/#/rspec/S5257/javascript
   */
  'sonar/no-table-as-layout'?: Linter.RuleEntry<[]>
  /**
   * Promise rejections should not be caught by "try" blocks
   * @see https://sonarsource.github.io/rspec/#/rspec/S4822/javascript
   */
  'sonar/no-try-promise'?: Linter.RuleEntry<[]>
  /**
   * "undefined" should not be passed as the value of optional parameters
   * @see https://sonarsource.github.io/rspec/#/rspec/S4623/javascript
   */
  'sonar/no-undefined-argument'?: Linter.RuleEntry<[]>
  /**
   * "undefined" should not be assigned
   * @see https://sonarsource.github.io/rspec/#/rspec/S2138/javascript
   */
  'sonar/no-undefined-assignment'?: Linter.RuleEntry<[]>
  /**
   * Multiline blocks should be enclosed in curly braces
   * @see https://sonarsource.github.io/rspec/#/rspec/S2681/javascript
   */
  'sonar/no-unenclosed-multiline-block'?: Linter.RuleEntry<[]>
  /**
   * JSX list components keys should match up between renders
   * @see https://sonarsource.github.io/rspec/#/rspec/S6486/javascript
   */
  'sonar/no-uniq-key'?: Linter.RuleEntry<[]>
  /**
   * Expanding archive files without controlling resource consumption is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5042/javascript
   */
  'sonar/no-unsafe-unzip'?: Linter.RuleEntry<[]>
  /**
   * Errors should not be created without being thrown
   * @see https://sonarsource.github.io/rspec/#/rspec/S3984/javascript
   */
  'sonar/no-unthrown-error'?: Linter.RuleEntry<[]>
  /**
   * Collection contents should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4030/javascript
   */
  'sonar/no-unused-collection'?: Linter.RuleEntry<[]>
  /**
   * Unused function parameters should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1172/javascript
   */
  'sonar/no-unused-function-argument'?: Linter.RuleEntry<[]>
  /**
   * Unused local variables and functions should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1481/javascript
   */
  'sonar/no-unused-vars'?: Linter.RuleEntry<[]>
  /**
   * The return value of void functions should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S3699/javascript
   */
  'sonar/no-use-of-empty-return-value'?: Linter.RuleEntry<[]>
  /**
   * "catch" clauses should do more than rethrow
   * @see https://sonarsource.github.io/rspec/#/rspec/S2737/javascript
   */
  'sonar/no-useless-catch'?: Linter.RuleEntry<[]>
  /**
   * Values should not be uselessly incremented
   * @see https://sonarsource.github.io/rspec/#/rspec/S2123/javascript
   */
  'sonar/no-useless-increment'?: Linter.RuleEntry<[]>
  /**
   * Type intersections should use meaningful types
   * @see https://sonarsource.github.io/rspec/#/rspec/S4335/javascript
   */
  'sonar/no-useless-intersection'?: Linter.RuleEntry<[]>
  /**
   * React state setter function should not be called with its matching state variable
   * @see https://sonarsource.github.io/rspec/#/rspec/S6443/javascript
   */
  'sonar/no-useless-react-setstate'?: Linter.RuleEntry<[]>
  /**
   * Variables declared with "var" should be declared before they are used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1526/javascript
   */
  'sonar/no-variable-usage-before-declaration'?: Linter.RuleEntry<[]>
  /**
   * Disabling Vue.js built-in escaping is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S6299/javascript
   * @deprecated
   */
  'sonar/no-vue-bypass-sanitization'?: Linter.RuleEntry<[]>
  /**
   * Cipher algorithms should be robust
   * @see https://sonarsource.github.io/rspec/#/rspec/S5547/javascript
   */
  'sonar/no-weak-cipher'?: Linter.RuleEntry<[]>
  /**
   * Cryptographic keys should be robust
   * @see https://sonarsource.github.io/rspec/#/rspec/S4426/javascript
   */
  'sonar/no-weak-keys'?: Linter.RuleEntry<[]>
  /**
   * Wildcard imports should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2208/javascript
   */
  'sonar/no-wildcard-import'?: Linter.RuleEntry<[]>
  /**
   * Non-existent operators '=+', '=-' and '=!' should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2757/javascript
   */
  'sonar/non-existent-operator'?: Linter.RuleEntry<[]>
  /**
   * Arithmetic operators should only have numbers as operands
   * @see https://sonarsource.github.io/rspec/#/rspec/S3760/javascript
   */
  'sonar/non-number-in-arithmetic-expression'?: Linter.RuleEntry<[]>
  /**
   * Properties of variables with "null" or "undefined" values should not be accessed
   * @see https://sonarsource.github.io/rspec/#/rspec/S2259/javascript
   */
  'sonar/null-dereference'?: Linter.RuleEntry<[]>
  /**
   * "<object>" tags should provide an alternative content
   * @see https://sonarsource.github.io/rspec/#/rspec/S5264/javascript
   */
  'sonar/object-alt-content'?: Linter.RuleEntry<[]>
  /**
   * Arithmetic operations should not result in "NaN"
   * @see https://sonarsource.github.io/rspec/#/rspec/S3757/javascript
   */
  'sonar/operation-returning-nan'?: Linter.RuleEntry<[]>
  /**
   * Using shell interpreter when executing OS commands is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4721/javascript
   */
  'sonar/os-command'?: Linter.RuleEntry<[]>
  /**
   * Origins should be verified during cross-origin communications
   * @see https://sonarsource.github.io/rspec/#/rspec/S2819/javascript
   */
  'sonar/post-message'?: Linter.RuleEntry<[]>
  /**
   * "default" clauses should be last
   * @see https://sonarsource.github.io/rspec/#/rspec/S4524/javascript
   */
  'sonar/prefer-default-last'?: Linter.RuleEntry<[]>
  /**
   * Local variables should not be declared and then immediately returned or thrown
   * @see https://sonarsource.github.io/rspec/#/rspec/S1488/javascript
   */
  'sonar/prefer-immediate-return'?: Linter.RuleEntry<[]>
  /**
   * Object literal syntax should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2428/javascript
   */
  'sonar/prefer-object-literal'?: Linter.RuleEntry<[]>
  /**
   * Shorthand promises should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4634/javascript
   */
  'sonar/prefer-promise-shorthand'?: Linter.RuleEntry<[]>
  /**
   * React props should be read-only
   * @see https://sonarsource.github.io/rspec/#/rspec/S6759/javascript
   */
  'sonar/prefer-read-only-props'?: Linter.RuleEntry<[]>
  /**
   * "RegExp.exec()" should be preferred over "String.match()"
   * @see https://sonarsource.github.io/rspec/#/rspec/S6594/javascript
   */
  'sonar/prefer-regexp-exec'?: Linter.RuleEntry<[]>
  /**
   * Return of boolean expressions should not be wrapped into an "if-then-else" statement
   * @see https://sonarsource.github.io/rspec/#/rspec/S1126/javascript
   */
  'sonar/prefer-single-boolean-return'?: Linter.RuleEntry<[]>
  /**
   * Type predicates should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4322/javascript
   */
  'sonar/prefer-type-guard'?: Linter.RuleEntry<[]>
  /**
   * A "while" loop should be used instead of a "for" loop
   * @see https://sonarsource.github.io/rspec/#/rspec/S1264/javascript
   */
  'sonar/prefer-while'?: Linter.RuleEntry<[]>
  /**
   * Using command line arguments is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4823/javascript
   * @deprecated
   */
  'sonar/process-argv'?: Linter.RuleEntry<[]>
  /**
   * Delivering code in production with debug features activated is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4507/javascript
   */
  'sonar/production-debug'?: Linter.RuleEntry<[]>
  /**
   * Using pseudorandom number generators (PRNGs) is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S2245/javascript
   */
  'sonar/pseudo-random'?: Linter.RuleEntry<[]>
  /**
   * Public "static" fields should be read-only
   * @see https://sonarsource.github.io/rspec/#/rspec/S1444/javascript
   */
  'sonar/public-static-readonly'?: Linter.RuleEntry<[]>
  /**
   * Using publicly writable directories is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5443/javascript
   */
  'sonar/publicly-writable-directories'?: Linter.RuleEntry<[]>
  /**
   * "Array.reduce()" calls should include an initial value
   * @see https://sonarsource.github.io/rspec/#/rspec/S6959/javascript
   */
  'sonar/reduce-initial-value'?: Linter.RuleEntry<[]>
  /**
   * Redundant type aliases should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S6564/javascript
   */
  'sonar/redundant-type-aliases'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not be too complicated
   * @see https://sonarsource.github.io/rspec/#/rspec/S5843/javascript
   */
  'sonar/regex-complexity'?: Linter.RuleEntry<SonarRegexComplexity>
  /**
   * Using regular expressions is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4784/javascript
   * @deprecated
   */
  'sonar/regular-expr'?: Linter.RuleEntry<[]>
  /**
   * Wallet phrases should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S7639/javascript
   */
  'sonar/review-blockchain-mnemonic'?: Linter.RuleEntry<[]>
  /**
   * A new session should be created during user authentication
   * @see https://sonarsource.github.io/rspec/#/rspec/S5876/javascript
   */
  'sonar/session-regeneration'?: Linter.RuleEntry<[]>
  /**
   * Shorthand object properties should be grouped at the beginning or end of an object declaration
   * @see https://sonarsource.github.io/rspec/#/rspec/S3499/javascript
   */
  'sonar/shorthand-property-grouping'?: Linter.RuleEntry<[]>
  /**
   * Character classes in regular expressions should not contain only one character
   * @see https://sonarsource.github.io/rspec/#/rspec/S6397/javascript
   */
  'sonar/single-char-in-character-classes'?: Linter.RuleEntry<[]>
  /**
   * Single-character alternations in regular expressions should be replaced with character classes
   * @see https://sonarsource.github.io/rspec/#/rspec/S6035/javascript
   */
  'sonar/single-character-alternation'?: Linter.RuleEntry<[]>
  /**
   * Using slow regular expressions is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5852/javascript
   */
  'sonar/slow-regex'?: Linter.RuleEntry<[]>
  /**
   * Using Sockets is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4818/javascript
   * @deprecated
   */
  'sonar/sockets'?: Linter.RuleEntry<[]>
  /**
   * Formatting SQL queries is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S2077/javascript
   */
  'sonar/sql-queries'?: Linter.RuleEntry<[]>
  /**
   * Tests should be stable
   * @see https://sonarsource.github.io/rspec/#/rspec/S5973/javascript
   */
  'sonar/stable-tests'?: Linter.RuleEntry<[]>
  /**
   * Reading the Standard Input is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4829/javascript
   * @deprecated
   */
  'sonar/standard-input'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions with the global flag should be used with caution
   * @see https://sonarsource.github.io/rspec/#/rspec/S6351/javascript
   */
  'sonar/stateful-regex'?: Linter.RuleEntry<[]>
  /**
   * Disabling Strict-Transport-Security policy is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5739/javascript
   */
  'sonar/strict-transport-security'?: Linter.RuleEntry<[]>
  /**
   * Comparison operators should not be used with strings
   * @see https://sonarsource.github.io/rspec/#/rspec/S3003/javascript
   */
  'sonar/strings-comparison'?: Linter.RuleEntry<[]>
  /**
   * Tables should have headers
   * @see https://sonarsource.github.io/rspec/#/rspec/S5256/javascript
   */
  'sonar/table-header'?: Linter.RuleEntry<[]>
  /**
   * Table cells should reference their headers
   * @see https://sonarsource.github.io/rspec/#/rspec/S5260/javascript
   */
  'sonar/table-header-reference'?: Linter.RuleEntry<[]>
  /**
   * Tests should check which exception is thrown
   * @see https://sonarsource.github.io/rspec/#/rspec/S5958/javascript
   */
  'sonar/test-check-exception'?: Linter.RuleEntry<[]>
  /**
   * Track uses of "TODO" tags
   * @see https://sonarsource.github.io/rspec/#/rspec/S1135/javascript
   */
  'sonar/todo-tag'?: Linter.RuleEntry<[]>
  /**
   * Loops should not contain more than a single "break" or "continue" statement
   * @see https://sonarsource.github.io/rspec/#/rspec/S135/javascript
   */
  'sonar/too-many-break-or-continue-in-loop'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions using Unicode character classes or property escapes should enable the unicode flag
   * @see https://sonarsource.github.io/rspec/#/rspec/S5867/javascript
   */
  'sonar/unicode-aware-regex'?: Linter.RuleEntry<[]>
  /**
   * Unnecessary imports should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1128/javascript
   */
  'sonar/unused-import'?: Linter.RuleEntry<[]>
  /**
   * Names of regular expressions named groups should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S5860/javascript
   */
  'sonar/unused-named-groups'?: Linter.RuleEntry<[]>
  /**
   * Server certificates should be verified during SSL/TLS connections
   * @see https://sonarsource.github.io/rspec/#/rspec/S4830/javascript
   */
  'sonar/unverified-certificate'?: Linter.RuleEntry<[]>
  /**
   * Server hostnames should be verified during SSL/TLS connections
   * @see https://sonarsource.github.io/rspec/#/rspec/S5527/javascript
   */
  'sonar/unverified-hostname'?: Linter.RuleEntry<[]>
  /**
   * "const" variables should not be reassigned
   * @see https://sonarsource.github.io/rspec/#/rspec/S3500/javascript
   */
  'sonar/updated-const-var'?: Linter.RuleEntry<[]>
  /**
   * Loop counters should not be assigned within the loop body
   * @see https://sonarsource.github.io/rspec/#/rspec/S2310/javascript
   */
  'sonar/updated-loop-counter'?: Linter.RuleEntry<[]>
  /**
   * Type aliases should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4323/javascript
   */
  'sonar/use-type-alias'?: Linter.RuleEntry<[]>
  /**
   * Results of operations on strings should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S1154/javascript
   * @deprecated
   */
  'sonar/useless-string-operation'?: Linter.RuleEntry<[]>
  /**
   * Values not convertible to numbers should not be used in numeric comparisons
   * @see https://sonarsource.github.io/rspec/#/rspec/S3758/javascript
   */
  'sonar/values-not-convertible-to-numbers'?: Linter.RuleEntry<[]>
  /**
   * Variable, property and parameter names should comply with a naming convention
   * @see https://sonarsource.github.io/rspec/#/rspec/S117/javascript
   */
  'sonar/variable-name'?: Linter.RuleEntry<SonarVariableName>
  /**
   * "void" should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S3735/javascript
   */
  'sonar/void-use'?: Linter.RuleEntry<[]>
  /**
   * Weak SSL/TLS protocols should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4423/javascript
   */
  'sonar/weak-ssl'?: Linter.RuleEntry<[]>
  /**
   * Web SQL databases should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2817/javascript
   * @deprecated
   */
  'sonar/web-sql-database'?: Linter.RuleEntry<[]>
  /**
   * Disclosing fingerprints from web application technologies is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S5689/javascript
   */
  'sonar/x-powered-by'?: Linter.RuleEntry<[]>
  /**
   * XML parsers should not be vulnerable to XXE attacks
   * @see https://sonarsource.github.io/rspec/#/rspec/S2755/javascript
   */
  'sonar/xml-parser-xxe'?: Linter.RuleEntry<[]>
  /**
   * Executing XPath expressions is security-sensitive
   * @see https://sonarsource.github.io/rspec/#/rspec/S4817/javascript
   * @deprecated
   */
  'sonar/xpath'?: Linter.RuleEntry<[]>
  /**
   * Enforce sorted `import` declarations within modules
   * @see https://eslint.org/docs/latest/rules/sort-imports
   */
  'sort-imports'?: Linter.RuleEntry<SortImports>
  /**
   * Require object keys to be sorted
   * @see https://eslint.org/docs/latest/rules/sort-keys
   */
  'sort-keys'?: Linter.RuleEntry<SortKeys>
  /**
   * Require variables within the same declaration block to be sorted
   * @see https://eslint.org/docs/latest/rules/sort-vars
   */
  'sort-vars'?: Linter.RuleEntry<SortVars>
  /**
   * Enforce consistent spacing before blocks
   * @see https://eslint.org/docs/latest/rules/space-before-blocks
   * @deprecated
   */
  'space-before-blocks'?: Linter.RuleEntry<SpaceBeforeBlocks>
  /**
   * Enforce consistent spacing before `function` definition opening parenthesis
   * @see https://eslint.org/docs/latest/rules/space-before-function-paren
   * @deprecated
   */
  'space-before-function-paren'?: Linter.RuleEntry<SpaceBeforeFunctionParen>
  /**
   * Enforce consistent spacing inside parentheses
   * @see https://eslint.org/docs/latest/rules/space-in-parens
   * @deprecated
   */
  'space-in-parens'?: Linter.RuleEntry<SpaceInParens>
  /**
   * Require spacing around infix operators
   * @see https://eslint.org/docs/latest/rules/space-infix-ops
   * @deprecated
   */
  'space-infix-ops'?: Linter.RuleEntry<SpaceInfixOps>
  /**
   * Enforce consistent spacing before or after unary operators
   * @see https://eslint.org/docs/latest/rules/space-unary-ops
   * @deprecated
   */
  'space-unary-ops'?: Linter.RuleEntry<SpaceUnaryOps>
  /**
   * Enforce consistent spacing after the `//` or `/*` in a comment
   * @see https://eslint.org/docs/latest/rules/spaced-comment
   * @deprecated
   */
  'spaced-comment'?: Linter.RuleEntry<SpacedComment>
  /**
   * Interactions should be awaited
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/await-interactions.md
   */
  'storybook/await-interactions'?: Linter.RuleEntry<[]>
  /**
   * Pass a context when invoking play function of another story
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/context-in-play-function.md
   */
  'storybook/context-in-play-function'?: Linter.RuleEntry<[]>
  /**
   * The component property should be set
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/csf-component.md
   */
  'storybook/csf-component'?: Linter.RuleEntry<[]>
  /**
   * Story files should have a default export
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/default-exports.md
   */
  'storybook/default-exports'?: Linter.RuleEntry<[]>
  /**
   * Deprecated hierarchy separator in title property
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/hierarchy-separator.md
   */
  'storybook/hierarchy-separator'?: Linter.RuleEntry<[]>
  /**
   * Meta should only have inline properties
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/meta-inline-properties.md
   */
  'storybook/meta-inline-properties'?: Linter.RuleEntry<StorybookMetaInlineProperties>
  /**
   * Meta should use `satisfies Meta`
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/meta-satisfies-type.md
   */
  'storybook/meta-satisfies-type'?: Linter.RuleEntry<[]>
  /**
   * A story should not have a redundant name property
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-redundant-story-name.md
   */
  'storybook/no-redundant-story-name'?: Linter.RuleEntry<[]>
  /**
   * Do not import renderer packages directly in stories
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-renderer-packages.md
   */
  'storybook/no-renderer-packages'?: Linter.RuleEntry<[]>
  /**
   * storiesOf is deprecated and should not be used
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-stories-of.md
   */
  'storybook/no-stories-of'?: Linter.RuleEntry<[]>
  /**
   * Do not define a title in meta
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-title-property-in-meta.md
   */
  'storybook/no-title-property-in-meta'?: Linter.RuleEntry<[]>
  /**
   * This rule identifies storybook addons that are invalid because they are either not installed or contain a typo in their name.
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-uninstalled-addons.md
   */
  'storybook/no-uninstalled-addons'?: Linter.RuleEntry<StorybookNoUninstalledAddons>
  /**
   * Stories should use PascalCase
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/prefer-pascal-case.md
   */
  'storybook/prefer-pascal-case'?: Linter.RuleEntry<[]>
  /**
   * A story file must contain at least one story export
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/story-exports.md
   */
  'storybook/story-exports'?: Linter.RuleEntry<[]>
  /**
   * Use expect from `@storybook/test`, `storybook/test` or `@storybook/jest`
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/use-storybook-expect.md
   */
  'storybook/use-storybook-expect'?: Linter.RuleEntry<[]>
  /**
   * Do not use testing-library directly on stories
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/use-storybook-testing-library.md
   */
  'storybook/use-storybook-testing-library'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow strict mode directives
   * @see https://eslint.org/docs/latest/rules/strict
   */
  'strict'?: Linter.RuleEntry<Strict>
  /**
   * Enforce linebreaks after opening and before closing array brackets
   * @see https://eslint.style/rules/array-bracket-newline
   */
  'stylistic/array-bracket-newline'?: Linter.RuleEntry<StylisticArrayBracketNewline>
  /**
   * Enforce consistent spacing inside array brackets
   * @see https://eslint.style/rules/array-bracket-spacing
   */
  'stylistic/array-bracket-spacing'?: Linter.RuleEntry<StylisticArrayBracketSpacing>
  /**
   * Enforce line breaks after each array element
   * @see https://eslint.style/rules/array-element-newline
   */
  'stylistic/array-element-newline'?: Linter.RuleEntry<StylisticArrayElementNewline>
  /**
   * Require parentheses around arrow function arguments
   * @see https://eslint.style/rules/arrow-parens
   */
  'stylistic/arrow-parens'?: Linter.RuleEntry<StylisticArrowParens>
  /**
   * Enforce consistent spacing before and after the arrow in arrow functions
   * @see https://eslint.style/rules/arrow-spacing
   */
  'stylistic/arrow-spacing'?: Linter.RuleEntry<StylisticArrowSpacing>
  /**
   * Disallow or enforce spaces inside of blocks after opening block and before closing block
   * @see https://eslint.style/rules/block-spacing
   */
  'stylistic/block-spacing'?: Linter.RuleEntry<StylisticBlockSpacing>
  /**
   * Enforce consistent brace style for blocks
   * @see https://eslint.style/rules/brace-style
   */
  'stylistic/brace-style'?: Linter.RuleEntry<StylisticBraceStyle>
  /**
   * Require or disallow trailing commas
   * @see https://eslint.style/rules/comma-dangle
   */
  'stylistic/comma-dangle'?: Linter.RuleEntry<StylisticCommaDangle>
  /**
   * Enforce consistent spacing before and after commas
   * @see https://eslint.style/rules/comma-spacing
   */
  'stylistic/comma-spacing'?: Linter.RuleEntry<StylisticCommaSpacing>
  /**
   * Enforce consistent comma style
   * @see https://eslint.style/rules/comma-style
   */
  'stylistic/comma-style'?: Linter.RuleEntry<StylisticCommaStyle>
  /**
   * Enforce consistent spacing inside computed property brackets
   * @see https://eslint.style/rules/computed-property-spacing
   */
  'stylistic/computed-property-spacing'?: Linter.RuleEntry<StylisticComputedPropertySpacing>
  /**
   * Enforce consistent line breaks after opening and before closing braces
   * @see https://eslint.style/rules/curly-newline
   */
  'stylistic/curly-newline'?: Linter.RuleEntry<StylisticCurlyNewline>
  /**
   * Enforce consistent newlines before and after dots
   * @see https://eslint.style/rules/dot-location
   */
  'stylistic/dot-location'?: Linter.RuleEntry<StylisticDotLocation>
  /**
   * Require or disallow newline at the end of files
   * @see https://eslint.style/rules/eol-last
   */
  'stylistic/eol-last'?: Linter.RuleEntry<StylisticEolLast>
  /**
   * Enforce consistent line break styles for JSX props
   * @see https://eslint.style/rules/jsx-props-style
   */
  'stylistic/exp-jsx-props-style'?: Linter.RuleEntry<StylisticExpJsxPropsStyle>
  /**
   * Enforce consistent spacing and line break styles inside brackets.
   * @see https://eslint.style/rules/list-style
   */
  'stylistic/exp-list-style'?: Linter.RuleEntry<StylisticExpListStyle>
  /**
   * Enforce line breaks between arguments of a function call
   * @see https://eslint.style/rules/function-call-argument-newline
   */
  'stylistic/function-call-argument-newline'?: Linter.RuleEntry<StylisticFunctionCallArgumentNewline>
  /**
   * Require or disallow spacing between function identifiers and their invocations
   * @see https://eslint.style/rules/function-call-spacing
   */
  'stylistic/function-call-spacing'?: Linter.RuleEntry<StylisticFunctionCallSpacing>
  /**
   * Enforce consistent line breaks inside function parentheses
   * @see https://eslint.style/rules/function-paren-newline
   */
  'stylistic/function-paren-newline'?: Linter.RuleEntry<StylisticFunctionParenNewline>
  /**
   * Enforce consistent spacing around `*` operators in generator functions
   * @see https://eslint.style/rules/generator-star-spacing
   */
  'stylistic/generator-star-spacing'?: Linter.RuleEntry<StylisticGeneratorStarSpacing>
  /**
   * Enforce the location of arrow function bodies
   * @see https://eslint.style/rules/implicit-arrow-linebreak
   */
  'stylistic/implicit-arrow-linebreak'?: Linter.RuleEntry<StylisticImplicitArrowLinebreak>
  /**
   * Enforce consistent indentation
   * @see https://eslint.style/rules/indent
   */
  'stylistic/indent'?: Linter.RuleEntry<StylisticIndent>
  /**
   * Indentation for binary operators
   * @see https://eslint.style/rules/indent-binary-ops
   */
  'stylistic/indent-binary-ops'?: Linter.RuleEntry<StylisticIndentBinaryOps>
  /**
   * Enforce or disallow spaces inside of curly braces in JSX attributes and expressions
   * @see https://eslint.style/rules/jsx-child-element-spacing
   */
  'stylistic/jsx-child-element-spacing'?: Linter.RuleEntry<[]>
  /**
   * Enforce closing bracket location in JSX
   * @see https://eslint.style/rules/jsx-closing-bracket-location
   */
  'stylistic/jsx-closing-bracket-location'?: Linter.RuleEntry<StylisticJsxClosingBracketLocation>
  /**
   * Enforce closing tag location for multiline JSX
   * @see https://eslint.style/rules/jsx-closing-tag-location
   */
  'stylistic/jsx-closing-tag-location'?: Linter.RuleEntry<StylisticJsxClosingTagLocation>
  /**
   * Disallow unnecessary JSX expressions when literals alone are sufficient or enforce JSX expressions on literals in JSX children or attributes
   * @see https://eslint.style/rules/jsx-curly-brace-presence
   */
  'stylistic/jsx-curly-brace-presence'?: Linter.RuleEntry<StylisticJsxCurlyBracePresence>
  /**
   * Enforce consistent linebreaks in curly braces in JSX attributes and expressions
   * @see https://eslint.style/rules/jsx-curly-newline
   */
  'stylistic/jsx-curly-newline'?: Linter.RuleEntry<StylisticJsxCurlyNewline>
  /**
   * Enforce or disallow spaces inside of curly braces in JSX attributes and expressions
   * @see https://eslint.style/rules/jsx-curly-spacing
   */
  'stylistic/jsx-curly-spacing'?: Linter.RuleEntry<StylisticJsxCurlySpacing>
  /**
   * Enforce or disallow spaces around equal signs in JSX attributes
   * @see https://eslint.style/rules/jsx-equals-spacing
   */
  'stylistic/jsx-equals-spacing'?: Linter.RuleEntry<StylisticJsxEqualsSpacing>
  /**
   * Enforce proper position of the first property in JSX
   * @see https://eslint.style/rules/jsx-first-prop-new-line
   */
  'stylistic/jsx-first-prop-new-line'?: Linter.RuleEntry<StylisticJsxFirstPropNewLine>
  /**
   * Enforce line breaks before and after JSX elements when they are used as arguments to a function.
   * @see https://eslint.style/rules/jsx-function-call-newline
   */
  'stylistic/jsx-function-call-newline'?: Linter.RuleEntry<StylisticJsxFunctionCallNewline>
  /**
   * Enforce JSX indentation. Deprecated, use `indent` rule instead.
   * @see https://eslint.style/rules/jsx-indent
   * @deprecated
   */
  'stylistic/jsx-indent'?: Linter.RuleEntry<StylisticJsxIndent>
  /**
   * Enforce props indentation in JSX
   * @see https://eslint.style/rules/jsx-indent-props
   */
  'stylistic/jsx-indent-props'?: Linter.RuleEntry<StylisticJsxIndentProps>
  /**
   * Enforce maximum of props on a single line in JSX
   * @see https://eslint.style/rules/jsx-max-props-per-line
   */
  'stylistic/jsx-max-props-per-line'?: Linter.RuleEntry<StylisticJsxMaxPropsPerLine>
  /**
   * Require or prevent a new line after jsx elements and expressions.
   * @see https://eslint.style/rules/jsx-newline
   */
  'stylistic/jsx-newline'?: Linter.RuleEntry<StylisticJsxNewline>
  /**
   * Require one JSX element per line
   * @see https://eslint.style/rules/jsx-one-expression-per-line
   */
  'stylistic/jsx-one-expression-per-line'?: Linter.RuleEntry<StylisticJsxOneExpressionPerLine>
  /**
   * Enforce PascalCase for user-defined JSX components
   * @see https://eslint.style/rules/jsx-pascal-case
   */
  'stylistic/jsx-pascal-case'?: Linter.RuleEntry<StylisticJsxPascalCase>
  /**
   * Disallow multiple spaces between inline JSX props. Deprecated, use `no-multi-spaces` rule instead.
   * @see https://eslint.style/rules/jsx-props-no-multi-spaces
   * @deprecated
   */
  'stylistic/jsx-props-no-multi-spaces'?: Linter.RuleEntry<[]>
  /**
   * Enforce the consistent use of either double or single quotes in JSX attributes
   * @see https://eslint.style/rules/jsx-quotes
   */
  'stylistic/jsx-quotes'?: Linter.RuleEntry<StylisticJsxQuotes>
  /**
   * Disallow extra closing tags for components without children
   * @see https://eslint.style/rules/jsx-self-closing-comp
   */
  'stylistic/jsx-self-closing-comp'?: Linter.RuleEntry<StylisticJsxSelfClosingComp>
  /**
   * Enforce props alphabetical sorting
   * @see https://eslint.style/rules/jsx-sort-props
   * @deprecated
   */
  'stylistic/jsx-sort-props'?: Linter.RuleEntry<StylisticJsxSortProps>
  /**
   * Enforce whitespace in and around the JSX opening and closing brackets
   * @see https://eslint.style/rules/jsx-tag-spacing
   */
  'stylistic/jsx-tag-spacing'?: Linter.RuleEntry<StylisticJsxTagSpacing>
  /**
   * Disallow missing parentheses around multiline JSX
   * @see https://eslint.style/rules/jsx-wrap-multilines
   */
  'stylistic/jsx-wrap-multilines'?: Linter.RuleEntry<StylisticJsxWrapMultilines>
  /**
   * Enforce consistent spacing between property names and type annotations in types and interfaces
   * @see https://eslint.style/rules/key-spacing
   */
  'stylistic/key-spacing'?: Linter.RuleEntry<StylisticKeySpacing>
  /**
   * Enforce consistent spacing before and after keywords
   * @see https://eslint.style/rules/keyword-spacing
   */
  'stylistic/keyword-spacing'?: Linter.RuleEntry<StylisticKeywordSpacing>
  /**
   * Enforce position of line comments
   * @see https://eslint.style/rules/line-comment-position
   */
  'stylistic/line-comment-position'?: Linter.RuleEntry<StylisticLineCommentPosition>
  /**
   * Enforce consistent linebreak style
   * @see https://eslint.style/rules/linebreak-style
   */
  'stylistic/linebreak-style'?: Linter.RuleEntry<StylisticLinebreakStyle>
  /**
   * Require empty lines around comments
   * @see https://eslint.style/rules/lines-around-comment
   */
  'stylistic/lines-around-comment'?: Linter.RuleEntry<StylisticLinesAroundComment>
  /**
   * Require or disallow an empty line between class members
   * @see https://eslint.style/rules/lines-between-class-members
   */
  'stylistic/lines-between-class-members'?: Linter.RuleEntry<StylisticLinesBetweenClassMembers>
  /**
   * Enforce a maximum line length
   * @see https://eslint.style/rules/max-len
   */
  'stylistic/max-len'?: Linter.RuleEntry<StylisticMaxLen>
  /**
   * Enforce a maximum number of statements allowed per line
   * @see https://eslint.style/rules/max-statements-per-line
   */
  'stylistic/max-statements-per-line'?: Linter.RuleEntry<StylisticMaxStatementsPerLine>
  /**
   * Require a specific member delimiter style for interfaces and type literals
   * @see https://eslint.style/rules/member-delimiter-style
   */
  'stylistic/member-delimiter-style'?: Linter.RuleEntry<StylisticMemberDelimiterStyle>
  /**
   * Enforce a particular style for multiline comments
   * @see https://eslint.style/rules/multiline-comment-style
   */
  'stylistic/multiline-comment-style'?: Linter.RuleEntry<StylisticMultilineCommentStyle>
  /**
   * Enforce newlines between operands of ternary expressions
   * @see https://eslint.style/rules/multiline-ternary
   */
  'stylistic/multiline-ternary'?: Linter.RuleEntry<StylisticMultilineTernary>
  /**
   * Enforce or disallow parentheses when invoking a constructor with no arguments
   * @see https://eslint.style/rules/new-parens
   */
  'stylistic/new-parens'?: Linter.RuleEntry<StylisticNewParens>
  /**
   * Require a newline after each call in a method chain
   * @see https://eslint.style/rules/newline-per-chained-call
   */
  'stylistic/newline-per-chained-call'?: Linter.RuleEntry<StylisticNewlinePerChainedCall>
  /**
   * Disallow arrow functions where they could be confused with comparisons
   * @see https://eslint.style/rules/no-confusing-arrow
   */
  'stylistic/no-confusing-arrow'?: Linter.RuleEntry<StylisticNoConfusingArrow>
  /**
   * Disallow unnecessary parentheses
   * @see https://eslint.style/rules/no-extra-parens
   */
  'stylistic/no-extra-parens'?: Linter.RuleEntry<StylisticNoExtraParens>
  /**
   * Disallow unnecessary semicolons
   * @see https://eslint.style/rules/no-extra-semi
   */
  'stylistic/no-extra-semi'?: Linter.RuleEntry<[]>
  /**
   * Disallow leading or trailing decimal points in numeric literals
   * @see https://eslint.style/rules/no-floating-decimal
   */
  'stylistic/no-floating-decimal'?: Linter.RuleEntry<[]>
  /**
   * Disallow mixed binary operators
   * @see https://eslint.style/rules/no-mixed-operators
   */
  'stylistic/no-mixed-operators'?: Linter.RuleEntry<StylisticNoMixedOperators>
  /**
   * Disallow mixed spaces and tabs for indentation
   * @see https://eslint.style/rules/no-mixed-spaces-and-tabs
   */
  'stylistic/no-mixed-spaces-and-tabs'?: Linter.RuleEntry<StylisticNoMixedSpacesAndTabs>
  /**
   * Disallow multiple spaces
   * @see https://eslint.style/rules/no-multi-spaces
   */
  'stylistic/no-multi-spaces'?: Linter.RuleEntry<StylisticNoMultiSpaces>
  /**
   * Disallow multiple empty lines
   * @see https://eslint.style/rules/no-multiple-empty-lines
   */
  'stylistic/no-multiple-empty-lines'?: Linter.RuleEntry<StylisticNoMultipleEmptyLines>
  /**
   * Disallow all tabs
   * @see https://eslint.style/rules/no-tabs
   */
  'stylistic/no-tabs'?: Linter.RuleEntry<StylisticNoTabs>
  /**
   * Disallow trailing whitespace at the end of lines
   * @see https://eslint.style/rules/no-trailing-spaces
   */
  'stylistic/no-trailing-spaces'?: Linter.RuleEntry<StylisticNoTrailingSpaces>
  /**
   * Disallow whitespace before properties
   * @see https://eslint.style/rules/no-whitespace-before-property
   */
  'stylistic/no-whitespace-before-property'?: Linter.RuleEntry<[]>
  /**
   * Enforce the location of single-line statements
   * @see https://eslint.style/rules/nonblock-statement-body-position
   */
  'stylistic/nonblock-statement-body-position'?: Linter.RuleEntry<StylisticNonblockStatementBodyPosition>
  /**
   * Enforce consistent line breaks after opening and before closing braces
   * @see https://eslint.style/rules/object-curly-newline
   */
  'stylistic/object-curly-newline'?: Linter.RuleEntry<StylisticObjectCurlyNewline>
  /**
   * Enforce consistent spacing inside braces
   * @see https://eslint.style/rules/object-curly-spacing
   */
  'stylistic/object-curly-spacing'?: Linter.RuleEntry<StylisticObjectCurlySpacing>
  /**
   * Enforce placing object properties on separate lines
   * @see https://eslint.style/rules/object-property-newline
   */
  'stylistic/object-property-newline'?: Linter.RuleEntry<StylisticObjectPropertyNewline>
  /**
   * Require or disallow newlines around variable declarations
   * @see https://eslint.style/rules/one-var-declaration-per-line
   */
  'stylistic/one-var-declaration-per-line'?: Linter.RuleEntry<StylisticOneVarDeclarationPerLine>
  /**
   * Enforce consistent linebreak style for operators
   * @see https://eslint.style/rules/operator-linebreak
   */
  'stylistic/operator-linebreak'?: Linter.RuleEntry<StylisticOperatorLinebreak>
  /**
   * Require or disallow padding within blocks
   * @see https://eslint.style/rules/padded-blocks
   */
  'stylistic/padded-blocks'?: Linter.RuleEntry<StylisticPaddedBlocks>
  /**
   * Require or disallow padding lines between statements
   * @see https://eslint.style/rules/padding-line-between-statements
   */
  'stylistic/padding-line-between-statements'?: Linter.RuleEntry<StylisticPaddingLineBetweenStatements>
  /**
   * Require quotes around object literal, type literal, interfaces and enums property names
   * @see https://eslint.style/rules/quote-props
   */
  'stylistic/quote-props'?: Linter.RuleEntry<StylisticQuoteProps>
  /**
   * Enforce the consistent use of either backticks, double, or single quotes
   * @see https://eslint.style/rules/quotes
   */
  'stylistic/quotes'?: Linter.RuleEntry<StylisticQuotes>
  /**
   * Enforce spacing between rest and spread operators and their expressions
   * @see https://eslint.style/rules/rest-spread-spacing
   */
  'stylistic/rest-spread-spacing'?: Linter.RuleEntry<StylisticRestSpreadSpacing>
  /**
   * Require or disallow semicolons instead of ASI
   * @see https://eslint.style/rules/semi
   */
  'stylistic/semi'?: Linter.RuleEntry<StylisticSemi>
  /**
   * Enforce consistent spacing before and after semicolons
   * @see https://eslint.style/rules/semi-spacing
   */
  'stylistic/semi-spacing'?: Linter.RuleEntry<StylisticSemiSpacing>
  /**
   * Enforce location of semicolons
   * @see https://eslint.style/rules/semi-style
   */
  'stylistic/semi-style'?: Linter.RuleEntry<StylisticSemiStyle>
  /**
   * Enforce consistent spacing before blocks
   * @see https://eslint.style/rules/space-before-blocks
   */
  'stylistic/space-before-blocks'?: Linter.RuleEntry<StylisticSpaceBeforeBlocks>
  /**
   * Enforce consistent spacing before function parenthesis
   * @see https://eslint.style/rules/space-before-function-paren
   */
  'stylistic/space-before-function-paren'?: Linter.RuleEntry<StylisticSpaceBeforeFunctionParen>
  /**
   * Enforce consistent spacing inside parentheses
   * @see https://eslint.style/rules/space-in-parens
   */
  'stylistic/space-in-parens'?: Linter.RuleEntry<StylisticSpaceInParens>
  /**
   * Require spacing around infix operators
   * @see https://eslint.style/rules/space-infix-ops
   */
  'stylistic/space-infix-ops'?: Linter.RuleEntry<StylisticSpaceInfixOps>
  /**
   * Enforce consistent spacing before or after unary operators
   * @see https://eslint.style/rules/space-unary-ops
   */
  'stylistic/space-unary-ops'?: Linter.RuleEntry<StylisticSpaceUnaryOps>
  /**
   * Enforce consistent spacing after the `//` or `/*` in a comment
   * @see https://eslint.style/rules/spaced-comment
   */
  'stylistic/spaced-comment'?: Linter.RuleEntry<StylisticSpacedComment>
  /**
   * Enforce spacing around colons of switch statements
   * @see https://eslint.style/rules/switch-colon-spacing
   */
  'stylistic/switch-colon-spacing'?: Linter.RuleEntry<StylisticSwitchColonSpacing>
  /**
   * Require or disallow spacing around embedded expressions of template strings
   * @see https://eslint.style/rules/template-curly-spacing
   */
  'stylistic/template-curly-spacing'?: Linter.RuleEntry<StylisticTemplateCurlySpacing>
  /**
   * Require or disallow spacing between template tags and their literals
   * @see https://eslint.style/rules/template-tag-spacing
   */
  'stylistic/template-tag-spacing'?: Linter.RuleEntry<StylisticTemplateTagSpacing>
  /**
   * Require consistent spacing around type annotations
   * @see https://eslint.style/rules/type-annotation-spacing
   */
  'stylistic/type-annotation-spacing'?: Linter.RuleEntry<StylisticTypeAnnotationSpacing>
  /**
   * Enforces consistent spacing inside TypeScript type generics
   * @see https://eslint.style/rules/type-generic-spacing
   */
  'stylistic/type-generic-spacing'?: Linter.RuleEntry<[]>
  /**
   * Expect space before the type declaration in the named tuple
   * @see https://eslint.style/rules/type-named-tuple-spacing
   */
  'stylistic/type-named-tuple-spacing'?: Linter.RuleEntry<[]>
  /**
   * Require parentheses around immediate `function` invocations
   * @see https://eslint.style/rules/wrap-iife
   */
  'stylistic/wrap-iife'?: Linter.RuleEntry<StylisticWrapIife>
  /**
   * Require parenthesis around regex literals
   * @see https://eslint.style/rules/wrap-regex
   */
  'stylistic/wrap-regex'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around the `*` in `yield*` expressions
   * @see https://eslint.style/rules/yield-star-spacing
   */
  'stylistic/yield-star-spacing'?: Linter.RuleEntry<StylisticYieldStarSpacing>
  /**
   * Enforce spacing around colons of switch statements
   * @see https://eslint.org/docs/latest/rules/switch-colon-spacing
   * @deprecated
   */
  'switch-colon-spacing'?: Linter.RuleEntry<SwitchColonSpacing>
  /**
   * Require symbol descriptions
   * @see https://eslint.org/docs/latest/rules/symbol-description
   */
  'symbol-description'?: Linter.RuleEntry<[]>
  /**
   * Enforce a consistent and logical order of the Tailwind CSS classnames
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/classnames-order.md
   */
  'tailwindcss/classnames-order'?: Linter.RuleEntry<TailwindcssClassnamesOrder>
  /**
   * Warns about dash prefixed classnames using arbitrary values
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/enforces-negative-arbitrary-values.md
   */
  'tailwindcss/enforces-negative-arbitrary-values'?: Linter.RuleEntry<TailwindcssEnforcesNegativeArbitraryValues>
  /**
   * Enforces the usage of shorthand Tailwind CSS classnames
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/enforces-shorthand.md
   */
  'tailwindcss/enforces-shorthand'?: Linter.RuleEntry<TailwindcssEnforcesShorthand>
  /**
   * Detect obsolete classnames when upgrading to Tailwind CSS v3
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/migration-from-tailwind-2.md
   */
  'tailwindcss/migration-from-tailwind-2'?: Linter.RuleEntry<TailwindcssMigrationFromTailwind2>
  /**
   * Forbid using arbitrary values in classnames
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/no-arbitrary-value.md
   */
  'tailwindcss/no-arbitrary-value'?: Linter.RuleEntry<TailwindcssNoArbitraryValue>
  /**
   * Avoid contradicting Tailwind CSS classnames (e.g. "w-3 w-5")
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/no-contradicting-classname.md
   */
  'tailwindcss/no-contradicting-classname'?: Linter.RuleEntry<TailwindcssNoContradictingClassname>
  /**
   * Detect classnames which do not belong to Tailwind CSS
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/no-custom-classname.md
   */
  'tailwindcss/no-custom-classname'?: Linter.RuleEntry<TailwindcssNoCustomClassname>
  /**
   * Forbid using arbitrary values in classnames when an equivalent preset exists
   * @see https://github.com/francoismassart/eslint-plugin-tailwindcss/tree/master/docs/rules/no-unnecessary-arbitrary-value.md
   */
  'tailwindcss/no-unnecessary-arbitrary-value'?: Linter.RuleEntry<TailwindcssNoUnnecessaryArbitraryValue>
  /**
   * Exhaustive deps rule for useQuery
   * @see https://tanstack.com/query/latest/docs/eslint/exhaustive-deps
   */
  'tanstack-query/exhaustive-deps'?: Linter.RuleEntry<[]>
  /**
   * Ensure correct order of inference sensitive properties for infinite queries
   * @see https://tanstack.com/query/latest/docs/eslint/infinite-query-property-order
   */
  'tanstack-query/infinite-query-property-order'?: Linter.RuleEntry<[]>
  /**
   * Ensure correct order of inference-sensitive properties in useMutation()
   * @see https://tanstack.com/query/latest/docs/eslint/mutation-property-order
   */
  'tanstack-query/mutation-property-order'?: Linter.RuleEntry<[]>
  /**
   * Disallows rest destructuring in queries
   * @see https://tanstack.com/query/latest/docs/eslint/no-rest-destructuring
   */
  'tanstack-query/no-rest-destructuring'?: Linter.RuleEntry<[]>
  /**
   * Disallow putting the result of query hooks directly in a React hook dependency array
   * @see https://tanstack.com/query/latest/docs/eslint/no-unstable-deps
   */
  'tanstack-query/no-unstable-deps'?: Linter.RuleEntry<[]>
  /**
   * Ensures queryFn returns a non-undefined value
   * @see https://tanstack.com/query/latest/docs/eslint/no-void-query-fn
   */
  'tanstack-query/no-void-query-fn'?: Linter.RuleEntry<[]>
  /**
   * Makes sure that QueryClient is stable
   * @see https://tanstack.com/query/latest/docs/eslint/stable-query-client
   */
  'tanstack-query/stable-query-client'?: Linter.RuleEntry<[]>
  /**
   * Ensure correct order of inference sensitive properties for createRoute functions
   * @see https://tanstack.com/router/latest/docs/eslint/create-route-property-order
   */
  'tanstack-router/create-route-property-order'?: Linter.RuleEntry<[]>
  /**
   * Ensure route param names are valid JavaScript identifiers
   * @see https://tanstack.com/router/latest/docs/eslint/route-param-names
   */
  'tanstack-router/route-param-names'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around embedded expressions of template strings
   * @see https://eslint.org/docs/latest/rules/template-curly-spacing
   * @deprecated
   */
  'template-curly-spacing'?: Linter.RuleEntry<TemplateCurlySpacing>
  /**
   * Require or disallow spacing between template tags and their literals
   * @see https://eslint.org/docs/latest/rules/template-tag-spacing
   * @deprecated
   */
  'template-tag-spacing'?: Linter.RuleEntry<TemplateTagSpacing>
  /**
   * enforce linebreaks after opening and before closing array brackets
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/array-bracket-newline.html
   */
  'toml/array-bracket-newline'?: Linter.RuleEntry<TomlArrayBracketNewline>
  /**
   * enforce consistent spacing inside array brackets
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/array-bracket-spacing.html
   */
  'toml/array-bracket-spacing'?: Linter.RuleEntry<TomlArrayBracketSpacing>
  /**
   * enforce line breaks between array elements
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/array-element-newline.html
   */
  'toml/array-element-newline'?: Linter.RuleEntry<TomlArrayElementNewline>
  /**
   * enforce consistent comma style in array
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/comma-style.html
   */
  'toml/comma-style'?: Linter.RuleEntry<TomlCommaStyle>
  /**
   * enforce consistent indentation
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/indent.html
   */
  'toml/indent'?: Linter.RuleEntry<TomlIndent>
  /**
   * enforce consistent spacing inside braces
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/inline-table-curly-spacing.html
   */
  'toml/inline-table-curly-spacing'?: Linter.RuleEntry<TomlInlineTableCurlySpacing>
  /**
   * enforce consistent spacing between keys and values in key/value pairs
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/key-spacing.html
   */
  'toml/key-spacing'?: Linter.RuleEntry<TomlKeySpacing>
  /**
   * disallow defining pair keys out-of-order
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/keys-order.html
   */
  'toml/keys-order'?: Linter.RuleEntry<[]>
  /**
   * disallow mixed data types in array
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/no-mixed-type-in-array.html
   */
  'toml/no-mixed-type-in-array'?: Linter.RuleEntry<TomlNoMixedTypeInArray>
  /**
   * disallow hexadecimal, octal and binary integer
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/no-non-decimal-integer.html
   */
  'toml/no-non-decimal-integer'?: Linter.RuleEntry<TomlNoNonDecimalInteger>
  /**
   * disallow spacing around infix operators
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/no-space-dots.html
   */
  'toml/no-space-dots'?: Linter.RuleEntry<[]>
  /**
   * disallow number separators that to not enhance readability.
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/no-unreadable-number-separator.html
   */
  'toml/no-unreadable-number-separator'?: Linter.RuleEntry<[]>
  /**
   * require or disallow padding lines between pairs
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/padding-line-between-pairs.html
   */
  'toml/padding-line-between-pairs'?: Linter.RuleEntry<[]>
  /**
   * require or disallow padding lines between tables
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/padding-line-between-tables.html
   */
  'toml/padding-line-between-tables'?: Linter.RuleEntry<[]>
  /**
   * disallow precision of fractional seconds greater than the specified value.
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/precision-of-fractional-seconds.html
   */
  'toml/precision-of-fractional-seconds'?: Linter.RuleEntry<TomlPrecisionOfFractionalSeconds>
  /**
   * disallow precision of integer greater than the specified value.
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/precision-of-integer.html
   */
  'toml/precision-of-integer'?: Linter.RuleEntry<TomlPrecisionOfInteger>
  /**
   * require or disallow quotes around keys
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/quoted-keys.html
   */
  'toml/quoted-keys'?: Linter.RuleEntry<TomlQuotedKeys>
  /**
   * require spacing around equals sign
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/space-eq-sign.html
   * @deprecated
   */
  'toml/space-eq-sign'?: Linter.RuleEntry<[]>
  /**
   * enforce consistent spacing after the `#` in a comment
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/spaced-comment.html
   */
  'toml/spaced-comment'?: Linter.RuleEntry<TomlSpacedComment>
  /**
   * enforce consistent spacing inside table brackets
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/table-bracket-spacing.html
   */
  'toml/table-bracket-spacing'?: Linter.RuleEntry<TomlTableBracketSpacing>
  /**
   * disallow defining tables out-of-order
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/tables-order.html
   */
  'toml/tables-order'?: Linter.RuleEntry<[]>
  /**
   * disallow parsing errors in Vue custom blocks
   * @see https://ota-meshi.github.io/eslint-plugin-toml/rules/vue-custom-block/no-parsing-error.html
   */
  'toml/vue-custom-block/no-parsing-error'?: Linter.RuleEntry<[]>
  /**
   * Require that function overload signatures be consecutive
   * @see https://typescript-eslint.io/rules/adjacent-overload-signatures
   */
  'ts/adjacent-overload-signatures'?: Linter.RuleEntry<[]>
  /**
   * Require consistently using either `T[]` or `Array<T>` for arrays
   * @see https://typescript-eslint.io/rules/array-type
   */
  'ts/array-type'?: Linter.RuleEntry<TsArrayType>
  /**
   * Disallow awaiting a value that is not a Thenable
   * @see https://typescript-eslint.io/rules/await-thenable
   */
  'ts/await-thenable'?: Linter.RuleEntry<[]>
  /**
   * Disallow `@ts-<directive>` comments or require descriptions after directives
   * @see https://typescript-eslint.io/rules/ban-ts-comment
   */
  'ts/ban-ts-comment'?: Linter.RuleEntry<TsBanTsComment>
  /**
   * Disallow `// tslint:<rule-flag>` comments
   * @see https://typescript-eslint.io/rules/ban-tslint-comment
   */
  'ts/ban-tslint-comment'?: Linter.RuleEntry<[]>
  /**
   * Enforce that literals on classes are exposed in a consistent style
   * @see https://typescript-eslint.io/rules/class-literal-property-style
   */
  'ts/class-literal-property-style'?: Linter.RuleEntry<TsClassLiteralPropertyStyle>
  /**
   * Enforce that class methods utilize `this`
   * @see https://typescript-eslint.io/rules/class-methods-use-this
   */
  'ts/class-methods-use-this'?: Linter.RuleEntry<TsClassMethodsUseThis>
  /**
   * Enforce specifying generic type arguments on type annotation or constructor name of a constructor call
   * @see https://typescript-eslint.io/rules/consistent-generic-constructors
   */
  'ts/consistent-generic-constructors'?: Linter.RuleEntry<TsConsistentGenericConstructors>
  /**
   * Require or disallow the `Record` type
   * @see https://typescript-eslint.io/rules/consistent-indexed-object-style
   */
  'ts/consistent-indexed-object-style'?: Linter.RuleEntry<TsConsistentIndexedObjectStyle>
  /**
   * Require `return` statements to either always or never specify values
   * @see https://typescript-eslint.io/rules/consistent-return
   */
  'ts/consistent-return'?: Linter.RuleEntry<TsConsistentReturn>
  /**
   * Enforce consistent usage of type assertions
   * @see https://typescript-eslint.io/rules/consistent-type-assertions
   */
  'ts/consistent-type-assertions'?: Linter.RuleEntry<TsConsistentTypeAssertions>
  /**
   * Enforce type definitions to consistently use either `interface` or `type`
   * @see https://typescript-eslint.io/rules/consistent-type-definitions
   */
  'ts/consistent-type-definitions'?: Linter.RuleEntry<TsConsistentTypeDefinitions>
  /**
   * Enforce consistent usage of type exports
   * @see https://typescript-eslint.io/rules/consistent-type-exports
   */
  'ts/consistent-type-exports'?: Linter.RuleEntry<TsConsistentTypeExports>
  /**
   * Enforce consistent usage of type imports
   * @see https://typescript-eslint.io/rules/consistent-type-imports
   */
  'ts/consistent-type-imports'?: Linter.RuleEntry<TsConsistentTypeImports>
  /**
   * Enforce default parameters to be last
   * @see https://typescript-eslint.io/rules/default-param-last
   */
  'ts/default-param-last'?: Linter.RuleEntry<[]>
  /**
   * Enforce dot notation whenever possible
   * @see https://typescript-eslint.io/rules/dot-notation
   */
  'ts/dot-notation'?: Linter.RuleEntry<TsDotNotation>
  /**
   * Require explicit return types on functions and class methods
   * @see https://typescript-eslint.io/rules/explicit-function-return-type
   */
  'ts/explicit-function-return-type'?: Linter.RuleEntry<TsExplicitFunctionReturnType>
  /**
   * Require explicit accessibility modifiers on class properties and methods
   * @see https://typescript-eslint.io/rules/explicit-member-accessibility
   */
  'ts/explicit-member-accessibility'?: Linter.RuleEntry<TsExplicitMemberAccessibility>
  /**
   * Require explicit return and argument types on exported functions' and classes' public class methods
   * @see https://typescript-eslint.io/rules/explicit-module-boundary-types
   */
  'ts/explicit-module-boundary-types'?: Linter.RuleEntry<TsExplicitModuleBoundaryTypes>
  /**
   * Require or disallow initialization in variable declarations
   * @see https://typescript-eslint.io/rules/init-declarations
   */
  'ts/init-declarations'?: Linter.RuleEntry<TsInitDeclarations>
  /**
   * Enforce a maximum number of parameters in function definitions
   * @see https://typescript-eslint.io/rules/max-params
   */
  'ts/max-params'?: Linter.RuleEntry<TsMaxParams>
  /**
   * Require a consistent member declaration order
   * @see https://typescript-eslint.io/rules/member-ordering
   */
  'ts/member-ordering'?: Linter.RuleEntry<TsMemberOrdering>
  /**
   * Enforce using a particular method signature syntax
   * @see https://typescript-eslint.io/rules/method-signature-style
   */
  'ts/method-signature-style'?: Linter.RuleEntry<TsMethodSignatureStyle>
  /**
   * Enforce naming conventions for everything across a codebase
   * @see https://typescript-eslint.io/rules/naming-convention
   */
  'ts/naming-convention'?: Linter.RuleEntry<TsNamingConvention>
  /**
   * Disallow generic `Array` constructors
   * @see https://typescript-eslint.io/rules/no-array-constructor
   */
  'ts/no-array-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow using the `delete` operator on array values
   * @see https://typescript-eslint.io/rules/no-array-delete
   */
  'ts/no-array-delete'?: Linter.RuleEntry<[]>
  /**
   * Require `.toString()` and `.toLocaleString()` to only be called on objects which provide useful information when stringified
   * @see https://typescript-eslint.io/rules/no-base-to-string
   */
  'ts/no-base-to-string'?: Linter.RuleEntry<TsNoBaseToString>
  /**
   * Disallow non-null assertion in locations that may be confusing
   * @see https://typescript-eslint.io/rules/no-confusing-non-null-assertion
   */
  'ts/no-confusing-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Require expressions of type void to appear in statement position
   * @see https://typescript-eslint.io/rules/no-confusing-void-expression
   */
  'ts/no-confusing-void-expression'?: Linter.RuleEntry<TsNoConfusingVoidExpression>
  /**
   * Disallow using code marked as `@deprecated`
   * @see https://typescript-eslint.io/rules/no-deprecated
   */
  'ts/no-deprecated'?: Linter.RuleEntry<TsNoDeprecated>
  /**
   * Disallow duplicate class members
   * @see https://typescript-eslint.io/rules/no-dupe-class-members
   */
  'ts/no-dupe-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate enum member values
   * @see https://typescript-eslint.io/rules/no-duplicate-enum-values
   */
  'ts/no-duplicate-enum-values'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate constituents of union or intersection types
   * @see https://typescript-eslint.io/rules/no-duplicate-type-constituents
   */
  'ts/no-duplicate-type-constituents'?: Linter.RuleEntry<TsNoDuplicateTypeConstituents>
  /**
   * Disallow using the `delete` operator on computed key expressions
   * @see https://typescript-eslint.io/rules/no-dynamic-delete
   */
  'ts/no-dynamic-delete'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty functions
   * @see https://typescript-eslint.io/rules/no-empty-function
   */
  'ts/no-empty-function'?: Linter.RuleEntry<TsNoEmptyFunction>
  /**
   * Disallow the declaration of empty interfaces
   * @see https://typescript-eslint.io/rules/no-empty-interface
   * @deprecated
   */
  'ts/no-empty-interface'?: Linter.RuleEntry<TsNoEmptyInterface>
  /**
   * Disallow accidentally using the "empty object" type
   * @see https://typescript-eslint.io/rules/no-empty-object-type
   */
  'ts/no-empty-object-type'?: Linter.RuleEntry<TsNoEmptyObjectType>
  /**
   * Disallow the `any` type
   * @see https://typescript-eslint.io/rules/no-explicit-any
   */
  'ts/no-explicit-any'?: Linter.RuleEntry<TsNoExplicitAny>
  /**
   * Disallow extra non-null assertions
   * @see https://typescript-eslint.io/rules/no-extra-non-null-assertion
   */
  'ts/no-extra-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Disallow classes used as namespaces
   * @see https://typescript-eslint.io/rules/no-extraneous-class
   */
  'ts/no-extraneous-class'?: Linter.RuleEntry<TsNoExtraneousClass>
  /**
   * Require Promise-like statements to be handled appropriately
   * @see https://typescript-eslint.io/rules/no-floating-promises
   */
  'ts/no-floating-promises'?: Linter.RuleEntry<TsNoFloatingPromises>
  /**
   * Disallow iterating over an array with a for-in loop
   * @see https://typescript-eslint.io/rules/no-for-in-array
   */
  'ts/no-for-in-array'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `eval()`-like functions
   * @see https://typescript-eslint.io/rules/no-implied-eval
   */
  'ts/no-implied-eval'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
   * @see https://typescript-eslint.io/rules/no-import-type-side-effects
   */
  'ts/no-import-type-side-effects'?: Linter.RuleEntry<[]>
  /**
   * Disallow explicit type declarations for variables or parameters initialized to a number, string, or boolean
   * @see https://typescript-eslint.io/rules/no-inferrable-types
   */
  'ts/no-inferrable-types'?: Linter.RuleEntry<TsNoInferrableTypes>
  /**
   * Disallow `this` keywords outside of classes or class-like objects
   * @see https://typescript-eslint.io/rules/no-invalid-this
   */
  'ts/no-invalid-this'?: Linter.RuleEntry<TsNoInvalidThis>
  /**
   * Disallow `void` type outside of generic or return types
   * @see https://typescript-eslint.io/rules/no-invalid-void-type
   */
  'ts/no-invalid-void-type'?: Linter.RuleEntry<TsNoInvalidVoidType>
  /**
   * Disallow function declarations that contain unsafe references inside loop statements
   * @see https://typescript-eslint.io/rules/no-loop-func
   */
  'ts/no-loop-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow literal numbers that lose precision
   * @see https://typescript-eslint.io/rules/no-loss-of-precision
   * @deprecated
   */
  'ts/no-loss-of-precision'?: Linter.RuleEntry<[]>
  /**
   * Disallow magic numbers
   * @see https://typescript-eslint.io/rules/no-magic-numbers
   */
  'ts/no-magic-numbers'?: Linter.RuleEntry<TsNoMagicNumbers>
  /**
   * Disallow the `void` operator except when used to discard a value
   * @see https://typescript-eslint.io/rules/no-meaningless-void-operator
   */
  'ts/no-meaningless-void-operator'?: Linter.RuleEntry<TsNoMeaninglessVoidOperator>
  /**
   * Enforce valid definition of `new` and `constructor`
   * @see https://typescript-eslint.io/rules/no-misused-new
   */
  'ts/no-misused-new'?: Linter.RuleEntry<[]>
  /**
   * Disallow Promises in places not designed to handle them
   * @see https://typescript-eslint.io/rules/no-misused-promises
   */
  'ts/no-misused-promises'?: Linter.RuleEntry<TsNoMisusedPromises>
  /**
   * Disallow using the spread operator when it might cause unexpected behavior
   * @see https://typescript-eslint.io/rules/no-misused-spread
   */
  'ts/no-misused-spread'?: Linter.RuleEntry<TsNoMisusedSpread>
  /**
   * Disallow enums from having both number and string members
   * @see https://typescript-eslint.io/rules/no-mixed-enums
   */
  'ts/no-mixed-enums'?: Linter.RuleEntry<[]>
  /**
   * Disallow TypeScript namespaces
   * @see https://typescript-eslint.io/rules/no-namespace
   */
  'ts/no-namespace'?: Linter.RuleEntry<TsNoNamespace>
  /**
   * Disallow non-null assertions in the left operand of a nullish coalescing operator
   * @see https://typescript-eslint.io/rules/no-non-null-asserted-nullish-coalescing
   */
  'ts/no-non-null-asserted-nullish-coalescing'?: Linter.RuleEntry<[]>
  /**
   * Disallow non-null assertions after an optional chain expression
   * @see https://typescript-eslint.io/rules/no-non-null-asserted-optional-chain
   */
  'ts/no-non-null-asserted-optional-chain'?: Linter.RuleEntry<[]>
  /**
   * Disallow non-null assertions using the `!` postfix operator
   * @see https://typescript-eslint.io/rules/no-non-null-assertion
   */
  'ts/no-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Disallow variable redeclaration
   * @see https://typescript-eslint.io/rules/no-redeclare
   */
  'ts/no-redeclare'?: Linter.RuleEntry<TsNoRedeclare>
  /**
   * Disallow members of unions and intersections that do nothing or override type information
   * @see https://typescript-eslint.io/rules/no-redundant-type-constituents
   */
  'ts/no-redundant-type-constituents'?: Linter.RuleEntry<[]>
  /**
   * Disallow invocation of `require()`
   * @see https://typescript-eslint.io/rules/no-require-imports
   */
  'ts/no-require-imports'?: Linter.RuleEntry<TsNoRequireImports>
  /**
   * Disallow specified modules when loaded by `import`
   * @see https://typescript-eslint.io/rules/no-restricted-imports
   */
  'ts/no-restricted-imports'?: Linter.RuleEntry<TsNoRestrictedImports>
  /**
   * Disallow certain types
   * @see https://typescript-eslint.io/rules/no-restricted-types
   */
  'ts/no-restricted-types'?: Linter.RuleEntry<TsNoRestrictedTypes>
  /**
   * Disallow variable declarations from shadowing variables declared in the outer scope
   * @see https://typescript-eslint.io/rules/no-shadow
   */
  'ts/no-shadow'?: Linter.RuleEntry<TsNoShadow>
  /**
   * Disallow aliasing `this`
   * @see https://typescript-eslint.io/rules/no-this-alias
   */
  'ts/no-this-alias'?: Linter.RuleEntry<TsNoThisAlias>
  /**
   * Disallow type aliases
   * @see https://typescript-eslint.io/rules/no-type-alias
   * @deprecated
   */
  'ts/no-type-alias'?: Linter.RuleEntry<TsNoTypeAlias>
  /**
   * Disallow unnecessary equality comparisons against boolean literals
   * @see https://typescript-eslint.io/rules/no-unnecessary-boolean-literal-compare
   */
  'ts/no-unnecessary-boolean-literal-compare'?: Linter.RuleEntry<TsNoUnnecessaryBooleanLiteralCompare>
  /**
   * Disallow conditionals where the type is always truthy or always falsy
   * @see https://typescript-eslint.io/rules/no-unnecessary-condition
   */
  'ts/no-unnecessary-condition'?: Linter.RuleEntry<TsNoUnnecessaryCondition>
  /**
   * Disallow unnecessary assignment of constructor property parameter
   * @see https://typescript-eslint.io/rules/no-unnecessary-parameter-property-assignment
   */
  'ts/no-unnecessary-parameter-property-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary namespace qualifiers
   * @see https://typescript-eslint.io/rules/no-unnecessary-qualifier
   */
  'ts/no-unnecessary-qualifier'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary template expressions
   * @see https://typescript-eslint.io/rules/no-unnecessary-template-expression
   */
  'ts/no-unnecessary-template-expression'?: Linter.RuleEntry<[]>
  /**
   * Disallow type arguments that are equal to the default
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-arguments
   */
  'ts/no-unnecessary-type-arguments'?: Linter.RuleEntry<[]>
  /**
   * Disallow type assertions that do not change the type of an expression
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-assertion
   */
  'ts/no-unnecessary-type-assertion'?: Linter.RuleEntry<TsNoUnnecessaryTypeAssertion>
  /**
   * Disallow unnecessary constraints on generic types
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-constraint
   */
  'ts/no-unnecessary-type-constraint'?: Linter.RuleEntry<[]>
  /**
   * Disallow conversion idioms when they do not change the type or value of the expression
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-conversion
   */
  'ts/no-unnecessary-type-conversion'?: Linter.RuleEntry<[]>
  /**
   * Disallow type parameters that aren't used multiple times
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-parameters
   */
  'ts/no-unnecessary-type-parameters'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling a function with a value with type `any`
   * @see https://typescript-eslint.io/rules/no-unsafe-argument
   */
  'ts/no-unsafe-argument'?: Linter.RuleEntry<[]>
  /**
   * Disallow assigning a value with type `any` to variables and properties
   * @see https://typescript-eslint.io/rules/no-unsafe-assignment
   */
  'ts/no-unsafe-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling a value with type `any`
   * @see https://typescript-eslint.io/rules/no-unsafe-call
   */
  'ts/no-unsafe-call'?: Linter.RuleEntry<[]>
  /**
   * Disallow unsafe declaration merging
   * @see https://typescript-eslint.io/rules/no-unsafe-declaration-merging
   */
  'ts/no-unsafe-declaration-merging'?: Linter.RuleEntry<[]>
  /**
   * Disallow comparing an enum value with a non-enum value
   * @see https://typescript-eslint.io/rules/no-unsafe-enum-comparison
   */
  'ts/no-unsafe-enum-comparison'?: Linter.RuleEntry<[]>
  /**
   * Disallow using the unsafe built-in Function type
   * @see https://typescript-eslint.io/rules/no-unsafe-function-type
   */
  'ts/no-unsafe-function-type'?: Linter.RuleEntry<[]>
  /**
   * Disallow member access on a value with type `any`
   * @see https://typescript-eslint.io/rules/no-unsafe-member-access
   */
  'ts/no-unsafe-member-access'?: Linter.RuleEntry<TsNoUnsafeMemberAccess>
  /**
   * Disallow returning a value with type `any` from a function
   * @see https://typescript-eslint.io/rules/no-unsafe-return
   */
  'ts/no-unsafe-return'?: Linter.RuleEntry<[]>
  /**
   * Disallow type assertions that narrow a type
   * @see https://typescript-eslint.io/rules/no-unsafe-type-assertion
   */
  'ts/no-unsafe-type-assertion'?: Linter.RuleEntry<[]>
  /**
   * Require unary negation to take a number
   * @see https://typescript-eslint.io/rules/no-unsafe-unary-minus
   */
  'ts/no-unsafe-unary-minus'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused expressions
   * @see https://typescript-eslint.io/rules/no-unused-expressions
   */
  'ts/no-unused-expressions'?: Linter.RuleEntry<TsNoUnusedExpressions>
  /**
   * Disallow unused private class members
   * @see https://typescript-eslint.io/rules/no-unused-private-class-members
   */
  'ts/no-unused-private-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused variables
   * @see https://typescript-eslint.io/rules/no-unused-vars
   */
  'ts/no-unused-vars'?: Linter.RuleEntry<TsNoUnusedVars>
  /**
   * Disallow the use of variables before they are defined
   * @see https://typescript-eslint.io/rules/no-use-before-define
   */
  'ts/no-use-before-define'?: Linter.RuleEntry<TsNoUseBeforeDefine>
  /**
   * Disallow unnecessary constructors
   * @see https://typescript-eslint.io/rules/no-useless-constructor
   */
  'ts/no-useless-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow default values that will never be used
   * @see https://typescript-eslint.io/rules/no-useless-default-assignment
   */
  'ts/no-useless-default-assignment'?: Linter.RuleEntry<TsNoUselessDefaultAssignment>
  /**
   * Disallow empty exports that don't change anything in a module file
   * @see https://typescript-eslint.io/rules/no-useless-empty-export
   */
  'ts/no-useless-empty-export'?: Linter.RuleEntry<[]>
  /**
   * Disallow `require` statements except in import statements
   * @see https://typescript-eslint.io/rules/no-var-requires
   * @deprecated
   */
  'ts/no-var-requires'?: Linter.RuleEntry<TsNoVarRequires>
  /**
   * Disallow using confusing built-in primitive class wrappers
   * @see https://typescript-eslint.io/rules/no-wrapper-object-types
   */
  'ts/no-wrapper-object-types'?: Linter.RuleEntry<[]>
  /**
   * Enforce non-null assertions over explicit type assertions
   * @see https://typescript-eslint.io/rules/non-nullable-type-assertion-style
   */
  'ts/non-nullable-type-assertion-style'?: Linter.RuleEntry<[]>
  /**
   * Disallow throwing non-`Error` values as exceptions
   * @see https://typescript-eslint.io/rules/only-throw-error
   */
  'ts/only-throw-error'?: Linter.RuleEntry<TsOnlyThrowError>
  /**
   * Require or disallow parameter properties in class constructors
   * @see https://typescript-eslint.io/rules/parameter-properties
   */
  'ts/parameter-properties'?: Linter.RuleEntry<TsParameterProperties>
  /**
   * Enforce the use of `as const` over literal type
   * @see https://typescript-eslint.io/rules/prefer-as-const
   */
  'ts/prefer-as-const'?: Linter.RuleEntry<[]>
  /**
   * Require destructuring from arrays and/or objects
   * @see https://typescript-eslint.io/rules/prefer-destructuring
   */
  'ts/prefer-destructuring'?: Linter.RuleEntry<TsPreferDestructuring>
  /**
   * Require each enum member value to be explicitly initialized
   * @see https://typescript-eslint.io/rules/prefer-enum-initializers
   */
  'ts/prefer-enum-initializers'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of Array.prototype.find() over Array.prototype.filter() followed by [0] when looking for a single result
   * @see https://typescript-eslint.io/rules/prefer-find
   */
  'ts/prefer-find'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of `for-of` loop over the standard `for` loop where possible
   * @see https://typescript-eslint.io/rules/prefer-for-of
   */
  'ts/prefer-for-of'?: Linter.RuleEntry<[]>
  /**
   * Enforce using function types instead of interfaces with call signatures
   * @see https://typescript-eslint.io/rules/prefer-function-type
   */
  'ts/prefer-function-type'?: Linter.RuleEntry<[]>
  /**
   * Enforce `includes` method over `indexOf` method
   * @see https://typescript-eslint.io/rules/prefer-includes
   */
  'ts/prefer-includes'?: Linter.RuleEntry<[]>
  /**
   * Require all enum members to be literal values
   * @see https://typescript-eslint.io/rules/prefer-literal-enum-member
   */
  'ts/prefer-literal-enum-member'?: Linter.RuleEntry<TsPreferLiteralEnumMember>
  /**
   * Require using `namespace` keyword over `module` keyword to declare custom TypeScript modules
   * @see https://typescript-eslint.io/rules/prefer-namespace-keyword
   */
  'ts/prefer-namespace-keyword'?: Linter.RuleEntry<[]>
  /**
   * Enforce using the nullish coalescing operator instead of logical assignments or chaining
   * @see https://typescript-eslint.io/rules/prefer-nullish-coalescing
   */
  'ts/prefer-nullish-coalescing'?: Linter.RuleEntry<TsPreferNullishCoalescing>
  /**
   * Enforce using concise optional chain expressions instead of chained logical ands, negated logical ors, or empty objects
   * @see https://typescript-eslint.io/rules/prefer-optional-chain
   */
  'ts/prefer-optional-chain'?: Linter.RuleEntry<TsPreferOptionalChain>
  /**
   * Require using Error objects as Promise rejection reasons
   * @see https://typescript-eslint.io/rules/prefer-promise-reject-errors
   */
  'ts/prefer-promise-reject-errors'?: Linter.RuleEntry<TsPreferPromiseRejectErrors>
  /**
   * Require private members to be marked as `readonly` if they're never modified outside of the constructor
   * @see https://typescript-eslint.io/rules/prefer-readonly
   */
  'ts/prefer-readonly'?: Linter.RuleEntry<TsPreferReadonly>
  /**
   * Require function parameters to be typed as `readonly` to prevent accidental mutation of inputs
   * @see https://typescript-eslint.io/rules/prefer-readonly-parameter-types
   */
  'ts/prefer-readonly-parameter-types'?: Linter.RuleEntry<TsPreferReadonlyParameterTypes>
  /**
   * Enforce using type parameter when calling `Array#reduce` instead of using a type assertion
   * @see https://typescript-eslint.io/rules/prefer-reduce-type-parameter
   */
  'ts/prefer-reduce-type-parameter'?: Linter.RuleEntry<[]>
  /**
   * Enforce `RegExp#exec` over `String#match` if no global flag is provided
   * @see https://typescript-eslint.io/rules/prefer-regexp-exec
   */
  'ts/prefer-regexp-exec'?: Linter.RuleEntry<[]>
  /**
   * Enforce that `this` is used when only `this` type is returned
   * @see https://typescript-eslint.io/rules/prefer-return-this-type
   */
  'ts/prefer-return-this-type'?: Linter.RuleEntry<[]>
  /**
   * Enforce using `String#startsWith` and `String#endsWith` over other equivalent methods of checking substrings
   * @see https://typescript-eslint.io/rules/prefer-string-starts-ends-with
   */
  'ts/prefer-string-starts-ends-with'?: Linter.RuleEntry<TsPreferStringStartsEndsWith>
  /**
   * Enforce using `@ts-expect-error` over `@ts-ignore`
   * @see https://typescript-eslint.io/rules/prefer-ts-expect-error
   * @deprecated
   */
  'ts/prefer-ts-expect-error'?: Linter.RuleEntry<[]>
  /**
   * Require any function or method that returns a Promise to be marked async
   * @see https://typescript-eslint.io/rules/promise-function-async
   */
  'ts/promise-function-async'?: Linter.RuleEntry<TsPromiseFunctionAsync>
  /**
   * Enforce that `get()` types should be assignable to their equivalent `set()` type
   * @see https://typescript-eslint.io/rules/related-getter-setter-pairs
   */
  'ts/related-getter-setter-pairs'?: Linter.RuleEntry<[]>
  /**
   * Require `Array#sort` and `Array#toSorted` calls to always provide a `compareFunction`
   * @see https://typescript-eslint.io/rules/require-array-sort-compare
   */
  'ts/require-array-sort-compare'?: Linter.RuleEntry<TsRequireArraySortCompare>
  /**
   * Disallow async functions which do not return promises and have no `await` expression
   * @see https://typescript-eslint.io/rules/require-await
   */
  'ts/require-await'?: Linter.RuleEntry<[]>
  /**
   * Require both operands of addition to be the same type and be `bigint`, `number`, or `string`
   * @see https://typescript-eslint.io/rules/restrict-plus-operands
   */
  'ts/restrict-plus-operands'?: Linter.RuleEntry<TsRestrictPlusOperands>
  /**
   * Enforce template literal expressions to be of `string` type
   * @see https://typescript-eslint.io/rules/restrict-template-expressions
   */
  'ts/restrict-template-expressions'?: Linter.RuleEntry<TsRestrictTemplateExpressions>
  /**
   * Enforce consistent awaiting of returned promises
   * @see https://typescript-eslint.io/rules/return-await
   */
  'ts/return-await'?: Linter.RuleEntry<TsReturnAwait>
  /**
   * Enforce constituents of a type union/intersection to be sorted alphabetically
   * @see https://typescript-eslint.io/rules/sort-type-constituents
   * @deprecated
   */
  'ts/sort-type-constituents'?: Linter.RuleEntry<TsSortTypeConstituents>
  /**
   * Disallow certain types in boolean expressions
   * @see https://typescript-eslint.io/rules/strict-boolean-expressions
   */
  'ts/strict-boolean-expressions'?: Linter.RuleEntry<TsStrictBooleanExpressions>
  /**
   * Disallow passing a value-returning function in a position accepting a void function
   * @see https://typescript-eslint.io/rules/strict-void-return
   */
  'ts/strict-void-return'?: Linter.RuleEntry<TsStrictVoidReturn>
  /**
   * Require switch-case statements to be exhaustive
   * @see https://typescript-eslint.io/rules/switch-exhaustiveness-check
   */
  'ts/switch-exhaustiveness-check'?: Linter.RuleEntry<TsSwitchExhaustivenessCheck>
  /**
   * Disallow certain triple slash directives in favor of ES6-style import declarations
   * @see https://typescript-eslint.io/rules/triple-slash-reference
   */
  'ts/triple-slash-reference'?: Linter.RuleEntry<TsTripleSlashReference>
  /**
   * Require type annotations in certain places
   * @see https://typescript-eslint.io/rules/typedef
   * @deprecated
   */
  'ts/typedef'?: Linter.RuleEntry<TsTypedef>
  /**
   * Enforce unbound methods are called with their expected scope
   * @see https://typescript-eslint.io/rules/unbound-method
   */
  'ts/unbound-method'?: Linter.RuleEntry<TsUnboundMethod>
  /**
   * Disallow two overloads that could be unified into one with a union or an optional/rest parameter
   * @see https://typescript-eslint.io/rules/unified-signatures
   */
  'ts/unified-signatures'?: Linter.RuleEntry<TsUnifiedSignatures>
  /**
   * Enforce typing arguments in Promise rejection callbacks as `unknown`
   * @see https://typescript-eslint.io/rules/use-unknown-in-catch-callback-variable
   */
  'ts/use-unknown-in-catch-callback-variable'?: Linter.RuleEntry<[]>
  /**
   * Do not allow the use of `process.env` without including the env key in any turbo.json
   * @see https://github.com/vercel/turborepo/tree/main/packages/eslint-plugin-turbo/docs/rules/no-undeclared-env-vars.md
   */
  'turbo/no-undeclared-env-vars'?: Linter.RuleEntry<TurboNoUndeclaredEnvVars>
  /**
   * Require or disallow Unicode byte order mark (BOM)
   * @see https://eslint.org/docs/latest/rules/unicode-bom
   */
  'unicode-bom'?: Linter.RuleEntry<UnicodeBom>
  /**
   * Improve regexes by making them shorter, consistent, and safer.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/better-regex.md
   */
  'unicorn/better-regex'?: Linter.RuleEntry<UnicornBetterRegex>
  /**
   * Enforce a specific parameter name in catch clauses.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/catch-error-name.md
   */
  'unicorn/catch-error-name'?: Linter.RuleEntry<UnicornCatchErrorName>
  /**
   * Enforce consistent assertion style with `node:assert`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/consistent-assert.md
   */
  'unicorn/consistent-assert'?: Linter.RuleEntry<[]>
  /**
   * Prefer passing `Date` directly to the constructor when cloning.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/consistent-date-clone.md
   */
  'unicorn/consistent-date-clone'?: Linter.RuleEntry<[]>
  /**
   * Use destructured variables over properties.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/consistent-destructuring.md
   */
  'unicorn/consistent-destructuring'?: Linter.RuleEntry<[]>
  /**
   * Prefer consistent types when spreading a ternary in an array literal.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/consistent-empty-array-spread.md
   */
  'unicorn/consistent-empty-array-spread'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent style for element existence checks with `indexOf()`, `lastIndexOf()`, `findIndex()`, and `findLastIndex()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/consistent-existence-index-check.md
   */
  'unicorn/consistent-existence-index-check'?: Linter.RuleEntry<[]>
  /**
   * Move function definitions to the highest possible scope.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/consistent-function-scoping.md
   */
  'unicorn/consistent-function-scoping'?: Linter.RuleEntry<UnicornConsistentFunctionScoping>
  /**
   * Enforce correct `Error` subclassing.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/custom-error-definition.md
   */
  'unicorn/custom-error-definition'?: Linter.RuleEntry<[]>
  /**
   * Enforce no spaces between braces.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/empty-brace-spaces.md
   */
  'unicorn/empty-brace-spaces'?: Linter.RuleEntry<[]>
  /**
   * Enforce passing a `message` value when creating a built-in error.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/error-message.md
   */
  'unicorn/error-message'?: Linter.RuleEntry<[]>
  /**
   * Require escape sequences to use uppercase or lowercase values.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/escape-case.md
   */
  'unicorn/escape-case'?: Linter.RuleEntry<UnicornEscapeCase>
  /**
   * Add expiration conditions to TODO comments.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/expiring-todo-comments.md
   */
  'unicorn/expiring-todo-comments'?: Linter.RuleEntry<UnicornExpiringTodoComments>
  /**
   * Enforce explicitly comparing the `length` or `size` property of a value.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/explicit-length-check.md
   */
  'unicorn/explicit-length-check'?: Linter.RuleEntry<UnicornExplicitLengthCheck>
  /**
   * Enforce a case style for filenames.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/filename-case.md
   */
  'unicorn/filename-case'?: Linter.RuleEntry<UnicornFilenameCase>
  /**
   * Enforce specific import styles per module.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/import-style.md
   */
  'unicorn/import-style'?: Linter.RuleEntry<UnicornImportStyle>
  /**
   * Prevent usage of variables from outside the scope of isolated functions.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/isolated-functions.md
   */
  'unicorn/isolated-functions'?: Linter.RuleEntry<UnicornIsolatedFunctions>
  /**
   * Enforce the use of `new` for all builtins, except `String`, `Number`, `Boolean`, `Symbol` and `BigInt`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/new-for-builtins.md
   */
  'unicorn/new-for-builtins'?: Linter.RuleEntry<[]>
  /**
   * Enforce specifying rules to disable in `eslint-disable` comments.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-abusive-eslint-disable.md
   */
  'unicorn/no-abusive-eslint-disable'?: Linter.RuleEntry<[]>
  /**
   * Disallow recursive access to `this` within getters and setters.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-accessor-recursion.md
   */
  'unicorn/no-accessor-recursion'?: Linter.RuleEntry<[]>
  /**
   * Disallow anonymous functions and classes as the default export.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-anonymous-default-export.md
   */
  'unicorn/no-anonymous-default-export'?: Linter.RuleEntry<[]>
  /**
   * Prevent passing a function reference directly to iterator methods.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-array-callback-reference.md
   */
  'unicorn/no-array-callback-reference'?: Linter.RuleEntry<[]>
  /**
   * Prefer `for…of` over the `forEach` method.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-array-for-each.md
   */
  'unicorn/no-array-for-each'?: Linter.RuleEntry<[]>
  /**
   * Disallow using the `this` argument in array methods.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-array-method-this-argument.md
   */
  'unicorn/no-array-method-this-argument'?: Linter.RuleEntry<[]>
  /**
   * Replaced by `unicorn/prefer-single-call` which covers more cases.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/deleted-and-deprecated-rules.md#no-array-push-push
   * @deprecated
   */
  'unicorn/no-array-push-push'?: Linter.RuleEntry<[]>
  /**
   * Disallow `Array#reduce()` and `Array#reduceRight()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-array-reduce.md
   */
  'unicorn/no-array-reduce'?: Linter.RuleEntry<UnicornNoArrayReduce>
  /**
   * Prefer `Array#toReversed()` over `Array#reverse()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-array-reverse.md
   */
  'unicorn/no-array-reverse'?: Linter.RuleEntry<UnicornNoArrayReverse>
  /**
   * Prefer `Array#toSorted()` over `Array#sort()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-array-sort.md
   */
  'unicorn/no-array-sort'?: Linter.RuleEntry<UnicornNoArraySort>
  /**
   * Disallow member access from await expression.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-await-expression-member.md
   */
  'unicorn/no-await-expression-member'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `await` in `Promise` method parameters.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-await-in-promise-methods.md
   */
  'unicorn/no-await-in-promise-methods'?: Linter.RuleEntry<[]>
  /**
   * Do not use leading/trailing space between `console.log` parameters.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-console-spaces.md
   */
  'unicorn/no-console-spaces'?: Linter.RuleEntry<[]>
  /**
   * Do not use `document.cookie` directly.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-document-cookie.md
   */
  'unicorn/no-document-cookie'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty files.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-empty-file.md
   */
  'unicorn/no-empty-file'?: Linter.RuleEntry<[]>
  /**
   * Do not use a `for` loop that can be replaced with a `for-of` loop.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-for-loop.md
   */
  'unicorn/no-for-loop'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of Unicode escapes instead of hexadecimal escapes.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-hex-escape.md
   */
  'unicorn/no-hex-escape'?: Linter.RuleEntry<[]>
  /**
   * Disallow immediate mutation after variable assignment.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-immediate-mutation.md
   */
  'unicorn/no-immediate-mutation'?: Linter.RuleEntry<[]>
  /**
   * Replaced by `unicorn/no-instanceof-builtins` which covers more cases.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/deleted-and-deprecated-rules.md#no-instanceof-array
   * @deprecated
   */
  'unicorn/no-instanceof-array'?: Linter.RuleEntry<[]>
  /**
   * Disallow `instanceof` with built-in objects
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-instanceof-builtins.md
   */
  'unicorn/no-instanceof-builtins'?: Linter.RuleEntry<UnicornNoInstanceofBuiltins>
  /**
   * Disallow invalid options in `fetch()` and `new Request()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-invalid-fetch-options.md
   */
  'unicorn/no-invalid-fetch-options'?: Linter.RuleEntry<[]>
  /**
   * Prevent calling `EventTarget#removeEventListener()` with the result of an expression.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-invalid-remove-event-listener.md
   */
  'unicorn/no-invalid-remove-event-listener'?: Linter.RuleEntry<[]>
  /**
   * Disallow identifiers starting with `new` or `class`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-keyword-prefix.md
   */
  'unicorn/no-keyword-prefix'?: Linter.RuleEntry<UnicornNoKeywordPrefix>
  /**
   * Replaced by `unicorn/no-unnecessary-slice-end` which covers more cases.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/deleted-and-deprecated-rules.md#no-length-as-slice-end
   * @deprecated
   */
  'unicorn/no-length-as-slice-end'?: Linter.RuleEntry<[]>
  /**
   * Disallow `if` statements as the only statement in `if` blocks without `else`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-lonely-if.md
   */
  'unicorn/no-lonely-if'?: Linter.RuleEntry<[]>
  /**
   * Disallow a magic number as the `depth` argument in `Array#flat(…).`
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-magic-array-flat-depth.md
   */
  'unicorn/no-magic-array-flat-depth'?: Linter.RuleEntry<[]>
  /**
   * Disallow named usage of default import and export.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-named-default.md
   */
  'unicorn/no-named-default'?: Linter.RuleEntry<[]>
  /**
   * Disallow negated conditions.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-negated-condition.md
   */
  'unicorn/no-negated-condition'?: Linter.RuleEntry<[]>
  /**
   * Disallow negated expression in equality check.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-negation-in-equality-check.md
   */
  'unicorn/no-negation-in-equality-check'?: Linter.RuleEntry<[]>
  /**
   * Disallow nested ternary expressions.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-nested-ternary.md
   */
  'unicorn/no-nested-ternary'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new Array()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-new-array.md
   */
  'unicorn/no-new-array'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of `Buffer.from()` and `Buffer.alloc()` instead of the deprecated `new Buffer()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-new-buffer.md
   */
  'unicorn/no-new-buffer'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of the `null` literal.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-null.md
   */
  'unicorn/no-null'?: Linter.RuleEntry<UnicornNoNull>
  /**
   * Disallow the use of objects as default parameters.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-object-as-default-parameter.md
   */
  'unicorn/no-object-as-default-parameter'?: Linter.RuleEntry<[]>
  /**
   * Disallow `process.exit()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-process-exit.md
   */
  'unicorn/no-process-exit'?: Linter.RuleEntry<[]>
  /**
   * Disallow passing single-element arrays to `Promise` methods.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-single-promise-in-promise-methods.md
   */
  'unicorn/no-single-promise-in-promise-methods'?: Linter.RuleEntry<[]>
  /**
   * Disallow classes that only have static members.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-static-only-class.md
   */
  'unicorn/no-static-only-class'?: Linter.RuleEntry<[]>
  /**
   * Disallow `then` property.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-thenable.md
   */
  'unicorn/no-thenable'?: Linter.RuleEntry<[]>
  /**
   * Disallow assigning `this` to a variable.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-this-assignment.md
   */
  'unicorn/no-this-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow comparing `undefined` using `typeof`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-typeof-undefined.md
   */
  'unicorn/no-typeof-undefined'?: Linter.RuleEntry<UnicornNoTypeofUndefined>
  /**
   * Disallow using `1` as the `depth` argument of `Array#flat()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unnecessary-array-flat-depth.md
   */
  'unicorn/no-unnecessary-array-flat-depth'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `.length` or `Infinity` as the `deleteCount` or `skipCount` argument of `Array#{splice,toSpliced}()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unnecessary-array-splice-count.md
   */
  'unicorn/no-unnecessary-array-splice-count'?: Linter.RuleEntry<[]>
  /**
   * Disallow awaiting non-promise values.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unnecessary-await.md
   */
  'unicorn/no-unnecessary-await'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of built-in methods instead of unnecessary polyfills.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unnecessary-polyfills.md
   */
  'unicorn/no-unnecessary-polyfills'?: Linter.RuleEntry<UnicornNoUnnecessaryPolyfills>
  /**
   * Disallow using `.length` or `Infinity` as the `end` argument of `{Array,String,TypedArray}#slice()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unnecessary-slice-end.md
   */
  'unicorn/no-unnecessary-slice-end'?: Linter.RuleEntry<[]>
  /**
   * Disallow unreadable array destructuring.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unreadable-array-destructuring.md
   */
  'unicorn/no-unreadable-array-destructuring'?: Linter.RuleEntry<[]>
  /**
   * Disallow unreadable IIFEs.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unreadable-iife.md
   */
  'unicorn/no-unreadable-iife'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused object properties.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-unused-properties.md
   */
  'unicorn/no-unused-properties'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless values or fallbacks in `Set`, `Map`, `WeakSet`, or `WeakMap`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-collection-argument.md
   */
  'unicorn/no-useless-collection-argument'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary `Error.captureStackTrace(…)`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-error-capture-stack-trace.md
   */
  'unicorn/no-useless-error-capture-stack-trace'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless fallback when spreading in object literals.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-fallback-in-spread.md
   */
  'unicorn/no-useless-fallback-in-spread'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless array length check.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-length-check.md
   */
  'unicorn/no-useless-length-check'?: Linter.RuleEntry<[]>
  /**
   * Disallow returning/yielding `Promise.resolve/reject()` in async functions or promise callbacks
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-promise-resolve-reject.md
   */
  'unicorn/no-useless-promise-resolve-reject'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary spread.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-spread.md
   */
  'unicorn/no-useless-spread'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless case in switch statements.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-switch-case.md
   */
  'unicorn/no-useless-switch-case'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless `undefined`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-useless-undefined.md
   */
  'unicorn/no-useless-undefined'?: Linter.RuleEntry<UnicornNoUselessUndefined>
  /**
   * Disallow number literals with zero fractions or dangling dots.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/no-zero-fractions.md
   */
  'unicorn/no-zero-fractions'?: Linter.RuleEntry<[]>
  /**
   * Enforce proper case for numeric literals.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/number-literal-case.md
   */
  'unicorn/number-literal-case'?: Linter.RuleEntry<UnicornNumberLiteralCase>
  /**
   * Enforce the style of numeric separators by correctly grouping digits.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/numeric-separators-style.md
   */
  'unicorn/numeric-separators-style'?: Linter.RuleEntry<UnicornNumericSeparatorsStyle>
  /**
   * Prefer `.addEventListener()` and `.removeEventListener()` over `on`-functions.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-add-event-listener.md
   */
  'unicorn/prefer-add-event-listener'?: Linter.RuleEntry<UnicornPreferAddEventListener>
  /**
   * Prefer `.find(…)` and `.findLast(…)` over the first or last element from `.filter(…)`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-array-find.md
   */
  'unicorn/prefer-array-find'?: Linter.RuleEntry<UnicornPreferArrayFind>
  /**
   * Prefer `Array#flat()` over legacy techniques to flatten arrays.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-array-flat.md
   */
  'unicorn/prefer-array-flat'?: Linter.RuleEntry<UnicornPreferArrayFlat>
  /**
   * Prefer `.flatMap(…)` over `.map(…).flat()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-array-flat-map.md
   */
  'unicorn/prefer-array-flat-map'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Array#{indexOf,lastIndexOf}()` over `Array#{findIndex,findLastIndex}()` when looking for the index of an item.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-array-index-of.md
   */
  'unicorn/prefer-array-index-of'?: Linter.RuleEntry<[]>
  /**
   * Prefer `.some(…)` over `.filter(…).length` check and `.{find,findLast,findIndex,findLastIndex}(…)`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-array-some.md
   */
  'unicorn/prefer-array-some'?: Linter.RuleEntry<[]>
  /**
   * Prefer `.at()` method for index access and `String#charAt()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-at.md
   */
  'unicorn/prefer-at'?: Linter.RuleEntry<UnicornPreferAt>
  /**
   * Prefer `BigInt` literals over the constructor.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-bigint-literals.md
   */
  'unicorn/prefer-bigint-literals'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Blob#arrayBuffer()` over `FileReader#readAsArrayBuffer(…)` and `Blob#text()` over `FileReader#readAsText(…)`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-blob-reading-methods.md
   */
  'unicorn/prefer-blob-reading-methods'?: Linter.RuleEntry<[]>
  /**
   * Prefer class field declarations over `this` assignments in constructors.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-class-fields.md
   */
  'unicorn/prefer-class-fields'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `Element#classList.toggle()` to toggle class names.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-classlist-toggle.md
   */
  'unicorn/prefer-classlist-toggle'?: Linter.RuleEntry<[]>
  /**
   * Prefer `String#codePointAt(…)` over `String#charCodeAt(…)` and `String.fromCodePoint(…)` over `String.fromCharCode(…)`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-code-point.md
   */
  'unicorn/prefer-code-point'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Date.now()` to get the number of milliseconds since the Unix Epoch.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-date-now.md
   */
  'unicorn/prefer-date-now'?: Linter.RuleEntry<[]>
  /**
   * Prefer default parameters over reassignment.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-default-parameters.md
   */
  'unicorn/prefer-default-parameters'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Node#append()` over `Node#appendChild()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-dom-node-append.md
   */
  'unicorn/prefer-dom-node-append'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `.dataset` on DOM elements over calling attribute methods.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-dom-node-dataset.md
   */
  'unicorn/prefer-dom-node-dataset'?: Linter.RuleEntry<[]>
  /**
   * Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-dom-node-remove.md
   */
  'unicorn/prefer-dom-node-remove'?: Linter.RuleEntry<[]>
  /**
   * Prefer `.textContent` over `.innerText`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-dom-node-text-content.md
   */
  'unicorn/prefer-dom-node-text-content'?: Linter.RuleEntry<[]>
  /**
   * Prefer `EventTarget` over `EventEmitter`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-event-target.md
   */
  'unicorn/prefer-event-target'?: Linter.RuleEntry<[]>
  /**
   * Prefer `export…from` when re-exporting.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-export-from.md
   */
  'unicorn/prefer-export-from'?: Linter.RuleEntry<UnicornPreferExportFrom>
  /**
   * Prefer `globalThis` over `window`, `self`, and `global`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-global-this.md
   */
  'unicorn/prefer-global-this'?: Linter.RuleEntry<[]>
  /**
   * Prefer `import.meta.{dirname,filename}` over legacy techniques for getting file paths.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-import-meta-properties.md
   */
  'unicorn/prefer-import-meta-properties'?: Linter.RuleEntry<[]>
  /**
   * Prefer `.includes()` over `.indexOf()`, `.lastIndexOf()`, and `Array#some()` when checking for existence or non-existence.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-includes.md
   */
  'unicorn/prefer-includes'?: Linter.RuleEntry<[]>
  /**
   * Prefer reading a JSON file as a buffer.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-json-parse-buffer.md
   */
  'unicorn/prefer-json-parse-buffer'?: Linter.RuleEntry<[]>
  /**
   * Prefer `KeyboardEvent#key` over `KeyboardEvent#keyCode`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-keyboard-event-key.md
   */
  'unicorn/prefer-keyboard-event-key'?: Linter.RuleEntry<[]>
  /**
   * Prefer using a logical operator over a ternary.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-logical-operator-over-ternary.md
   */
  'unicorn/prefer-logical-operator-over-ternary'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Math.min()` and `Math.max()` over ternaries for simple comparisons.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-math-min-max.md
   */
  'unicorn/prefer-math-min-max'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of `Math.trunc` instead of bitwise operators.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-math-trunc.md
   */
  'unicorn/prefer-math-trunc'?: Linter.RuleEntry<[]>
  /**
   * Prefer `.before()` over `.insertBefore()`, `.replaceWith()` over `.replaceChild()`, prefer one of `.before()`, `.after()`, `.append()` or `.prepend()` over `insertAdjacentText()` and `insertAdjacentElement()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-modern-dom-apis.md
   */
  'unicorn/prefer-modern-dom-apis'?: Linter.RuleEntry<[]>
  /**
   * Prefer modern `Math` APIs over legacy patterns.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-modern-math-apis.md
   */
  'unicorn/prefer-modern-math-apis'?: Linter.RuleEntry<[]>
  /**
   * Prefer JavaScript modules (ESM) over CommonJS.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-module.md
   */
  'unicorn/prefer-module'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `String`, `Number`, `BigInt`, `Boolean`, and `Symbol` directly.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-native-coercion-functions.md
   */
  'unicorn/prefer-native-coercion-functions'?: Linter.RuleEntry<[]>
  /**
   * Prefer negative index over `.length - index` when possible.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-negative-index.md
   */
  'unicorn/prefer-negative-index'?: Linter.RuleEntry<[]>
  /**
   * Prefer using the `node:` protocol when importing Node.js builtin modules.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-node-protocol.md
   */
  'unicorn/prefer-node-protocol'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Number` static properties over global ones.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-number-properties.md
   */
  'unicorn/prefer-number-properties'?: Linter.RuleEntry<UnicornPreferNumberProperties>
  /**
   * Prefer using `Object.fromEntries(…)` to transform a list of key-value pairs into an object.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-object-from-entries.md
   */
  'unicorn/prefer-object-from-entries'?: Linter.RuleEntry<UnicornPreferObjectFromEntries>
  /**
   * Prefer omitting the `catch` binding parameter.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-optional-catch-binding.md
   */
  'unicorn/prefer-optional-catch-binding'?: Linter.RuleEntry<[]>
  /**
   * Prefer borrowing methods from the prototype instead of the instance.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-prototype-methods.md
   */
  'unicorn/prefer-prototype-methods'?: Linter.RuleEntry<[]>
  /**
   * Prefer `.querySelector()` over `.getElementById()`, `.querySelectorAll()` over `.getElementsByClassName()` and `.getElementsByTagName()` and `.getElementsByName()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-query-selector.md
   */
  'unicorn/prefer-query-selector'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Reflect.apply()` over `Function#apply()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-reflect-apply.md
   */
  'unicorn/prefer-reflect-apply'?: Linter.RuleEntry<[]>
  /**
   * Prefer `RegExp#test()` over `String#match()` and `RegExp#exec()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-regexp-test.md
   */
  'unicorn/prefer-regexp-test'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Response.json()` over `new Response(JSON.stringify())`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-response-static-json.md
   */
  'unicorn/prefer-response-static-json'?: Linter.RuleEntry<[]>
  /**
   * Prefer `Set#has()` over `Array#includes()` when checking for existence or non-existence.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-set-has.md
   */
  'unicorn/prefer-set-has'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `Set#size` instead of `Array#length`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-set-size.md
   */
  'unicorn/prefer-set-size'?: Linter.RuleEntry<[]>
  /**
   * Enforce combining multiple `Array#push()`, `Element#classList.{add,remove}()`, and `importScripts()` into one call.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-single-call.md
   */
  'unicorn/prefer-single-call'?: Linter.RuleEntry<UnicornPreferSingleCall>
  /**
   * Prefer the spread operator over `Array.from(…)`, `Array#concat(…)`, `Array#{slice,toSpliced}()` and `String#split('')`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-spread.md
   */
  'unicorn/prefer-spread'?: Linter.RuleEntry<[]>
  /**
   * Prefer using the `String.raw` tag to avoid escaping `\`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-string-raw.md
   */
  'unicorn/prefer-string-raw'?: Linter.RuleEntry<[]>
  /**
   * Prefer `String#replaceAll()` over regex searches with the global flag.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-string-replace-all.md
   */
  'unicorn/prefer-string-replace-all'?: Linter.RuleEntry<[]>
  /**
   * Prefer `String#slice()` over `String#substr()` and `String#substring()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-string-slice.md
   */
  'unicorn/prefer-string-slice'?: Linter.RuleEntry<[]>
  /**
   * Prefer `String#startsWith()` & `String#endsWith()` over `RegExp#test()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-string-starts-ends-with.md
   */
  'unicorn/prefer-string-starts-ends-with'?: Linter.RuleEntry<[]>
  /**
   * Prefer `String#trimStart()` / `String#trimEnd()` over `String#trimLeft()` / `String#trimRight()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-string-trim-start-end.md
   */
  'unicorn/prefer-string-trim-start-end'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `structuredClone` to create a deep clone.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-structured-clone.md
   */
  'unicorn/prefer-structured-clone'?: Linter.RuleEntry<UnicornPreferStructuredClone>
  /**
   * Prefer `switch` over multiple `else-if`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-switch.md
   */
  'unicorn/prefer-switch'?: Linter.RuleEntry<UnicornPreferSwitch>
  /**
   * Prefer ternary expressions over simple `if-else` statements.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-ternary.md
   */
  'unicorn/prefer-ternary'?: Linter.RuleEntry<UnicornPreferTernary>
  /**
   * Prefer top-level await over top-level promises and async function calls.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-top-level-await.md
   */
  'unicorn/prefer-top-level-await'?: Linter.RuleEntry<[]>
  /**
   * Enforce throwing `TypeError` in type checking conditions.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prefer-type-error.md
   */
  'unicorn/prefer-type-error'?: Linter.RuleEntry<[]>
  /**
   * Prevent abbreviations.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/prevent-abbreviations.md
   */
  'unicorn/prevent-abbreviations'?: Linter.RuleEntry<UnicornPreventAbbreviations>
  /**
   * Enforce consistent relative URL style.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/relative-url-style.md
   */
  'unicorn/relative-url-style'?: Linter.RuleEntry<UnicornRelativeUrlStyle>
  /**
   * Enforce using the separator argument with `Array#join()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/require-array-join-separator.md
   */
  'unicorn/require-array-join-separator'?: Linter.RuleEntry<[]>
  /**
   * Require non-empty module attributes for imports and exports
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/require-module-attributes.md
   */
  'unicorn/require-module-attributes'?: Linter.RuleEntry<[]>
  /**
   * Require non-empty specifier list in import and export statements.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/require-module-specifiers.md
   */
  'unicorn/require-module-specifiers'?: Linter.RuleEntry<[]>
  /**
   * Enforce using the digits argument with `Number#toFixed()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/require-number-to-fixed-digits-argument.md
   */
  'unicorn/require-number-to-fixed-digits-argument'?: Linter.RuleEntry<[]>
  /**
   * Enforce using the `targetOrigin` argument with `window.postMessage()`.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/require-post-message-target-origin.md
   */
  'unicorn/require-post-message-target-origin'?: Linter.RuleEntry<[]>
  /**
   * Enforce better string content.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/string-content.md
   */
  'unicorn/string-content'?: Linter.RuleEntry<UnicornStringContent>
  /**
   * Enforce consistent brace style for `case` clauses.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/switch-case-braces.md
   */
  'unicorn/switch-case-braces'?: Linter.RuleEntry<UnicornSwitchCaseBraces>
  /**
   * Fix whitespace-insensitive template indentation.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/template-indent.md
   */
  'unicorn/template-indent'?: Linter.RuleEntry<UnicornTemplateIndent>
  /**
   * Enforce consistent case for text encoding identifiers.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/text-encoding-identifier-case.md
   */
  'unicorn/text-encoding-identifier-case'?: Linter.RuleEntry<UnicornTextEncodingIdentifierCase>
  /**
   * Require `new` when creating an error.
   * @see https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v63.0.0/docs/rules/throw-new-error.md
   */
  'unicorn/throw-new-error'?: Linter.RuleEntry<[]>
  /**
   * Require calls to `isNaN()` when checking for `NaN`
   * @see https://eslint.org/docs/latest/rules/use-isnan
   */
  'use-isnan'?: Linter.RuleEntry<UseIsnan>
  /**
   * Enforce comparing `typeof` expressions against valid strings
   * @see https://eslint.org/docs/latest/rules/valid-typeof
   */
  'valid-typeof'?: Linter.RuleEntry<ValidTypeof>
  /**
   * Require `var` declarations be placed at the top of their containing scope
   * @see https://eslint.org/docs/latest/rules/vars-on-top
   */
  'vars-on-top'?: Linter.RuleEntry<[]>
  /**
   * Require parentheses around immediate `function` invocations
   * @see https://eslint.org/docs/latest/rules/wrap-iife
   * @deprecated
   */
  'wrap-iife'?: Linter.RuleEntry<WrapIife>
  /**
   * Require parenthesis around regex literals
   * @see https://eslint.org/docs/latest/rules/wrap-regex
   * @deprecated
   */
  'wrap-regex'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around the `*` in `yield*` expressions
   * @see https://eslint.org/docs/latest/rules/yield-star-spacing
   * @deprecated
   */
  'yield-star-spacing'?: Linter.RuleEntry<YieldStarSpacing>
  /**
   * require or disallow block style mappings.
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/block-mapping.html
   */
  'yml/block-mapping'?: Linter.RuleEntry<YmlBlockMapping>
  /**
   * enforce consistent line breaks after `:` indicator
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/block-mapping-colon-indicator-newline.html
   */
  'yml/block-mapping-colon-indicator-newline'?: Linter.RuleEntry<YmlBlockMappingColonIndicatorNewline>
  /**
   * enforce consistent line breaks after `?` indicator
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/block-mapping-question-indicator-newline.html
   */
  'yml/block-mapping-question-indicator-newline'?: Linter.RuleEntry<YmlBlockMappingQuestionIndicatorNewline>
  /**
   * require or disallow block style sequences.
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/block-sequence.html
   */
  'yml/block-sequence'?: Linter.RuleEntry<YmlBlockSequence>
  /**
   * enforce consistent line breaks after `-` indicator
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/block-sequence-hyphen-indicator-newline.html
   */
  'yml/block-sequence-hyphen-indicator-newline'?: Linter.RuleEntry<YmlBlockSequenceHyphenIndicatorNewline>
  /**
   * enforce YAML file extension
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/file-extension.html
   */
  'yml/file-extension'?: Linter.RuleEntry<YmlFileExtension>
  /**
   * enforce consistent line breaks inside braces
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/flow-mapping-curly-newline.html
   */
  'yml/flow-mapping-curly-newline'?: Linter.RuleEntry<YmlFlowMappingCurlyNewline>
  /**
   * enforce consistent spacing inside braces
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/flow-mapping-curly-spacing.html
   */
  'yml/flow-mapping-curly-spacing'?: Linter.RuleEntry<YmlFlowMappingCurlySpacing>
  /**
   * enforce linebreaks after opening and before closing flow sequence brackets
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/flow-sequence-bracket-newline.html
   */
  'yml/flow-sequence-bracket-newline'?: Linter.RuleEntry<YmlFlowSequenceBracketNewline>
  /**
   * enforce consistent spacing inside flow sequence brackets
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/flow-sequence-bracket-spacing.html
   */
  'yml/flow-sequence-bracket-spacing'?: Linter.RuleEntry<YmlFlowSequenceBracketSpacing>
  /**
   * enforce consistent indentation
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/indent.html
   */
  'yml/indent'?: Linter.RuleEntry<YmlIndent>
  /**
   * enforce naming convention to key names
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/key-name-casing.html
   */
  'yml/key-name-casing'?: Linter.RuleEntry<YmlKeyNameCasing>
  /**
   * enforce consistent spacing between keys and values in mapping pairs
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/key-spacing.html
   */
  'yml/key-spacing'?: Linter.RuleEntry<YmlKeySpacing>
  /**
   * disallow empty document
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-empty-document.html
   */
  'yml/no-empty-document'?: Linter.RuleEntry<[]>
  /**
   * disallow empty mapping keys
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-empty-key.html
   */
  'yml/no-empty-key'?: Linter.RuleEntry<[]>
  /**
   * disallow empty mapping values
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-empty-mapping-value.html
   */
  'yml/no-empty-mapping-value'?: Linter.RuleEntry<[]>
  /**
   * disallow empty sequence entries
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-empty-sequence-entry.html
   */
  'yml/no-empty-sequence-entry'?: Linter.RuleEntry<[]>
  /**
   * disallow irregular whitespace
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-irregular-whitespace.html
   */
  'yml/no-irregular-whitespace'?: Linter.RuleEntry<YmlNoIrregularWhitespace>
  /**
   * disallow multiple empty lines
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-multiple-empty-lines.html
   */
  'yml/no-multiple-empty-lines'?: Linter.RuleEntry<YmlNoMultipleEmptyLines>
  /**
   * disallow tabs for indentation.
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-tab-indent.html
   */
  'yml/no-tab-indent'?: Linter.RuleEntry<[]>
  /**
   * disallow trailing zeros for floats
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/no-trailing-zeros.html
   */
  'yml/no-trailing-zeros'?: Linter.RuleEntry<[]>
  /**
   * require or disallow plain style scalar.
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/plain-scalar.html
   */
  'yml/plain-scalar'?: Linter.RuleEntry<YmlPlainScalar>
  /**
   * enforce the consistent use of either double, or single quotes
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/quotes.html
   */
  'yml/quotes'?: Linter.RuleEntry<YmlQuotes>
  /**
   * disallow mapping keys other than strings
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/require-string-key.html
   */
  'yml/require-string-key'?: Linter.RuleEntry<[]>
  /**
   * require mapping keys to be sorted
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/sort-keys.html
   */
  'yml/sort-keys'?: Linter.RuleEntry<YmlSortKeys>
  /**
   * require sequence values to be sorted
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/sort-sequence-values.html
   */
  'yml/sort-sequence-values'?: Linter.RuleEntry<YmlSortSequenceValues>
  /**
   * enforce consistent spacing after the `#` in a comment
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/spaced-comment.html
   */
  'yml/spaced-comment'?: Linter.RuleEntry<YmlSpacedComment>
  /**
   * disallow parsing errors in Vue custom blocks
   * @see https://ota-meshi.github.io/eslint-plugin-yml/rules/vue-custom-block/no-parsing-error.html
   */
  'yml/vue-custom-block/no-parsing-error'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow "Yoda" conditions
   * @see https://eslint.org/docs/latest/rules/yoda
   */
  'yoda'?: Linter.RuleEntry<Yoda>
  /**
   * Enforce consistent Zod array style
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/array-style.md
   */
  'zod/array-style'?: Linter.RuleEntry<ZodArrayStyle>
  /**
   * Enforce a consistent import style for Zod
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/consistent-import.md
   */
  'zod/consistent-import'?: Linter.RuleEntry<ZodConsistentImport>
  /**
   * Enforce consistent source from Zod imports
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/consistent-import-source.md
   */
  'zod/consistent-import-source'?: Linter.RuleEntry<ZodConsistentImportSource>
  /**
   * Enforce consistent usage of Zod schema methods
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/consistent-object-schema-type.md
   */
  'zod/consistent-object-schema-type'?: Linter.RuleEntry<ZodConsistentObjectSchemaType>
  /**
   * Disallow usage of `z.any()` in Zod schemas
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/no-any-schema.md
   */
  'zod/no-any-schema'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of `z.custom()` without arguments
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/no-empty-custom-schema.md
   */
  'zod/no-empty-custom-schema'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of `z.number().int()` as it is considered legacy
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/no-number-schema-with-int.md
   */
  'zod/no-number-schema-with-int'?: Linter.RuleEntry<[]>
  /**
   * Disallow using both `.optional()` and `.default()` on the same Zod schema
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/no-optional-and-default-together.md
   */
  'zod/no-optional-and-default-together'?: Linter.RuleEntry<ZodNoOptionalAndDefaultTogether>
  /**
   * Disallow throwing errors directly inside Zod refine callbacks
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/no-throw-in-refine.md
   */
  'zod/no-throw-in-refine'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of `z.unknown()` in Zod schemas
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/no-unknown-schema.md
   */
  'zod/no-unknown-schema'?: Linter.RuleEntry<[]>
  /**
   * Prefer `z.enum()` over `z.union()` when all members are string literals.
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/prefer-enum-over-literal-union.md
   */
  'zod/prefer-enum-over-literal-union'?: Linter.RuleEntry<[]>
  /**
   * Enforce usage of `.meta()` over `.describe()`
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/prefer-meta.md
   */
  'zod/prefer-meta'?: Linter.RuleEntry<[]>
  /**
   * Enforce `.meta()` as last method
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/prefer-meta-last.md
   */
  'zod/prefer-meta-last'?: Linter.RuleEntry<[]>
  /**
   * Enforce importing zod as a namespace import (`import * as z from 'zod'`)
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/prefer-namespace-import.md
   * @deprecated
   */
  'zod/prefer-namespace-import'?: Linter.RuleEntry<[]>
  /**
   * Require type parameter on `.brand()` functions
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/require-brand-type-parameter.md
   */
  'zod/require-brand-type-parameter'?: Linter.RuleEntry<[]>
  /**
   * Enforce that custom refinements include an error message
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/require-error-message.md
   */
  'zod/require-error-message'?: Linter.RuleEntry<[]>
  /**
   * Require schema suffix when declaring a Zod schema
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/require-schema-suffix.md
   */
  'zod/require-schema-suffix'?: Linter.RuleEntry<ZodRequireSchemaSuffix>
  /**
   * Enforce consistent style for error messages in Zod schema validation (using ESQuery patterns)
   * @see https://github.com/marcalexiei/eslint-plugin-zod/blob/HEAD/docs/rules/schema-error-property-style.md
   */
  'zod/schema-error-property-style'?: Linter.RuleEntry<ZodSchemaErrorPropertyStyle>
}

/* ======= Declarations ======= */
// ----- accessor-pairs -----
type AccessorPairs = []|[{
  getWithoutSet?: boolean
  setWithoutGet?: boolean
  enforceForClassMembers?: boolean
  enforceForTSTypes?: boolean
}]
// ----- antfu/consistent-chaining -----
type AntfuConsistentChaining = []|[{
  
  allowLeadingPropertyAccess?: boolean
}]
// ----- antfu/consistent-list-newline -----
type AntfuConsistentListNewline = []|[{
  ArrayExpression?: boolean
  ArrayPattern?: boolean
  ArrowFunctionExpression?: boolean
  CallExpression?: boolean
  ExportNamedDeclaration?: boolean
  FunctionDeclaration?: boolean
  FunctionExpression?: boolean
  IfStatement?: boolean
  ImportDeclaration?: boolean
  JSONArrayExpression?: boolean
  JSONObjectExpression?: boolean
  JSXOpeningElement?: boolean
  NewExpression?: boolean
  ObjectExpression?: boolean
  ObjectPattern?: boolean
  TSFunctionType?: boolean
  TSInterfaceDeclaration?: boolean
  TSTupleType?: boolean
  TSTypeLiteral?: boolean
  TSTypeParameterDeclaration?: boolean
  TSTypeParameterInstantiation?: boolean
}]
// ----- antfu/indent-unindent -----
type AntfuIndentUnindent = []|[{
  indent?: number
  tags?: string[]
}]
// ----- array-bracket-newline -----
type ArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- array-bracket-spacing -----
type ArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- array-callback-return -----
type ArrayCallbackReturn = []|[{
  allowImplicit?: boolean
  checkForEach?: boolean
  allowVoid?: boolean
}]
// ----- array-element-newline -----
type ArrayElementNewline = []|[(_ArrayElementNewlineBasicConfig | {
  ArrayExpression?: _ArrayElementNewlineBasicConfig
  ArrayPattern?: _ArrayElementNewlineBasicConfig
})]
type _ArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})
// ----- arrow-body-style -----
type ArrowBodyStyle = ([]|[("always" | "never")] | []|["as-needed"]|["as-needed", {
  requireReturnForObjectLiteral?: boolean
}])
// ----- arrow-parens -----
type ArrowParens = []|[("always" | "as-needed")]|[("always" | "as-needed"), {
  requireForBlockBody?: boolean
}]
// ----- arrow-spacing -----
type ArrowSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- block-spacing -----
type BlockSpacing = []|[("always" | "never")]
// ----- brace-style -----
type BraceStyle = []|[("1tbs" | "stroustrup" | "allman")]|[("1tbs" | "stroustrup" | "allman"), {
  allowSingleLine?: boolean
}]
// ----- callback-return -----
type CallbackReturn = []|[string[]]
// ----- camelcase -----
type Camelcase = []|[{
  ignoreDestructuring?: boolean
  ignoreImports?: boolean
  ignoreGlobals?: boolean
  properties?: ("always" | "never")
  
  allow?: string[]
}]
// ----- capitalized-comments -----
type CapitalizedComments = []|[("always" | "never")]|[("always" | "never"), ({
  ignorePattern?: string
  ignoreInlineComments?: boolean
  ignoreConsecutiveComments?: boolean
} | {
  line?: {
    ignorePattern?: string
    ignoreInlineComments?: boolean
    ignoreConsecutiveComments?: boolean
  }
  block?: {
    ignorePattern?: string
    ignoreInlineComments?: boolean
    ignoreConsecutiveComments?: boolean
  }
})]
// ----- class-methods-use-this -----
type ClassMethodsUseThis = []|[{
  exceptMethods?: string[]
  enforceForClassFields?: boolean
  ignoreOverrideMethods?: boolean
  ignoreClassesWithImplements?: ("all" | "public-fields")
}]
// ----- comma-dangle -----
type CommaDangle = []|[(_CommaDangleValue | {
  arrays?: _CommaDangleValueWithIgnore
  objects?: _CommaDangleValueWithIgnore
  imports?: _CommaDangleValueWithIgnore
  exports?: _CommaDangleValueWithIgnore
  functions?: _CommaDangleValueWithIgnore
})]
type _CommaDangleValue = ("always-multiline" | "always" | "never" | "only-multiline")
type _CommaDangleValueWithIgnore = ("always-multiline" | "always" | "ignore" | "never" | "only-multiline")
// ----- comma-spacing -----
type CommaSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- comma-style -----
type CommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- comments/disable-enable-pair -----
type CommentsDisableEnablePair = []|[{
  allowWholeFile?: boolean
}]
// ----- comments/no-restricted-disable -----
type CommentsNoRestrictedDisable = string[]
// ----- comments/no-use -----
type CommentsNoUse = []|[{
  allow?: ("eslint" | "eslint-disable" | "eslint-disable-line" | "eslint-disable-next-line" | "eslint-enable" | "eslint-env" | "exported" | "global" | "globals")[]
}]
// ----- comments/require-description -----
type CommentsRequireDescription = []|[{
  ignore?: ("eslint" | "eslint-disable" | "eslint-disable-line" | "eslint-disable-next-line" | "eslint-enable" | "eslint-env" | "exported" | "global" | "globals")[]
}]
// ----- complexity -----
type Complexity = []|[(number | {
  maximum?: number
  max?: number
  variant?: ("classic" | "modified")
})]
// ----- computed-property-spacing -----
type ComputedPropertySpacing = []|[("always" | "never")]|[("always" | "never"), {
  enforceForClassMembers?: boolean
}]
// ----- consistent-return -----
type ConsistentReturn = []|[{
  treatUndefinedAsUnspecified?: boolean
}]
// ----- consistent-this -----
type ConsistentThis = string[]
// ----- css/no-invalid-properties -----
type CssNoInvalidProperties = []|[{
  allowUnknownVariables?: boolean
}]
// ----- css/prefer-logical-properties -----
type CssPreferLogicalProperties = []|[{
  allowProperties?: ("bottom" | "border-bottom" | "border-bottom-color" | "border-bottom-left-radius" | "border-bottom-right-radius" | "border-bottom-style" | "border-bottom-width" | "border-left" | "border-left-color" | "border-left-style" | "border-left-width" | "border-right" | "border-right-color" | "border-right-style" | "border-right-width" | "border-top" | "border-top-color" | "border-top-left-radius" | "border-top-right-radius" | "border-top-style" | "border-top-width" | "contain-intrinsic-height" | "contain-intrinsic-width" | "height" | "left" | "margin-bottom" | "margin-left" | "margin-right" | "margin-top" | "max-height" | "max-width" | "min-height" | "min-width" | "overflow-x" | "overflow-y" | "overscroll-behavior-x" | "overscroll-behavior-y" | "padding-bottom" | "padding-left" | "padding-right" | "padding-top" | "right" | "scroll-margin-bottom" | "scroll-margin-left" | "scroll-margin-right" | "scroll-margin-top" | "scroll-padding-bottom" | "scroll-padding-left" | "scroll-padding-right" | "scroll-padding-top" | "top" | "width")[]
  allowUnits?: ("cqh" | "cqw" | "dvh" | "dvw" | "lvh" | "lvw" | "svh" | "svw" | "vh" | "vw")[]
}]
// ----- css/relative-font-units -----
type CssRelativeFontUnits = []|[{
  allowUnits?: ("%" | "cap" | "ch" | "em" | "ex" | "ic" | "lh" | "rcap" | "rch" | "rem" | "rex" | "ric" | "rlh")[]
}]
// ----- css/selector-complexity -----
type CssSelectorComplexity = []|[{
  maxIds?: number
  maxClasses?: number
  maxTypes?: number
  maxAttributes?: number
  maxPseudoClasses?: number
  maxUniversals?: number
  maxCompounds?: number
  maxCombinators?: number
  disallowCombinators?: string[]
  disallowPseudoClasses?: string[]
  disallowPseudoElements?: string[]
  disallowAttributes?: string[]
  disallowAttributeMatchers?: string[]
}]
// ----- css/use-baseline -----
type CssUseBaseline = []|[{
  available?: (("widely" | "newly") | number)
  allowAtRules?: ("position-try" | "keyframes" | "layer" | "charset" | "container" | "counter-style" | "view-transition" | "font-face" | "font-palette-values" | "font-feature-values" | "function" | "import" | "media" | "namespace" | "page" | "property" | "scope" | "starting-style" | "supports")[]
  allowFunctions?: ("abs" | "sign" | "anchor" | "anchor-size" | "color" | "attr" | "calc" | "calc-size" | "rect" | "color-mix" | "conic-gradient" | "repeating-conic-gradient" | "round" | "counter" | "counters" | "cross-fade" | "cubic-bezier" | "var" | "element" | "exp" | "hypot" | "log" | "pow" | "sqrt" | "blur" | "brightness" | "contrast" | "drop-shadow" | "grayscale" | "hue-rotate" | "invert" | "opacity" | "saturate" | "sepia" | "linear-gradient" | "radial-gradient" | "repeating-linear-gradient" | "repeating-radial-gradient" | "image" | "hsl" | "hwb" | "image-set" | "lab" | "lch" | "light-dark" | "clamp" | "max" | "min" | "ray" | "oklab" | "oklch" | "paint" | "path" | "rem" | "rgb" | "mod" | "env" | "circle" | "ellipse" | "inset" | "polygon" | "xywh" | "steps" | "matrix" | "rotate" | "scale" | "scaleX" | "scaleY" | "skew" | "skewX" | "skewY" | "translate" | "translateX" | "translateY" | "matrix3d" | "perspective" | "rotate3d" | "rotateX" | "rotateY" | "rotateZ" | "scale3d" | "scaleZ" | "translate3d" | "translateZ" | "acos" | "asin" | "atan" | "atan2" | "cos" | "sin" | "tan")[]
  allowMediaConditions?: ("color-gamut" | "device-posture" | "device-aspect-ratio" | "device-height" | "device-width" | "display-mode" | "dynamic-range" | "forced-colors" | "any-hover" | "any-pointer" | "hover" | "pointer" | "inverted-colors" | "aspect-ratio" | "calc" | "color" | "color-index" | "grid" | "height" | "monochrome" | "nested-queries" | "orientation" | "width" | "overflow-block" | "overflow-inline" | "prefers-color-scheme" | "prefers-contrast" | "prefers-reduced-data" | "prefers-reduced-motion" | "prefers-reduced-transparency" | "resolution" | "-webkit-device-pixel-ratio" | "-webkit-max-device-pixel-ratio" | "-webkit-min-device-pixel-ratio" | "scripting" | "-webkit-transform-3d" | "update" | "video-dynamic-range" | "horizontal-viewport-segments" | "vertical-viewport-segments")[]
  allowProperties?: ("accent-color" | "alignment-baseline" | "all" | "anchor-name" | "anchor-scope" | "position-anchor" | "position-area" | "position-try" | "position-try-fallbacks" | "position-try-order" | "position-visibility" | "animation-composition" | "animation" | "animation-delay" | "animation-direction" | "animation-duration" | "animation-fill-mode" | "animation-iteration-count" | "animation-name" | "animation-play-state" | "animation-timing-function" | "appearance" | "aspect-ratio" | "backdrop-filter" | "background" | "background-attachment" | "background-blend-mode" | "background-clip" | "background-color" | "background-image" | "background-origin" | "background-position" | "background-position-x" | "background-position-y" | "background-repeat" | "background-size" | "baseline-shift" | "baseline-source" | "border-image" | "border-image-outset" | "border-image-repeat" | "border-image-slice" | "border-image-source" | "border-image-width" | "border-bottom-left-radius" | "border-bottom-right-radius" | "border-radius" | "border-top-left-radius" | "border-top-right-radius" | "border" | "border-bottom" | "border-bottom-color" | "border-bottom-style" | "border-bottom-width" | "border-color" | "border-left" | "border-left-color" | "border-left-style" | "border-left-width" | "border-right" | "border-right-color" | "border-right-style" | "border-right-width" | "border-style" | "border-top" | "border-top-color" | "border-top-style" | "border-top-width" | "border-width" | "box-decoration-break" | "box-shadow" | "box-sizing" | "caret-color" | "caret-shape" | "clip" | "clip-path" | "color" | "color-adjust" | "color-scheme" | "column-fill" | "column-span" | "contain" | "contain-intrinsic-block-size" | "contain-intrinsic-height" | "contain-intrinsic-inline-size" | "contain-intrinsic-size" | "contain-intrinsic-width" | "container" | "container-name" | "container-type" | "content" | "content-visibility" | "corner-block-end-shape" | "corner-block-start-shape" | "corner-bottom-left-shape" | "corner-bottom-right-shape" | "corner-bottom-shape" | "corner-end-end-shape" | "corner-end-start-shape" | "corner-inline-end-shape" | "corner-inline-start-shape" | "corner-left-shape" | "corner-right-shape" | "corner-shape" | "corner-start-end-shape" | "corner-start-start-shape" | "corner-top-left-shape" | "corner-top-right-shape" | "corner-top-shape" | "counter-set" | "counter-increment" | "counter-reset" | "custom-property" | "display" | "dominant-baseline" | "field-sizing" | "filter" | "align-content" | "align-items" | "align-self" | "flex" | "flex-basis" | "flex-direction" | "flex-flow" | "flex-grow" | "flex-shrink" | "flex-wrap" | "justify-content" | "justify-items" | "order" | "place-content" | "place-items" | "place-self" | "clear" | "float" | "font-family" | "font-feature-settings" | "font-kerning" | "font-language-override" | "font-optical-sizing" | "font-palette" | "font" | "font-size" | "font-size-adjust" | "font-stretch" | "font-style" | "font-synthesis" | "font-synthesis-position" | "font-synthesis-small-caps" | "font-synthesis-style" | "font-synthesis-weight" | "font-variant" | "font-variant-alternates" | "font-variant-caps" | "font-variant-east-asian" | "font-variant-emoji" | "font-variant-ligatures" | "font-variant-numeric" | "font-variant-position" | "font-variation-settings" | "font-weight" | "font-width" | "forced-color-adjust" | "glyph-orientation-vertical" | "gap" | "grid" | "grid-area" | "grid-auto-columns" | "grid-auto-flow" | "grid-auto-rows" | "grid-column" | "grid-column-end" | "grid-column-start" | "grid-row" | "grid-row-end" | "grid-row-start" | "grid-template" | "grid-template-areas" | "grid-template-columns" | "grid-template-rows" | "justify-self" | "row-gap" | "hanging-punctuation" | "hyphenate-character" | "hyphenate-limit-chars" | "hyphens" | "image-orientation" | "image-rendering" | "ime-mode" | "rotate" | "scale" | "translate" | "initial-letter" | "interactivity" | "interpolate-size" | "isolation" | "direction" | "unicode-bidi" | "letter-spacing" | "line-break" | "line-clamp" | "line-height" | "list-style" | "list-style-image" | "list-style-position" | "list-style-type" | "block-size" | "border-block" | "border-block-color" | "border-block-end" | "border-block-end-color" | "border-block-end-style" | "border-block-end-width" | "border-block-start" | "border-block-start-color" | "border-block-start-style" | "border-block-start-width" | "border-block-style" | "border-block-width" | "border-end-end-radius" | "border-end-start-radius" | "border-inline" | "border-inline-color" | "border-inline-end" | "border-inline-end-color" | "border-inline-end-style" | "border-inline-end-width" | "border-inline-start" | "border-inline-start-color" | "border-inline-start-style" | "border-inline-start-width" | "border-inline-style" | "border-inline-width" | "border-start-end-radius" | "border-start-start-radius" | "inline-size" | "inset" | "inset-block" | "inset-block-end" | "inset-block-start" | "inset-inline" | "inset-inline-end" | "inset-inline-start" | "margin-block" | "margin-block-end" | "margin-block-start" | "margin-inline" | "margin-inline-end" | "margin-inline-start" | "max-block-size" | "max-inline-size" | "min-block-size" | "min-inline-size" | "overflow-block" | "overflow-inline" | "padding-block" | "padding-block-end" | "padding-block-start" | "padding-inline" | "padding-inline-end" | "padding-inline-start" | "margin" | "margin-bottom" | "margin-left" | "margin-right" | "margin-top" | "margin-trim" | "mask-border" | "mask-border-outset" | "mask-border-repeat" | "mask-border-slice" | "mask-border-source" | "mask-border-width" | "mask-type" | "mask" | "mask-clip" | "mask-composite" | "mask-image" | "mask-mode" | "mask-origin" | "mask-position" | "mask-repeat" | "mask-size" | "math-depth" | "math-shift" | "math-style" | "max-height" | "max-width" | "min-height" | "min-width" | "mix-blend-mode" | "offset" | "offset-anchor" | "offset-distance" | "offset-path" | "offset-position" | "offset-rotate" | "column-count" | "column-gap" | "column-rule" | "column-rule-color" | "column-rule-style" | "column-rule-width" | "column-width" | "columns" | "object-fit" | "object-position" | "object-view-box" | "opacity" | "fill-opacity" | "stroke-opacity" | "outline" | "outline-color" | "outline-offset" | "outline-style" | "outline-width" | "overflow-anchor" | "overflow-clip-margin" | "overflow" | "overflow-x" | "overflow-y" | "overflow-wrap" | "overlay" | "overscroll-behavior" | "overscroll-behavior-block" | "overscroll-behavior-inline" | "overscroll-behavior-x" | "overscroll-behavior-y" | "padding" | "padding-bottom" | "padding-left" | "padding-right" | "padding-top" | "page-break-after" | "page-break-before" | "page-break-inside" | "break-after" | "break-before" | "break-inside" | "page" | "paint-order" | "bottom" | "left" | "right" | "top" | "pointer-events" | "position" | "print-color-adjust" | "quotes" | "reading-flow" | "reading-order" | "resize" | "ruby-align" | "ruby-overhang" | "ruby-position" | "scroll-behavior" | "animation-range" | "animation-range-end" | "animation-range-start" | "animation-timeline" | "scroll-timeline" | "scroll-timeline-axis" | "scroll-timeline-name" | "timeline-scope" | "view-timeline" | "view-timeline-axis" | "view-timeline-inset" | "view-timeline-name" | "scroll-initial-target" | "scroll-marker-group" | "scroll-margin" | "scroll-margin-block" | "scroll-margin-block-end" | "scroll-margin-block-start" | "scroll-margin-bottom" | "scroll-margin-inline" | "scroll-margin-inline-end" | "scroll-margin-inline-start" | "scroll-margin-left" | "scroll-margin-right" | "scroll-margin-top" | "scroll-padding" | "scroll-padding-block" | "scroll-padding-block-end" | "scroll-padding-block-start" | "scroll-padding-bottom" | "scroll-padding-inline" | "scroll-padding-inline-end" | "scroll-padding-inline-start" | "scroll-padding-left" | "scroll-padding-right" | "scroll-padding-top" | "scroll-snap-align" | "scroll-snap-stop" | "scroll-snap-type" | "scrollbar-color" | "scrollbar-gutter" | "scrollbar-width" | "shape-image-threshold" | "shape-margin" | "shape-outside" | "speak" | "speak-as" | "clip-rule" | "color-interpolation" | "cx" | "cy" | "d" | "fill" | "fill-rule" | "marker" | "marker-end" | "marker-mid" | "marker-start" | "r" | "rx" | "ry" | "shape-rendering" | "stop-color" | "stop-opacity" | "stroke" | "stroke-color" | "stroke-dasharray" | "stroke-dashoffset" | "stroke-linecap" | "stroke-linejoin" | "stroke-miterlimit" | "stroke-width" | "text-anchor" | "text-rendering" | "vector-effect" | "x" | "y" | "color-interpolation-filters" | "flood-color" | "flood-opacity" | "lighting-color" | "tab-size" | "border-collapse" | "border-spacing" | "caption-side" | "empty-cells" | "table-layout" | "text-align" | "text-align-last" | "text-autospace" | "text-box" | "text-box-edge" | "text-box-trim" | "text-combine-upright" | "text-decoration" | "text-decoration-color" | "text-decoration-line" | "text-decoration-skip" | "text-decoration-skip-ink" | "text-decoration-style" | "text-decoration-thickness" | "text-emphasis" | "text-emphasis-color" | "text-emphasis-position" | "text-emphasis-style" | "text-indent" | "text-justify" | "text-orientation" | "text-overflow" | "text-shadow" | "text-size-adjust" | "text-spacing-trim" | "-webkit-text-fill-color" | "-webkit-text-stroke" | "-webkit-text-stroke-color" | "-webkit-text-stroke-width" | "text-transform" | "text-underline-offset" | "text-underline-position" | "text-wrap" | "text-wrap-mode" | "text-wrap-style" | "touch-action" | "transform-box" | "transform" | "transform-origin" | "backface-visibility" | "perspective" | "perspective-origin" | "transform-style" | "transition-behavior" | "transition" | "transition-delay" | "transition-duration" | "transition-property" | "transition-timing-function" | "user-select" | "vertical-align" | "view-transition-class" | "view-transition-name" | "visibility" | "white-space" | "white-space-collapse" | "orphans" | "widows" | "height" | "width" | "will-change" | "word-break" | "word-spacing" | "writing-mode" | "z-index" | "zoom")[]
  allowPropertyValues?: {
    position?: ("absolute" | "fixed" | "relative" | "static" | "sticky")[]
    "accent-color"?: ("auto")[]
    "alignment-baseline"?: ("alphabetic" | "baseline" | "central" | "ideographic" | "mathematical" | "middle" | "text-after-edge" | "text-before-edge")[]
    "align-items"?: ("anchor-center")[]
    "align-self"?: ("anchor-center" | "auto" | "normal" | "stretch")[]
    "anchor-name"?: ("none")[]
    "anchor-scope"?: ("all" | "none")[]
    "block-size"?: ("anchor-size" | "fit-content" | "max-content" | "min-content")[]
    bottom?: ("anchor" | "anchor-size" | "auto")[]
    height?: ("anchor-size" | "fit-content" | "max-content" | "min-content" | "stretch" | "auto")[]
    "inline-size"?: ("anchor-size" | "fit-content" | "max-content" | "min-content")[]
    "inset-block-end"?: ("anchor" | "anchor-size" | "auto")[]
    "inset-block-start"?: ("anchor" | "anchor-size" | "auto")[]
    "inset-block"?: ("anchor" | "anchor-size" | "auto")[]
    "inset-inline-end"?: ("anchor" | "anchor-size" | "auto")[]
    "inset-inline-start"?: ("anchor" | "anchor-size" | "auto")[]
    "inset-inline"?: ("anchor" | "anchor-size" | "auto")[]
    inset?: ("anchor" | "anchor-size" | "auto")[]
    "justify-items"?: ("anchor-center" | "left" | "legacy" | "right")[]
    "justify-self"?: ("anchor-center" | "auto" | "left" | "normal" | "right" | "stretch")[]
    left?: ("anchor" | "anchor-size" | "auto")[]
    "margin-block-end"?: ("anchor-size")[]
    "margin-block-start"?: ("anchor-size")[]
    "margin-block"?: ("anchor-size")[]
    "margin-bottom"?: ("anchor-size" | "auto")[]
    "margin-inline-end"?: ("anchor-size")[]
    "margin-inline-start"?: ("anchor-size")[]
    "margin-inline"?: ("anchor-size")[]
    "margin-left"?: ("anchor-size" | "auto")[]
    "margin-right"?: ("anchor-size" | "auto")[]
    "margin-top"?: ("anchor-size" | "auto")[]
    margin?: ("anchor-size" | "auto")[]
    "max-block-size"?: ("anchor-size" | "fit-content" | "max-content" | "min-content")[]
    "max-height"?: ("anchor-size" | "fit-content" | "max-content" | "min-content" | "none" | "stretch")[]
    "max-inline-size"?: ("anchor-size" | "fit-content" | "max-content" | "min-content")[]
    "max-width"?: ("anchor-size" | "fit-content" | "max-content" | "min-content" | "none" | "stretch")[]
    "min-block-size"?: ("anchor-size" | "fit-content" | "max-content" | "min-content")[]
    "min-height"?: ("anchor-size" | "fit-content" | "max-content" | "min-content" | "auto" | "stretch")[]
    "min-inline-size"?: ("anchor-size" | "fit-content" | "max-content" | "min-content")[]
    "min-width"?: ("anchor-size" | "fit-content" | "max-content" | "min-content" | "auto" | "stretch")[]
    "place-items"?: ("anchor-center")[]
    "place-self"?: ("anchor-center")[]
    "position-anchor"?: ("auto")[]
    "position-area"?: ("block-end" | "block-start" | "bottom" | "center" | "end" | "inline-end" | "inline-start" | "left" | "none" | "right" | "self-block-end" | "self-block-start" | "self-end" | "self-inline-end" | "self-inline-start" | "self-start" | "span-all" | "span-block-end" | "span-block-start" | "span-bottom" | "span-end" | "span-inline-end" | "span-inline-start" | "span-self-block-end" | "span-self-block-start" | "span-self-end" | "span-self-inline-end" | "span-self-inline-start" | "span-self-start" | "span-start" | "span-top" | "span-x-end" | "span-x-self-end" | "span-x-self-start" | "span-x-start" | "span-y-end" | "span-y-self-end" | "span-y-self-start" | "span-y-start" | "start" | "top" | "x-end" | "x-self-end" | "x-self-start" | "x-start" | "y-end" | "y-self-end" | "y-self-start" | "y-start")[]
    "position-try-fallbacks"?: ("flip-block" | "flip-inline" | "flip-start" | "none" | "position-area")[]
    "position-try-order"?: ("most-block-size" | "most-height" | "most-inline-size" | "most-width" | "normal")[]
    "position-visibility"?: ("always" | "anchors-visible" | "no-overflow")[]
    right?: ("anchor" | "anchor-size" | "auto")[]
    top?: ("anchor" | "anchor-size" | "auto")[]
    width?: ("anchor-size" | "fit-content" | "max-content" | "min-content" | "stretch" | "auto")[]
    "animation-direction"?: ("alternate" | "alternate-reverse" | "normal" | "reverse")[]
    "animation-duration"?: ("auto")[]
    "animation-fill-mode"?: ("backwards" | "both" | "forwards" | "none")[]
    "animation-iteration-count"?: ("infinite")[]
    "animation-name"?: ("none")[]
    "animation-play-state"?: ("paused" | "running")[]
    "animation-timing-function"?: ("jump")[]
    appearance?: ("auto" | "button" | "checkbox" | "listbox" | "menulist" | "menulist-button" | "meter" | "none" | "progress-bar" | "radio" | "searchfield" | "textarea" | "textfield" | "base-select")[]
    "aspect-ratio"?: ("auto")[]
    "background-attachment"?: ("fixed" | "local" | "scroll")[]
    "background-clip"?: ("border-box" | "content-box" | "padding-box" | "border-area" | "text")[]
    background?: ("background-clip" | "background-origin" | "background-size")[]
    "background-image"?: ("none" | "element" | "gradients" | "image-set")[]
    "background-origin"?: ("border-box" | "content-box" | "padding-box")[]
    "background-position"?: ("bottom" | "center" | "left" | "right" | "top")[]
    "background-repeat"?: ("2-value" | "no-repeat" | "repeat" | "repeat-x" | "repeat-y" | "round" | "space")[]
    "background-size"?: ("auto" | "contain" | "cover")[]
    "baseline-shift"?: ("baseline" | "sub" | "super")[]
    "baseline-source"?: ("auto" | "first" | "last")[]
    "border-image-repeat"?: ("repeat" | "round" | "space" | "stretch")[]
    "border-image-width"?: ("auto")[]
    "border-image"?: ("fill" | "gradient")[]
    "border-bottom-left-radius"?: ("percentages")[]
    "border-bottom-right-radius"?: ("percentages")[]
    "border-radius"?: ("percentages")[]
    "border-top-left-radius"?: ("percentages")[]
    "border-top-right-radius"?: ("percentages")[]
    "border-style"?: ("dashed" | "dotted" | "double" | "groove" | "hidden" | "inset" | "none" | "outset" | "ridge" | "solid")[]
    "box-decoration-break"?: ("clone" | "slice")[]
    "box-shadow"?: ("inset")[]
    "box-sizing"?: ("border-box" | "content-box")[]
    "caret-shape"?: ("auto" | "bar" | "block" | "underscore")[]
    clip?: ("auto")[]
    "clip-path"?: ("path" | "fill-box" | "stroke-box" | "view-box")[]
    "color-scheme"?: ("dark" | "light" | "normal" | "only")[]
    "break-after"?: ("avoid-column" | "column" | "always" | "auto" | "avoid" | "avoid-page" | "left" | "page" | "recto" | "right" | "verso")[]
    "break-before"?: ("avoid-column" | "column" | "always" | "auto" | "avoid" | "avoid-page" | "left" | "page" | "recto" | "right" | "verso")[]
    "break-inside"?: ("avoid-column" | "auto" | "avoid" | "avoid-page")[]
    "column-fill"?: ("auto" | "balance")[]
    "column-span"?: ("all" | "none")[]
    contain?: ("content" | "none" | "strict" | "inline-size" | "layout" | "paint" | "size" | "style")[]
    "contain-intrinsic-block-size"?: ("none")[]
    "contain-intrinsic-height"?: ("none")[]
    "contain-intrinsic-inline-size"?: ("none")[]
    "contain-intrinsic-size"?: ("none")[]
    "contain-intrinsic-width"?: ("none")[]
    "container-name"?: ("none")[]
    "container-type"?: ("inline-size" | "normal" | "size" | "scroll-state")[]
    content?: ("gradient" | "none" | "normal" | "url" | "image-set")[]
    "content-visibility"?: ("auto" | "hidden" | "visible")[]
    "counter-reset"?: ("reversed" | "list-item" | "none")[]
    "counter-set"?: ("list-item" | "none")[]
    "counter-increment"?: ("list-item" | "none")[]
    "image-rendering"?: ("crisp-edges" | "auto" | "pixelated" | "smooth")[]
    "text-overflow"?: ("string" | "clip" | "ellipsis")[]
    display?: ("block" | "inline" | "inline-block" | "none" | "contents" | "flow-root" | "list-item" | "ruby" | "ruby-base" | "ruby-base-container" | "ruby-text" | "ruby-text-container" | "inline-table" | "table" | "table-caption" | "table-cell" | "table-column" | "table-column-group" | "table-footer-group" | "table-header-group" | "table-row" | "table-row-group" | "flex" | "inline-flex" | "grid" | "inline-grid" | "math")[]
    "ruby-position"?: ("alternate" | "inter-character" | "over" | "under")[]
    "dominant-baseline"?: ("alphabetic" | "auto" | "central" | "hanging" | "ideographic" | "mathematical" | "middle")[]
    "field-sizing"?: ("content" | "fixed")[]
    filter?: ("blur" | "brightness" | "contrast" | "drop-shadow" | "grayscale" | "hue-rotate" | "invert" | "opacity" | "saturate" | "sepia")[]
    "align-content"?: ("normal")[]
    "flex-basis"?: ("auto" | "content" | "fit-content" | "max-content" | "min-content")[]
    "flex-direction"?: ("column" | "column-reverse" | "row" | "row-reverse")[]
    "flex-wrap"?: ("nowrap" | "wrap" | "wrap-reverse")[]
    flex?: ("none")[]
    "justify-content"?: ("left" | "normal" | "right")[]
    clear?: ("both" | "left" | "right" | "inline-end" | "inline-start")[]
    float?: ("left" | "none" | "right" | "inline-end" | "inline-start")[]
    "font-family"?: ("math" | "system-ui" | "ui-monospace" | "ui-rounded" | "ui-sans-serif" | "ui-serif")[]
    "font-feature-settings"?: ("normal")[]
    "font-kerning"?: ("auto" | "none" | "normal")[]
    "font-optical-sizing"?: ("auto" | "none")[]
    "font-palette"?: ("dark" | "light" | "normal")[]
    font?: ("caption" | "icon" | "menu" | "message-box" | "small-caption" | "status-bar")[]
    "font-size"?: ("xxx-large" | "math")[]
    "font-size-adjust"?: ("from-font" | "none" | "two-values")[]
    "font-stretch"?: ("percentage")[]
    "font-style"?: ("italic" | "normal" | "oblique-angle")[]
    "font-synthesis"?: ("position" | "small-caps" | "style" | "weight")[]
    "font-synthesis-position"?: ("auto" | "none")[]
    "font-synthesis-small-caps"?: ("auto" | "none")[]
    "font-synthesis-style"?: ("auto" | "none")[]
    "font-synthesis-weight"?: ("auto" | "none")[]
    "font-variant"?: ("historical-forms" | "none" | "normal" | "sub" | "super")[]
    "font-variant-alternates"?: ("annotation" | "historical-forms" | "normal" | "ornaments" | "styleset" | "stylistic" | "swash")[]
    "font-variant-caps"?: ("all-petite-caps" | "all-small-caps" | "normal" | "petite-caps" | "small-caps" | "titling-caps" | "unicase")[]
    "font-variant-east-asian"?: ("full-width" | "jis04" | "jis78" | "jis83" | "jis90" | "normal" | "proportional-width" | "ruby" | "simplified" | "traditional")[]
    "font-variant-emoji"?: ("emoji" | "normal" | "text" | "unicode")[]
    "font-variant-ligatures"?: ("common-ligatures" | "contextual" | "discretionary-ligatures" | "historical-ligatures" | "no-common-ligatures" | "no-contextual" | "no-discretionary-ligatures" | "no-historical-ligatures" | "none" | "normal")[]
    "font-variant-numeric"?: ("diagonal-fractions" | "lining-nums" | "normal" | "oldstyle-nums" | "ordinal" | "proportional-nums" | "slashed-zero" | "stacked-fractions" | "tabular-nums")[]
    "font-variant-position"?: ("normal" | "sub" | "super")[]
    "font-weight"?: ("bold" | "bolder" | "lighter" | "normal" | "number")[]
    "font-width"?: ("condensed" | "expanded" | "extra-condensed" | "extra-expanded" | "normal" | "semi-condensed" | "semi-expanded" | "ultra-condensed" | "ultra-expanded")[]
    "forced-color-adjust"?: ("auto" | "none" | "preserve-parent-color")[]
    gap?: ("normal")[]
    "grid-auto-flow"?: ("column" | "dense" | "row")[]
    "grid-template-areas"?: ("none")[]
    "grid-template-columns"?: ("auto" | "fit-content" | "max-content" | "min-content" | "minmax" | "none" | "repeat" | "animation" | "masonry" | "subgrid")[]
    "grid-template-rows"?: ("auto" | "fit-content" | "max-content" | "min-content" | "minmax" | "none" | "repeat" | "animation" | "masonry" | "subgrid")[]
    "grid-template"?: ("none")[]
    "row-gap"?: ("normal")[]
    "hanging-punctuation"?: ("allow-end" | "first" | "last" | "none")[]
    "hyphenate-character"?: ("auto")[]
    "hyphenate-limit-chars"?: ("auto")[]
    hyphens?: ("auto")[]
    "image-orientation"?: ("from-image" | "none")[]
    rotate?: ("none")[]
    scale?: ("none")[]
    translate?: ("none")[]
    "initial-letter"?: ("normal")[]
    interactivity?: ("auto" | "inert")[]
    "interpolate-size"?: ("allow-keywords" | "numeric-only")[]
    direction?: ("ltr" | "rtl")[]
    "unicode-bidi"?: ("bidi-override" | "embed" | "isolate" | "isolate-override" | "normal" | "plaintext")[]
    "letter-spacing"?: ("normal")[]
    "line-break"?: ("anywhere" | "auto" | "loose" | "normal" | "strict")[]
    "line-clamp"?: ("none")[]
    "line-height"?: ("normal")[]
    "list-style-image"?: ("none")[]
    "list-style-position"?: ("inside" | "outside")[]
    "list-style-type"?: ("arabic-indic" | "armenian" | "bengali" | "cambodian" | "circle" | "cjk-decimal" | "cjk-earthly-branch" | "cjk-heavenly-stem" | "cjk-ideographic" | "decimal" | "decimal-leading-zero" | "devanagari" | "disc" | "disclosure-closed" | "disclosure-open" | "ethiopic-numeric" | "georgian" | "gujarati" | "gurmukhi" | "hebrew" | "hiragana" | "hiragana-iroha" | "japanese-formal" | "japanese-informal" | "kannada" | "katakana" | "katakana-iroha" | "khmer" | "korean-hangul-formal" | "korean-hanja-formal" | "korean-hanja-informal" | "lao" | "lower-alpha" | "lower-armenian" | "lower-greek" | "lower-latin" | "lower-roman" | "malayalam" | "mongolian" | "myanmar" | "none" | "oriya" | "persian" | "simp-chinese-formal" | "simp-chinese-informal" | "square" | "string" | "symbols" | "tamil" | "telugu" | "thai" | "tibetan" | "trad-chinese-formal" | "trad-chinese-informal" | "upper-alpha" | "upper-armenian" | "upper-latin" | "upper-roman")[]
    "list-style"?: ("symbols")[]
    "overflow-block"?: ("overlay")[]
    "overflow-inline"?: ("overlay")[]
    "margin-trim"?: ("block" | "block-end" | "block-start" | "inline" | "inline-end" | "inline-start" | "none")[]
    "mask-type"?: ("alpha" | "luminance")[]
    "mask-clip"?: ("border" | "content" | "padding" | "text")[]
    "mask-composite"?: ("add" | "exclude" | "intersect" | "subtract")[]
    "mask-mode"?: ("alpha" | "luminance" | "match-source")[]
    "mask-origin"?: ("border" | "content" | "fill-box" | "padding" | "stroke-box" | "view-box")[]
    "text-transform"?: ("math-auto" | "capitalize" | "full-size-kana" | "full-width" | "lowercase" | "none" | "uppercase")[]
    "mix-blend-mode"?: ("plus-darker" | "plus-lighter")[]
    "offset-anchor"?: ("auto" | "bottom" | "center" | "left" | "right" | "top")[]
    "offset-path"?: ("border-box" | "content-box" | "fill-box" | "margin-box" | "none" | "padding-box" | "path" | "ray" | "stroke-box" | "url" | "view-box")[]
    "offset-position"?: ("auto" | "bottom" | "center" | "left" | "normal" | "right" | "top")[]
    "offset-rotate"?: ("auto" | "reverse")[]
    "column-count"?: ("auto")[]
    "column-gap"?: ("normal")[]
    "column-width"?: ("auto")[]
    "object-fit"?: ("contain" | "cover" | "fill" | "none" | "scale-down")[]
    "object-view-box"?: ("none")[]
    opacity?: ("percentages")[]
    "outline-style"?: ("auto" | "dashed" | "dotted" | "double" | "groove" | "inset" | "none" | "outset" | "ridge" | "solid")[]
    "overflow-anchor"?: ("auto" | "none")[]
    "overflow-x"?: ("clip" | "auto" | "hidden" | "scroll" | "visible")[]
    "overflow-y"?: ("clip" | "auto" | "hidden" | "scroll" | "visible")[]
    overflow?: ("clip" | "auto" | "hidden" | "scroll" | "visible")[]
    "overflow-clip-margin"?: ("border-box" | "content-box" | "padding-box")[]
    "overflow-wrap"?: ("anywhere" | "break-word" | "normal")[]
    overlay?: ("auto" | "none")[]
    "overscroll-behavior-block"?: ("auto" | "contain" | "none")[]
    "overscroll-behavior-inline"?: ("auto" | "contain" | "none")[]
    "overscroll-behavior-x"?: ("auto" | "contain" | "none")[]
    "overscroll-behavior-y"?: ("auto" | "contain" | "none")[]
    "overscroll-behavior"?: ("auto" | "contain" | "none")[]
    "page-break-after"?: ("always" | "auto" | "avoid" | "left" | "right")[]
    "page-break-before"?: ("always" | "auto" | "avoid" | "left" | "right")[]
    "page-break-inside"?: ("auto" | "avoid")[]
    "print-color-adjust"?: ("economy" | "exact")[]
    quotes?: ("auto" | "none")[]
    "reading-flow"?: ("flex-flow" | "flex-visual" | "grid-columns" | "grid-order" | "grid-rows" | "normal" | "source-order")[]
    resize?: ("block" | "inline")[]
    "ruby-align"?: ("center" | "space-around" | "space-between" | "start")[]
    "ruby-overhang"?: ("auto" | "none")[]
    "scroll-behavior"?: ("auto" | "smooth")[]
    "animation-range-end"?: ("normal")[]
    "animation-range-start"?: ("normal")[]
    "animation-timeline"?: ("scroll" | "view")[]
    "scroll-timeline-axis"?: ("block" | "inline" | "x" | "y")[]
    "timeline-scope"?: ("all" | "none")[]
    "view-timeline-axis"?: ("block" | "inline" | "x" | "y")[]
    "view-timeline-inset"?: ("auto")[]
    "scroll-initial-target"?: ("nearest" | "none")[]
    "scroll-marker-group"?: ("after" | "before" | "none")[]
    "scroll-padding-block-end"?: ("auto")[]
    "scroll-padding-block-start"?: ("auto")[]
    "scroll-padding-block"?: ("auto")[]
    "scroll-padding-inline-end"?: ("auto")[]
    "scroll-padding-inline-start"?: ("auto")[]
    "scroll-padding-inline"?: ("auto")[]
    "scroll-padding"?: ("auto")[]
    "scroll-snap-align"?: ("center" | "end" | "none" | "start")[]
    "scroll-snap-stop"?: ("always" | "normal")[]
    "scroll-snap-type"?: ("block" | "both" | "inline" | "none" | "x" | "y")[]
    "scrollbar-color"?: ("auto")[]
    "scrollbar-gutter"?: ("auto" | "stable")[]
    "scrollbar-width"?: ("auto" | "none" | "thin")[]
    "shape-image-threshold"?: ("percentages")[]
    "shape-outside"?: ("circle" | "gradient" | "image" | "inset" | "none" | "path" | "polygon")[]
    "speak-as"?: ("digits" | "literal-punctuation" | "no-punctuation" | "normal" | "spell-out")[]
    "clip-rule"?: ("evenodd" | "nonzero")[]
    "color-interpolation"?: ("linearGradient" | "sRGB")[]
    "fill-rule"?: ("evenodd" | "nonzero")[]
    "stroke-dasharray"?: ("none")[]
    "stroke-linecap"?: ("butt" | "round" | "square")[]
    "stroke-linejoin"?: ("bevel" | "miter" | "round")[]
    "text-rendering"?: ("auto" | "geometricPrecision")[]
    "color-interpolation-filters"?: ("auto" | "linearRGB" | "sRGB")[]
    "tab-size"?: ("length")[]
    "border-collapse"?: ("collapse" | "separate")[]
    "caption-side"?: ("bottom" | "bottom-outside" | "top" | "top-outside")[]
    "empty-cells"?: ("hide" | "show")[]
    "table-layout"?: ("auto" | "fixed")[]
    "text-align"?: ("center" | "end" | "justify" | "left" | "match-parent" | "right" | "start")[]
    "text-align-last"?: ("auto")[]
    "text-autospace"?: ("auto" | "ideograph-alpha" | "ideograph-numeric" | "insert" | "no-autospace" | "normal" | "punctuation" | "replace")[]
    "text-box-edge"?: ("auto")[]
    "text-box-trim"?: ("none" | "trim-both" | "trim-end" | "trim-start")[]
    "text-box"?: ("normal")[]
    "text-combine-upright"?: ("all" | "none")[]
    "text-decoration-line"?: ("grammar-error" | "line-through" | "none" | "overline" | "spelling-error" | "underline" | "blink")[]
    "text-decoration-skip-ink"?: ("all" | "auto" | "none")[]
    "text-decoration-skip"?: ("auto" | "none")[]
    "text-decoration-style"?: ("wavy")[]
    "text-decoration-thickness"?: ("auto" | "from-font" | "percentage")[]
    "text-emphasis-position"?: ("auto" | "left" | "over" | "right" | "under")[]
    "text-emphasis-style"?: ("circle" | "dot" | "double-circle" | "filled" | "none" | "sesame" | "triangle")[]
    "text-indent"?: ("each-line" | "hanging")[]
    "text-justify"?: ("auto" | "inter-character" | "inter-word" | "none")[]
    "text-orientation"?: ("mixed" | "sideways" | "upright")[]
    "text-size-adjust"?: ("auto" | "none" | "percentages")[]
    "text-spacing-trim"?: ("normal" | "space-all" | "space-first" | "trim-start")[]
    "text-underline-offset"?: ("auto" | "percentage")[]
    "text-underline-position"?: ("auto" | "from-font" | "left" | "right" | "under")[]
    "text-wrap"?: ("wrap" | "balance" | "nowrap" | "pretty" | "stable")[]
    "text-wrap-mode"?: ("nowrap" | "wrap")[]
    "text-wrap-style"?: ("auto" | "balance" | "pretty" | "stable")[]
    "touch-action"?: ("manipulation" | "none" | "pan-down" | "pan-left" | "pan-right" | "pan-up" | "pan-x" | "pan-y" | "pinch-zoom")[]
    "transform-box"?: ("border-box" | "content-box" | "fill-box" | "stroke-box" | "view-box")[]
    "transform-origin"?: ("bottom" | "center" | "left" | "right" | "top")[]
    "perspective-origin"?: ("bottom" | "center" | "left" | "right" | "top")[]
    perspective?: ("none")[]
    transform?: ("3d")[]
    transition?: ("transition-behavior")[]
    "transition-property"?: ("all" | "none")[]
    "transition-timing-function"?: ("jump")[]
    "user-select"?: ("all" | "auto" | "none" | "text")[]
    "vertical-align"?: ("baseline" | "bottom" | "middle" | "sub" | "super" | "text-bottom" | "text-top" | "top")[]
    "view-transition-class"?: ("none")[]
    "view-transition-name"?: ("match-element" | "none")[]
    visibility?: ("collapse" | "hidden" | "visible")[]
    "white-space"?: ("break-spaces" | "normal" | "nowrap" | "pre" | "pre-line" | "pre-wrap")[]
    "white-space-collapse"?: ("break-spaces" | "collapse" | "preserve" | "preserve-breaks" | "preserve-spaces")[]
    "will-change"?: ("auto" | "contents" | "scroll-position")[]
    "word-break"?: ("break-all" | "keep-all" | "normal" | "auto-phrase" | "break-word")[]
    "word-spacing"?: ("normal")[]
    "writing-mode"?: ("horizontal-tb" | "sideways-lr" | "sideways-rl" | "vertical-lr" | "vertical-rl" | "lr" | "lr-tb" | "rl" | "rl-tb" | "tb" | "tb-rl")[]
    "z-index"?: ("auto")[]
  }
  allowSelectors?: ("active-view-transition" | "active-view-transition-type" | "autofill" | "defined" | "backdrop" | "after" | "before" | "column" | "checkmark" | "picker" | "picker-icon" | "default" | "details-content" | "dir" | "empty" | "file-selector-button" | "first-letter" | "first-line" | "focus-visible" | "focus-within" | "in-range" | "invalid" | "optional" | "out-of-range" | "required" | "valid" | "fullscreen" | "has" | "has-slotted" | "heading" | "headingfunction" | "highlight" | "host" | "hostfunction" | "host-context" | "indeterminate" | "checked" | "disabled" | "enabled" | "is" | "lang" | "any-link" | "link" | "visited" | "marker" | "buffering" | "muted" | "paused" | "playing" | "seeking" | "stalled" | "volume-locked" | "modal" | "namespace" | "nesting" | "not" | "first-child" | "last-child" | "nth-child" | "nth-last-child" | "only-child" | "first-of-type" | "last-of-type" | "nth-last-of-type" | "nth-of-type" | "only-of-type" | "open" | "first" | "left" | "right" | "picture-in-picture" | "placeholder" | "placeholder-shown" | "popover-open" | "read-only" | "read-write" | "root" | "scope" | "scroll-button" | "scroll-marker" | "scroll-marker-group" | "selection" | "attribute" | "child" | "class" | "descendant" | "id" | "list" | "next-sibling" | "subsequent-sibling" | "type" | "universal" | "part" | "slotted" | "grammar-error" | "spelling-error" | "state" | "target" | "target-text" | "future" | "past" | "active" | "focus" | "hover" | "user-invalid" | "user-valid" | "view-transition" | "view-transition-group" | "view-transition-image-pair" | "view-transition-new" | "view-transition-old" | "cue" | "xr-overlay" | "where")[]
}]
// ----- css/use-layers -----
type CssUseLayers = []|[{
  allowUnnamedLayers?: boolean
  requireImportLayers?: boolean
  layerNamePattern?: string
}]
// ----- curly -----
type Curly = ([]|["all"] | []|[("multi" | "multi-line" | "multi-or-nest")]|[("multi" | "multi-line" | "multi-or-nest"), "consistent"])
// ----- default-case -----
type DefaultCase = []|[{
  commentPattern?: string
}]
// ----- depend/ban-dependencies -----
type DependBanDependencies = []|[{
  presets?: string[]
  modules?: string[]
  allowed?: string[]
}]
// ----- dot-location -----
type DotLocation = []|[("object" | "property")]
// ----- dot-notation -----
type DotNotation = []|[{
  allowKeywords?: boolean
  allowPattern?: string
}]
// ----- drizzle/enforce-delete-with-where -----
type DrizzleEnforceDeleteWithWhere = []|[{
  drizzleObjectName?: (string | unknown[])
}]
// ----- drizzle/enforce-update-with-where -----
type DrizzleEnforceUpdateWithWhere = []|[{
  drizzleObjectName?: (string | unknown[])
}]
// ----- eol-last -----
type EolLast = []|[("always" | "never" | "unix" | "windows")]
// ----- eqeqeq -----
type Eqeqeq = ([]|["always"]|["always", {
  null?: ("always" | "never" | "ignore")
}] | []|[("smart" | "allow-null")])
// ----- func-call-spacing -----
type FuncCallSpacing = ([]|["never"] | []|["always"]|["always", {
  allowNewlines?: boolean
}])
// ----- func-name-matching -----
type FuncNameMatching = ([]|[("always" | "never")]|[("always" | "never"), {
  considerPropertyDescriptor?: boolean
  includeCommonJSModuleExports?: boolean
}] | []|[{
  considerPropertyDescriptor?: boolean
  includeCommonJSModuleExports?: boolean
}])
// ----- func-names -----
type FuncNames = []|[_FuncNamesValue]|[_FuncNamesValue, {
  generators?: _FuncNamesValue
}]
type _FuncNamesValue = ("always" | "as-needed" | "never")
// ----- func-style -----
type FuncStyle = []|[("declaration" | "expression")]|[("declaration" | "expression"), {
  allowArrowFunctions?: boolean
  allowTypeAnnotation?: boolean
  overrides?: {
    namedExports?: ("declaration" | "expression" | "ignore")
  }
}]
// ----- function-call-argument-newline -----
type FunctionCallArgumentNewline = []|[("always" | "never" | "consistent")]
// ----- function-paren-newline -----
type FunctionParenNewline = []|[(("always" | "never" | "consistent" | "multiline" | "multiline-arguments") | {
  minItems?: number
})]
// ----- generator-star-spacing -----
type GeneratorStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
  named?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  anonymous?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  method?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
})]
// ----- getter-return -----
type GetterReturn = []|[{
  allowImplicit?: boolean
}]
// ----- github-action/action-name-casing -----
type GithubActionActionNameCasing = []|[(("camelCase" | "kebab-case" | "PascalCase" | "snake_case" | "Title Case" | "Train-Case" | "SCREAMING_SNAKE_CASE") | {
  "kebab-case"?: boolean
  camelCase?: boolean
  PascalCase?: boolean
  snake_case?: boolean
  "Title Case"?: boolean
  "Train-Case"?: boolean
  SCREAMING_SNAKE_CASE?: boolean
  
  ignores?: string[]
})]
// ----- github-action/job-id-casing -----
type GithubActionJobIdCasing = []|[(("camelCase" | "kebab-case" | "PascalCase" | "snake_case" | "Train-Case" | "SCREAMING_SNAKE_CASE") | {
  "kebab-case"?: boolean
  camelCase?: boolean
  PascalCase?: boolean
  snake_case?: boolean
  "Train-Case"?: boolean
  SCREAMING_SNAKE_CASE?: boolean
  
  ignores?: string[]
})]
// ----- github-action/max-jobs-per-action -----
type GithubActionMaxJobsPerAction = []|[number]
// ----- github-action/prefer-file-extension -----
type GithubActionPreferFileExtension = []|[(("yml" | "yaml") | {
  extension?: ("yml" | "yaml")
  caseSensitive?: boolean
})]
// ----- github-action/prefer-step-uses-style -----
type GithubActionPreferStepUsesStyle = []|[(("release" | "commit" | "branch") | {
  commit?: boolean
  release?: boolean
  branch?: boolean
  allowRepository?: boolean
  allowDocker?: boolean
  
  ignores?: string[]
})]
// ----- github-action/valid-timeout-minutes -----
type GithubActionValidTimeoutMinutes = []|[(number | {
  
  min?: number
  
  max?: number
} | {
  job?: (number | {
    
    min?: number
    
    max?: number
  })
  step?: (number | {
    
    min?: number
    
    max?: number
  })
})]
// ----- gql/alphabetize -----
type GqlAlphabetize = [{
  
  fields?: [("ObjectTypeDefinition" | "InterfaceTypeDefinition" | "InputObjectTypeDefinition"), ...(("ObjectTypeDefinition" | "InterfaceTypeDefinition" | "InputObjectTypeDefinition"))[]]
  
  values?: boolean
  
  selections?: [("OperationDefinition" | "FragmentDefinition"), ...(("OperationDefinition" | "FragmentDefinition"))[]]
  
  variables?: boolean
  
  arguments?: [("FieldDefinition" | "Field" | "DirectiveDefinition" | "Directive"), ...(("FieldDefinition" | "Field" | "DirectiveDefinition" | "Directive"))[]]
  
  definitions?: boolean
  
  groups?: [string, string, ...(string)[]]
}]
// ----- gql/description-style -----
type GqlDescriptionStyle = []|[{
  style?: ("block" | "inline")
}]
// ----- gql/input-name -----
type GqlInputName = []|[{
  
  checkInputType?: boolean
  
  caseSensitiveInputType?: boolean
  
  checkQueries?: boolean
  
  checkMutations?: boolean
}]
// ----- gql/known-directives -----
type GqlKnownDirectives = []|[{
  
  ignoreClientDirectives: [string, ...(string)[]]
}]
// ----- gql/lone-executable-definition -----
type GqlLoneExecutableDefinition = []|[{
  
  ignore?: [("fragment" | "query" | "mutation" | "subscription")]|[("fragment" | "query" | "mutation" | "subscription"), ("fragment" | "query" | "mutation" | "subscription")]|[("fragment" | "query" | "mutation" | "subscription"), ("fragment" | "query" | "mutation" | "subscription"), ("fragment" | "query" | "mutation" | "subscription")]
}]
// ----- gql/match-document-filename -----
type GqlMatchDocumentFilename = [{
  fileExtension?: (".gql" | ".graphql")
  query?: (_GqlMatchDocumentFilenameAsString | _GqlMatchDocumentFilename_AsObject)
  mutation?: (_GqlMatchDocumentFilenameAsString | _GqlMatchDocumentFilename_AsObject)
  subscription?: (_GqlMatchDocumentFilenameAsString | _GqlMatchDocumentFilename_AsObject)
  fragment?: (_GqlMatchDocumentFilenameAsString | _GqlMatchDocumentFilename_AsObject)
}]
type _GqlMatchDocumentFilenameAsString = ("camelCase" | "PascalCase" | "snake_case" | "UPPER_CASE" | "kebab-case" | "matchDocumentStyle")
interface _GqlMatchDocumentFilename_AsObject {
  style?: _GqlMatchDocumentFilenameAsString
  suffix?: string
  prefix?: string
}
// ----- gql/naming-convention -----
type GqlNamingConvention = []|[{
  
  types?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  Argument?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  DirectiveDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  EnumTypeDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  EnumValueDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  FieldDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  FragmentDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  InputObjectTypeDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  InputValueDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  InterfaceTypeDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  ObjectTypeDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  OperationDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  ScalarTypeDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  UnionTypeDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  
  VariableDefinition?: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
  allowLeadingUnderscore?: boolean
  allowTrailingUnderscore?: boolean
  [k: string]: (_GqlNamingConventionAsString | _GqlNamingConvention_AsObject)
}]
type _GqlNamingConventionAsString = ("camelCase" | "PascalCase" | "snake_case" | "UPPER_CASE")
interface _GqlNamingConvention_AsObject {
  style?: _GqlNamingConventionAsString
  prefix?: string
  suffix?: string
  
  forbiddenPatterns?: [{
    [k: string]: unknown | undefined
  }, ...({
    [k: string]: unknown | undefined
  })[]]
  
  requiredPattern?: {
    [k: string]: unknown | undefined
  }
  
  forbiddenPrefixes?: [string, ...(string)[]]
  
  forbiddenSuffixes?: [string, ...(string)[]]
  
  requiredPrefixes?: [string, ...(string)[]]
  
  requiredSuffixes?: [string, ...(string)[]]
  
  ignorePattern?: string
}
// ----- gql/no-root-type -----
type GqlNoRootType = [{
  
  disallow: [("mutation" | "subscription"), ...(("mutation" | "subscription"))[]]
}]
// ----- gql/no-unused-fields -----
type GqlNoUnusedFields = []|[{
  
  ignoredFieldSelectors?: [string, ...(string)[]]
}]
// ----- gql/relay-arguments -----
type GqlRelayArguments = []|[{
  
  includeBoth?: boolean
}]
// ----- gql/relay-edge-types -----
type GqlRelayEdgeTypes = []|[{
  
  withEdgeSuffix?: boolean
  
  shouldImplementNode?: boolean
  
  listTypeCanWrapOnlyEdgeType?: boolean
}]
// ----- gql/require-deprecation-date -----
type GqlRequireDeprecationDate = []|[{
  argumentName?: string
}]
// ----- gql/require-description -----
type GqlRequireDescription = [{
  
  types?: true
  
  rootField?: true
  
  ignoredSelectors?: [string, ...(string)[]]
  
  DirectiveDefinition?: boolean
  
  EnumTypeDefinition?: boolean
  
  EnumValueDefinition?: boolean
  
  FieldDefinition?: boolean
  
  InputObjectTypeDefinition?: boolean
  
  InputValueDefinition?: boolean
  
  InterfaceTypeDefinition?: boolean
  
  ObjectTypeDefinition?: boolean
  
  OperationDefinition?: boolean
  
  ScalarTypeDefinition?: boolean
  
  UnionTypeDefinition?: boolean
}]
// ----- gql/require-selections -----
type GqlRequireSelections = []|[{
  fieldName?: (_GqlRequireSelectionsAsString | _GqlRequireSelections_AsArray)
  
  requireAllFields?: boolean
}]
type _GqlRequireSelectionsAsString = string
type _GqlRequireSelections_AsArray = [string, ...(string)[]]
// ----- gql/selection-set-depth -----
type GqlSelectionSetDepth = [{
  maxDepth: number
  
  ignore?: [string, ...(string)[]]
}]
// ----- gql/strict-id-in-types -----
type GqlStrictIdInTypes = []|[{
  
  acceptedIdNames?: [string, ...(string)[]]
  
  acceptedIdTypes?: [string, ...(string)[]]
  exceptions?: {
    
    types?: [string, ...(string)[]]
    
    suffixes?: [string, ...(string)[]]
  }
}]
// ----- grouped-accessor-pairs -----
type GroupedAccessorPairs = []|[("anyOrder" | "getBeforeSet" | "setBeforeGet")]|[("anyOrder" | "getBeforeSet" | "setBeforeGet"), {
  enforceForTSTypes?: boolean
}]
// ----- handle-callback-err -----
type HandleCallbackErr = []|[string]
// ----- id-blacklist -----
type IdBlacklist = string[]
// ----- id-denylist -----
type IdDenylist = string[]
// ----- id-length -----
type IdLength = []|[{
  min?: number
  max?: number
  exceptions?: string[]
  exceptionPatterns?: string[]
  properties?: ("always" | "never")
}]
// ----- id-match -----
type IdMatch = []|[string]|[string, {
  properties?: boolean
  classFields?: boolean
  onlyDeclarations?: boolean
  ignoreDestructuring?: boolean
}]
// ----- implicit-arrow-linebreak -----
type ImplicitArrowLinebreak = []|[("beside" | "below")]
// ----- indent -----
type Indent = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: ((number | ("first" | "off")) | {
    var?: (number | ("first" | "off"))
    let?: (number | ("first" | "off"))
    const?: (number | ("first" | "off"))
  })
  outerIIFEBody?: (number | "off")
  MemberExpression?: (number | "off")
  FunctionDeclaration?: {
    parameters?: (number | ("first" | "off"))
    body?: number
  }
  FunctionExpression?: {
    parameters?: (number | ("first" | "off"))
    body?: number
  }
  StaticBlock?: {
    body?: number
  }
  CallExpression?: {
    arguments?: (number | ("first" | "off"))
  }
  ArrayExpression?: (number | ("first" | "off"))
  ObjectExpression?: (number | ("first" | "off"))
  ImportDeclaration?: (number | ("first" | "off"))
  flatTernaryExpressions?: boolean
  offsetTernaryExpressions?: boolean
  ignoredNodes?: string[]
  ignoreComments?: boolean
}]
// ----- indent-legacy -----
type IndentLegacy = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: (number | {
    var?: number
    let?: number
    const?: number
    [k: string]: unknown | undefined
  })
  outerIIFEBody?: number
  MemberExpression?: number
  FunctionDeclaration?: {
    parameters?: (number | "first")
    body?: number
    [k: string]: unknown | undefined
  }
  FunctionExpression?: {
    parameters?: (number | "first")
    body?: number
    [k: string]: unknown | undefined
  }
  CallExpression?: {
    parameters?: (number | "first")
    [k: string]: unknown | undefined
  }
  ArrayExpression?: (number | "first")
  ObjectExpression?: (number | "first")
}]
// ----- init-declarations -----
type InitDeclarations = ([]|["always"] | []|["never"]|["never", {
  ignoreForLoopInit?: boolean
}])
// ----- jsdoc/check-alignment -----
type JsdocCheckAlignment = []|[{
  
  innerIndent?: number
}]
// ----- jsdoc/check-examples -----
type JsdocCheckExamples = []|[{
  allowInlineConfig?: boolean
  baseConfig?: {
    [k: string]: unknown | undefined
  }
  captionRequired?: boolean
  checkDefaults?: boolean
  checkEslintrc?: boolean
  checkParams?: boolean
  checkProperties?: boolean
  configFile?: string
  exampleCodeRegex?: string
  matchingFileName?: string
  matchingFileNameDefaults?: string
  matchingFileNameParams?: string
  matchingFileNameProperties?: string
  noDefaultExampleRules?: boolean
  paddedIndent?: number
  rejectExampleCodeRegex?: string
  reportUnusedDisableDirectives?: boolean
}]
// ----- jsdoc/check-indentation -----
type JsdocCheckIndentation = []|[{
  
  allowIndentedSections?: boolean
  
  excludeTags?: string[]
}]
// ----- jsdoc/check-line-alignment -----
type JsdocCheckLineAlignment = []|[("always" | "never" | "any")]|[("always" | "never" | "any"), {
  
  customSpacings?: {
    
    postDelimiter?: number
    
    postHyphen?: number
    
    postName?: number
    
    postTag?: number
    
    postType?: number
  }
  
  disableWrapIndent?: boolean
  
  preserveMainDescriptionPostDelimiter?: boolean
  
  tags?: string[]
  
  wrapIndent?: string
}]
// ----- jsdoc/check-param-names -----
type JsdocCheckParamNames = []|[{
  
  allowExtraTrailingParamDocs?: boolean
  
  checkDestructured?: boolean
  
  checkRestProperty?: boolean
  
  checkTypesPattern?: string
  
  disableExtraPropertyReporting?: boolean
  
  disableMissingParamChecks?: boolean
  
  enableFixer?: boolean
  
  useDefaultObjectProperties?: boolean
}]
// ----- jsdoc/check-property-names -----
type JsdocCheckPropertyNames = []|[{
  
  enableFixer?: boolean
}]
// ----- jsdoc/check-tag-names -----
type JsdocCheckTagNames = []|[{
  
  definedTags?: string[]
  
  enableFixer?: boolean
  
  inlineTags?: string[]
  
  jsxTags?: boolean
  
  typed?: boolean
}]
// ----- jsdoc/check-types -----
type JsdocCheckTypes = []|[{
  
  exemptTagContexts?: {
    
    tag?: string
    
    types?: (boolean | string[])
  }[]
  
  noDefaults?: boolean
  
  unifyParentAndChildTypeChecks?: boolean
}]
// ----- jsdoc/check-values -----
type JsdocCheckValues = []|[{
  
  allowedAuthors?: string[]
  
  allowedLicenses?: (string[] | boolean)
  
  licensePattern?: string
  
  numericOnlyVariation?: boolean
}]
// ----- jsdoc/convert-to-jsdoc-comments -----
type JsdocConvertToJsdocComments = []|[{
  
  allowedPrefixes?: string[]
  
  contexts?: (string | {
    context?: string
    inlineCommentBlock?: boolean
  })[]
  
  contextsAfter?: (string | {
    context?: string
    inlineCommentBlock?: boolean
  })[]
  
  contextsBeforeAndAfter?: (string | {
    context?: string
    inlineCommentBlock?: boolean
  })[]
  
  enableFixer?: boolean
  
  enforceJsdocLineStyle?: ("multi" | "single")
  
  lineOrBlockStyle?: ("block" | "line" | "both")
}]
// ----- jsdoc/empty-tags -----
type JsdocEmptyTags = []|[{
  
  tags?: string[]
}]
// ----- jsdoc/escape-inline-tags -----
type JsdocEscapeInlineTags = []|[{
  
  allowedInlineTags?: string[]
  
  enableFixer?: boolean
  
  fixType?: ("backticks" | "backslash")
}]
// ----- jsdoc/implements-on-classes -----
type JsdocImplementsOnClasses = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
}]
// ----- jsdoc/informative-docs -----
type JsdocInformativeDocs = []|[{
  
  aliases?: {
    [k: string]: string[]
  }
  
  excludedTags?: string[]
  
  uselessWords?: string[]
}]
// ----- jsdoc/lines-before-block -----
type JsdocLinesBeforeBlock = []|[{
  
  checkBlockStarts?: boolean
  
  excludedTags?: string[]
  
  ignoreSameLine?: boolean
  
  ignoreSingleLines?: boolean
  
  lines?: number
}]
// ----- jsdoc/match-description -----
type JsdocMatchDescription = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  mainDescription?: (string | boolean | {
    match?: (string | boolean)
    message?: string
  })
  
  matchDescription?: string
  
  message?: string
  
  nonemptyTags?: boolean
  
  tags?: {
    [k: string]: (string | true | {
      match?: (string | true)
      message?: string
    })
  }
}]
// ----- jsdoc/match-name -----
type JsdocMatchName = []|[{
  
  match: {
    
    allowName?: string
    
    comment?: string
    
    context?: string
    
    disallowName?: string
    
    message?: string
    
    replacement?: string
    
    tags?: string[]
  }[]
}]
// ----- jsdoc/multiline-blocks -----
type JsdocMultilineBlocks = []|[{
  
  allowMultipleTags?: boolean
  
  minimumLengthForMultiline?: number
  
  multilineTags?: ("*" | string[])
  
  noFinalLineText?: boolean
  
  noMultilineBlocks?: boolean
  
  noSingleLineBlocks?: boolean
  
  noZeroLineText?: boolean
  
  requireSingleLineUnderCount?: number
  
  singleLineTags?: string[]
}]
// ----- jsdoc/no-bad-blocks -----
type JsdocNoBadBlocks = []|[{
  
  ignore?: string[]
  
  preventAllMultiAsteriskBlocks?: boolean
}]
// ----- jsdoc/no-blank-blocks -----
type JsdocNoBlankBlocks = []|[{
  
  enableFixer?: boolean
}]
// ----- jsdoc/no-defaults -----
type JsdocNoDefaults = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  noOptionalParamNames?: boolean
}]
// ----- jsdoc/no-missing-syntax -----
type JsdocNoMissingSyntax = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
    message?: string
    minimum?: number
  })[]
}]
// ----- jsdoc/no-multi-asterisks -----
type JsdocNoMultiAsterisks = []|[{
  
  allowWhitespace?: boolean
  
  preventAtEnd?: boolean
  
  preventAtMiddleLines?: boolean
}]
// ----- jsdoc/no-restricted-syntax -----
type JsdocNoRestrictedSyntax = []|[{
  
  contexts: (string | {
    comment?: string
    context?: string
    message?: string
  })[]
}]
// ----- jsdoc/no-types -----
type JsdocNoTypes = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
}]
// ----- jsdoc/no-undefined-types -----
type JsdocNoUndefinedTypes = []|[{
  
  checkUsedTypedefs?: boolean
  
  definedTypes?: string[]
  
  disableReporting?: boolean
  
  markVariablesAsUsed?: boolean
}]
// ----- jsdoc/prefer-import-tag -----
type JsdocPreferImportTag = []|[{
  
  enableFixer?: boolean
  
  exemptTypedefs?: boolean
  
  outputType?: ("named-import" | "namespaced-import")
}]
// ----- jsdoc/require-asterisk-prefix -----
type JsdocRequireAsteriskPrefix = []|[("always" | "never" | "any")]|[("always" | "never" | "any"), {
  
  tags?: {
    
    always?: string[]
    
    any?: string[]
    
    never?: string[]
  }
}]
// ----- jsdoc/require-description -----
type JsdocRequireDescription = []|[{
  
  checkConstructors?: boolean
  
  checkGetters?: boolean
  
  checkSetters?: boolean
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  descriptionStyle?: ("body" | "tag" | "any")
  
  exemptedBy?: string[]
}]
// ----- jsdoc/require-description-complete-sentence -----
type JsdocRequireDescriptionCompleteSentence = []|[{
  
  abbreviations?: string[]
  
  newlineBeforeCapsAssumesBadSentenceEnd?: boolean
  
  tags?: string[]
}]
// ----- jsdoc/require-example -----
type JsdocRequireExample = []|[{
  
  checkConstructors?: boolean
  
  checkGetters?: boolean
  
  checkSetters?: boolean
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  enableFixer?: boolean
  
  exemptedBy?: string[]
  
  exemptNoArguments?: boolean
}]
// ----- jsdoc/require-file-overview -----
type JsdocRequireFileOverview = []|[{
  
  tags?: {
    [k: string]: {
      initialCommentsOnly?: boolean
      mustExist?: boolean
      preventDuplicates?: boolean
    }
  }
}]
// ----- jsdoc/require-hyphen-before-param-description -----
type JsdocRequireHyphenBeforeParamDescription = []|[("always" | "never")]|[("always" | "never"), {
  
  tags?: ({
    [k: string]: ("always" | "never")
  } | "any")
}]
// ----- jsdoc/require-jsdoc -----
type JsdocRequireJsdoc = []|[{
  
  checkAllFunctionExpressions?: boolean
  
  checkConstructors?: boolean
  
  checkGetters?: (boolean | "no-setter")
  
  checkSetters?: (boolean | "no-getter")
  
  contexts?: (string | {
    context?: string
    inlineCommentBlock?: boolean
    minLineCount?: number
  })[]
  
  enableFixer?: boolean
  
  exemptEmptyConstructors?: boolean
  
  exemptEmptyFunctions?: boolean
  
  exemptOverloadedImplementations?: boolean
  
  fixerMessage?: string
  
  minLineCount?: number
  
  publicOnly?: (boolean | {
    ancestorsOnly?: boolean
    cjs?: boolean
    esm?: boolean
    window?: boolean
  })
  
  require?: {
    
    ArrowFunctionExpression?: boolean
    
    ClassDeclaration?: boolean
    
    ClassExpression?: boolean
    
    FunctionDeclaration?: boolean
    
    FunctionExpression?: boolean
    
    MethodDefinition?: boolean
  }
  
  skipInterveningOverloadedDeclarations?: boolean
}]
// ----- jsdoc/require-param -----
type JsdocRequireParam = []|[{
  
  autoIncrementBase?: number
  
  checkConstructors?: boolean
  
  checkDestructured?: boolean
  
  checkDestructuredRoots?: boolean
  
  checkGetters?: boolean
  
  checkRestProperty?: boolean
  
  checkSetters?: boolean
  
  checkTypesPattern?: string
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  enableFixer?: boolean
  
  enableRestElementFixer?: boolean
  
  enableRootFixer?: boolean
  
  exemptedBy?: string[]
  
  ignoreWhenAllParamsMissing?: boolean
  
  interfaceExemptsParamsCheck?: boolean
  
  unnamedRootBase?: string[]
  
  useDefaultObjectProperties?: boolean
}]
// ----- jsdoc/require-param-description -----
type JsdocRequireParamDescription = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  defaultDestructuredRootDescription?: string
  
  setDefaultDestructuredRootDescription?: boolean
}]
// ----- jsdoc/require-param-name -----
type JsdocRequireParamName = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
}]
// ----- jsdoc/require-param-type -----
type JsdocRequireParamType = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  defaultDestructuredRootType?: string
  
  setDefaultDestructuredRootType?: boolean
}]
// ----- jsdoc/require-rejects -----
type JsdocRequireRejects = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  exemptedBy?: string[]
}]
// ----- jsdoc/require-returns -----
type JsdocRequireReturns = []|[{
  
  checkConstructors?: boolean
  
  checkGetters?: boolean
  
  contexts?: (string | {
    comment?: string
    context?: string
    forceRequireReturn?: boolean
  })[]
  
  enableFixer?: boolean
  
  exemptedBy?: string[]
  
  forceRequireReturn?: boolean
  
  forceReturnsWithAsync?: boolean
  
  publicOnly?: (boolean | {
    ancestorsOnly?: boolean
    cjs?: boolean
    esm?: boolean
    window?: boolean
  })
}]
// ----- jsdoc/require-returns-check -----
type JsdocRequireReturnsCheck = []|[{
  
  exemptAsync?: boolean
  
  exemptGenerators?: boolean
  
  noNativeTypes?: boolean
  
  reportMissingReturnForUndefinedTypes?: boolean
}]
// ----- jsdoc/require-returns-description -----
type JsdocRequireReturnsDescription = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
}]
// ----- jsdoc/require-returns-type -----
type JsdocRequireReturnsType = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
}]
// ----- jsdoc/require-tags -----
type JsdocRequireTags = []|[{
  
  tags?: (string | {
    context?: string
    tag?: string
    [k: string]: unknown | undefined
  })[]
}]
// ----- jsdoc/require-template -----
type JsdocRequireTemplate = []|[{
  
  exemptedBy?: string[]
  
  requireSeparateTemplates?: boolean
}]
// ----- jsdoc/require-throws -----
type JsdocRequireThrows = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  exemptedBy?: string[]
}]
// ----- jsdoc/require-yields -----
type JsdocRequireYields = []|[{
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  exemptedBy?: string[]
  
  forceRequireNext?: boolean
  
  forceRequireYields?: boolean
  
  next?: boolean
  
  nextWithGeneratorTag?: boolean
  
  withGeneratorTag?: boolean
}]
// ----- jsdoc/require-yields-check -----
type JsdocRequireYieldsCheck = []|[{
  
  checkGeneratorsOnly?: boolean
  
  contexts?: (string | {
    comment?: string
    context?: string
  })[]
  
  next?: boolean
}]
// ----- jsdoc/sort-tags -----
type JsdocSortTags = []|[{
  
  alphabetizeExtras?: boolean
  
  linesBetween?: number
  
  reportIntraTagGroupSpacing?: boolean
  
  reportTagGroupSpacing?: boolean
  
  tagExceptions?: {
    [k: string]: number
  }
  
  tagSequence?: {
    
    tags?: string[]
  }[]
}]
// ----- jsdoc/tag-lines -----
type JsdocTagLines = []|[("always" | "any" | "never")]|[("always" | "any" | "never"), {
  
  applyToEndTag?: boolean
  
  count?: number
  
  endLines?: (number | null)
  
  maxBlockLines?: (number | null)
  
  startLines?: (number | null)
  
  startLinesWithNoTags?: number
  
  tags?: {
    [k: string]: {
      count?: number
      lines?: ("always" | "never" | "any")
    }
  }
}]
// ----- jsdoc/text-escaping -----
type JsdocTextEscaping = []|[{
  
  escapeHTML?: boolean
  
  escapeMarkdown?: boolean
}]
// ----- jsdoc/ts-method-signature-style -----
type JsdocTsMethodSignatureStyle = []|[("method" | "property")]|[("method" | "property"), {
  
  enableFixer?: boolean
}]
// ----- jsdoc/ts-no-unnecessary-template-expression -----
type JsdocTsNoUnnecessaryTemplateExpression = []|[{
  
  enableFixer?: boolean
}]
// ----- jsdoc/ts-prefer-function-type -----
type JsdocTsPreferFunctionType = []|[{
  
  enableFixer?: boolean
}]
// ----- jsdoc/type-formatting -----
type JsdocTypeFormatting = []|[{
  
  arrayBrackets?: ("angle" | "square")
  
  arrowFunctionPostReturnMarkerSpacing?: string
  
  arrowFunctionPreReturnMarkerSpacing?: string
  
  enableFixer?: boolean
  
  functionOrClassParameterSpacing?: string
  
  functionOrClassPostGenericSpacing?: string
  
  functionOrClassPostReturnMarkerSpacing?: string
  
  functionOrClassPreReturnMarkerSpacing?: string
  
  functionOrClassTypeParameterSpacing?: string
  
  genericAndTupleElementSpacing?: string
  
  genericDot?: boolean
  
  keyValuePostColonSpacing?: string
  
  keyValuePostKeySpacing?: string
  
  keyValuePostOptionalSpacing?: string
  
  keyValuePostVariadicSpacing?: string
  
  methodQuotes?: ("double" | "single")
  
  objectFieldIndent?: string
  
  objectFieldQuote?: ("double" | "single" | null)
  
  objectFieldSeparator?: ("comma" | "comma-and-linebreak" | "linebreak" | "semicolon" | "semicolon-and-linebreak")
  
  objectFieldSeparatorOptionalLinebreak?: boolean
  
  objectFieldSeparatorTrailingPunctuation?: boolean
  
  objectTypeBracketSpacing?: string
  
  parameterDefaultValueSpacing?: string
  
  postMethodNameSpacing?: string
  
  postNewSpacing?: string
  
  separatorForSingleObjectField?: boolean
  
  stringQuotes?: ("double" | "single")
  
  trailingPunctuationMultilineOnly?: boolean
  
  typeBracketSpacing?: string
  
  unionSpacing?: string
}]
// ----- jsdoc/valid-types -----
type JsdocValidTypes = []|[{
  
  allowEmptyNamepaths?: boolean
}]
// ----- jsonc/array-bracket-newline -----
type JsoncArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- jsonc/array-bracket-spacing -----
type JsoncArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- jsonc/array-element-newline -----
type JsoncArrayElementNewline = []|[(_JsoncArrayElementNewlineBasicConfig | {
  ArrayExpression?: _JsoncArrayElementNewlineBasicConfig
  JSONArrayExpression?: _JsoncArrayElementNewlineBasicConfig
  ArrayPattern?: _JsoncArrayElementNewlineBasicConfig
})]
type _JsoncArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})
// ----- jsonc/comma-dangle -----
type JsoncCommaDangle = []|[(_JsoncCommaDangleValue | {
  arrays?: _JsoncCommaDangleValueWithIgnore
  objects?: _JsoncCommaDangleValueWithIgnore
  imports?: _JsoncCommaDangleValueWithIgnore
  exports?: _JsoncCommaDangleValueWithIgnore
  functions?: _JsoncCommaDangleValueWithIgnore
})]
type _JsoncCommaDangleValue = ("always-multiline" | "always" | "never" | "only-multiline")
type _JsoncCommaDangleValueWithIgnore = ("always-multiline" | "always" | "ignore" | "never" | "only-multiline")
// ----- jsonc/comma-style -----
type JsoncCommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- jsonc/indent -----
type JsoncIndent = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: ((number | ("first" | "off")) | {
    var?: (number | ("first" | "off"))
    let?: (number | ("first" | "off"))
    const?: (number | ("first" | "off"))
  })
  outerIIFEBody?: (number | "off")
  MemberExpression?: (number | "off")
  FunctionDeclaration?: {
    parameters?: (number | ("first" | "off"))
    body?: number
  }
  FunctionExpression?: {
    parameters?: (number | ("first" | "off"))
    body?: number
  }
  StaticBlock?: {
    body?: number
  }
  CallExpression?: {
    arguments?: (number | ("first" | "off"))
  }
  ArrayExpression?: (number | ("first" | "off"))
  ObjectExpression?: (number | ("first" | "off"))
  ImportDeclaration?: (number | ("first" | "off"))
  flatTernaryExpressions?: boolean
  offsetTernaryExpressions?: boolean
  ignoredNodes?: string[]
  ignoreComments?: boolean
}]
// ----- jsonc/key-name-casing -----
type JsoncKeyNameCasing = []|[{
  camelCase?: boolean
  PascalCase?: boolean
  SCREAMING_SNAKE_CASE?: boolean
  "kebab-case"?: boolean
  snake_case?: boolean
  ignores?: string[]
}]
// ----- jsonc/key-spacing -----
type JsoncKeySpacing = []|[({
  align?: (("colon" | "value") | {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      mode?: ("strict" | "minimum")
      on?: ("colon" | "value")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- jsonc/no-irregular-whitespace -----
type JsoncNoIrregularWhitespace = []|[{
  skipComments?: boolean
  skipStrings?: boolean
  skipTemplates?: boolean
  skipRegExps?: boolean
  skipJSXText?: boolean
}]
// ----- jsonc/no-useless-escape -----
type JsoncNoUselessEscape = []|[{
  allowRegexCharacters?: string[]
}]
// ----- jsonc/object-curly-newline -----
type JsoncObjectCurlyNewline = []|[((("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
}) | {
  ObjectExpression?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ObjectPattern?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ImportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ExportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
})]
// ----- jsonc/object-curly-spacing -----
type JsoncObjectCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
}]
// ----- jsonc/object-property-newline -----
type JsoncObjectPropertyNewline = []|[{
  allowAllPropertiesOnSameLine?: boolean
  allowMultiplePropertiesPerLine?: boolean
}]
// ----- jsonc/quote-props -----
type JsoncQuoteProps = ([]|[("always" | "as-needed" | "consistent" | "consistent-as-needed")] | []|[("always" | "as-needed" | "consistent" | "consistent-as-needed")]|[("always" | "as-needed" | "consistent" | "consistent-as-needed"), {
  keywords?: boolean
  unnecessary?: boolean
  numbers?: boolean
}])
// ----- jsonc/quotes -----
type JsoncQuotes = []|[("single" | "double" | "backtick")]|[("single" | "double" | "backtick"), ("avoid-escape" | {
  avoidEscape?: boolean
  allowTemplateLiterals?: boolean
})]
// ----- jsonc/sort-array-values -----
type JsoncSortArrayValues = [{
  pathPattern: string
  order: ((string | {
    valuePattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minValues?: number
}, ...({
  pathPattern: string
  order: ((string | {
    valuePattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minValues?: number
})[]]
// ----- jsonc/sort-keys -----
type JsoncSortKeys = ([{
  pathPattern: string
  hasProperties?: string[]
  order: ((string | {
    keyPattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minKeys?: number
  allowLineSeparatedGroups?: boolean
}, ...({
  pathPattern: string
  hasProperties?: string[]
  order: ((string | {
    keyPattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minKeys?: number
  allowLineSeparatedGroups?: boolean
})[]] | []|[("asc" | "desc")]|[("asc" | "desc"), {
  caseSensitive?: boolean
  natural?: boolean
  minKeys?: number
  allowLineSeparatedGroups?: boolean
}])
// ----- jsonc/space-unary-ops -----
type JsoncSpaceUnaryOps = []|[{
  words?: boolean
  nonwords?: boolean
  overrides?: {
    [k: string]: boolean | undefined
  }
}]
// ----- jsx-quotes -----
type JsxQuotes = []|[("prefer-single" | "prefer-double")]
// ----- key-spacing -----
type KeySpacing = []|[({
  align?: (("colon" | "value") | {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      mode?: ("strict" | "minimum")
      on?: ("colon" | "value")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- keyword-spacing -----
type KeywordSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    abstract?: {
      before?: boolean
      after?: boolean
    }
    as?: {
      before?: boolean
      after?: boolean
    }
    async?: {
      before?: boolean
      after?: boolean
    }
    await?: {
      before?: boolean
      after?: boolean
    }
    boolean?: {
      before?: boolean
      after?: boolean
    }
    break?: {
      before?: boolean
      after?: boolean
    }
    byte?: {
      before?: boolean
      after?: boolean
    }
    case?: {
      before?: boolean
      after?: boolean
    }
    catch?: {
      before?: boolean
      after?: boolean
    }
    char?: {
      before?: boolean
      after?: boolean
    }
    class?: {
      before?: boolean
      after?: boolean
    }
    const?: {
      before?: boolean
      after?: boolean
    }
    continue?: {
      before?: boolean
      after?: boolean
    }
    debugger?: {
      before?: boolean
      after?: boolean
    }
    default?: {
      before?: boolean
      after?: boolean
    }
    delete?: {
      before?: boolean
      after?: boolean
    }
    do?: {
      before?: boolean
      after?: boolean
    }
    double?: {
      before?: boolean
      after?: boolean
    }
    else?: {
      before?: boolean
      after?: boolean
    }
    enum?: {
      before?: boolean
      after?: boolean
    }
    export?: {
      before?: boolean
      after?: boolean
    }
    extends?: {
      before?: boolean
      after?: boolean
    }
    false?: {
      before?: boolean
      after?: boolean
    }
    final?: {
      before?: boolean
      after?: boolean
    }
    finally?: {
      before?: boolean
      after?: boolean
    }
    float?: {
      before?: boolean
      after?: boolean
    }
    for?: {
      before?: boolean
      after?: boolean
    }
    from?: {
      before?: boolean
      after?: boolean
    }
    function?: {
      before?: boolean
      after?: boolean
    }
    get?: {
      before?: boolean
      after?: boolean
    }
    goto?: {
      before?: boolean
      after?: boolean
    }
    if?: {
      before?: boolean
      after?: boolean
    }
    implements?: {
      before?: boolean
      after?: boolean
    }
    import?: {
      before?: boolean
      after?: boolean
    }
    in?: {
      before?: boolean
      after?: boolean
    }
    instanceof?: {
      before?: boolean
      after?: boolean
    }
    int?: {
      before?: boolean
      after?: boolean
    }
    interface?: {
      before?: boolean
      after?: boolean
    }
    let?: {
      before?: boolean
      after?: boolean
    }
    long?: {
      before?: boolean
      after?: boolean
    }
    native?: {
      before?: boolean
      after?: boolean
    }
    new?: {
      before?: boolean
      after?: boolean
    }
    null?: {
      before?: boolean
      after?: boolean
    }
    of?: {
      before?: boolean
      after?: boolean
    }
    package?: {
      before?: boolean
      after?: boolean
    }
    private?: {
      before?: boolean
      after?: boolean
    }
    protected?: {
      before?: boolean
      after?: boolean
    }
    public?: {
      before?: boolean
      after?: boolean
    }
    return?: {
      before?: boolean
      after?: boolean
    }
    set?: {
      before?: boolean
      after?: boolean
    }
    short?: {
      before?: boolean
      after?: boolean
    }
    static?: {
      before?: boolean
      after?: boolean
    }
    super?: {
      before?: boolean
      after?: boolean
    }
    switch?: {
      before?: boolean
      after?: boolean
    }
    synchronized?: {
      before?: boolean
      after?: boolean
    }
    this?: {
      before?: boolean
      after?: boolean
    }
    throw?: {
      before?: boolean
      after?: boolean
    }
    throws?: {
      before?: boolean
      after?: boolean
    }
    transient?: {
      before?: boolean
      after?: boolean
    }
    true?: {
      before?: boolean
      after?: boolean
    }
    try?: {
      before?: boolean
      after?: boolean
    }
    typeof?: {
      before?: boolean
      after?: boolean
    }
    var?: {
      before?: boolean
      after?: boolean
    }
    void?: {
      before?: boolean
      after?: boolean
    }
    volatile?: {
      before?: boolean
      after?: boolean
    }
    while?: {
      before?: boolean
      after?: boolean
    }
    with?: {
      before?: boolean
      after?: boolean
    }
    yield?: {
      before?: boolean
      after?: boolean
    }
  }
}]
// ----- line-comment-position -----
type LineCommentPosition = []|[(("above" | "beside") | {
  position?: ("above" | "beside")
  ignorePattern?: string
  applyDefaultPatterns?: boolean
  applyDefaultIgnorePatterns?: boolean
})]
// ----- linebreak-style -----
type LinebreakStyle = []|[("unix" | "windows")]
// ----- lines-around-comment -----
type LinesAroundComment = []|[{
  beforeBlockComment?: boolean
  afterBlockComment?: boolean
  beforeLineComment?: boolean
  afterLineComment?: boolean
  allowBlockStart?: boolean
  allowBlockEnd?: boolean
  allowClassStart?: boolean
  allowClassEnd?: boolean
  allowObjectStart?: boolean
  allowObjectEnd?: boolean
  allowArrayStart?: boolean
  allowArrayEnd?: boolean
  ignorePattern?: string
  applyDefaultIgnorePatterns?: boolean
  afterHashbangComment?: boolean
}]
// ----- lines-around-directive -----
type LinesAroundDirective = []|[(("always" | "never") | {
  before?: ("always" | "never")
  after?: ("always" | "never")
})]
// ----- lines-between-class-members -----
type LinesBetweenClassMembers = []|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never"))]|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never")), {
  exceptAfterSingleLine?: boolean
}]
// ----- logical-assignment-operators -----
type LogicalAssignmentOperators = (([]|["always"]|["always", {
  enforceForIfStatements?: boolean
}] | ["never"]) & unknown[])
// ----- markdown/fenced-code-language -----
type MarkdownFencedCodeLanguage = []|[{
  required?: string[]
}]
// ----- markdown/heading-increment -----
type MarkdownHeadingIncrement = []|[{
  frontmatterTitle?: string
}]
// ----- markdown/no-duplicate-definitions -----
type MarkdownNoDuplicateDefinitions = []|[{
  allowDefinitions?: string[]
  allowFootnoteDefinitions?: string[]
}]
// ----- markdown/no-duplicate-headings -----
type MarkdownNoDuplicateHeadings = []|[{
  checkSiblingsOnly?: boolean
}]
// ----- markdown/no-empty-definitions -----
type MarkdownNoEmptyDefinitions = []|[{
  allowDefinitions?: string[]
  allowFootnoteDefinitions?: string[]
  checkFootnoteDefinitions?: boolean
}]
// ----- markdown/no-html -----
type MarkdownNoHtml = []|[{
  allowed?: string[]
  allowedIgnoreCase?: boolean
}]
// ----- markdown/no-missing-atx-heading-space -----
type MarkdownNoMissingAtxHeadingSpace = []|[{
  checkClosedHeadings?: boolean
}]
// ----- markdown/no-missing-label-refs -----
type MarkdownNoMissingLabelRefs = []|[{
  allowLabels?: string[]
}]
// ----- markdown/no-missing-link-fragments -----
type MarkdownNoMissingLinkFragments = []|[{
  ignoreCase?: boolean
  allowPattern?: string
}]
// ----- markdown/no-multiple-h1 -----
type MarkdownNoMultipleH1 = []|[{
  frontmatterTitle?: string
}]
// ----- markdown/no-space-in-emphasis -----
type MarkdownNoSpaceInEmphasis = []|[{
  checkStrikethrough?: boolean
}]
// ----- markdown/no-unused-definitions -----
type MarkdownNoUnusedDefinitions = []|[{
  allowDefinitions?: string[]
  allowFootnoteDefinitions?: string[]
}]
// ----- markdown/table-column-count -----
type MarkdownTableColumnCount = []|[{
  checkMissingCells?: boolean
}]
// ----- max-classes-per-file -----
type MaxClassesPerFile = []|[(number | {
  ignoreExpressions?: boolean
  max?: number
})]
// ----- max-depth -----
type MaxDepth = []|[(number | {
  maximum?: number
  max?: number
})]
// ----- max-len -----
type MaxLen = []|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), {
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
}]
// ----- max-lines -----
type MaxLines = []|[(number | {
  max?: number
  skipComments?: boolean
  skipBlankLines?: boolean
})]
// ----- max-lines-per-function -----
type MaxLinesPerFunction = []|[({
  max?: number
  skipComments?: boolean
  skipBlankLines?: boolean
  IIFEs?: boolean
} | number)]
// ----- max-nested-callbacks -----
type MaxNestedCallbacks = []|[(number | {
  maximum?: number
  max?: number
})]
// ----- max-params -----
type MaxParams = []|[(number | {
  maximum?: number
  max?: number
  
  countVoidThis?: boolean
  
  countThis?: ("never" | "except-void" | "always")
})]
// ----- max-statements -----
type MaxStatements = []|[(number | {
  maximum?: number
  max?: number
})]|[(number | {
  maximum?: number
  max?: number
}), {
  ignoreTopLevelFunctions?: boolean
}]
// ----- max-statements-per-line -----
type MaxStatementsPerLine = []|[{
  max?: number
}]
// ----- multiline-comment-style -----
type MultilineCommentStyle = ([]|[("starred-block" | "bare-block")] | []|["separate-lines"]|["separate-lines", {
  checkJSDoc?: boolean
}])
// ----- multiline-ternary -----
type MultilineTernary = []|[("always" | "always-multiline" | "never")]
// ----- new-cap -----
type NewCap = []|[{
  newIsCap?: boolean
  capIsNew?: boolean
  newIsCapExceptions?: string[]
  newIsCapExceptionPattern?: string
  capIsNewExceptions?: string[]
  capIsNewExceptionPattern?: string
  properties?: boolean
}]
// ----- new-parens -----
type NewParens = []|[("always" | "never")]
// ----- newline-after-var -----
type NewlineAfterVar = []|[("never" | "always")]
// ----- newline-per-chained-call -----
type NewlinePerChainedCall = []|[{
  ignoreChainWithDepth?: number
}]
// ----- next/no-html-link-for-pages -----
type NextNoHtmlLinkForPages = []|[(string | string[])]
// ----- no-bitwise -----
type NoBitwise = []|[{
  allow?: ("^" | "|" | "&" | "<<" | ">>" | ">>>" | "^=" | "|=" | "&=" | "<<=" | ">>=" | ">>>=" | "~")[]
  int32Hint?: boolean
}]
// ----- no-cond-assign -----
type NoCondAssign = []|[("except-parens" | "always")]
// ----- no-confusing-arrow -----
type NoConfusingArrow = []|[{
  allowParens?: boolean
  onlyOneSimpleParam?: boolean
}]
// ----- no-console -----
type NoConsole = []|[{
  
  allow?: [string, ...(string)[]]
}]
// ----- no-constant-condition -----
type NoConstantCondition = []|[{
  checkLoops?: ("all" | "allExceptWhileTrue" | "none" | true | false)
}]
// ----- no-duplicate-imports -----
type NoDuplicateImports = []|[{
  includeExports?: boolean
  allowSeparateTypeImports?: boolean
}]
// ----- no-else-return -----
type NoElseReturn = []|[{
  allowElseIf?: boolean
}]
// ----- no-empty -----
type NoEmpty = []|[{
  allowEmptyCatch?: boolean
}]
// ----- no-empty-function -----
type NoEmptyFunction = []|[{
  allow?: ("functions" | "arrowFunctions" | "generatorFunctions" | "methods" | "generatorMethods" | "getters" | "setters" | "constructors" | "asyncFunctions" | "asyncMethods" | "privateConstructors" | "protectedConstructors" | "decoratedFunctions" | "overrideMethods")[]
}]
// ----- no-empty-pattern -----
type NoEmptyPattern = []|[{
  allowObjectPatternsAsParameters?: boolean
}]
// ----- no-eval -----
type NoEval = []|[{
  allowIndirect?: boolean
}]
// ----- no-extend-native -----
type NoExtendNative = []|[{
  exceptions?: string[]
}]
// ----- no-extra-boolean-cast -----
type NoExtraBooleanCast = []|[({
  enforceForInnerExpressions?: boolean
} | {
  enforceForLogicalOperands?: boolean
})]
// ----- no-extra-parens -----
type NoExtraParens = ([]|["functions"] | []|["all"]|["all", {
  conditionalAssign?: boolean
  ternaryOperandBinaryExpressions?: boolean
  nestedBinaryExpressions?: boolean
  returnAssign?: boolean
  ignoreJSX?: ("none" | "all" | "single-line" | "multi-line")
  enforceForArrowConditionals?: boolean
  enforceForSequenceExpressions?: boolean
  enforceForNewInMemberExpressions?: boolean
  enforceForFunctionPrototypeMethods?: boolean
  allowParensAfterCommentPattern?: string
}])
// ----- no-fallthrough -----
type NoFallthrough = []|[{
  commentPattern?: string
  allowEmptyCase?: boolean
  reportUnusedFallthroughComment?: boolean
}]
// ----- no-global-assign -----
type NoGlobalAssign = []|[{
  exceptions?: string[]
}]
// ----- no-implicit-coercion -----
type NoImplicitCoercion = []|[{
  boolean?: boolean
  number?: boolean
  string?: boolean
  disallowTemplateShorthand?: boolean
  allow?: ("~" | "!!" | "+" | "- -" | "-" | "*")[]
}]
// ----- no-implicit-globals -----
type NoImplicitGlobals = []|[{
  lexicalBindings?: boolean
}]
// ----- no-inline-comments -----
type NoInlineComments = []|[{
  ignorePattern?: string
}]
// ----- no-inner-declarations -----
type NoInnerDeclarations = []|[("functions" | "both")]|[("functions" | "both"), {
  blockScopedFunctions?: ("allow" | "disallow")
}]
// ----- no-invalid-regexp -----
type NoInvalidRegexp = []|[{
  allowConstructorFlags?: string[]
}]
// ----- no-invalid-this -----
type NoInvalidThis = []|[{
  capIsConstructor?: boolean
}]
// ----- no-irregular-whitespace -----
type NoIrregularWhitespace = []|[{
  skipComments?: boolean
  skipStrings?: boolean
  skipTemplates?: boolean
  skipRegExps?: boolean
  skipJSXText?: boolean
}]
// ----- no-labels -----
type NoLabels = []|[{
  allowLoop?: boolean
  allowSwitch?: boolean
}]
// ----- no-magic-numbers -----
type NoMagicNumbers = []|[{
  detectObjects?: boolean
  enforceConst?: boolean
  ignore?: (number | string)[]
  ignoreArrayIndexes?: boolean
  ignoreDefaultValues?: boolean
  ignoreClassFieldInitialValues?: boolean
  ignoreEnums?: boolean
  ignoreNumericLiteralTypes?: boolean
  ignoreReadonlyClassProperties?: boolean
  ignoreTypeIndexes?: boolean
}]
// ----- no-misleading-character-class -----
type NoMisleadingCharacterClass = []|[{
  allowEscape?: boolean
}]
// ----- no-mixed-operators -----
type NoMixedOperators = []|[{
  groups?: [("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ...(("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"))[]][]
  allowSamePrecedence?: boolean
}]
// ----- no-mixed-requires -----
type NoMixedRequires = []|[(boolean | {
  grouping?: boolean
  allowCall?: boolean
})]
// ----- no-mixed-spaces-and-tabs -----
type NoMixedSpacesAndTabs = []|[("smart-tabs" | true | false)]
// ----- no-multi-assign -----
type NoMultiAssign = []|[{
  ignoreNonDeclaration?: boolean
}]
// ----- no-multi-spaces -----
type NoMultiSpaces = []|[{
  exceptions?: {
    [k: string]: boolean
  }
  ignoreEOLComments?: boolean
}]
// ----- no-multiple-empty-lines -----
type NoMultipleEmptyLines = []|[{
  max: number
  maxEOF?: number
  maxBOF?: number
}]
// ----- no-native-reassign -----
type NoNativeReassign = []|[{
  exceptions?: string[]
}]
// ----- no-param-reassign -----
type NoParamReassign = []|[({
  props?: false
} | {
  props?: true
  ignorePropertyModificationsFor?: string[]
  ignorePropertyModificationsForRegex?: string[]
})]
// ----- no-plusplus -----
type NoPlusplus = []|[{
  allowForLoopAfterthoughts?: boolean
}]
// ----- no-promise-executor-return -----
type NoPromiseExecutorReturn = []|[{
  allowVoid?: boolean
}]
// ----- no-redeclare -----
type NoRedeclare = []|[{
  builtinGlobals?: boolean
}]
// ----- no-restricted-exports -----
type NoRestrictedExports = []|[({
  restrictedNamedExports?: string[]
  restrictedNamedExportsPattern?: string
} | {
  restrictedNamedExports?: string[]
  restrictedNamedExportsPattern?: string
  restrictDefaultExports?: {
    direct?: boolean
    named?: boolean
    defaultFrom?: boolean
    namedFrom?: boolean
    namespaceFrom?: boolean
  }
})]
// ----- no-restricted-globals -----
type NoRestrictedGlobals = ((string | {
  name: string
  message?: string
})[] | []|[{
  
  globals: (string | {
    name: string
    message?: string
  })[]
  checkGlobalObject?: boolean
  globalObjects?: string[]
}])
// ----- no-restricted-imports -----
type NoRestrictedImports = ((string | {
  name: string
  message?: string
  importNames?: string[]
  allowImportNames?: string[]
  
  allowTypeImports?: boolean
})[] | []|[{
  paths?: (string | {
    name: string
    message?: string
    importNames?: string[]
    allowImportNames?: string[]
    
    allowTypeImports?: boolean
  })[]
  patterns?: (string[] | ({
    [k: string]: unknown | undefined
  } | {
    [k: string]: unknown | undefined
  })[])
}])
// ----- no-restricted-modules -----
type NoRestrictedModules = ((string | {
  name: string
  message?: string
})[] | {
  paths?: (string | {
    name: string
    message?: string
  })[]
  patterns?: string[]
}[])
// ----- no-restricted-properties -----
type NoRestrictedProperties = ({
  [k: string]: unknown | undefined
} | {
  [k: string]: unknown | undefined
})[]
// ----- no-restricted-syntax -----
type NoRestrictedSyntax = (string | {
  selector: string
  message?: string
})[]
// ----- no-return-assign -----
type NoReturnAssign = []|[("except-parens" | "always")]
// ----- no-self-assign -----
type NoSelfAssign = []|[{
  props?: boolean
}]
// ----- no-sequences -----
type NoSequences = []|[{
  allowInParentheses?: boolean
}]
// ----- no-shadow -----
type NoShadow = []|[{
  builtinGlobals?: boolean
  hoist?: ("all" | "functions" | "never" | "types" | "functions-and-types")
  allow?: string[]
  ignoreOnInitialization?: boolean
  ignoreTypeValueShadow?: boolean
  ignoreFunctionTypeParameterNameValueShadow?: boolean
}]
// ----- no-shadow-restricted-names -----
type NoShadowRestrictedNames = []|[{
  reportGlobalThis?: boolean
}]
// ----- no-sync -----
type NoSync = []|[{
  allowAtRootLevel?: boolean
}]
// ----- no-tabs -----
type NoTabs = []|[{
  allowIndentationTabs?: boolean
}]
// ----- no-trailing-spaces -----
type NoTrailingSpaces = []|[{
  skipBlankLines?: boolean
  ignoreComments?: boolean
}]
// ----- no-undef -----
type NoUndef = []|[{
  typeof?: boolean
}]
// ----- no-underscore-dangle -----
type NoUnderscoreDangle = []|[{
  allow?: string[]
  allowAfterThis?: boolean
  allowAfterSuper?: boolean
  allowAfterThisConstructor?: boolean
  enforceInMethodNames?: boolean
  allowFunctionParams?: boolean
  enforceInClassFields?: boolean
  allowInArrayDestructuring?: boolean
  allowInObjectDestructuring?: boolean
}]
// ----- no-unneeded-ternary -----
type NoUnneededTernary = []|[{
  defaultAssignment?: boolean
}]
// ----- no-unreachable-loop -----
type NoUnreachableLoop = []|[{
  ignore?: ("WhileStatement" | "DoWhileStatement" | "ForStatement" | "ForInStatement" | "ForOfStatement")[]
}]
// ----- no-unsafe-negation -----
type NoUnsafeNegation = []|[{
  enforceForOrderingRelations?: boolean
}]
// ----- no-unsafe-optional-chaining -----
type NoUnsafeOptionalChaining = []|[{
  disallowArithmeticOperators?: boolean
}]
// ----- no-unused-expressions -----
type NoUnusedExpressions = []|[{
  allowShortCircuit?: boolean
  allowTernary?: boolean
  allowTaggedTemplates?: boolean
  enforceForJSX?: boolean
  ignoreDirectives?: boolean
}]
// ----- no-unused-vars -----
type NoUnusedVars = []|[(("all" | "local") | {
  vars?: ("all" | "local")
  varsIgnorePattern?: string
  args?: ("all" | "after-used" | "none")
  ignoreRestSiblings?: boolean
  argsIgnorePattern?: string
  caughtErrors?: ("all" | "none")
  caughtErrorsIgnorePattern?: string
  destructuredArrayIgnorePattern?: string
  ignoreClassWithStaticInitBlock?: boolean
  ignoreUsingDeclarations?: boolean
  reportUsedIgnorePattern?: boolean
})]
// ----- no-use-before-define -----
type NoUseBeforeDefine = []|[("nofunc" | {
  functions?: boolean
  classes?: boolean
  variables?: boolean
  allowNamedExports?: boolean
  enums?: boolean
  typedefs?: boolean
  ignoreTypeReferences?: boolean
})]
// ----- no-useless-computed-key -----
type NoUselessComputedKey = []|[{
  enforceForClassMembers?: boolean
}]
// ----- no-useless-escape -----
type NoUselessEscape = []|[{
  allowRegexCharacters?: string[]
}]
// ----- no-useless-rename -----
type NoUselessRename = []|[{
  ignoreDestructuring?: boolean
  ignoreImport?: boolean
  ignoreExport?: boolean
}]
// ----- no-void -----
type NoVoid = []|[{
  allowAsStatement?: boolean
}]
// ----- no-warning-comments -----
type NoWarningComments = []|[{
  terms?: string[]
  location?: ("start" | "anywhere")
  
  decoration?: [string, ...(string)[]]
}]
// ----- node/callback-return -----
type NodeCallbackReturn = []|[string[]]
// ----- node/exports-style -----
type NodeExportsStyle = []|[("module.exports" | "exports")]|[("module.exports" | "exports"), {
  allowBatchAssign?: boolean
}]
// ----- node/file-extension-in-import -----
type NodeFileExtensionInImport = []|[("always" | "never")]|[("always" | "never"), {
  [k: string]: ("always" | "never") | undefined
}]
// ----- node/handle-callback-err -----
type NodeHandleCallbackErr = []|[string]
// ----- node/hashbang -----
type NodeHashbang = []|[{
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  ignoreUnpublished?: boolean
  additionalExecutables?: string[]
  executableMap?: {
    [k: string]: string
  }
}]
// ----- node/no-deprecated-api -----
type NodeNoDeprecatedApi = []|[{
  version?: string
  ignoreModuleItems?: ("_linklist" | "_stream_wrap" | "async_hooks.currentId" | "async_hooks.triggerId" | "buffer.Buffer()" | "new buffer.Buffer()" | "buffer.SlowBuffer" | "constants" | "crypto._toBuf" | "crypto.Credentials" | "crypto.DEFAULT_ENCODING" | "crypto.createCipher" | "crypto.createCredentials" | "crypto.createDecipher" | "crypto.fips" | "crypto.prng" | "crypto.pseudoRandomBytes" | "crypto.rng" | "domain" | "events.EventEmitter.listenerCount" | "events.listenerCount" | "freelist" | "fs.SyncWriteStream" | "fs.exists" | "fs.lchmod" | "fs.lchmodSync" | "http.createClient" | "module.Module.createRequireFromPath" | "module.Module.requireRepl" | "module.Module._debug" | "module.createRequireFromPath" | "module.requireRepl" | "module._debug" | "net._setSimultaneousAccepts" | "os.getNetworkInterfaces" | "os.tmpDir" | "path._makeLong" | "process.EventEmitter" | "process.assert" | "process.binding" | "process.env.NODE_REPL_HISTORY_FILE" | "process.report.triggerReport" | "punycode" | "readline.codePointAt" | "readline.getStringWidth" | "readline.isFullWidthCodePoint" | "readline.stripVTControlCharacters" | "repl.REPLServer" | "repl.Recoverable" | "repl.REPL_MODE_MAGIC" | "repl.builtinModules" | "safe-buffer.Buffer()" | "new safe-buffer.Buffer()" | "safe-buffer.SlowBuffer" | "sys" | "timers.enroll" | "timers.unenroll" | "tls.CleartextStream" | "tls.CryptoStream" | "tls.SecurePair" | "tls.convertNPNProtocols" | "tls.createSecurePair" | "tls.parseCertString" | "tty.setRawMode" | "url.parse" | "url.resolve" | "util.debug" | "util.error" | "util.isArray" | "util.isBoolean" | "util.isBuffer" | "util.isDate" | "util.isError" | "util.isFunction" | "util.isNull" | "util.isNullOrUndefined" | "util.isNumber" | "util.isObject" | "util.isPrimitive" | "util.isRegExp" | "util.isString" | "util.isSymbol" | "util.isUndefined" | "util.log" | "util.print" | "util.pump" | "util.puts" | "util._extend" | "vm.runInDebugContext" | "zlib.BrotliCompress()" | "zlib.BrotliDecompress()" | "zlib.Deflate()" | "zlib.DeflateRaw()" | "zlib.Gunzip()" | "zlib.Gzip()" | "zlib.Inflate()" | "zlib.InflateRaw()" | "zlib.Unzip()")[]
  ignoreGlobalItems?: ("Buffer()" | "new Buffer()" | "COUNTER_NET_SERVER_CONNECTION" | "COUNTER_NET_SERVER_CONNECTION_CLOSE" | "COUNTER_HTTP_SERVER_REQUEST" | "COUNTER_HTTP_SERVER_RESPONSE" | "COUNTER_HTTP_CLIENT_REQUEST" | "COUNTER_HTTP_CLIENT_RESPONSE" | "GLOBAL" | "Intl.v8BreakIterator" | "require.extensions" | "root" | "process.EventEmitter" | "process.assert" | "process.binding" | "process.env.NODE_REPL_HISTORY_FILE" | "process.report.triggerReport")[]
  ignoreIndirectDependencies?: boolean
}]
// ----- node/no-extraneous-import -----
type NodeNoExtraneousImport = []|[{
  allowModules?: string[]
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  resolvePaths?: string[]
  resolverConfig?: {
    [k: string]: unknown | undefined
  }
}]
// ----- node/no-extraneous-require -----
type NodeNoExtraneousRequire = []|[{
  allowModules?: string[]
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  resolvePaths?: string[]
  resolverConfig?: {
    [k: string]: unknown | undefined
  }
  tryExtensions?: string[]
}]
// ----- node/no-hide-core-modules -----
type NodeNoHideCoreModules = []|[{
  allow?: ("assert" | "buffer" | "child_process" | "cluster" | "console" | "constants" | "crypto" | "dgram" | "dns" | "events" | "fs" | "http" | "https" | "module" | "net" | "os" | "path" | "querystring" | "readline" | "repl" | "stream" | "string_decoder" | "timers" | "tls" | "tty" | "url" | "util" | "vm" | "zlib")[]
  ignoreDirectDependencies?: boolean
  ignoreIndirectDependencies?: boolean
}]
// ----- node/no-missing-import -----
type NodeNoMissingImport = []|[{
  allowModules?: string[]
  resolvePaths?: string[]
  resolverConfig?: {
    [k: string]: unknown | undefined
  }
  tryExtensions?: string[]
  ignoreTypeImport?: boolean
  tsconfigPath?: string
  typescriptExtensionMap?: (unknown[][] | ("react" | "react-jsx" | "react-jsxdev" | "react-native" | "preserve"))
}]
// ----- node/no-missing-require -----
type NodeNoMissingRequire = []|[{
  allowModules?: string[]
  tryExtensions?: string[]
  resolvePaths?: string[]
  resolverConfig?: {
    [k: string]: unknown | undefined
  }
  typescriptExtensionMap?: (unknown[][] | ("react" | "react-jsx" | "react-jsxdev" | "react-native" | "preserve"))
  tsconfigPath?: string
}]
// ----- node/no-mixed-requires -----
type NodeNoMixedRequires = []|[(boolean | {
  grouping?: boolean
  allowCall?: boolean
})]
// ----- node/no-process-env -----
type NodeNoProcessEnv = []|[{
  allowedVariables?: string[]
}]
// ----- node/no-restricted-import -----
type NodeNoRestrictedImport = []|[(string | {
  name: (string | string[])
  message?: string
})[]]
// ----- node/no-restricted-require -----
type NodeNoRestrictedRequire = []|[(string | {
  name: (string | string[])
  message?: string
})[]]
// ----- node/no-sync -----
type NodeNoSync = []|[{
  allowAtRootLevel?: boolean
  ignores?: (string | {
    from?: "file"
    path?: string
    name?: string[]
  } | {
    from?: "lib"
    name?: string[]
  } | {
    from?: "package"
    package?: string
    name?: string[]
  })[]
}]
// ----- node/no-top-level-await -----
type NodeNoTopLevelAwait = []|[{
  ignoreBin?: boolean
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
}]
// ----- node/no-unpublished-bin -----
type NodeNoUnpublishedBin = []|[{
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  [k: string]: unknown | undefined
}]
// ----- node/no-unpublished-import -----
type NodeNoUnpublishedImport = []|[{
  allowModules?: string[]
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  resolvePaths?: string[]
  resolverConfig?: {
    [k: string]: unknown | undefined
  }
  tryExtensions?: string[]
  ignoreTypeImport?: boolean
  ignorePrivate?: boolean
}]
// ----- node/no-unpublished-require -----
type NodeNoUnpublishedRequire = []|[{
  allowModules?: string[]
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  resolvePaths?: string[]
  resolverConfig?: {
    [k: string]: unknown | undefined
  }
  tryExtensions?: string[]
  ignorePrivate?: boolean
}]
// ----- node/no-unsupported-features/es-builtins -----
type NodeNoUnsupportedFeaturesEsBuiltins = []|[{
  version?: string
  ignores?: ("AggregateError" | "Array" | "Array.from" | "Array.isArray" | "Array.length" | "Array.of" | "Array.toLocaleString" | "ArrayBuffer" | "ArrayBuffer.isView" | "Atomics" | "Atomics.add" | "Atomics.and" | "Atomics.compareExchange" | "Atomics.exchange" | "Atomics.isLockFree" | "Atomics.load" | "Atomics.notify" | "Atomics.or" | "Atomics.store" | "Atomics.sub" | "Atomics.wait" | "Atomics.waitAsync" | "Atomics.xor" | "BigInt" | "BigInt.asIntN" | "BigInt.asUintN" | "BigInt64Array" | "BigInt64Array.BYTES_PER_ELEMENT" | "BigInt64Array.from" | "BigInt64Array.name" | "BigInt64Array.of" | "BigUint64Array" | "BigUint64Array.BYTES_PER_ELEMENT" | "BigUint64Array.from" | "BigUint64Array.name" | "BigUint64Array.of" | "Boolean" | "DataView" | "Date" | "Date.UTC" | "Date.now" | "Date.parse" | "Date.toLocaleDateString" | "Date.toLocaleString" | "Date.toLocaleTimeString" | "Error" | "Error.cause" | "EvalError" | "FinalizationRegistry" | "Float32Array" | "Float32Array.BYTES_PER_ELEMENT" | "Float32Array.from" | "Float32Array.name" | "Float32Array.of" | "Float64Array" | "Float64Array.BYTES_PER_ELEMENT" | "Float64Array.from" | "Float64Array.name" | "Float64Array.of" | "Function" | "Function.length" | "Function.name" | "Infinity" | "Int16Array" | "Int16Array.BYTES_PER_ELEMENT" | "Int16Array.from" | "Int16Array.name" | "Int16Array.of" | "Int32Array" | "Int32Array.BYTES_PER_ELEMENT" | "Int32Array.from" | "Int32Array.name" | "Int32Array.of" | "Int8Array" | "Int8Array.BYTES_PER_ELEMENT" | "Int8Array.from" | "Int8Array.name" | "Int8Array.of" | "Intl" | "Intl.Collator" | "Intl.DateTimeFormat" | "Intl.DisplayNames" | "Intl.ListFormat" | "Intl.Locale" | "Intl.NumberFormat" | "Intl.PluralRules" | "Intl.RelativeTimeFormat" | "Intl.Segmenter" | "Intl.Segments" | "Intl.getCanonicalLocales" | "Intl.supportedValuesOf" | "JSON" | "JSON.parse" | "JSON.stringify" | "Map" | "Map.groupBy" | "Math" | "Math.E" | "Math.LN10" | "Math.LN2" | "Math.LOG10E" | "Math.LOG2E" | "Math.PI" | "Math.SQRT1_2" | "Math.SQRT2" | "Math.abs" | "Math.acos" | "Math.acosh" | "Math.asin" | "Math.asinh" | "Math.atan" | "Math.atan2" | "Math.atanh" | "Math.cbrt" | "Math.ceil" | "Math.clz32" | "Math.cos" | "Math.cosh" | "Math.exp" | "Math.expm1" | "Math.floor" | "Math.fround" | "Math.hypot" | "Math.imul" | "Math.log" | "Math.log10" | "Math.log1p" | "Math.log2" | "Math.max" | "Math.min" | "Math.pow" | "Math.random" | "Math.round" | "Math.sign" | "Math.sin" | "Math.sinh" | "Math.sqrt" | "Math.tan" | "Math.tanh" | "Math.trunc" | "NaN" | "Number.EPSILON" | "Number.MAX_SAFE_INTEGER" | "Number.MAX_VALUE" | "Number.MIN_SAFE_INTEGER" | "Number.MIN_VALUE" | "Number.NEGATIVE_INFINITY" | "Number.NaN" | "Number.POSITIVE_INFINITY" | "Number.isFinite" | "Number.isInteger" | "Number.isNaN" | "Number.isSafeInteger" | "Number.parseFloat" | "Number.parseInt" | "Number.toLocaleString" | "Object.assign" | "Object.create" | "Object.defineGetter" | "Object.defineProperties" | "Object.defineProperty" | "Object.defineSetter" | "Object.entries" | "Object.freeze" | "Object.fromEntries" | "Object.getOwnPropertyDescriptor" | "Object.getOwnPropertyDescriptors" | "Object.getOwnPropertyNames" | "Object.getOwnPropertySymbols" | "Object.getPrototypeOf" | "Object.groupBy" | "Object.hasOwn" | "Object.is" | "Object.isExtensible" | "Object.isFrozen" | "Object.isSealed" | "Object.keys" | "Object.lookupGetter" | "Object.lookupSetter" | "Object.preventExtensions" | "Object.proto" | "Object.seal" | "Object.setPrototypeOf" | "Object.values" | "Promise" | "Promise.all" | "Promise.allSettled" | "Promise.any" | "Promise.race" | "Promise.reject" | "Promise.resolve" | "Proxy" | "Proxy.revocable" | "RangeError" | "ReferenceError" | "Reflect" | "Reflect.apply" | "Reflect.construct" | "Reflect.defineProperty" | "Reflect.deleteProperty" | "Reflect.get" | "Reflect.getOwnPropertyDescriptor" | "Reflect.getPrototypeOf" | "Reflect.has" | "Reflect.isExtensible" | "Reflect.ownKeys" | "Reflect.preventExtensions" | "Reflect.set" | "Reflect.setPrototypeOf" | "RegExp" | "RegExp.dotAll" | "RegExp.hasIndices" | "RegExp.input" | "RegExp.lastIndex" | "RegExp.lastMatch" | "RegExp.lastParen" | "RegExp.leftContext" | "RegExp.n" | "RegExp.rightContext" | "Set" | "SharedArrayBuffer" | "String" | "String.fromCharCode" | "String.fromCodePoint" | "String.length" | "String.localeCompare" | "String.raw" | "String.toLocaleLowerCase" | "String.toLocaleUpperCase" | "Symbol" | "Symbol.asyncIterator" | "Symbol.for" | "Symbol.hasInstance" | "Symbol.isConcatSpreadable" | "Symbol.iterator" | "Symbol.keyFor" | "Symbol.match" | "Symbol.matchAll" | "Symbol.replace" | "Symbol.search" | "Symbol.species" | "Symbol.split" | "Symbol.toPrimitive" | "Symbol.toStringTag" | "Symbol.unscopables" | "SyntaxError" | "TypeError" | "URIError" | "Uint16Array" | "Uint16Array.BYTES_PER_ELEMENT" | "Uint16Array.from" | "Uint16Array.name" | "Uint16Array.of" | "Uint32Array" | "Uint32Array.BYTES_PER_ELEMENT" | "Uint32Array.from" | "Uint32Array.name" | "Uint32Array.of" | "Uint8Array" | "Uint8Array.BYTES_PER_ELEMENT" | "Uint8Array.from" | "Uint8Array.name" | "Uint8Array.of" | "Uint8ClampedArray" | "Uint8ClampedArray.BYTES_PER_ELEMENT" | "Uint8ClampedArray.from" | "Uint8ClampedArray.name" | "Uint8ClampedArray.of" | "WeakMap" | "WeakRef" | "WeakSet" | "decodeURI" | "decodeURIComponent" | "encodeURI" | "encodeURIComponent" | "escape" | "eval" | "globalThis" | "isFinite" | "isNaN" | "parseFloat" | "parseInt" | "unescape")[]
}]
// ----- node/no-unsupported-features/es-syntax -----
type NodeNoUnsupportedFeaturesEsSyntax = []|[{
  version?: string
  ignores?: ("no-accessor-properties" | "accessor-properties" | "accessorProperties" | "no-arbitrary-module-namespace-names" | "arbitrary-module-namespace-names" | "arbitraryModuleNamespaceNames" | "no-array-from" | "array-from" | "arrayFrom" | "no-array-isarray" | "array-isarray" | "arrayIsarray" | "no-array-of" | "array-of" | "arrayOf" | "no-array-prototype-copywithin" | "array-prototype-copywithin" | "arrayPrototypeCopywithin" | "no-array-prototype-entries" | "array-prototype-entries" | "arrayPrototypeEntries" | "no-array-prototype-every" | "array-prototype-every" | "arrayPrototypeEvery" | "no-array-prototype-fill" | "array-prototype-fill" | "arrayPrototypeFill" | "no-array-prototype-filter" | "array-prototype-filter" | "arrayPrototypeFilter" | "no-array-prototype-find" | "array-prototype-find" | "arrayPrototypeFind" | "no-array-prototype-findindex" | "array-prototype-findindex" | "arrayPrototypeFindindex" | "no-array-prototype-findlast-findlastindex" | "array-prototype-findlast-findlastindex" | "arrayPrototypeFindlastFindlastindex" | "no-array-prototype-flat" | "array-prototype-flat" | "arrayPrototypeFlat" | "no-array-prototype-foreach" | "array-prototype-foreach" | "arrayPrototypeForeach" | "no-array-prototype-includes" | "array-prototype-includes" | "arrayPrototypeIncludes" | "no-array-prototype-indexof" | "array-prototype-indexof" | "arrayPrototypeIndexof" | "no-array-prototype-keys" | "array-prototype-keys" | "arrayPrototypeKeys" | "no-array-prototype-lastindexof" | "array-prototype-lastindexof" | "arrayPrototypeLastindexof" | "no-array-prototype-map" | "array-prototype-map" | "arrayPrototypeMap" | "no-array-prototype-reduce" | "array-prototype-reduce" | "arrayPrototypeReduce" | "no-array-prototype-reduceright" | "array-prototype-reduceright" | "arrayPrototypeReduceright" | "no-array-prototype-some" | "array-prototype-some" | "arrayPrototypeSome" | "no-array-prototype-toreversed" | "array-prototype-toreversed" | "arrayPrototypeToreversed" | "no-array-prototype-tosorted" | "array-prototype-tosorted" | "arrayPrototypeTosorted" | "no-array-prototype-tospliced" | "array-prototype-tospliced" | "arrayPrototypeTospliced" | "no-array-prototype-values" | "array-prototype-values" | "arrayPrototypeValues" | "no-array-prototype-with" | "array-prototype-with" | "arrayPrototypeWith" | "no-array-string-prototype-at" | "array-string-prototype-at" | "arrayStringPrototypeAt" | "no-arrow-functions" | "arrow-functions" | "arrowFunctions" | "no-async-functions" | "async-functions" | "asyncFunctions" | "no-async-iteration" | "async-iteration" | "asyncIteration" | "no-atomics-waitasync" | "atomics-waitasync" | "atomicsWaitasync" | "no-atomics" | "atomics" | "no-bigint" | "bigint" | "no-binary-numeric-literals" | "binary-numeric-literals" | "binaryNumericLiterals" | "no-block-scoped-functions" | "block-scoped-functions" | "blockScopedFunctions" | "no-block-scoped-variables" | "block-scoped-variables" | "blockScopedVariables" | "no-class-fields" | "class-fields" | "classFields" | "no-class-static-block" | "class-static-block" | "classStaticBlock" | "no-classes" | "classes" | "no-computed-properties" | "computed-properties" | "computedProperties" | "no-date-now" | "date-now" | "dateNow" | "no-date-prototype-getyear-setyear" | "date-prototype-getyear-setyear" | "datePrototypeGetyearSetyear" | "no-date-prototype-togmtstring" | "date-prototype-togmtstring" | "datePrototypeTogmtstring" | "no-default-parameters" | "default-parameters" | "defaultParameters" | "no-destructuring" | "destructuring" | "no-dynamic-import" | "dynamic-import" | "dynamicImport" | "no-error-cause" | "error-cause" | "errorCause" | "no-escape-unescape" | "escape-unescape" | "escapeUnescape" | "no-exponential-operators" | "exponential-operators" | "exponentialOperators" | "no-export-ns-from" | "export-ns-from" | "exportNsFrom" | "no-for-of-loops" | "for-of-loops" | "forOfLoops" | "no-function-declarations-in-if-statement-clauses-without-block" | "function-declarations-in-if-statement-clauses-without-block" | "functionDeclarationsInIfStatementClausesWithoutBlock" | "no-function-prototype-bind" | "function-prototype-bind" | "functionPrototypeBind" | "no-generators" | "generators" | "no-global-this" | "global-this" | "globalThis" | "no-hashbang" | "hashbang" | "no-import-meta" | "import-meta" | "importMeta" | "no-initializers-in-for-in" | "initializers-in-for-in" | "initializersInForIn" | "no-intl-datetimeformat-prototype-formatrange" | "intl-datetimeformat-prototype-formatrange" | "intlDatetimeformatPrototypeFormatrange" | "no-intl-datetimeformat-prototype-formattoparts" | "intl-datetimeformat-prototype-formattoparts" | "intlDatetimeformatPrototypeFormattoparts" | "no-intl-displaynames" | "intl-displaynames" | "intlDisplaynames" | "no-intl-getcanonicallocales" | "intl-getcanonicallocales" | "intlGetcanonicallocales" | "no-intl-listformat" | "intl-listformat" | "intlListformat" | "no-intl-locale" | "intl-locale" | "intlLocale" | "no-intl-numberformat-prototype-formatrange" | "intl-numberformat-prototype-formatrange" | "intlNumberformatPrototypeFormatrange" | "no-intl-numberformat-prototype-formatrangetoparts" | "intl-numberformat-prototype-formatrangetoparts" | "intlNumberformatPrototypeFormatrangetoparts" | "no-intl-numberformat-prototype-formattoparts" | "intl-numberformat-prototype-formattoparts" | "intlNumberformatPrototypeFormattoparts" | "no-intl-pluralrules-prototype-selectrange" | "intl-pluralrules-prototype-selectrange" | "intlPluralrulesPrototypeSelectrange" | "no-intl-pluralrules" | "intl-pluralrules" | "intlPluralrules" | "no-intl-relativetimeformat" | "intl-relativetimeformat" | "intlRelativetimeformat" | "no-intl-segmenter" | "intl-segmenter" | "intlSegmenter" | "no-intl-supportedvaluesof" | "intl-supportedvaluesof" | "intlSupportedvaluesof" | "no-json-superset" | "json-superset" | "jsonSuperset" | "no-json" | "json" | "no-keyword-properties" | "keyword-properties" | "keywordProperties" | "no-labelled-function-declarations" | "labelled-function-declarations" | "labelledFunctionDeclarations" | "no-legacy-object-prototype-accessor-methods" | "legacy-object-prototype-accessor-methods" | "legacyObjectPrototypeAccessorMethods" | "no-logical-assignment-operators" | "logical-assignment-operators" | "logicalAssignmentOperators" | "no-malformed-template-literals" | "malformed-template-literals" | "malformedTemplateLiterals" | "no-map" | "map" | "no-math-acosh" | "math-acosh" | "mathAcosh" | "no-math-asinh" | "math-asinh" | "mathAsinh" | "no-math-atanh" | "math-atanh" | "mathAtanh" | "no-math-cbrt" | "math-cbrt" | "mathCbrt" | "no-math-clz32" | "math-clz32" | "mathClz32" | "no-math-cosh" | "math-cosh" | "mathCosh" | "no-math-expm1" | "math-expm1" | "mathExpm1" | "no-math-fround" | "math-fround" | "mathFround" | "no-math-hypot" | "math-hypot" | "mathHypot" | "no-math-imul" | "math-imul" | "mathImul" | "no-math-log10" | "math-log10" | "mathLog10" | "no-math-log1p" | "math-log1p" | "mathLog1p" | "no-math-log2" | "math-log2" | "mathLog2" | "no-math-sign" | "math-sign" | "mathSign" | "no-math-sinh" | "math-sinh" | "mathSinh" | "no-math-tanh" | "math-tanh" | "mathTanh" | "no-math-trunc" | "math-trunc" | "mathTrunc" | "no-modules" | "modules" | "no-new-target" | "new-target" | "newTarget" | "new.target" | "no-nullish-coalescing-operators" | "nullish-coalescing-operators" | "nullishCoalescingOperators" | "no-number-epsilon" | "number-epsilon" | "numberEpsilon" | "no-number-isfinite" | "number-isfinite" | "numberIsfinite" | "no-number-isinteger" | "number-isinteger" | "numberIsinteger" | "no-number-isnan" | "number-isnan" | "numberIsnan" | "no-number-issafeinteger" | "number-issafeinteger" | "numberIssafeinteger" | "no-number-maxsafeinteger" | "number-maxsafeinteger" | "numberMaxsafeinteger" | "no-number-minsafeinteger" | "number-minsafeinteger" | "numberMinsafeinteger" | "no-number-parsefloat" | "number-parsefloat" | "numberParsefloat" | "no-number-parseint" | "number-parseint" | "numberParseint" | "no-numeric-separators" | "numeric-separators" | "numericSeparators" | "no-object-assign" | "object-assign" | "objectAssign" | "no-object-create" | "object-create" | "objectCreate" | "no-object-defineproperties" | "object-defineproperties" | "objectDefineproperties" | "no-object-defineproperty" | "object-defineproperty" | "objectDefineproperty" | "no-object-entries" | "object-entries" | "objectEntries" | "no-object-freeze" | "object-freeze" | "objectFreeze" | "no-object-fromentries" | "object-fromentries" | "objectFromentries" | "no-object-getownpropertydescriptor" | "object-getownpropertydescriptor" | "objectGetownpropertydescriptor" | "no-object-getownpropertydescriptors" | "object-getownpropertydescriptors" | "objectGetownpropertydescriptors" | "no-object-getownpropertynames" | "object-getownpropertynames" | "objectGetownpropertynames" | "no-object-getownpropertysymbols" | "object-getownpropertysymbols" | "objectGetownpropertysymbols" | "no-object-getprototypeof" | "object-getprototypeof" | "objectGetprototypeof" | "no-object-hasown" | "object-hasown" | "objectHasown" | "no-object-is" | "object-is" | "objectIs" | "no-object-isextensible" | "object-isextensible" | "objectIsextensible" | "no-object-isfrozen" | "object-isfrozen" | "objectIsfrozen" | "no-object-issealed" | "object-issealed" | "objectIssealed" | "no-object-keys" | "object-keys" | "objectKeys" | "no-object-map-groupby" | "object-map-groupby" | "objectMapGroupby" | "no-object-preventextensions" | "object-preventextensions" | "objectPreventextensions" | "no-object-seal" | "object-seal" | "objectSeal" | "no-object-setprototypeof" | "object-setprototypeof" | "objectSetprototypeof" | "no-object-super-properties" | "object-super-properties" | "objectSuperProperties" | "no-object-values" | "object-values" | "objectValues" | "no-octal-numeric-literals" | "octal-numeric-literals" | "octalNumericLiterals" | "no-optional-catch-binding" | "optional-catch-binding" | "optionalCatchBinding" | "no-optional-chaining" | "optional-chaining" | "optionalChaining" | "no-private-in" | "private-in" | "privateIn" | "no-promise-all-settled" | "promise-all-settled" | "promiseAllSettled" | "no-promise-any" | "promise-any" | "promiseAny" | "no-promise-prototype-finally" | "promise-prototype-finally" | "promisePrototypeFinally" | "no-promise-withresolvers" | "promise-withresolvers" | "promiseWithresolvers" | "no-promise" | "promise" | "no-property-shorthands" | "property-shorthands" | "propertyShorthands" | "no-proxy" | "proxy" | "no-reflect" | "reflect" | "no-regexp-d-flag" | "regexp-d-flag" | "regexpDFlag" | "no-regexp-lookbehind-assertions" | "regexp-lookbehind-assertions" | "regexpLookbehindAssertions" | "regexpLookbehind" | "no-regexp-named-capture-groups" | "regexp-named-capture-groups" | "regexpNamedCaptureGroups" | "no-regexp-prototype-compile" | "regexp-prototype-compile" | "regexpPrototypeCompile" | "no-regexp-prototype-flags" | "regexp-prototype-flags" | "regexpPrototypeFlags" | "no-regexp-s-flag" | "regexp-s-flag" | "regexpSFlag" | "regexpS" | "no-regexp-u-flag" | "regexp-u-flag" | "regexpUFlag" | "regexpU" | "no-regexp-unicode-property-escapes-2019" | "regexp-unicode-property-escapes-2019" | "regexpUnicodePropertyEscapes2019" | "no-regexp-unicode-property-escapes-2020" | "regexp-unicode-property-escapes-2020" | "regexpUnicodePropertyEscapes2020" | "no-regexp-unicode-property-escapes-2021" | "regexp-unicode-property-escapes-2021" | "regexpUnicodePropertyEscapes2021" | "no-regexp-unicode-property-escapes-2022" | "regexp-unicode-property-escapes-2022" | "regexpUnicodePropertyEscapes2022" | "no-regexp-unicode-property-escapes-2023" | "regexp-unicode-property-escapes-2023" | "regexpUnicodePropertyEscapes2023" | "no-regexp-unicode-property-escapes" | "regexp-unicode-property-escapes" | "regexpUnicodePropertyEscapes" | "regexpUnicodeProperties" | "no-regexp-v-flag" | "regexp-v-flag" | "regexpVFlag" | "no-regexp-y-flag" | "regexp-y-flag" | "regexpYFlag" | "regexpY" | "no-resizable-and-growable-arraybuffers" | "resizable-and-growable-arraybuffers" | "resizableAndGrowableArraybuffers" | "no-rest-parameters" | "rest-parameters" | "restParameters" | "no-rest-spread-properties" | "rest-spread-properties" | "restSpreadProperties" | "no-set" | "set" | "no-shadow-catch-param" | "shadow-catch-param" | "shadowCatchParam" | "no-shared-array-buffer" | "shared-array-buffer" | "sharedArrayBuffer" | "no-spread-elements" | "spread-elements" | "spreadElements" | "no-string-create-html-methods" | "string-create-html-methods" | "stringCreateHtmlMethods" | "no-string-fromcodepoint" | "string-fromcodepoint" | "stringFromcodepoint" | "no-string-prototype-codepointat" | "string-prototype-codepointat" | "stringPrototypeCodepointat" | "no-string-prototype-endswith" | "string-prototype-endswith" | "stringPrototypeEndswith" | "no-string-prototype-includes" | "string-prototype-includes" | "stringPrototypeIncludes" | "no-string-prototype-iswellformed-towellformed" | "string-prototype-iswellformed-towellformed" | "stringPrototypeIswellformedTowellformed" | "no-string-prototype-matchall" | "string-prototype-matchall" | "stringPrototypeMatchall" | "no-string-prototype-normalize" | "string-prototype-normalize" | "stringPrototypeNormalize" | "no-string-prototype-padstart-padend" | "string-prototype-padstart-padend" | "stringPrototypePadstartPadend" | "no-string-prototype-repeat" | "string-prototype-repeat" | "stringPrototypeRepeat" | "no-string-prototype-replaceall" | "string-prototype-replaceall" | "stringPrototypeReplaceall" | "no-string-prototype-startswith" | "string-prototype-startswith" | "stringPrototypeStartswith" | "no-string-prototype-substr" | "string-prototype-substr" | "stringPrototypeSubstr" | "no-string-prototype-trim" | "string-prototype-trim" | "stringPrototypeTrim" | "no-string-prototype-trimleft-trimright" | "string-prototype-trimleft-trimright" | "stringPrototypeTrimleftTrimright" | "no-string-prototype-trimstart-trimend" | "string-prototype-trimstart-trimend" | "stringPrototypeTrimstartTrimend" | "no-string-raw" | "string-raw" | "stringRaw" | "no-subclassing-builtins" | "subclassing-builtins" | "subclassingBuiltins" | "no-symbol-prototype-description" | "symbol-prototype-description" | "symbolPrototypeDescription" | "no-symbol" | "symbol" | "no-template-literals" | "template-literals" | "templateLiterals" | "no-top-level-await" | "top-level-await" | "topLevelAwait" | "no-trailing-commas" | "trailing-commas" | "trailingCommas" | "no-trailing-function-commas" | "trailing-function-commas" | "trailingFunctionCommas" | "trailingCommasInFunctions" | "no-typed-arrays" | "typed-arrays" | "typedArrays" | "no-unicode-codepoint-escapes" | "unicode-codepoint-escapes" | "unicodeCodepointEscapes" | "unicodeCodePointEscapes" | "no-weak-map" | "weak-map" | "weakMap" | "no-weak-set" | "weak-set" | "weakSet" | "no-weakrefs" | "weakrefs")[]
}]
// ----- node/no-unsupported-features/node-builtins -----
type NodeNoUnsupportedFeaturesNodeBuiltins = []|[{
  version?: string
  allowExperimental?: boolean
  ignores?: ("__filename" | "__dirname" | "require" | "require.cache" | "require.extensions" | "require.main" | "require.resolve" | "require.resolve.paths" | "module" | "module.children" | "module.exports" | "module.filename" | "module.id" | "module.isPreloading" | "module.loaded" | "module.parent" | "module.path" | "module.paths" | "module.require" | "exports" | "AbortController" | "AbortSignal" | "AbortSignal.abort" | "AbortSignal.timeout" | "AbortSignal.any" | "DOMException" | "FormData" | "Headers" | "MessageEvent" | "Navigator" | "Request" | "Response" | "WebAssembly" | "WebSocket" | "fetch" | "global" | "queueMicrotask" | "navigator" | "navigator.hardwareConcurrency" | "navigator.language" | "navigator.languages" | "navigator.platform" | "navigator.userAgent" | "structuredClone" | "localStorage" | "sessionStorage" | "Storage" | "Blob" | "new Buffer()" | "Buffer" | "Buffer.alloc" | "Buffer.allocUnsafe" | "Buffer.allocUnsafeSlow" | "Buffer.byteLength" | "Buffer.compare" | "Buffer.concat" | "Buffer.copyBytesFrom" | "Buffer.from" | "Buffer.isBuffer" | "Buffer.isEncoding" | "File" | "atob" | "btoa" | "console" | "console.profile" | "console.profileEnd" | "console.timeStamp" | "console.Console" | "console.assert" | "console.clear" | "console.count" | "console.countReset" | "console.debug" | "console.dir" | "console.dirxml" | "console.error" | "console.group" | "console.groupCollapsed" | "console.groupEnd" | "console.info" | "console.log" | "console.table" | "console.time" | "console.timeEnd" | "console.timeLog" | "console.trace" | "console.warn" | "crypto" | "crypto.subtle" | "crypto.subtle.decrypt" | "crypto.subtle.deriveBits" | "crypto.subtle.deriveKey" | "crypto.subtle.digest" | "crypto.subtle.encrypt" | "crypto.subtle.exportKey" | "crypto.subtle.generateKey" | "crypto.subtle.importKey" | "crypto.subtle.sign" | "crypto.subtle.unwrapKey" | "crypto.subtle.verify" | "crypto.subtle.wrapKey" | "crypto.getRandomValues" | "crypto.randomUUID" | "Crypto" | "CryptoKey" | "SubtleCrypto" | "CloseEvent" | "CustomEvent" | "Event" | "EventSource" | "EventTarget" | "PerformanceEntry" | "PerformanceMark" | "PerformanceMeasure" | "PerformanceObserver" | "PerformanceObserverEntryList" | "PerformanceResourceTiming" | "performance" | "performance.clearMarks" | "performance.clearMeasures" | "performance.clearResourceTimings" | "performance.eventLoopUtilization" | "performance.getEntries" | "performance.getEntriesByName" | "performance.getEntriesByType" | "performance.mark" | "performance.markResourceTiming" | "performance.measure" | "performance.nodeTiming" | "performance.nodeTiming.bootstrapComplete" | "performance.nodeTiming.environment" | "performance.nodeTiming.idleTime" | "performance.nodeTiming.loopExit" | "performance.nodeTiming.loopStart" | "performance.nodeTiming.nodeStart" | "performance.nodeTiming.uvMetricsInfo" | "performance.nodeTiming.v8Start" | "performance.now" | "performance.onresourcetimingbufferfull" | "performance.setResourceTimingBufferSize" | "performance.timeOrigin" | "performance.timerify" | "performance.toJSON" | "process" | "process.allowedNodeEnvironmentFlags" | "process.availableMemory" | "process.arch" | "process.argv" | "process.argv0" | "process.channel" | "process.config" | "process.connected" | "process.debugPort" | "process.env" | "process.execArgv" | "process.execPath" | "process.execve" | "process.exitCode" | "process.features.cached_builtins" | "process.features.debug" | "process.features.inspector" | "process.features.ipv6" | "process.features.require_module" | "process.features.tls" | "process.features.tls_alpn" | "process.features.tls_ocsp" | "process.features.tls_sni" | "process.features.typescript" | "process.features.uv" | "process.finalization.register" | "process.finalization.registerBeforeExit" | "process.finalization.unregister" | "process.getBuiltinModule" | "process.mainModule" | "process.noDeprecation" | "process.permission" | "process.pid" | "process.platform" | "process.ppid" | "process.ref" | "process.release" | "process.report" | "process.report.excludeEnv" | "process.sourceMapsEnabled" | "process.stdin" | "process.stdin.isRaw" | "process.stdin.isTTY" | "process.stdin.setRawMode" | "process.stdout" | "process.stdout.clearLine" | "process.stdout.clearScreenDown" | "process.stdout.columns" | "process.stdout.cursorTo" | "process.stdout.getColorDepth" | "process.stdout.getWindowSize" | "process.stdout.hasColors" | "process.stdout.isTTY" | "process.stdout.moveCursor" | "process.stdout.rows" | "process.stderr" | "process.stderr.clearLine" | "process.stderr.clearScreenDown" | "process.stderr.columns" | "process.stderr.cursorTo" | "process.stderr.getColorDepth" | "process.stderr.getWindowSize" | "process.stderr.hasColors" | "process.stderr.isTTY" | "process.stderr.moveCursor" | "process.stderr.rows" | "process.threadCpuUsage" | "process.throwDeprecation" | "process.title" | "process.traceDeprecation" | "process.version" | "process.versions" | "process.abort" | "process.chdir" | "process.constrainedMemory" | "process.cpuUsage" | "process.cwd" | "process.disconnect" | "process.dlopen" | "process.emitWarning" | "process.exit" | "process.getActiveResourcesInfo" | "process.getegid" | "process.geteuid" | "process.getgid" | "process.getgroups" | "process.getuid" | "process.hasUncaughtExceptionCaptureCallback" | "process.hrtime" | "process.hrtime.bigint" | "process.initgroups" | "process.kill" | "process.loadEnvFile" | "process.memoryUsage" | "process.rss" | "process.nextTick" | "process.resourceUsage" | "process.send" | "process.setegid" | "process.seteuid" | "process.setgid" | "process.setgroups" | "process.setuid" | "process.setSourceMapsEnabled" | "process.setUncaughtExceptionCaptureCallback" | "process.umask" | "process.unref" | "process.uptime" | "ReadableStream" | "ReadableStream.from" | "ReadableStreamDefaultReader" | "ReadableStreamBYOBReader" | "ReadableStreamDefaultController" | "ReadableByteStreamController" | "ReadableStreamBYOBRequest" | "WritableStream" | "WritableStreamDefaultWriter" | "WritableStreamDefaultController" | "TransformStream" | "TransformStreamDefaultController" | "ByteLengthQueuingStrategy" | "CountQueuingStrategy" | "TextEncoderStream" | "TextDecoderStream" | "CompressionStream" | "DecompressionStream" | "setInterval" | "clearInterval" | "setTimeout" | "clearTimeout" | "setImmediate" | "clearImmediate" | "URL" | "URL.canParse" | "URL.createObjectURL" | "URL.revokeObjectURL" | "URLSearchParams" | "TextDecoder" | "TextEncoder" | "BroadcastChannel" | "MessageChannel" | "MessagePort" | "assert" | "assert.Assert" | "assert.assert" | "assert.deepEqual" | "assert.deepStrictEqual" | "assert.doesNotMatch" | "assert.doesNotReject" | "assert.doesNotThrow" | "assert.equal" | "assert.fail" | "assert.ifError" | "assert.match" | "assert.notDeepEqual" | "assert.notDeepStrictEqual" | "assert.notEqual" | "assert.notStrictEqual" | "assert.ok" | "assert.partialDeepStrictEqual" | "assert.rejects" | "assert.strictEqual" | "assert.throws" | "assert.CallTracker" | "assert.strict" | "assert.strict.Assert" | "assert.strict.assert" | "assert.strict.deepEqual" | "assert.strict.deepStrictEqual" | "assert.strict.doesNotMatch" | "assert.strict.doesNotReject" | "assert.strict.doesNotThrow" | "assert.strict.equal" | "assert.strict.fail" | "assert.strict.ifError" | "assert.strict.match" | "assert.strict.notDeepEqual" | "assert.strict.notDeepStrictEqual" | "assert.strict.notEqual" | "assert.strict.notStrictEqual" | "assert.strict.ok" | "assert.strict.partialDeepStrictEqual" | "assert.strict.rejects" | "assert.strict.strictEqual" | "assert.strict.throws" | "assert.strict.CallTracker" | "assert/strict" | "assert/strict.Assert" | "assert/strict.assert" | "assert/strict.deepEqual" | "assert/strict.deepStrictEqual" | "assert/strict.doesNotMatch" | "assert/strict.doesNotReject" | "assert/strict.doesNotThrow" | "assert/strict.equal" | "assert/strict.fail" | "assert/strict.ifError" | "assert/strict.match" | "assert/strict.notDeepEqual" | "assert/strict.notDeepStrictEqual" | "assert/strict.notEqual" | "assert/strict.notStrictEqual" | "assert/strict.ok" | "assert/strict.partialDeepStrictEqual" | "assert/strict.rejects" | "assert/strict.strictEqual" | "assert/strict.throws" | "assert/strict.CallTracker" | "async_hooks" | "async_hooks.createHook" | "async_hooks.executionAsyncResource" | "async_hooks.executionAsyncId" | "async_hooks.triggerAsyncId" | "async_hooks.AsyncLocalStorage" | "async_hooks.AsyncLocalStorage.bind" | "async_hooks.AsyncLocalStorage.snapshot" | "async_hooks.AsyncResource" | "async_hooks.AsyncResource.bind" | "buffer" | "buffer.constants" | "buffer.INSPECT_MAX_BYTES" | "buffer.kMaxLength" | "buffer.kStringMaxLength" | "buffer.atob" | "buffer.btoa" | "buffer.isAscii" | "buffer.isUtf8" | "buffer.resolveObjectURL" | "buffer.transcode" | "buffer.SlowBuffer" | "buffer.Blob" | "new buffer.Buffer()" | "buffer.Buffer" | "buffer.Buffer.alloc" | "buffer.Buffer.allocUnsafe" | "buffer.Buffer.allocUnsafeSlow" | "buffer.Buffer.byteLength" | "buffer.Buffer.compare" | "buffer.Buffer.concat" | "buffer.Buffer.copyBytesFrom" | "buffer.Buffer.from" | "buffer.Buffer.isBuffer" | "buffer.Buffer.isEncoding" | "buffer.File" | "child_process" | "child_process.exec" | "child_process.execFile" | "child_process.fork" | "child_process.spawn" | "child_process.execFileSync" | "child_process.execSync" | "child_process.spawnSync" | "child_process.ChildProcess" | "cluster" | "cluster.isMaster" | "cluster.isPrimary" | "cluster.isWorker" | "cluster.schedulingPolicy" | "cluster.settings" | "cluster.worker" | "cluster.workers" | "cluster.disconnect" | "cluster.fork" | "cluster.setupMaster" | "cluster.setupPrimary" | "cluster.Worker" | "crypto.constants" | "crypto.fips" | "crypto.webcrypto" | "crypto.webcrypto.subtle" | "crypto.webcrypto.subtle.decrypt" | "crypto.webcrypto.subtle.deriveBits" | "crypto.webcrypto.subtle.deriveKey" | "crypto.webcrypto.subtle.digest" | "crypto.webcrypto.subtle.encrypt" | "crypto.webcrypto.subtle.exportKey" | "crypto.webcrypto.subtle.generateKey" | "crypto.webcrypto.subtle.importKey" | "crypto.webcrypto.subtle.sign" | "crypto.webcrypto.subtle.unwrapKey" | "crypto.webcrypto.subtle.verify" | "crypto.webcrypto.subtle.wrapKey" | "crypto.webcrypto.getRandomValues" | "crypto.webcrypto.randomUUID" | "crypto.checkPrime" | "crypto.checkPrimeSync" | "crypto.createCipher" | "crypto.createCipheriv" | "crypto.createDecipher" | "crypto.createDecipheriv" | "crypto.createDiffieHellman" | "crypto.createDiffieHellmanGroup" | "crypto.createECDH" | "crypto.createHash" | "crypto.createHmac" | "crypto.createPrivateKey" | "crypto.createPublicKey" | "crypto.createSecretKey" | "crypto.createSign" | "crypto.createVerify" | "crypto.diffieHellman" | "crypto.generateKey" | "crypto.generateKeyPair" | "crypto.generateKeyPairSync" | "crypto.generateKeySync" | "crypto.generatePrime" | "crypto.generatePrimeSync" | "crypto.getCipherInfo" | "crypto.getCiphers" | "crypto.getCurves" | "crypto.getDiffieHellman" | "crypto.getFips" | "crypto.getHashes" | "crypto.hash" | "crypto.hkdf" | "crypto.hkdfSync" | "crypto.pbkdf2" | "crypto.pbkdf2Sync" | "crypto.privateDecrypt" | "crypto.privateEncrypt" | "crypto.publicDecrypt" | "crypto.publicEncrypt" | "crypto.randomBytes" | "crypto.randomFillSync" | "crypto.randomFill" | "crypto.randomInt" | "crypto.scrypt" | "crypto.scryptSync" | "crypto.secureHeapUsed" | "crypto.setEngine" | "crypto.setFips" | "crypto.sign" | "crypto.timingSafeEqual" | "crypto.verify" | "crypto.Certificate" | "crypto.Certificate.exportChallenge" | "crypto.Certificate.exportPublicKey" | "crypto.Certificate.verifySpkac" | "crypto.Cipher" | "crypto.Decipher" | "crypto.DiffieHellman" | "crypto.DiffieHellmanGroup" | "crypto.ECDH" | "crypto.ECDH.convertKey" | "crypto.Hash()" | "new crypto.Hash()" | "crypto.Hash" | "crypto.Hmac()" | "new crypto.Hmac()" | "crypto.Hmac" | "crypto.KeyObject" | "crypto.KeyObject.from" | "crypto.Sign" | "crypto.Verify" | "crypto.X509Certificate" | "dgram" | "dgram.createSocket" | "dgram.Socket" | "diagnostics_channel" | "diagnostics_channel.hasSubscribers" | "diagnostics_channel.channel" | "diagnostics_channel.subscribe" | "diagnostics_channel.unsubscribe" | "diagnostics_channel.tracingChannel" | "diagnostics_channel.Channel" | "diagnostics_channel.TracingChannel" | "dns" | "dns.Resolver" | "dns.getServers" | "dns.lookup" | "dns.lookupService" | "dns.resolve" | "dns.resolve4" | "dns.resolve6" | "dns.resolveAny" | "dns.resolveCname" | "dns.resolveCaa" | "dns.resolveMx" | "dns.resolveNaptr" | "dns.resolveNs" | "dns.resolvePtr" | "dns.resolveSoa" | "dns.resolveSrv" | "dns.resolveTlsa" | "dns.resolveTxt" | "dns.reverse" | "dns.setDefaultResultOrder" | "dns.getDefaultResultOrder" | "dns.setServers" | "dns.promises" | "dns.promises.Resolver" | "dns.promises.cancel" | "dns.promises.getServers" | "dns.promises.lookup" | "dns.promises.lookupService" | "dns.promises.resolve" | "dns.promises.resolve4" | "dns.promises.resolve6" | "dns.promises.resolveAny" | "dns.promises.resolveCaa" | "dns.promises.resolveCname" | "dns.promises.resolveMx" | "dns.promises.resolveNaptr" | "dns.promises.resolveNs" | "dns.promises.resolvePtr" | "dns.promises.resolveSoa" | "dns.promises.resolveSrv" | "dns.promises.resolveTlsa" | "dns.promises.resolveTxt" | "dns.promises.reverse" | "dns.promises.setDefaultResultOrder" | "dns.promises.getDefaultResultOrder" | "dns.promises.setServers" | "dns/promises" | "dns/promises.Resolver" | "dns/promises.cancel" | "dns/promises.getServers" | "dns/promises.lookup" | "dns/promises.lookupService" | "dns/promises.resolve" | "dns/promises.resolve4" | "dns/promises.resolve6" | "dns/promises.resolveAny" | "dns/promises.resolveCaa" | "dns/promises.resolveCname" | "dns/promises.resolveMx" | "dns/promises.resolveNaptr" | "dns/promises.resolveNs" | "dns/promises.resolvePtr" | "dns/promises.resolveSoa" | "dns/promises.resolveSrv" | "dns/promises.resolveTlsa" | "dns/promises.resolveTxt" | "dns/promises.reverse" | "dns/promises.setDefaultResultOrder" | "dns/promises.getDefaultResultOrder" | "dns/promises.setServers" | "domain" | "domain.create" | "domain.Domain" | "events" | "events.Event" | "events.EventTarget" | "events.CustomEvent" | "events.NodeEventTarget" | "events.EventEmitter" | "events.EventEmitter.defaultMaxListeners" | "events.EventEmitter.errorMonitor" | "events.EventEmitter.captureRejections" | "events.EventEmitter.captureRejectionSymbol" | "events.EventEmitter.getEventListeners" | "events.EventEmitter.getMaxListeners" | "events.EventEmitter.once" | "events.EventEmitter.listenerCount" | "events.EventEmitter.on" | "events.EventEmitter.setMaxListeners" | "events.EventEmitter.addAbortListener" | "events.EventEmitterAsyncResource" | "events.EventEmitterAsyncResource.defaultMaxListeners" | "events.EventEmitterAsyncResource.errorMonitor" | "events.EventEmitterAsyncResource.captureRejections" | "events.EventEmitterAsyncResource.captureRejectionSymbol" | "events.EventEmitterAsyncResource.getEventListeners" | "events.EventEmitterAsyncResource.getMaxListeners" | "events.EventEmitterAsyncResource.once" | "events.EventEmitterAsyncResource.listenerCount" | "events.EventEmitterAsyncResource.on" | "events.EventEmitterAsyncResource.setMaxListeners" | "events.EventEmitterAsyncResource.addAbortListener" | "events.defaultMaxListeners" | "events.errorMonitor" | "events.captureRejections" | "events.captureRejectionSymbol" | "events.getEventListeners" | "events.getMaxListeners" | "events.once" | "events.listenerCount" | "events.on" | "events.setMaxListeners" | "events.addAbortListener" | "fs" | "fs.promises" | "fs.promises.FileHandle" | "fs.promises.access" | "fs.promises.appendFile" | "fs.promises.chmod" | "fs.promises.chown" | "fs.promises.constants" | "fs.promises.copyFile" | "fs.promises.cp" | "fs.promises.glob" | "fs.promises.lchmod" | "fs.promises.lchown" | "fs.promises.link" | "fs.promises.lstat" | "fs.promises.lutimes" | "fs.promises.mkdir" | "fs.promises.mkdtemp" | "fs.promises.open" | "fs.promises.opendir" | "fs.promises.readFile" | "fs.promises.readdir" | "fs.promises.readlink" | "fs.promises.realpath" | "fs.promises.rename" | "fs.promises.rm" | "fs.promises.rmdir" | "fs.promises.stat" | "fs.promises.statfs" | "fs.promises.symlink" | "fs.promises.truncate" | "fs.promises.unlink" | "fs.promises.utimes" | "fs.promises.watch" | "fs.promises.writeFile" | "fs.access" | "fs.appendFile" | "fs.chmod" | "fs.chown" | "fs.close" | "fs.copyFile" | "fs.cp" | "fs.createReadStream" | "fs.createWriteStream" | "fs.exists" | "fs.fchmod" | "fs.fchown" | "fs.fdatasync" | "fs.fstat" | "fs.fsync" | "fs.ftruncate" | "fs.futimes" | "fs.glob" | "fs.lchmod" | "fs.lchown" | "fs.link" | "fs.lstat" | "fs.lutimes" | "fs.mkdir" | "fs.mkdtemp" | "fs.native" | "fs.open" | "fs.openAsBlob" | "fs.opendir" | "fs.read" | "fs.readdir" | "fs.readFile" | "fs.readlink" | "fs.readv" | "fs.realpath" | "fs.realpath.native" | "fs.rename" | "fs.rm" | "fs.rmdir" | "fs.stat" | "fs.statfs" | "fs.symlink" | "fs.truncate" | "fs.unlink" | "fs.unwatchFile" | "fs.utimes" | "fs.watch" | "fs.watchFile" | "fs.write" | "fs.writeFile" | "fs.writev" | "fs.accessSync" | "fs.appendFileSync" | "fs.chmodSync" | "fs.chownSync" | "fs.closeSync" | "fs.copyFileSync" | "fs.cpSync" | "fs.existsSync" | "fs.fchmodSync" | "fs.fchownSync" | "fs.fdatasyncSync" | "fs.fstatSync" | "fs.fsyncSync" | "fs.ftruncateSync" | "fs.futimesSync" | "fs.globSync" | "fs.lchmodSync" | "fs.lchownSync" | "fs.linkSync" | "fs.lstatSync" | "fs.lutimesSync" | "fs.mkdirSync" | "fs.mkdtempSync" | "fs.opendirSync" | "fs.openSync" | "fs.readdirSync" | "fs.readFileSync" | "fs.readlinkSync" | "fs.readSync" | "fs.readvSync" | "fs.realpathSync" | "fs.realpathSync.native" | "fs.renameSync" | "fs.rmdirSync" | "fs.rmSync" | "fs.statfsSync" | "fs.statSync" | "fs.symlinkSync" | "fs.truncateSync" | "fs.unlinkSync" | "fs.utimesSync" | "fs.writeFileSync" | "fs.writeSync" | "fs.writevSync" | "fs.constants" | "fs.Dir" | "fs.Dirent" | "fs.FSWatcher" | "fs.StatWatcher" | "fs.ReadStream" | "fs.Stats()" | "new fs.Stats()" | "fs.Stats" | "fs.StatFs" | "fs.WriteStream" | "fs.common_objects" | "fs/promises" | "fs/promises.FileHandle" | "fs/promises.access" | "fs/promises.appendFile" | "fs/promises.chmod" | "fs/promises.chown" | "fs/promises.constants" | "fs/promises.copyFile" | "fs/promises.cp" | "fs/promises.glob" | "fs/promises.lchmod" | "fs/promises.lchown" | "fs/promises.link" | "fs/promises.lstat" | "fs/promises.lutimes" | "fs/promises.mkdir" | "fs/promises.mkdtemp" | "fs/promises.open" | "fs/promises.opendir" | "fs/promises.readFile" | "fs/promises.readdir" | "fs/promises.readlink" | "fs/promises.realpath" | "fs/promises.rename" | "fs/promises.rm" | "fs/promises.rmdir" | "fs/promises.stat" | "fs/promises.statfs" | "fs/promises.symlink" | "fs/promises.truncate" | "fs/promises.unlink" | "fs/promises.utimes" | "fs/promises.watch" | "fs/promises.writeFile" | "http2" | "http2.constants" | "http2.sensitiveHeaders" | "http2.createServer" | "http2.createSecureServer" | "http2.connect" | "http2.getDefaultSettings" | "http2.getPackedSettings" | "http2.getUnpackedSettings" | "http2.performServerHandshake" | "http2.Http2Session" | "http2.ServerHttp2Session" | "http2.ClientHttp2Session" | "http2.Http2Stream" | "http2.ClientHttp2Stream" | "http2.ServerHttp2Stream" | "http2.Http2Server" | "http2.Http2SecureServer" | "http2.Http2ServerRequest" | "http2.Http2ServerResponse" | "http" | "http.METHODS" | "http.STATUS_CODES" | "http.globalAgent" | "http.maxHeaderSize" | "http.createServer" | "http.get" | "http.request" | "http.validateHeaderName" | "http.validateHeaderValue" | "http.setMaxIdleHTTPParsers" | "http.Agent" | "http.ClientRequest" | "http.Server" | "http.ServerResponse" | "http.IncomingMessage" | "http.OutgoingMessage" | "http.WebSocket" | "_http_agent" | "_http_client" | "_http_common" | "_http_incoming" | "_http_outgoing" | "_http_server" | "https" | "https.globalAgent" | "https.createServer" | "https.get" | "https.request" | "https.Agent" | "https.Server" | "inspector" | "inspector.Session" | "inspector.Network.dataReceived" | "inspector.Network.dataSent" | "inspector.Network.loadingFailed" | "inspector.Network.loadingFinished" | "inspector.Network.requestWillBeSent" | "inspector.Network.responseReceived" | "inspector.NetworkResources.put" | "inspector.console" | "inspector.close" | "inspector.open" | "inspector.url" | "inspector.waitForDebugger" | "inspector/promises" | "inspector/promises.Session" | "inspector/promises.Network.dataReceived" | "inspector/promises.Network.dataSent" | "inspector/promises.Network.loadingFailed" | "inspector/promises.Network.loadingFinished" | "inspector/promises.Network.requestWillBeSent" | "inspector/promises.Network.responseReceived" | "inspector/promises.NetworkResources.put" | "inspector/promises.console" | "inspector/promises.close" | "inspector/promises.open" | "inspector/promises.url" | "inspector/promises.waitForDebugger" | "module.builtinModules" | "module.constants.compileCacheStatus" | "module.createRequire" | "module.createRequireFromPath" | "module.enableCompileCache" | "module.findPackageJSON" | "module.flushCompileCache" | "module.getCompileCacheDir" | "module.getSourceMapsSupport" | "module.isBuiltin" | "module.registerHooks" | "module.register" | "module.setSourceMapsSupport" | "module.stripTypeScriptTypes" | "module.syncBuiltinESMExports" | "module.findSourceMap" | "module.SourceMap" | "module.Module.builtinModules" | "module.Module.createRequire" | "module.Module.createRequireFromPath" | "module.Module.enableCompileCache" | "module.Module.findPackageJSON" | "module.Module.flushCompileCache" | "module.Module.getCompileCacheDir" | "module.Module.getSourceMapsSupport" | "module.Module.isBuiltin" | "module.Module.registerHooks" | "module.Module.register" | "module.Module.setSourceMapsSupport" | "module.Module.stripTypeScriptTypes" | "module.Module.syncBuiltinESMExports" | "module.Module.findSourceMap" | "module.Module.SourceMap" | "net" | "net.connect" | "net.createConnection" | "net.createServer" | "net.getDefaultAutoSelectFamily" | "net.setDefaultAutoSelectFamily" | "net.getDefaultAutoSelectFamilyAttemptTimeout" | "net.setDefaultAutoSelectFamilyAttemptTimeout" | "net.isIP" | "net.isIPv4" | "net.isIPv6" | "net.BlockList" | "net.BlockList.isBlockList" | "net.SocketAddress" | "net.SocketAddress.parse" | "net.Server" | "net.Socket" | "os" | "os.EOL" | "os.constants" | "os.constants.priority" | "os.devNull" | "os.availableParallelism" | "os.arch" | "os.cpus" | "os.endianness" | "os.freemem" | "os.getPriority" | "os.homedir" | "os.hostname" | "os.loadavg" | "os.machine" | "os.networkInterfaces" | "os.platform" | "os.release" | "os.setPriority" | "os.tmpdir" | "os.totalmem" | "os.type" | "os.uptime" | "os.userInfo" | "os.version" | "path" | "path.posix" | "path.posix.delimiter" | "path.posix.sep" | "path.posix.basename" | "path.posix.dirname" | "path.posix.extname" | "path.posix.format" | "path.posix.matchesGlob" | "path.posix.isAbsolute" | "path.posix.join" | "path.posix.normalize" | "path.posix.parse" | "path.posix.relative" | "path.posix.resolve" | "path.posix.toNamespacedPath" | "path.win32" | "path.win32.delimiter" | "path.win32.sep" | "path.win32.basename" | "path.win32.dirname" | "path.win32.extname" | "path.win32.format" | "path.win32.matchesGlob" | "path.win32.isAbsolute" | "path.win32.join" | "path.win32.normalize" | "path.win32.parse" | "path.win32.relative" | "path.win32.resolve" | "path.win32.toNamespacedPath" | "path.delimiter" | "path.sep" | "path.basename" | "path.dirname" | "path.extname" | "path.format" | "path.matchesGlob" | "path.isAbsolute" | "path.join" | "path.normalize" | "path.parse" | "path.relative" | "path.resolve" | "path.toNamespacedPath" | "path/posix" | "path/posix.delimiter" | "path/posix.sep" | "path/posix.basename" | "path/posix.dirname" | "path/posix.extname" | "path/posix.format" | "path/posix.matchesGlob" | "path/posix.isAbsolute" | "path/posix.join" | "path/posix.normalize" | "path/posix.parse" | "path/posix.relative" | "path/posix.resolve" | "path/posix.toNamespacedPath" | "path/win32" | "path/win32.delimiter" | "path/win32.sep" | "path/win32.basename" | "path/win32.dirname" | "path/win32.extname" | "path/win32.format" | "path/win32.matchesGlob" | "path/win32.isAbsolute" | "path/win32.join" | "path/win32.normalize" | "path/win32.parse" | "path/win32.relative" | "path/win32.resolve" | "path/win32.toNamespacedPath" | "perf_hooks" | "perf_hooks.performance" | "perf_hooks.performance.clearMarks" | "perf_hooks.performance.clearMeasures" | "perf_hooks.performance.clearResourceTimings" | "perf_hooks.performance.eventLoopUtilization" | "perf_hooks.performance.getEntries" | "perf_hooks.performance.getEntriesByName" | "perf_hooks.performance.getEntriesByType" | "perf_hooks.performance.mark" | "perf_hooks.performance.markResourceTiming" | "perf_hooks.performance.measure" | "perf_hooks.performance.nodeTiming" | "perf_hooks.performance.nodeTiming.bootstrapComplete" | "perf_hooks.performance.nodeTiming.environment" | "perf_hooks.performance.nodeTiming.idleTime" | "perf_hooks.performance.nodeTiming.loopExit" | "perf_hooks.performance.nodeTiming.loopStart" | "perf_hooks.performance.nodeTiming.nodeStart" | "perf_hooks.performance.nodeTiming.uvMetricsInfo" | "perf_hooks.performance.nodeTiming.v8Start" | "perf_hooks.performance.now" | "perf_hooks.performance.onresourcetimingbufferfull" | "perf_hooks.performance.setResourceTimingBufferSize" | "perf_hooks.performance.timeOrigin" | "perf_hooks.performance.timerify" | "perf_hooks.performance.toJSON" | "perf_hooks.createHistogram" | "perf_hooks.monitorEventLoopDelay" | "perf_hooks.PerformanceEntry" | "perf_hooks.PerformanceMark" | "perf_hooks.PerformanceMeasure" | "perf_hooks.PerformanceNodeEntry" | "perf_hooks.PerformanceNodeTiming" | "perf_hooks.PerformanceResourceTiming" | "perf_hooks.PerformanceObserver" | "perf_hooks.PerformanceObserverEntryList" | "perf_hooks.Histogram" | "perf_hooks.IntervalHistogram" | "perf_hooks.RecordableHistogram" | "punycode" | "punycode.ucs2" | "punycode.version" | "punycode.decode" | "punycode.encode" | "punycode.toASCII" | "punycode.toUnicode" | "querystring" | "querystring.decode" | "querystring.encode" | "querystring.escape" | "querystring.parse" | "querystring.stringify" | "querystring.unescape" | "readline" | "readline.promises" | "readline.promises.createInterface" | "readline.promises.Interface" | "readline.promises.Readline" | "readline.clearLine" | "readline.clearScreenDown" | "readline.createInterface" | "readline.cursorTo" | "readline.moveCursor" | "readline.Interface" | "readline.emitKeypressEvents" | "readline.InterfaceConstructor" | "readline/promises" | "readline/promises.createInterface" | "readline/promises.Interface" | "readline/promises.Readline" | "repl" | "repl.start" | "repl.writer" | "repl.REPLServer()" | "repl.REPLServer" | "repl.REPL_MODE_MAGIC" | "repl.REPL_MODE_SLOPPY" | "repl.REPL_MODE_STRICT" | "repl.Recoverable()" | "repl.Recoverable" | "repl.builtinModules" | "sea" | "sea.isSea" | "sea.getAsset" | "sea.getAssetAsBlob" | "sea.getRawAsset" | "sea.sea.isSea" | "sea.sea.getAsset" | "sea.sea.getAssetAsBlob" | "sea.sea.getRawAsset" | "stream" | "stream.promises" | "stream.promises.pipeline" | "stream.promises.finished" | "stream.finished" | "stream.pipeline" | "stream.compose" | "stream.duplexPair" | "stream.Readable" | "stream.Readable.from" | "stream.Readable.isDisturbed" | "stream.Readable.fromWeb" | "stream.Readable.toWeb" | "stream.Writable" | "stream.Writable.fromWeb" | "stream.Writable.toWeb" | "stream.Duplex" | "stream.Duplex.from" | "stream.Duplex.fromWeb" | "stream.Duplex.toWeb" | "stream.Transform" | "stream.isErrored" | "stream.isReadable" | "stream.addAbortSignal" | "stream.getDefaultHighWaterMark" | "stream.setDefaultHighWaterMark" | "stream/promises.pipeline" | "stream/promises.finished" | "stream/web" | "stream/web.ReadableStream" | "stream/web.ReadableStream.from" | "stream/web.ReadableStreamDefaultReader" | "stream/web.ReadableStreamBYOBReader" | "stream/web.ReadableStreamDefaultController" | "stream/web.ReadableByteStreamController" | "stream/web.ReadableStreamBYOBRequest" | "stream/web.WritableStream" | "stream/web.WritableStreamDefaultWriter" | "stream/web.WritableStreamDefaultController" | "stream/web.TransformStream" | "stream/web.TransformStreamDefaultController" | "stream/web.ByteLengthQueuingStrategy" | "stream/web.CountQueuingStrategy" | "stream/web.TextEncoderStream" | "stream/web.TextDecoderStream" | "stream/web.CompressionStream" | "stream/web.DecompressionStream" | "stream/consumers" | "stream/consumers.arrayBuffer" | "stream/consumers.blob" | "stream/consumers.buffer" | "stream/consumers.json" | "stream/consumers.text" | "string_decoder" | "string_decoder.StringDecoder" | "sqlite" | "sqlite.constants" | "sqlite.constants.SQLITE_CHANGESET_OMIT" | "sqlite.constants.SQLITE_CHANGESET_REPLACE" | "sqlite.constants.SQLITE_CHANGESET_ABORT" | "sqlite.backup" | "sqlite.DatabaseSync" | "sqlite.StatementSync" | "sqlite.SQLITE_CHANGESET_OMIT" | "sqlite.SQLITE_CHANGESET_REPLACE" | "sqlite.SQLITE_CHANGESET_ABORT" | "test" | "test.after" | "test.afterEach" | "test.assert" | "test.assert.register" | "test.before" | "test.beforeEach" | "test.describe" | "test.describe.only" | "test.describe.skip" | "test.describe.todo" | "test.it" | "test.it.only" | "test.it.skip" | "test.it.todo" | "test.mock" | "test.mock.fn" | "test.mock.getter" | "test.mock.method" | "test.mock.module" | "test.mock.reset" | "test.mock.restoreAll" | "test.mock.setter" | "test.mock.timers" | "test.mock.timers.enable" | "test.mock.timers.reset" | "test.mock.timers.tick" | "test.only" | "test.run" | "test.snapshot" | "test.snapshot.setDefaultSnapshotSerializers" | "test.snapshot.setResolveSnapshotPath" | "test.skip" | "test.suite" | "test.test" | "test.test.only" | "test.test.skip" | "test.test.todo" | "test.todo" | "timers" | "timers.Immediate" | "timers.Timeout" | "timers.setImmediate" | "timers.clearImmediate" | "timers.setInterval" | "timers.clearInterval" | "timers.setTimeout" | "timers.clearTimeout" | "timers.promises" | "timers.promises.setTimeout" | "timers.promises.setImmediate" | "timers.promises.setInterval" | "timers.promises.scheduler.wait" | "timers.promises.scheduler.yield" | "timers/promises" | "timers/promises.setTimeout" | "timers/promises.setImmediate" | "timers/promises.setInterval" | "timers/promises.scheduler.wait" | "timers/promises.scheduler.yield" | "tls" | "tls.checkServerIdentity" | "tls.connect" | "tls.createSecureContext" | "tls.createSecurePair" | "tls.createServer" | "tls.CryptoStream" | "tls.DEFAULT_CIPHERS" | "tls.DEFAULT_ECDH_CURVE" | "tls.DEFAULT_MAX_VERSION" | "tls.DEFAULT_MIN_VERSION" | "tls.getCACertificates" | "tls.getCiphers" | "tls.rootCertificates" | "tls.SecureContext" | "tls.SecurePair" | "tls.Server" | "tls.setDefaultCACertificates" | "tls.TLSSocket" | "trace_events" | "trace_events.createTracing" | "trace_events.getEnabledCategories" | "tty" | "tty.isatty" | "tty.ReadStream" | "tty.WriteStream" | "url" | "url.domainToASCII" | "url.domainToUnicode" | "url.fileURLToPath" | "url.format" | "url.pathToFileURL" | "url.urlToHttpOptions" | "url.URL" | "url.URL.canParse" | "url.URL.createObjectURL" | "url.URL.revokeObjectURL" | "url.URLPattern" | "url.URLSearchParams" | "url.Url" | "util.promisify" | "util.promisify.custom" | "util.callbackify" | "util.debuglog" | "util.debug" | "util.deprecate" | "util.diff" | "util.format" | "util.formatWithOptions" | "util.getCallSite" | "util.getCallSites" | "util.getSystemErrorName" | "util.getSystemErrorMap" | "util.getSystemErrorMessage" | "util.inherits" | "util.inspect" | "util.inspect.custom" | "util.inspect.defaultOptions" | "util.inspect.replDefaults" | "util.isDeepStrictEqual" | "util.parseArgs" | "util.parseEnv" | "util.setTraceSigInt" | "util.stripVTControlCharacters" | "util.styleText" | "util.toUSVString" | "util.transferableAbortController" | "util.transferableAbortSignal" | "util.aborted" | "util.MIMEType" | "util.MIMEParams" | "util.TextDecoder" | "util.TextEncoder" | "util.types" | "util.types.isExternal" | "util.types.isDate" | "util.types.isArgumentsObject" | "util.types.isBigIntObject" | "util.types.isBooleanObject" | "util.types.isNumberObject" | "util.types.isStringObject" | "util.types.isSymbolObject" | "util.types.isNativeError" | "util.types.isRegExp" | "util.types.isAsyncFunction" | "util.types.isGeneratorFunction" | "util.types.isGeneratorObject" | "util.types.isPromise" | "util.types.isMap" | "util.types.isSet" | "util.types.isMapIterator" | "util.types.isSetIterator" | "util.types.isWeakMap" | "util.types.isWeakSet" | "util.types.isArrayBuffer" | "util.types.isDataView" | "util.types.isSharedArrayBuffer" | "util.types.isProxy" | "util.types.isModuleNamespaceObject" | "util.types.isAnyArrayBuffer" | "util.types.isBoxedPrimitive" | "util.types.isArrayBufferView" | "util.types.isTypedArray" | "util.types.isUint8Array" | "util.types.isUint8ClampedArray" | "util.types.isUint16Array" | "util.types.isUint32Array" | "util.types.isInt8Array" | "util.types.isInt16Array" | "util.types.isInt32Array" | "util.types.isFloat16Array" | "util.types.isFloat32Array" | "util.types.isFloat64Array" | "util.types.isBigInt64Array" | "util.types.isBigUint64Array" | "util.types.isKeyObject" | "util.types.isCryptoKey" | "util.types.isWebAssemblyCompiledModule" | "util._extend" | "util.isArray" | "util.isBoolean" | "util.isBuffer" | "util.isDate" | "util.isError" | "util.isFunction" | "util.isNull" | "util.isNullOrUndefined" | "util.isNumber" | "util.isObject" | "util.isPrimitive" | "util.isRegExp" | "util.isString" | "util.isSymbol" | "util.isUndefined" | "util.log" | "util" | "util/types" | "util/types.isExternal" | "util/types.isDate" | "util/types.isArgumentsObject" | "util/types.isBigIntObject" | "util/types.isBooleanObject" | "util/types.isNumberObject" | "util/types.isStringObject" | "util/types.isSymbolObject" | "util/types.isNativeError" | "util/types.isRegExp" | "util/types.isAsyncFunction" | "util/types.isGeneratorFunction" | "util/types.isGeneratorObject" | "util/types.isPromise" | "util/types.isMap" | "util/types.isSet" | "util/types.isMapIterator" | "util/types.isSetIterator" | "util/types.isWeakMap" | "util/types.isWeakSet" | "util/types.isArrayBuffer" | "util/types.isDataView" | "util/types.isSharedArrayBuffer" | "util/types.isProxy" | "util/types.isModuleNamespaceObject" | "util/types.isAnyArrayBuffer" | "util/types.isBoxedPrimitive" | "util/types.isArrayBufferView" | "util/types.isTypedArray" | "util/types.isUint8Array" | "util/types.isUint8ClampedArray" | "util/types.isUint16Array" | "util/types.isUint32Array" | "util/types.isInt8Array" | "util/types.isInt16Array" | "util/types.isInt32Array" | "util/types.isFloat16Array" | "util/types.isFloat32Array" | "util/types.isFloat64Array" | "util/types.isBigInt64Array" | "util/types.isBigUint64Array" | "util/types.isKeyObject" | "util/types.isCryptoKey" | "util/types.isWebAssemblyCompiledModule" | "v8" | "v8.serialize" | "v8.deserialize" | "v8.Serializer" | "v8.Deserializer" | "v8.DefaultSerializer" | "v8.DefaultDeserializer" | "v8.promiseHooks" | "v8.promiseHooks.onInit" | "v8.promiseHooks.onSettled" | "v8.promiseHooks.onBefore" | "v8.promiseHooks.onAfter" | "v8.promiseHooks.createHook" | "v8.startupSnapshot" | "v8.startupSnapshot.addSerializeCallback" | "v8.startupSnapshot.addDeserializeCallback" | "v8.startupSnapshot.setDeserializeMainFunction" | "v8.startupSnapshot.isBuildingSnapshot" | "v8.cachedDataVersionTag" | "v8.getHeapCodeStatistics" | "v8.getHeapSnapshot" | "v8.getHeapSpaceStatistics" | "v8.getHeapStatistics" | "v8.isStringOneByteRepresentation" | "v8.queryObjects" | "v8.setFlagsFromString" | "v8.stopCoverage" | "v8.takeCoverage" | "v8.writeHeapSnapshot" | "v8.setHeapSnapshotNearHeapLimit" | "v8.GCProfiler" | "vm.constants" | "vm.compileFunction" | "vm.createContext" | "vm.isContext" | "vm.measureMemory" | "vm.runInContext" | "vm.runInNewContext" | "vm.runInThisContext" | "vm.Script" | "vm.Module" | "vm.SourceTextModule" | "vm.SyntheticModule" | "vm" | "wasi.WASI" | "wasi" | "worker_threads" | "worker_threads.parentPort" | "worker_threads.resourceLimits" | "worker_threads.SHARE_ENV" | "worker_threads.threadId" | "worker_threads.workerData" | "worker_threads.getEnvironmentData" | "worker_threads.getHeapStatistics" | "worker_threads.markAsUncloneable" | "worker_threads.markAsUntransferable" | "worker_threads.isInternalThread" | "worker_threads.isMainThread" | "worker_threads.isMarkedAsUntransferable" | "worker_threads.moveMessagePortToContext" | "worker_threads.postMessageToThread" | "worker_threads.receiveMessageOnPort" | "worker_threads.setEnvironmentData" | "worker_threads.BroadcastChannel" | "worker_threads.MessageChannel" | "worker_threads.MessagePort" | "worker_threads.Worker" | "zlib.brotliCompress" | "zlib.brotliCompressSync" | "zlib.brotliDecompress" | "zlib.brotliDecompressSync" | "zlib.constants" | "zlib.constants.ZSTD_e_continue" | "zlib.constants.ZSTD_e_flush" | "zlib.constants.ZSTD_e_end" | "zlib.constants.ZSTD_fast" | "zlib.constants.ZSTD_dfast" | "zlib.constants.ZSTD_greedy" | "zlib.constants.ZSTD_lazy" | "zlib.constants.ZSTD_lazy2" | "zlib.constants.ZSTD_btlazy2" | "zlib.constants.ZSTD_btopt" | "zlib.constants.ZSTD_btultra" | "zlib.constants.ZSTD_btultra2" | "zlib.constants.ZSTD_c_compressionLevel" | "zlib.constants.ZSTD_c_windowLog" | "zlib.constants.ZSTD_c_hashLog" | "zlib.constants.ZSTD_c_chainLog" | "zlib.constants.ZSTD_c_searchLog" | "zlib.constants.ZSTD_c_minMatch" | "zlib.constants.ZSTD_c_targetLength" | "zlib.constants.ZSTD_c_strategy" | "zlib.constants.ZSTD_c_enableLongDistanceMatching" | "zlib.constants.ZSTD_c_ldmHashLog" | "zlib.constants.ZSTD_c_ldmMinMatch" | "zlib.constants.ZSTD_c_ldmBucketSizeLog" | "zlib.constants.ZSTD_c_ldmHashRateLog" | "zlib.constants.ZSTD_c_contentSizeFlag" | "zlib.constants.ZSTD_c_checksumFlag" | "zlib.constants.ZSTD_c_dictIDFlag" | "zlib.constants.ZSTD_c_nbWorkers" | "zlib.constants.ZSTD_c_jobSize" | "zlib.constants.ZSTD_c_overlapLog" | "zlib.constants.ZSTD_d_windowLogMax" | "zlib.constants.ZSTD_CLEVEL_DEFAULT" | "zlib.constants.ZSTD_error_no_error" | "zlib.constants.ZSTD_error_GENERIC" | "zlib.constants.ZSTD_error_prefix_unknown" | "zlib.constants.ZSTD_error_version_unsupported" | "zlib.constants.ZSTD_error_frameParameter_unsupported" | "zlib.constants.ZSTD_error_frameParameter_windowTooLarge" | "zlib.constants.ZSTD_error_corruption_detected" | "zlib.constants.ZSTD_error_checksum_wrong" | "zlib.constants.ZSTD_error_literals_headerWrong" | "zlib.constants.ZSTD_error_dictionary_corrupted" | "zlib.constants.ZSTD_error_dictionary_wrong" | "zlib.constants.ZSTD_error_dictionaryCreation_failed" | "zlib.constants.ZSTD_error_parameter_unsupported" | "zlib.constants.ZSTD_error_parameter_combination_unsupported" | "zlib.constants.ZSTD_error_parameter_outOfBound" | "zlib.constants.ZSTD_error_tableLog_tooLarge" | "zlib.constants.ZSTD_error_maxSymbolValue_tooLarge" | "zlib.constants.ZSTD_error_maxSymbolValue_tooSmall" | "zlib.constants.ZSTD_error_stabilityCondition_notRespected" | "zlib.constants.ZSTD_error_stage_wrong" | "zlib.constants.ZSTD_error_init_missing" | "zlib.constants.ZSTD_error_memory_allocation" | "zlib.constants.ZSTD_error_workSpace_tooSmall" | "zlib.constants.ZSTD_error_dstSize_tooSmall" | "zlib.constants.ZSTD_error_srcSize_wrong" | "zlib.constants.ZSTD_error_dstBuffer_null" | "zlib.constants.ZSTD_error_noForwardProgress_destFull" | "zlib.constants.ZSTD_error_noForwardProgress_inputEmpty" | "zlib.crc32" | "zlib.createBrotliCompress" | "zlib.createBrotliDecompress" | "zlib.createDeflate" | "zlib.createDeflateRaw" | "zlib.createGunzip" | "zlib.createGzip" | "zlib.createInflate" | "zlib.createInflateRaw" | "zlib.createUnzip" | "zlib.createZstdCompress" | "zlib.createZstdDecompress" | "zlib.deflate" | "zlib.deflateRaw" | "zlib.deflateRawSync" | "zlib.deflateSync" | "zlib.gunzip" | "zlib.gunzipSync" | "zlib.gzip" | "zlib.gzipSync" | "zlib.inflate" | "zlib.inflateRaw" | "zlib.inflateRawSync" | "zlib.inflateSync" | "zlib.unzip" | "zlib.unzipSync" | "zlib.zstdCompress" | "zlib.zstdCompressSync" | "zlib.zstdDecompress" | "zlib.zstdDecompressSync" | "zlib.BrotliCompress()" | "zlib.BrotliCompress" | "zlib.BrotliDecompress()" | "zlib.BrotliDecompress" | "zlib.Deflate()" | "zlib.Deflate" | "zlib.DeflateRaw()" | "zlib.DeflateRaw" | "zlib.Gunzip()" | "zlib.Gunzip" | "zlib.Gzip()" | "zlib.Gzip" | "zlib.Inflate()" | "zlib.Inflate" | "zlib.InflateRaw()" | "zlib.InflateRaw" | "zlib.Unzip()" | "zlib.Unzip" | "zlib.ZstdCompress" | "zlib.ZstdDecompress" | "zlib.ZstdOptions" | "zlib" | "import.meta.resolve" | "import.meta.dirname" | "import.meta.filename" | "import.meta.main")[]
}]
// ----- node/prefer-global/buffer -----
type NodePreferGlobalBuffer = []|[("always" | "never")]
// ----- node/prefer-global/console -----
type NodePreferGlobalConsole = []|[("always" | "never")]
// ----- node/prefer-global/crypto -----
type NodePreferGlobalCrypto = []|[("always" | "never")]
// ----- node/prefer-global/process -----
type NodePreferGlobalProcess = []|[("always" | "never")]
// ----- node/prefer-global/text-decoder -----
type NodePreferGlobalTextDecoder = []|[("always" | "never")]
// ----- node/prefer-global/text-encoder -----
type NodePreferGlobalTextEncoder = []|[("always" | "never")]
// ----- node/prefer-global/timers -----
type NodePreferGlobalTimers = []|[("always" | "never")]
// ----- node/prefer-global/url -----
type NodePreferGlobalUrl = []|[("always" | "never")]
// ----- node/prefer-global/url-search-params -----
type NodePreferGlobalUrlSearchParams = []|[("always" | "never")]
// ----- node/prefer-node-protocol -----
type NodePreferNodeProtocol = []|[{
  version?: string
}]
// ----- node/shebang -----
type NodeShebang = []|[{
  convertPath?: ({
    
    [k: string]: [string, string]
  } | [{
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  }, ...({
    
    include: [string, ...(string)[]]
    exclude?: string[]
    
    replace: [string, string]
  })[]])
  ignoreUnpublished?: boolean
  additionalExecutables?: string[]
  executableMap?: {
    [k: string]: string
  }
}]
// ----- nonblock-statement-body-position -----
type NonblockStatementBodyPosition = []|[("beside" | "below" | "any")]|[("beside" | "below" | "any"), {
  overrides?: {
    if?: ("beside" | "below" | "any")
    else?: ("beside" | "below" | "any")
    while?: ("beside" | "below" | "any")
    do?: ("beside" | "below" | "any")
    for?: ("beside" | "below" | "any")
  }
}]
// ----- object-curly-newline -----
type ObjectCurlyNewline = []|[((("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
}) | {
  ObjectExpression?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ObjectPattern?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ImportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ExportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
})]
// ----- object-curly-spacing -----
type ObjectCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
}]
// ----- object-property-newline -----
type ObjectPropertyNewline = []|[{
  allowAllPropertiesOnSameLine?: boolean
  allowMultiplePropertiesPerLine?: boolean
}]
// ----- object-shorthand -----
type ObjectShorthand = ([]|[("always" | "methods" | "properties" | "never" | "consistent" | "consistent-as-needed")] | []|[("always" | "methods" | "properties")]|[("always" | "methods" | "properties"), {
  avoidQuotes?: boolean
}] | []|[("always" | "methods")]|[("always" | "methods"), {
  ignoreConstructors?: boolean
  methodsIgnorePattern?: string
  avoidQuotes?: boolean
  avoidExplicitReturnArrows?: boolean
}])
// ----- one-var -----
type OneVar = []|[(("always" | "never" | "consecutive") | {
  separateRequires?: boolean
  var?: ("always" | "never" | "consecutive")
  let?: ("always" | "never" | "consecutive")
  const?: ("always" | "never" | "consecutive")
  using?: ("always" | "never" | "consecutive")
  awaitUsing?: ("always" | "never" | "consecutive")
} | {
  initialized?: ("always" | "never" | "consecutive")
  uninitialized?: ("always" | "never" | "consecutive")
})]
// ----- one-var-declaration-per-line -----
type OneVarDeclarationPerLine = []|[("always" | "initializations")]
// ----- operator-assignment -----
type OperatorAssignment = []|[("always" | "never")]
// ----- operator-linebreak -----
type OperatorLinebreak = []|[("after" | "before" | "none" | null)]|[("after" | "before" | "none" | null), {
  overrides?: {
    [k: string]: ("after" | "before" | "none" | "ignore") | undefined
  }
}]
// ----- padded-blocks -----
type PaddedBlocks = []|[(("always" | "never") | {
  blocks?: ("always" | "never")
  switches?: ("always" | "never")
  classes?: ("always" | "never")
})]|[(("always" | "never") | {
  blocks?: ("always" | "never")
  switches?: ("always" | "never")
  classes?: ("always" | "never")
}), {
  allowSingleLineBlocks?: boolean
}]
// ----- padding-line-between-statements -----
type _PaddingLineBetweenStatementsPaddingType = ("any" | "never" | "always")
type _PaddingLineBetweenStatementsStatementType = (("*" | "block-like" | "cjs-export" | "cjs-import" | "directive" | "expression" | "iife" | "multiline-block-like" | "multiline-expression" | "multiline-const" | "multiline-let" | "multiline-var" | "singleline-const" | "singleline-let" | "singleline-var" | "block" | "empty" | "function" | "break" | "case" | "class" | "const" | "continue" | "debugger" | "default" | "do" | "export" | "for" | "if" | "import" | "let" | "return" | "switch" | "throw" | "try" | "var" | "while" | "with") | [("*" | "block-like" | "cjs-export" | "cjs-import" | "directive" | "expression" | "iife" | "multiline-block-like" | "multiline-expression" | "multiline-const" | "multiline-let" | "multiline-var" | "singleline-const" | "singleline-let" | "singleline-var" | "block" | "empty" | "function" | "break" | "case" | "class" | "const" | "continue" | "debugger" | "default" | "do" | "export" | "for" | "if" | "import" | "let" | "return" | "switch" | "throw" | "try" | "var" | "while" | "with"), ...(("*" | "block-like" | "cjs-export" | "cjs-import" | "directive" | "expression" | "iife" | "multiline-block-like" | "multiline-expression" | "multiline-const" | "multiline-let" | "multiline-var" | "singleline-const" | "singleline-let" | "singleline-var" | "block" | "empty" | "function" | "break" | "case" | "class" | "const" | "continue" | "debugger" | "default" | "do" | "export" | "for" | "if" | "import" | "let" | "return" | "switch" | "throw" | "try" | "var" | "while" | "with"))[]])
type PaddingLineBetweenStatements = {
  blankLine: _PaddingLineBetweenStatementsPaddingType
  prev: _PaddingLineBetweenStatementsStatementType
  next: _PaddingLineBetweenStatementsStatementType
}[]
// ----- pnpm/json-enforce-catalog -----
type PnpmJsonEnforceCatalog = []|[{
  
  allowedProtocols?: string[]
  
  autofix?: boolean
  
  defaultCatalog?: string
  
  reuseExistingCatalog?: boolean
  
  conflicts?: ("new-catalog" | "overrides" | "error")
  
  fields?: string[]
  
  ignores?: string[]
}]
// ----- pnpm/json-prefer-workspace-settings -----
type PnpmJsonPreferWorkspaceSettings = []|[{
  
  autofix?: boolean
}]
// ----- pnpm/json-valid-catalog -----
type PnpmJsonValidCatalog = []|[{
  
  autoInsert?: boolean
  
  autoInsertDefaultSpecifier?: string
  
  autofix?: boolean
  
  enforceNoConflict?: boolean
  
  fields?: unknown[]
}]
// ----- pnpm/yaml-enforce-settings -----
type PnpmYamlEnforceSettings = []|[{
  
  autofix?: boolean
  
  settings?: {
    [k: string]: unknown | undefined
  }
  
  requiredFields?: string[]
  
  forbiddenFields?: string[]
}]
// ----- pnpm/yaml-no-duplicate-catalog-item -----
type PnpmYamlNoDuplicateCatalogItem = []|[{
  allow?: string[]
  
  checkDuplicates?: ("name-only" | "exact-version")
}]
// ----- prefer-arrow-callback -----
type PreferArrowCallback = []|[{
  allowNamedFunctions?: boolean
  allowUnboundThis?: boolean
}]
// ----- prefer-const -----
type PreferConst = []|[{
  destructuring?: ("any" | "all")
  ignoreReadBeforeAssign?: boolean
}]
// ----- prefer-destructuring -----
type PreferDestructuring = []|[({
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
})]|[({
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
}), {
  enforceForRenamedProperties?: boolean
}]
// ----- prefer-promise-reject-errors -----
type PreferPromiseRejectErrors = []|[{
  allowEmptyReject?: boolean
}]
// ----- prefer-reflect -----
type PreferReflect = []|[{
  exceptions?: ("apply" | "call" | "delete" | "defineProperty" | "getOwnPropertyDescriptor" | "getPrototypeOf" | "setPrototypeOf" | "isExtensible" | "getOwnPropertyNames" | "preventExtensions")[]
}]
// ----- prefer-regex-literals -----
type PreferRegexLiterals = []|[{
  disallowRedundantWrapping?: boolean
}]
// ----- preserve-caught-error -----
type PreserveCaughtError = []|[{
  
  requireCatchParameter?: boolean
}]
// ----- quote-props -----
type QuoteProps = ([]|[("always" | "as-needed" | "consistent" | "consistent-as-needed")] | []|[("always" | "as-needed" | "consistent" | "consistent-as-needed")]|[("always" | "as-needed" | "consistent" | "consistent-as-needed"), {
  keywords?: boolean
  unnecessary?: boolean
  numbers?: boolean
}])
// ----- quotes -----
type Quotes = []|[("single" | "double" | "backtick")]|[("single" | "double" | "backtick"), ("avoid-escape" | {
  avoidEscape?: boolean
  allowTemplateLiterals?: boolean
})]
// ----- radix -----
type Radix = []|[("always" | "as-needed")]
// ----- react-compiler/react-compiler -----
type ReactCompilerReactCompiler = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-dom/no-unknown-property -----
type ReactDomNoUnknownProperty = []|[{
  ignore?: string[]
  requireDataLowercase?: boolean
}]
// ----- react-extra/jsx-shorthand-boolean -----
type ReactExtraJsxShorthandBoolean = []|[(-1 | 1)]
// ----- react-extra/jsx-shorthand-fragment -----
type ReactExtraJsxShorthandFragment = []|[(-1 | 1)]
// ----- react-extra/no-forbidden-props -----
type ReactExtraNoForbiddenProps = []|[{
  forbid?: (string | {
    excludedNodes?: string[]
    prop: string
  } | {
    includedNodes?: string[]
    prop: string
  })[]
}]
// ----- react-extra/no-unstable-default-props -----
type ReactExtraNoUnstableDefaultProps = []|[{
  safeDefaultProps?: string[]
}]
// ----- react-extra/no-useless-fragment -----
type ReactExtraNoUselessFragment = []|[{
  
  allowEmptyFragment?: boolean
  
  allowExpressions?: boolean
}]
// ----- react-hooks/automatic-effect-dependencies -----
type ReactHooksAutomaticEffectDependencies = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/capitalized-calls -----
type ReactHooksCapitalizedCalls = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/component-hook-factories -----
type ReactHooksComponentHookFactories = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/config -----
type ReactHooksConfig = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/error-boundaries -----
type ReactHooksErrorBoundaries = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/exhaustive-deps -----
type ReactHooksExhaustiveDeps = []|[{
  additionalHooks?: string
  enableDangerousAutofixThisMayCauseInfiniteLoops?: boolean
  experimental_autoDependenciesHooks?: string[]
  requireExplicitEffectDeps?: boolean
}]
// ----- react-hooks/fbt -----
type ReactHooksFbt = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/fire -----
type ReactHooksFire = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/gating -----
type ReactHooksGating = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/globals -----
type ReactHooksGlobals = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/hooks -----
type ReactHooksHooks = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/immutability -----
type ReactHooksImmutability = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/incompatible-library -----
type ReactHooksIncompatibleLibrary = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/invariant -----
type ReactHooksInvariant = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/memoized-effect-dependencies -----
type ReactHooksMemoizedEffectDependencies = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/no-deriving-state-in-effects -----
type ReactHooksNoDerivingStateInEffects = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/preserve-manual-memoization -----
type ReactHooksPreserveManualMemoization = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/purity -----
type ReactHooksPurity = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/refs -----
type ReactHooksRefs = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/rule-suppression -----
type ReactHooksRuleSuppression = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/rules-of-hooks -----
type ReactHooksRulesOfHooks = []|[{
  additionalHooks?: string
}]
// ----- react-hooks/set-state-in-effect -----
type ReactHooksSetStateInEffect = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/set-state-in-render -----
type ReactHooksSetStateInRender = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/static-components -----
type ReactHooksStaticComponents = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/syntax -----
type ReactHooksSyntax = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/todo -----
type ReactHooksTodo = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/unsupported-syntax -----
type ReactHooksUnsupportedSyntax = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/use-memo -----
type ReactHooksUseMemo = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/void-use-memo -----
type ReactHooksVoidUseMemo = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-naming-convention/component-name -----
type ReactNamingConventionComponentName = []|[(("PascalCase" | "CONSTANT_CASE") | {
  allowAllCaps?: boolean
  excepts?: string[]
  rule?: ("PascalCase" | "CONSTANT_CASE")
})]
// ----- react-naming-convention/filename -----
type ReactNamingConventionFilename = []|[(("PascalCase" | "camelCase" | "kebab-case" | "snake_case") | {
  excepts?: string[]
  extensions?: string[]
  rule?: ("PascalCase" | "camelCase" | "kebab-case" | "snake_case")
})]
// ----- react-naming-convention/filename-extension -----
type ReactNamingConventionFilenameExtension = []|[(("always" | "as-needed") | {
  allow?: ("always" | "as-needed")
  extensions?: string[]
  ignoreFilesWithoutCode?: boolean
})]
// ----- react-naming-convention/use-state -----
type ReactNamingConventionUseState = []|[{
  enforceAssignment?: boolean
  enforceSetterName?: boolean
}]
// ----- regexp/hexadecimal-escape -----
type RegexpHexadecimalEscape = []|[("always" | "never")]
// ----- regexp/letter-case -----
type RegexpLetterCase = []|[{
  caseInsensitive?: ("lowercase" | "uppercase" | "ignore")
  unicodeEscape?: ("lowercase" | "uppercase" | "ignore")
  hexadecimalEscape?: ("lowercase" | "uppercase" | "ignore")
  controlEscape?: ("lowercase" | "uppercase" | "ignore")
}]
// ----- regexp/match-any -----
type RegexpMatchAny = []|[{
  
  allows?: [("[\\s\\S]" | "[\\S\\s]" | "[^]" | "dotAll"), ...(("[\\s\\S]" | "[\\S\\s]" | "[^]" | "dotAll"))[]]
}]
// ----- regexp/no-dupe-disjunctions -----
type RegexpNoDupeDisjunctions = []|[{
  report?: ("all" | "trivial" | "interesting")
  reportExponentialBacktracking?: ("none" | "certain" | "potential")
  reportUnreachable?: ("certain" | "potential")
}]
// ----- regexp/no-lazy-ends -----
type RegexpNoLazyEnds = []|[{
  ignorePartial?: boolean
}]
// ----- regexp/no-legacy-features -----
type RegexpNoLegacyFeatures = []|[{
  staticProperties?: ("input" | "$_" | "lastMatch" | "$&" | "lastParen" | "$+" | "leftContext" | "$`" | "rightContext" | "$'" | "$1" | "$2" | "$3" | "$4" | "$5" | "$6" | "$7" | "$8" | "$9")[]
  prototypeMethods?: ("compile")[]
}]
// ----- regexp/no-misleading-capturing-group -----
type RegexpNoMisleadingCapturingGroup = []|[{
  reportBacktrackingEnds?: boolean
}]
// ----- regexp/no-misleading-unicode-character -----
type RegexpNoMisleadingUnicodeCharacter = []|[{
  fixable?: boolean
}]
// ----- regexp/no-missing-g-flag -----
type RegexpNoMissingGFlag = []|[{
  strictTypes?: boolean
}]
// ----- regexp/no-obscure-range -----
type RegexpNoObscureRange = []|[{
  allowed?: (("all" | "alphanumeric") | [("all" | "alphanumeric")] | [("alphanumeric" | string), ...(("alphanumeric" | string))[]])
}]
// ----- regexp/no-super-linear-backtracking -----
type RegexpNoSuperLinearBacktracking = []|[{
  report?: ("certain" | "potential")
}]
// ----- regexp/no-super-linear-move -----
type RegexpNoSuperLinearMove = []|[{
  report?: ("certain" | "potential")
  ignoreSticky?: boolean
  ignorePartial?: boolean
}]
// ----- regexp/no-unused-capturing-group -----
type RegexpNoUnusedCapturingGroup = []|[{
  fixable?: boolean
  allowNamed?: boolean
}]
// ----- regexp/no-useless-character-class -----
type RegexpNoUselessCharacterClass = []|[{
  ignores?: string[]
}]
// ----- regexp/no-useless-flag -----
type RegexpNoUselessFlag = []|[{
  ignore?: ("i" | "m" | "s" | "g" | "y")[]
  strictTypes?: boolean
}]
// ----- regexp/no-useless-non-capturing-group -----
type RegexpNoUselessNonCapturingGroup = []|[{
  allowTop?: (boolean | ("always" | "never" | "partial"))
}]
// ----- regexp/optimal-quantifier-concatenation -----
type RegexpOptimalQuantifierConcatenation = []|[{
  capturingGroups?: ("ignore" | "report")
}]
// ----- regexp/prefer-character-class -----
type RegexpPreferCharacterClass = []|[{
  minAlternatives?: number
}]
// ----- regexp/prefer-d -----
type RegexpPreferD = []|[{
  insideCharacterClass?: ("ignore" | "range" | "d")
}]
// ----- regexp/prefer-lookaround -----
type RegexpPreferLookaround = []|[{
  lookbehind?: boolean
  strictTypes?: boolean
}]
// ----- regexp/prefer-named-replacement -----
type RegexpPreferNamedReplacement = []|[{
  strictTypes?: boolean
}]
// ----- regexp/prefer-quantifier -----
type RegexpPreferQuantifier = []|[{
  allows?: string[]
}]
// ----- regexp/prefer-range -----
type RegexpPreferRange = []|[{
  target?: (("all" | "alphanumeric") | [("all" | "alphanumeric")] | [("alphanumeric" | string), ...(("alphanumeric" | string))[]])
}]
// ----- regexp/prefer-result-array-groups -----
type RegexpPreferResultArrayGroups = []|[{
  strictTypes?: boolean
}]
// ----- regexp/sort-character-class-elements -----
type RegexpSortCharacterClassElements = []|[{
  order?: ("\\s" | "\\w" | "\\d" | "\\p" | "*" | "\\q" | "[]")[]
}]
// ----- regexp/unicode-escape -----
type RegexpUnicodeEscape = []|[("unicodeCodePointEscape" | "unicodeEscape")]
// ----- regexp/unicode-property -----
type RegexpUnicodeProperty = []|[{
  generalCategory?: ("always" | "never" | "ignore")
  key?: ("short" | "long" | "ignore")
  property?: (("short" | "long" | "ignore") | {
    binary?: ("short" | "long" | "ignore")
    generalCategory?: ("short" | "long" | "ignore")
    script?: ("short" | "long" | "ignore")
  })
}]
// ----- require-atomic-updates -----
type RequireAtomicUpdates = []|[{
  allowProperties?: boolean
}]
// ----- require-unicode-regexp -----
type RequireUnicodeRegexp = []|[{
  requireFlag?: ("u" | "v")
}]
// ----- rest-spread-spacing -----
type RestSpreadSpacing = []|[("always" | "never")]
// ----- semi -----
type Semi = ([]|["never"]|["never", {
  beforeStatementContinuationChars?: ("always" | "any" | "never")
}] | []|["always"]|["always", {
  omitLastInOneLineBlock?: boolean
  omitLastInOneLineClassBody?: boolean
}])
// ----- semi-spacing -----
type SemiSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- semi-style -----
type SemiStyle = []|[("last" | "first")]
// ----- sonar/arrow-function-convention -----
type SonarArrowFunctionConvention = []|[{
  requireParameterParentheses?: boolean
  requireBodyBraces?: boolean
}]
// ----- sonar/class-name -----
type SonarClassName = []|[{
  format?: string
}]
// ----- sonar/cognitive-complexity -----
type SonarCognitiveComplexity = []|[(number | string)]|[(number | string), string]
// ----- sonar/comment-regex -----
type SonarCommentRegex = []|[{
  regularExpression?: string
  message?: string
  flags?: string
}]
// ----- sonar/content-length -----
type SonarContentLength = []|[{
  fileUploadSizeLimit?: number
  standardSizeLimit?: number
}]
// ----- sonar/cyclomatic-complexity -----
type SonarCyclomaticComplexity = []|[{
  threshold?: number
}]
// ----- sonar/expression-complexity -----
type SonarExpressionComplexity = []|[{
  max?: number
}]
// ----- sonar/file-header -----
type SonarFileHeader = []|[{
  headerFormat?: string
  isRegularExpression?: boolean
}]
// ----- sonar/function-name -----
type SonarFunctionName = []|[{
  format?: string
}]
// ----- sonar/max-lines -----
type SonarMaxLines = []|[{
  maximum?: number
}]
// ----- sonar/max-lines-per-function -----
type SonarMaxLinesPerFunction = []|[{
  maximum?: number
}]
// ----- sonar/max-switch-cases -----
type SonarMaxSwitchCases = []|[number]
// ----- sonar/max-union-size -----
type SonarMaxUnionSize = []|[{
  threshold?: number
}]
// ----- sonar/nested-control-flow -----
type SonarNestedControlFlow = []|[{
  maximumNestingLevel?: number
}]
// ----- sonar/new-operator-misuse -----
type SonarNewOperatorMisuse = []|[{
  considerJSDoc?: boolean
}]
// ----- sonar/no-duplicate-string -----
type SonarNoDuplicateString = []|[{
  threshold?: number
  ignoreStrings?: string
}]
// ----- sonar/no-hardcoded-passwords -----
type SonarNoHardcodedPasswords = []|[{
  passwordWords?: string[]
}]
// ----- sonar/no-hardcoded-secrets -----
type SonarNoHardcodedSecrets = []|[{
  secretWords?: string
  randomnessSensibility?: number
}]
// ----- sonar/no-identical-functions -----
type SonarNoIdenticalFunctions = []|[number]
// ----- sonar/no-implicit-dependencies -----
type SonarNoImplicitDependencies = []|[{
  whitelist?: string[]
}]
// ----- sonar/no-intrusive-permissions -----
type SonarNoIntrusivePermissions = []|[{
  permissions?: string[]
}]
// ----- sonar/no-nested-functions -----
type SonarNoNestedFunctions = []|[{
  threshold?: number
}]
// ----- sonar/regex-complexity -----
type SonarRegexComplexity = []|[{
  threshold?: number
}]
// ----- sonar/variable-name -----
type SonarVariableName = []|[{
  format?: string
}]
// ----- sort-imports -----
type SortImports = []|[{
  ignoreCase?: boolean
  
  memberSyntaxSortOrder?: [("none" | "all" | "multiple" | "single"), ("none" | "all" | "multiple" | "single"), ("none" | "all" | "multiple" | "single"), ("none" | "all" | "multiple" | "single")]
  ignoreDeclarationSort?: boolean
  ignoreMemberSort?: boolean
  allowSeparatedGroups?: boolean
}]
// ----- sort-keys -----
type SortKeys = []|[("asc" | "desc")]|[("asc" | "desc"), {
  caseSensitive?: boolean
  natural?: boolean
  minKeys?: number
  allowLineSeparatedGroups?: boolean
  ignoreComputedKeys?: boolean
}]
// ----- sort-vars -----
type SortVars = []|[{
  ignoreCase?: boolean
}]
// ----- space-before-blocks -----
type SpaceBeforeBlocks = []|[(("always" | "never") | {
  keywords?: ("always" | "never" | "off")
  functions?: ("always" | "never" | "off")
  classes?: ("always" | "never" | "off")
})]
// ----- space-before-function-paren -----
type SpaceBeforeFunctionParen = []|[(("always" | "never") | {
  anonymous?: ("always" | "never" | "ignore")
  named?: ("always" | "never" | "ignore")
  asyncArrow?: ("always" | "never" | "ignore")
})]
// ----- space-in-parens -----
type SpaceInParens = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: ("{}" | "[]" | "()" | "empty")[]
}]
// ----- space-infix-ops -----
type SpaceInfixOps = []|[{
  int32Hint?: boolean
}]
// ----- space-unary-ops -----
type SpaceUnaryOps = []|[{
  words?: boolean
  nonwords?: boolean
  overrides?: {
    [k: string]: boolean | undefined
  }
}]
// ----- spaced-comment -----
type SpacedComment = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
  markers?: string[]
  line?: {
    exceptions?: string[]
    markers?: string[]
  }
  block?: {
    exceptions?: string[]
    markers?: string[]
    balanced?: boolean
  }
}]
// ----- storybook/meta-inline-properties -----
type StorybookMetaInlineProperties = []|[{
  csfVersion?: number
}]
// ----- storybook/no-uninstalled-addons -----
type StorybookNoUninstalledAddons = []|[{
  packageJsonLocation?: string
  ignore?: string[]
  [k: string]: unknown | undefined
}]
// ----- strict -----
type Strict = []|[("never" | "global" | "function" | "safe")]
// ----- stylistic/array-bracket-newline -----
type StylisticArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- stylistic/array-bracket-spacing -----
type StylisticArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- stylistic/array-element-newline -----
type StylisticArrayElementNewline = []|[(_StylisticArrayElementNewlineBasicConfig | {
  ArrayExpression?: _StylisticArrayElementNewlineBasicConfig
  ArrayPattern?: _StylisticArrayElementNewlineBasicConfig
})]
type _StylisticArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  consistent?: boolean
  multiline?: boolean
  minItems?: (number | null)
})
// ----- stylistic/arrow-parens -----
type StylisticArrowParens = []|[("always" | "as-needed")]|[("always" | "as-needed"), {
  requireForBlockBody?: boolean
}]
// ----- stylistic/arrow-spacing -----
type StylisticArrowSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- stylistic/block-spacing -----
type StylisticBlockSpacing = []|[("always" | "never")]
// ----- stylistic/brace-style -----
type StylisticBraceStyle = []|[("1tbs" | "stroustrup" | "allman")]|[("1tbs" | "stroustrup" | "allman"), {
  allowSingleLine?: boolean
}]
// ----- stylistic/comma-dangle -----
type StylisticCommaDangle = []|[(_StylisticCommaDangleValue | {
  arrays?: _StylisticCommaDangleValueWithIgnore
  objects?: _StylisticCommaDangleValueWithIgnore
  imports?: _StylisticCommaDangleValueWithIgnore
  exports?: _StylisticCommaDangleValueWithIgnore
  functions?: _StylisticCommaDangleValueWithIgnore
  importAttributes?: _StylisticCommaDangleValueWithIgnore
  dynamicImports?: _StylisticCommaDangleValueWithIgnore
  enums?: _StylisticCommaDangleValueWithIgnore
  generics?: _StylisticCommaDangleValueWithIgnore
  tuples?: _StylisticCommaDangleValueWithIgnore
})]
type _StylisticCommaDangleValue = ("always-multiline" | "always" | "never" | "only-multiline")
type _StylisticCommaDangleValueWithIgnore = ("always-multiline" | "always" | "never" | "only-multiline" | "ignore")
// ----- stylistic/comma-spacing -----
type StylisticCommaSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- stylistic/comma-style -----
type StylisticCommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- stylistic/computed-property-spacing -----
type StylisticComputedPropertySpacing = []|[("always" | "never")]|[("always" | "never"), {
  enforceForClassMembers?: boolean
}]
// ----- stylistic/curly-newline -----
type StylisticCurlyNewline = []|[(("always" | "never") | {
  IfStatementConsequent?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  IfStatementAlternative?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  DoWhileStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ForInStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ForOfStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ForStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  WhileStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  SwitchStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  SwitchCase?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TryStatementBlock?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TryStatementHandler?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TryStatementFinalizer?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  BlockStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ArrowFunctionExpression?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  FunctionDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  FunctionExpression?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  Property?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ClassBody?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  StaticBlock?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  WithStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TSModuleBlock?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  multiline?: boolean
  minElements?: number
  consistent?: boolean
})]
// ----- stylistic/dot-location -----
type StylisticDotLocation = []|[("object" | "property")]
// ----- stylistic/eol-last -----
type StylisticEolLast = []|[("always" | "never" | "unix" | "windows")]
// ----- stylistic/exp-jsx-props-style -----
type StylisticExpJsxPropsStyle = []|[{
  singleLine?: {
    maxItems?: number
  }
  multiLine?: {
    minItems?: number
    maxItemsPerLine?: number
  }
}]
// ----- stylistic/exp-list-style -----
type StylisticExpListStyle = []|[{
  singleLine?: _StylisticExpListStyle_SingleLineConfig
  multiLine?: _StylisticExpListStyle_MultiLineConfig
  overrides?: {
    "()"?: _StylisticExpListStyle_BaseConfig
    "[]"?: _StylisticExpListStyle_BaseConfig
    "{}"?: _StylisticExpListStyle_BaseConfig
    "<>"?: _StylisticExpListStyle_BaseConfig
    ArrayExpression?: _StylisticExpListStyle_BaseConfig
    ArrayPattern?: _StylisticExpListStyle_BaseConfig
    ArrowFunctionExpression?: _StylisticExpListStyle_BaseConfig
    CallExpression?: _StylisticExpListStyle_BaseConfig
    ExportNamedDeclaration?: _StylisticExpListStyle_BaseConfig
    FunctionDeclaration?: _StylisticExpListStyle_BaseConfig
    FunctionExpression?: _StylisticExpListStyle_BaseConfig
    IfStatement?: _StylisticExpListStyle_BaseConfig
    ImportAttributes?: _StylisticExpListStyle_BaseConfig
    ImportDeclaration?: _StylisticExpListStyle_BaseConfig
    JSONArrayExpression?: _StylisticExpListStyle_BaseConfig
    JSONObjectExpression?: _StylisticExpListStyle_BaseConfig
    NewExpression?: _StylisticExpListStyle_BaseConfig
    ObjectExpression?: _StylisticExpListStyle_BaseConfig
    ObjectPattern?: _StylisticExpListStyle_BaseConfig
    TSDeclareFunction?: _StylisticExpListStyle_BaseConfig
    TSEnumBody?: _StylisticExpListStyle_BaseConfig
    TSFunctionType?: _StylisticExpListStyle_BaseConfig
    TSInterfaceBody?: _StylisticExpListStyle_BaseConfig
    TSTupleType?: _StylisticExpListStyle_BaseConfig
    TSTypeLiteral?: _StylisticExpListStyle_BaseConfig
    TSTypeParameterDeclaration?: _StylisticExpListStyle_BaseConfig
    TSTypeParameterInstantiation?: _StylisticExpListStyle_BaseConfig
  }
}]
interface _StylisticExpListStyle_SingleLineConfig {
  spacing?: ("always" | "never")
  maxItems?: number
}
interface _StylisticExpListStyle_MultiLineConfig {
  minItems?: number
}
interface _StylisticExpListStyle_BaseConfig {
  singleLine?: _StylisticExpListStyle_SingleLineConfig
  multiline?: _StylisticExpListStyle_MultiLineConfig
}
// ----- stylistic/function-call-argument-newline -----
type StylisticFunctionCallArgumentNewline = []|[("always" | "never" | "consistent")]
// ----- stylistic/function-call-spacing -----
type StylisticFunctionCallSpacing = ([]|["never"] | []|["always"]|["always", {
  allowNewlines?: boolean
  optionalChain?: {
    before?: boolean
    after?: boolean
  }
}])
// ----- stylistic/function-paren-newline -----
type StylisticFunctionParenNewline = []|[(("always" | "never" | "consistent" | "multiline" | "multiline-arguments") | {
  minItems?: number
})]
// ----- stylistic/generator-star-spacing -----
type StylisticGeneratorStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
  named?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  anonymous?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  method?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  shorthand?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
})]
// ----- stylistic/implicit-arrow-linebreak -----
type StylisticImplicitArrowLinebreak = []|[("beside" | "below")]
// ----- stylistic/indent -----
type StylisticIndent = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: ((number | ("first" | "off")) | {
    var?: (number | ("first" | "off"))
    let?: (number | ("first" | "off"))
    const?: (number | ("first" | "off"))
    using?: (number | ("first" | "off"))
  })
  assignmentOperator?: (number | "off")
  outerIIFEBody?: (number | "off")
  MemberExpression?: (number | "off")
  FunctionDeclaration?: {
    parameters?: (number | ("first" | "off"))
    body?: number
    returnType?: number
  }
  FunctionExpression?: {
    parameters?: (number | ("first" | "off"))
    body?: number
    returnType?: number
  }
  StaticBlock?: {
    body?: number
  }
  CallExpression?: {
    arguments?: (number | ("first" | "off"))
  }
  ArrayExpression?: (number | ("first" | "off"))
  ObjectExpression?: (number | ("first" | "off"))
  ImportDeclaration?: (number | ("first" | "off"))
  flatTernaryExpressions?: boolean
  offsetTernaryExpressions?: (boolean | {
    CallExpression?: boolean
    AwaitExpression?: boolean
    NewExpression?: boolean
  })
  offsetTernaryExpressionsOffsetCallExpressions?: boolean
  ignoredNodes?: string[]
  ignoreComments?: boolean
  tabLength?: number
}]
// ----- stylistic/indent-binary-ops -----
type StylisticIndentBinaryOps = []|[(number | "tab")]
// ----- stylistic/jsx-closing-bracket-location -----
type StylisticJsxClosingBracketLocation = []|[(("after-props" | "props-aligned" | "tag-aligned" | "line-aligned") | {
  location?: ("after-props" | "props-aligned" | "tag-aligned" | "line-aligned")
} | {
  nonEmpty?: (("after-props" | "props-aligned" | "tag-aligned" | "line-aligned") | false)
  selfClosing?: (("after-props" | "props-aligned" | "tag-aligned" | "line-aligned") | false)
})]
// ----- stylistic/jsx-closing-tag-location -----
type StylisticJsxClosingTagLocation = []|[("tag-aligned" | "line-aligned")]
// ----- stylistic/jsx-curly-brace-presence -----
type StylisticJsxCurlyBracePresence = []|[({
  props?: ("always" | "never" | "ignore")
  children?: ("always" | "never" | "ignore")
  propElementValues?: ("always" | "never" | "ignore")
} | ("always" | "never" | "ignore"))]
// ----- stylistic/jsx-curly-newline -----
type StylisticJsxCurlyNewline = []|[(("consistent" | "never") | {
  singleline?: ("consistent" | "require" | "forbid")
  multiline?: ("consistent" | "require" | "forbid")
})]
// ----- stylistic/jsx-curly-spacing -----
type StylisticJsxCurlySpacing = []|[({
  when?: ("always" | "never")
  allowMultiline?: boolean
  spacing?: {
    objectLiterals?: ("always" | "never")
  }
  attributes?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
  children?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
} | ("always" | "never"))]|[({
  when?: ("always" | "never")
  allowMultiline?: boolean
  spacing?: {
    objectLiterals?: ("always" | "never")
  }
  attributes?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
  children?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
} | ("always" | "never")), {
  allowMultiline?: boolean
  spacing?: {
    objectLiterals?: ("always" | "never")
  }
}]
// ----- stylistic/jsx-equals-spacing -----
type StylisticJsxEqualsSpacing = []|[("always" | "never")]
// ----- stylistic/jsx-first-prop-new-line -----
type StylisticJsxFirstPropNewLine = []|[("always" | "never" | "multiline" | "multiline-multiprop" | "multiprop")]
// ----- stylistic/jsx-function-call-newline -----
type StylisticJsxFunctionCallNewline = []|[("always" | "multiline")]
// ----- stylistic/jsx-indent -----
type StylisticJsxIndent = []|[("tab" | number)]|[("tab" | number), {
  checkAttributes?: boolean
  indentLogicalExpressions?: boolean
}]
// ----- stylistic/jsx-indent-props -----
type StylisticJsxIndentProps = []|[(("tab" | "first") | number | {
  indentMode?: (("tab" | "first") | number)
  ignoreTernaryOperator?: boolean
})]
// ----- stylistic/jsx-max-props-per-line -----
type StylisticJsxMaxPropsPerLine = []|[({
  maximum?: {
    single?: number
    multi?: number
  }
} | {
  maximum?: number
  when?: ("always" | "multiline")
})]
// ----- stylistic/jsx-newline -----
type StylisticJsxNewline = []|[{
  prevent?: boolean
  allowMultilines?: boolean
}]
// ----- stylistic/jsx-one-expression-per-line -----
type StylisticJsxOneExpressionPerLine = []|[{
  allow?: ("none" | "literal" | "single-child" | "single-line" | "non-jsx")
}]
// ----- stylistic/jsx-pascal-case -----
type StylisticJsxPascalCase = []|[{
  allowAllCaps?: boolean
  allowLeadingUnderscore?: boolean
  allowNamespace?: boolean
  ignore?: string[]
}]
// ----- stylistic/jsx-quotes -----
type StylisticJsxQuotes = []|[("prefer-single" | "prefer-double")]
// ----- stylistic/jsx-self-closing-comp -----
type StylisticJsxSelfClosingComp = []|[{
  component?: boolean
  html?: boolean
}]
// ----- stylistic/jsx-sort-props -----
type StylisticJsxSortProps = []|[{
  callbacksLast?: boolean
  shorthandFirst?: boolean
  shorthandLast?: boolean
  multiline?: ("ignore" | "first" | "last")
  ignoreCase?: boolean
  noSortAlphabetically?: boolean
  reservedFirst?: (string[] | boolean)
  reservedLast?: string[]
  locale?: string
}]
// ----- stylistic/jsx-tag-spacing -----
type StylisticJsxTagSpacing = []|[{
  closingSlash?: ("always" | "never" | "allow")
  beforeSelfClosing?: ("always" | "proportional-always" | "never" | "allow")
  afterOpening?: ("always" | "allow-multiline" | "never" | "allow")
  beforeClosing?: ("always" | "proportional-always" | "never" | "allow")
}]
// ----- stylistic/jsx-wrap-multilines -----
type StylisticJsxWrapMultilines = []|[{
  declaration?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  assignment?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  return?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  arrow?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  condition?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  logical?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  prop?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  propertyValue?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
}]
// ----- stylistic/key-spacing -----
type StylisticKeySpacing = []|[({
  align?: (("colon" | "value") | {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
  ignoredNodes?: ("ObjectExpression" | "ObjectPattern" | "ImportDeclaration" | "ExportNamedDeclaration" | "ExportAllDeclaration" | "TSTypeLiteral" | "TSInterfaceBody" | "ClassBody")[]
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      mode?: ("strict" | "minimum")
      on?: ("colon" | "value")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- stylistic/keyword-spacing -----
type StylisticKeywordSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    abstract?: {
      before?: boolean
      after?: boolean
    }
    boolean?: {
      before?: boolean
      after?: boolean
    }
    break?: {
      before?: boolean
      after?: boolean
    }
    byte?: {
      before?: boolean
      after?: boolean
    }
    case?: {
      before?: boolean
      after?: boolean
    }
    catch?: {
      before?: boolean
      after?: boolean
    }
    char?: {
      before?: boolean
      after?: boolean
    }
    class?: {
      before?: boolean
      after?: boolean
    }
    const?: {
      before?: boolean
      after?: boolean
    }
    continue?: {
      before?: boolean
      after?: boolean
    }
    debugger?: {
      before?: boolean
      after?: boolean
    }
    default?: {
      before?: boolean
      after?: boolean
    }
    delete?: {
      before?: boolean
      after?: boolean
    }
    do?: {
      before?: boolean
      after?: boolean
    }
    double?: {
      before?: boolean
      after?: boolean
    }
    else?: {
      before?: boolean
      after?: boolean
    }
    enum?: {
      before?: boolean
      after?: boolean
    }
    export?: {
      before?: boolean
      after?: boolean
    }
    extends?: {
      before?: boolean
      after?: boolean
    }
    false?: {
      before?: boolean
      after?: boolean
    }
    final?: {
      before?: boolean
      after?: boolean
    }
    finally?: {
      before?: boolean
      after?: boolean
    }
    float?: {
      before?: boolean
      after?: boolean
    }
    for?: {
      before?: boolean
      after?: boolean
    }
    function?: {
      before?: boolean
      after?: boolean
    }
    goto?: {
      before?: boolean
      after?: boolean
    }
    if?: {
      before?: boolean
      after?: boolean
    }
    implements?: {
      before?: boolean
      after?: boolean
    }
    import?: {
      before?: boolean
      after?: boolean
    }
    in?: {
      before?: boolean
      after?: boolean
    }
    instanceof?: {
      before?: boolean
      after?: boolean
    }
    int?: {
      before?: boolean
      after?: boolean
    }
    interface?: {
      before?: boolean
      after?: boolean
    }
    long?: {
      before?: boolean
      after?: boolean
    }
    native?: {
      before?: boolean
      after?: boolean
    }
    new?: {
      before?: boolean
      after?: boolean
    }
    null?: {
      before?: boolean
      after?: boolean
    }
    package?: {
      before?: boolean
      after?: boolean
    }
    private?: {
      before?: boolean
      after?: boolean
    }
    protected?: {
      before?: boolean
      after?: boolean
    }
    public?: {
      before?: boolean
      after?: boolean
    }
    return?: {
      before?: boolean
      after?: boolean
    }
    short?: {
      before?: boolean
      after?: boolean
    }
    static?: {
      before?: boolean
      after?: boolean
    }
    super?: {
      before?: boolean
      after?: boolean
    }
    switch?: {
      before?: boolean
      after?: boolean
    }
    synchronized?: {
      before?: boolean
      after?: boolean
    }
    this?: {
      before?: boolean
      after?: boolean
    }
    throw?: {
      before?: boolean
      after?: boolean
    }
    throws?: {
      before?: boolean
      after?: boolean
    }
    transient?: {
      before?: boolean
      after?: boolean
    }
    true?: {
      before?: boolean
      after?: boolean
    }
    try?: {
      before?: boolean
      after?: boolean
    }
    typeof?: {
      before?: boolean
      after?: boolean
    }
    var?: {
      before?: boolean
      after?: boolean
    }
    void?: {
      before?: boolean
      after?: boolean
    }
    volatile?: {
      before?: boolean
      after?: boolean
    }
    while?: {
      before?: boolean
      after?: boolean
    }
    with?: {
      before?: boolean
      after?: boolean
    }
    arguments?: {
      before?: boolean
      after?: boolean
    }
    as?: {
      before?: boolean
      after?: boolean
    }
    async?: {
      before?: boolean
      after?: boolean
    }
    await?: {
      before?: boolean
      after?: boolean
    }
    eval?: {
      before?: boolean
      after?: boolean
    }
    from?: {
      before?: boolean
      after?: boolean
    }
    get?: {
      before?: boolean
      after?: boolean
    }
    let?: {
      before?: boolean
      after?: boolean
    }
    of?: {
      before?: boolean
      after?: boolean
    }
    set?: {
      before?: boolean
      after?: boolean
    }
    type?: {
      before?: boolean
      after?: boolean
    }
    using?: {
      before?: boolean
      after?: boolean
    }
    yield?: {
      before?: boolean
      after?: boolean
    }
    accessor?: {
      before?: boolean
      after?: boolean
    }
    satisfies?: {
      before?: boolean
      after?: boolean
    }
  }
}]
// ----- stylistic/line-comment-position -----
type StylisticLineCommentPosition = []|[(("above" | "beside") | {
  position?: ("above" | "beside")
  ignorePattern?: string
  applyDefaultPatterns?: boolean
  applyDefaultIgnorePatterns?: boolean
})]
// ----- stylistic/linebreak-style -----
type StylisticLinebreakStyle = []|[("unix" | "windows")]
// ----- stylistic/lines-around-comment -----
type StylisticLinesAroundComment = []|[{
  beforeBlockComment?: boolean
  afterBlockComment?: boolean
  beforeLineComment?: boolean
  afterLineComment?: boolean
  allowBlockStart?: boolean
  allowBlockEnd?: boolean
  allowClassStart?: boolean
  allowClassEnd?: boolean
  allowObjectStart?: boolean
  allowObjectEnd?: boolean
  allowArrayStart?: boolean
  allowArrayEnd?: boolean
  allowInterfaceStart?: boolean
  allowInterfaceEnd?: boolean
  allowTypeStart?: boolean
  allowTypeEnd?: boolean
  allowEnumStart?: boolean
  allowEnumEnd?: boolean
  allowModuleStart?: boolean
  allowModuleEnd?: boolean
  ignorePattern?: string
  applyDefaultIgnorePatterns?: boolean
  afterHashbangComment?: boolean
}]
// ----- stylistic/lines-between-class-members -----
type StylisticLinesBetweenClassMembers = []|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never"))]|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never")), {
  exceptAfterSingleLine?: boolean
  exceptAfterOverload?: boolean
}]
// ----- stylistic/max-len -----
type StylisticMaxLen = []|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), {
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
}]
// ----- stylistic/max-statements-per-line -----
type StylisticMaxStatementsPerLine = []|[{
  max?: number
  ignoredNodes?: ("BreakStatement" | "ClassDeclaration" | "ContinueStatement" | "DebuggerStatement" | "DoWhileStatement" | "ExpressionStatement" | "ForInStatement" | "ForOfStatement" | "ForStatement" | "FunctionDeclaration" | "IfStatement" | "ImportDeclaration" | "LabeledStatement" | "ReturnStatement" | "SwitchStatement" | "ThrowStatement" | "TryStatement" | "VariableDeclaration" | "WhileStatement" | "WithStatement" | "ExportNamedDeclaration" | "ExportDefaultDeclaration" | "ExportAllDeclaration")[]
}]
// ----- stylistic/member-delimiter-style -----
type StylisticMemberDelimiterStyle = []|[{
  multiline?: {
    delimiter?: ("none" | "semi" | "comma")
    requireLast?: boolean
  }
  singleline?: {
    delimiter?: ("semi" | "comma")
    requireLast?: boolean
  }
  overrides?: {
    interface?: _StylisticMemberDelimiterStyle_DelimiterConfig
    typeLiteral?: _StylisticMemberDelimiterStyle_DelimiterConfig
  }
  multilineDetection?: ("brackets" | "last-member")
}]
interface _StylisticMemberDelimiterStyle_DelimiterConfig {
  multiline?: {
    delimiter?: ("none" | "semi" | "comma")
    requireLast?: boolean
  }
  singleline?: {
    delimiter?: ("semi" | "comma")
    requireLast?: boolean
  }
}
// ----- stylistic/multiline-comment-style -----
type StylisticMultilineCommentStyle = ([]|[("starred-block" | "bare-block")] | []|["separate-lines"]|["separate-lines", {
  checkJSDoc?: boolean
  checkExclamation?: boolean
}])
// ----- stylistic/multiline-ternary -----
type StylisticMultilineTernary = []|[("always" | "always-multiline" | "never")]|[("always" | "always-multiline" | "never"), {
  ignoreJSX?: boolean
}]
// ----- stylistic/new-parens -----
type StylisticNewParens = []|[("always" | "never")]
// ----- stylistic/newline-per-chained-call -----
type StylisticNewlinePerChainedCall = []|[{
  ignoreChainWithDepth?: number
}]
// ----- stylistic/no-confusing-arrow -----
type StylisticNoConfusingArrow = []|[{
  allowParens?: boolean
  onlyOneSimpleParam?: boolean
}]
// ----- stylistic/no-extra-parens -----
type StylisticNoExtraParens = ([]|["functions"] | []|["all"]|["all", {
  conditionalAssign?: boolean
  ternaryOperandBinaryExpressions?: boolean
  nestedBinaryExpressions?: boolean
  returnAssign?: boolean
  ignoreJSX?: ("none" | "all" | "single-line" | "multi-line")
  enforceForArrowConditionals?: boolean
  enforceForSequenceExpressions?: boolean
  enforceForNewInMemberExpressions?: boolean
  enforceForFunctionPrototypeMethods?: boolean
  allowParensAfterCommentPattern?: string
  nestedConditionalExpressions?: boolean
  allowNodesInSpreadElement?: {
    ConditionalExpression?: boolean
    LogicalExpression?: boolean
    AwaitExpression?: boolean
  }
  ignoredNodes?: string[]
}])
// ----- stylistic/no-mixed-operators -----
type StylisticNoMixedOperators = []|[{
  groups?: [("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ...(("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"))[]][]
  allowSamePrecedence?: boolean
}]
// ----- stylistic/no-mixed-spaces-and-tabs -----
type StylisticNoMixedSpacesAndTabs = []|[("smart-tabs" | boolean)]
// ----- stylistic/no-multi-spaces -----
type StylisticNoMultiSpaces = []|[{
  exceptions?: {
    [k: string]: boolean
  }
  ignoreEOLComments?: boolean
  includeTabs?: boolean
}]
// ----- stylistic/no-multiple-empty-lines -----
type StylisticNoMultipleEmptyLines = []|[{
  max: number
  maxEOF?: number
  maxBOF?: number
}]
// ----- stylistic/no-tabs -----
type StylisticNoTabs = []|[{
  allowIndentationTabs?: boolean
}]
// ----- stylistic/no-trailing-spaces -----
type StylisticNoTrailingSpaces = []|[{
  skipBlankLines?: boolean
  ignoreComments?: boolean
}]
// ----- stylistic/nonblock-statement-body-position -----
type StylisticNonblockStatementBodyPosition = []|[("beside" | "below" | "any")]|[("beside" | "below" | "any"), {
  overrides?: {
    if?: ("beside" | "below" | "any")
    else?: ("beside" | "below" | "any")
    while?: ("beside" | "below" | "any")
    do?: ("beside" | "below" | "any")
    for?: ("beside" | "below" | "any")
  }
}]
// ----- stylistic/object-curly-newline -----
type StylisticObjectCurlyNewline = []|[((("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
}) | {
  ObjectExpression?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ObjectPattern?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ImportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ExportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSTypeLiteral?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSInterfaceBody?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSEnumBody?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
})]
// ----- stylistic/object-curly-spacing -----
type StylisticObjectCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
  overrides?: {
    ObjectPattern?: ("always" | "never")
    ObjectExpression?: ("always" | "never")
    ImportDeclaration?: ("always" | "never")
    ImportAttributes?: ("always" | "never")
    ExportNamedDeclaration?: ("always" | "never")
    ExportAllDeclaration?: ("always" | "never")
    TSMappedType?: ("always" | "never")
    TSTypeLiteral?: ("always" | "never")
    TSInterfaceBody?: ("always" | "never")
    TSEnumBody?: ("always" | "never")
  }
  emptyObjects?: ("ignore" | "always" | "never")
}]
// ----- stylistic/object-property-newline -----
type StylisticObjectPropertyNewline = []|[{
  allowAllPropertiesOnSameLine?: boolean
}]
// ----- stylistic/one-var-declaration-per-line -----
type StylisticOneVarDeclarationPerLine = []|[("always" | "initializations")]
// ----- stylistic/operator-linebreak -----
type StylisticOperatorLinebreak = []|[(("after" | "before" | "none") | null)]|[(("after" | "before" | "none") | null), {
  overrides?: {
    [k: string]: ("after" | "before" | "none" | "ignore") | undefined
  }
}]
// ----- stylistic/padded-blocks -----
type StylisticPaddedBlocks = []|[(("always" | "never" | "start" | "end") | {
  blocks?: ("always" | "never" | "start" | "end")
  switches?: ("always" | "never" | "start" | "end")
  classes?: ("always" | "never" | "start" | "end")
})]|[(("always" | "never" | "start" | "end") | {
  blocks?: ("always" | "never" | "start" | "end")
  switches?: ("always" | "never" | "start" | "end")
  classes?: ("always" | "never" | "start" | "end")
}), {
  allowSingleLineBlocks?: boolean
}]
// ----- stylistic/padding-line-between-statements -----
type _StylisticPaddingLineBetweenStatementsPaddingType = ("any" | "never" | "always")
type _StylisticPaddingLineBetweenStatementsStatementOption = (_StylisticPaddingLineBetweenStatementsStatementType | [_StylisticPaddingLineBetweenStatementsStatementType, ...(_StylisticPaddingLineBetweenStatementsStatementType)[]])
type _StylisticPaddingLineBetweenStatementsStatementType = ("*" | "exports" | "require" | "directive" | "iife" | "block" | "empty" | "function" | "ts-method" | "break" | "case" | "class" | "continue" | "debugger" | "default" | "do" | "for" | "if" | "import" | "switch" | "throw" | "try" | "while" | "with" | "cjs-export" | "cjs-import" | "enum" | "interface" | "function-overload" | "block-like" | "singleline-block-like" | "multiline-block-like" | "expression" | "singleline-expression" | "multiline-expression" | "return" | "singleline-return" | "multiline-return" | "export" | "singleline-export" | "multiline-export" | "var" | "singleline-var" | "multiline-var" | "let" | "singleline-let" | "multiline-let" | "const" | "singleline-const" | "multiline-const" | "using" | "singleline-using" | "multiline-using" | "type" | "singleline-type" | "multiline-type")
type StylisticPaddingLineBetweenStatements = {
  blankLine: _StylisticPaddingLineBetweenStatementsPaddingType
  prev: _StylisticPaddingLineBetweenStatementsStatementOption
  next: _StylisticPaddingLineBetweenStatementsStatementOption
}[]
// ----- stylistic/quote-props -----
type StylisticQuoteProps = ([]|[("always" | "as-needed" | "consistent" | "consistent-as-needed")] | []|[("always" | "as-needed" | "consistent" | "consistent-as-needed")]|[("always" | "as-needed" | "consistent" | "consistent-as-needed"), {
  keywords?: boolean
  unnecessary?: boolean
  numbers?: boolean
}])
// ----- stylistic/quotes -----
type StylisticQuotes = []|[("single" | "double" | "backtick")]|[("single" | "double" | "backtick"), ("avoid-escape" | {
  avoidEscape?: boolean
  allowTemplateLiterals?: (boolean | ("never" | "avoidEscape" | "always"))
  ignoreStringLiterals?: boolean
})]
// ----- stylistic/rest-spread-spacing -----
type StylisticRestSpreadSpacing = []|[("always" | "never")]
// ----- stylistic/semi -----
type StylisticSemi = ([]|["never"]|["never", {
  beforeStatementContinuationChars?: ("always" | "any" | "never")
}] | []|["always"]|["always", {
  omitLastInOneLineBlock?: boolean
  omitLastInOneLineClassBody?: boolean
}])
// ----- stylistic/semi-spacing -----
type StylisticSemiSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- stylistic/semi-style -----
type StylisticSemiStyle = []|[("last" | "first")]
// ----- stylistic/space-before-blocks -----
type StylisticSpaceBeforeBlocks = []|[(("always" | "never") | {
  keywords?: ("always" | "never" | "off")
  functions?: ("always" | "never" | "off")
  classes?: ("always" | "never" | "off")
  modules?: ("always" | "never" | "off")
})]
// ----- stylistic/space-before-function-paren -----
type StylisticSpaceBeforeFunctionParen = []|[(("always" | "never") | {
  anonymous?: ("always" | "never" | "ignore")
  named?: ("always" | "never" | "ignore")
  asyncArrow?: ("always" | "never" | "ignore")
  catch?: ("always" | "never" | "ignore")
})]
// ----- stylistic/space-in-parens -----
type StylisticSpaceInParens = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: ("{}" | "[]" | "()" | "empty")[]
}]
// ----- stylistic/space-infix-ops -----
type StylisticSpaceInfixOps = []|[{
  int32Hint?: boolean
  ignoreTypes?: boolean
}]
// ----- stylistic/space-unary-ops -----
type StylisticSpaceUnaryOps = []|[{
  words?: boolean
  nonwords?: boolean
  overrides?: {
    [k: string]: boolean | undefined
  }
}]
// ----- stylistic/spaced-comment -----
type StylisticSpacedComment = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
  markers?: string[]
  line?: {
    exceptions?: string[]
    markers?: string[]
  }
  block?: {
    exceptions?: string[]
    markers?: string[]
    balanced?: boolean
  }
}]
// ----- stylistic/switch-colon-spacing -----
type StylisticSwitchColonSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- stylistic/template-curly-spacing -----
type StylisticTemplateCurlySpacing = []|[("always" | "never")]
// ----- stylistic/template-tag-spacing -----
type StylisticTemplateTagSpacing = []|[("always" | "never")]
// ----- stylistic/type-annotation-spacing -----
type StylisticTypeAnnotationSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    colon?: _StylisticTypeAnnotationSpacing_SpacingConfig
    arrow?: ("ignore" | _StylisticTypeAnnotationSpacing_SpacingConfig)
    variable?: _StylisticTypeAnnotationSpacing_SpacingConfig
    parameter?: _StylisticTypeAnnotationSpacing_SpacingConfig
    property?: _StylisticTypeAnnotationSpacing_SpacingConfig
    returnType?: _StylisticTypeAnnotationSpacing_SpacingConfig
  }
}]
interface _StylisticTypeAnnotationSpacing_SpacingConfig {
  before?: boolean
  after?: boolean
}
// ----- stylistic/wrap-iife -----
type StylisticWrapIife = []|[("outside" | "inside" | "any")]|[("outside" | "inside" | "any"), {
  functionPrototypeMethods?: boolean
}]
// ----- stylistic/yield-star-spacing -----
type StylisticYieldStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
})]
// ----- switch-colon-spacing -----
type SwitchColonSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- tailwindcss/classnames-order -----
type TailwindcssClassnamesOrder = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  removeDuplicates?: boolean
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/enforces-negative-arbitrary-values -----
type TailwindcssEnforcesNegativeArbitraryValues = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/enforces-shorthand -----
type TailwindcssEnforcesShorthand = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/migration-from-tailwind-2 -----
type TailwindcssMigrationFromTailwind2 = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/no-arbitrary-value -----
type TailwindcssNoArbitraryValue = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/no-contradicting-classname -----
type TailwindcssNoContradictingClassname = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/no-custom-classname -----
type TailwindcssNoCustomClassname = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  cssFiles?: string[]
  cssFilesRefreshRate?: number
  tags?: string[]
  whitelist?: string[]
  [k: string]: unknown | undefined
}]
// ----- tailwindcss/no-unnecessary-arbitrary-value -----
type TailwindcssNoUnnecessaryArbitraryValue = []|[{
  callees?: string[]
  ignoredKeys?: string[]
  config?: (string | {
    [k: string]: unknown | undefined
  })
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- template-curly-spacing -----
type TemplateCurlySpacing = []|[("always" | "never")]
// ----- template-tag-spacing -----
type TemplateTagSpacing = []|[("always" | "never")]
// ----- toml/array-bracket-newline -----
type TomlArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- toml/array-bracket-spacing -----
type TomlArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- toml/array-element-newline -----
type TomlArrayElementNewline = []|[(_TomlArrayElementNewlineBasicConfig | {
  ArrayExpression?: _TomlArrayElementNewlineBasicConfig
  ArrayPattern?: _TomlArrayElementNewlineBasicConfig
  TOMLArray?: _TomlArrayElementNewlineBasicConfig
})]
type _TomlArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})
// ----- toml/comma-style -----
type TomlCommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- toml/indent -----
type TomlIndent = []|[("tab" | number)]|[("tab" | number), {
  subTables?: number
  keyValuePairs?: number
}]
// ----- toml/inline-table-curly-spacing -----
type TomlInlineTableCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
}]
// ----- toml/key-spacing -----
type TomlKeySpacing = []|[({
  align?: (("equal" | "value") | {
    on?: ("equal" | "value")
    mode?: ("strict" | "minimum")
    beforeEqual?: boolean
    afterEqual?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeEqual?: boolean
  afterEqual?: boolean
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeEqual?: boolean
    afterEqual?: boolean
  }
  multiLine?: {
    align?: (("equal" | "value") | {
      on?: ("equal" | "value")
      mode?: ("strict" | "minimum")
      beforeEqual?: boolean
      afterEqual?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeEqual?: boolean
    afterEqual?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeEqual?: boolean
    afterEqual?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeEqual?: boolean
    afterEqual?: boolean
  }
  align?: {
    on?: ("equal" | "value")
    mode?: ("strict" | "minimum")
    beforeEqual?: boolean
    afterEqual?: boolean
  }
})]
// ----- toml/no-mixed-type-in-array -----
type TomlNoMixedTypeInArray = []|[{
  typeMap?: {
    string?: string
    boolean?: string
    integer?: string
    float?: string
    offsetDateTime?: string
    localDateTime?: string
    localDate?: string
    localTime?: string
    array?: string
    inlineTable?: string
  }
}]
// ----- toml/no-non-decimal-integer -----
type TomlNoNonDecimalInteger = []|[{
  allowHexadecimal?: boolean
  allowOctal?: boolean
  allowBinary?: boolean
}]
// ----- toml/precision-of-fractional-seconds -----
type TomlPrecisionOfFractionalSeconds = []|[{
  max?: number
}]
// ----- toml/precision-of-integer -----
type TomlPrecisionOfInteger = []|[{
  maxBit?: number
}]
// ----- toml/quoted-keys -----
type TomlQuotedKeys = []|[{
  prefer?: ("as-needed" | "always")
  numbers?: boolean
}]
// ----- toml/spaced-comment -----
type TomlSpacedComment = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
  markers?: string[]
}]
// ----- toml/table-bracket-spacing -----
type TomlTableBracketSpacing = []|[("always" | "never")]
// ----- ts/array-type -----
type TsArrayType = []|[{
  
  default?: ("array" | "generic" | "array-simple")
  
  readonly?: ("array" | "generic" | "array-simple")
}]
// ----- ts/ban-ts-comment -----
type TsBanTsComment = []|[{
  
  minimumDescriptionLength?: number
  
  "ts-check"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
  
  "ts-expect-error"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
  
  "ts-ignore"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
  
  "ts-nocheck"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
}]
// ----- ts/class-literal-property-style -----
type TsClassLiteralPropertyStyle = []|[("fields" | "getters")]
// ----- ts/class-methods-use-this -----
type TsClassMethodsUseThis = []|[{
  
  enforceForClassFields?: boolean
  
  exceptMethods?: string[]
  
  ignoreClassesThatImplementAnInterface?: (boolean | "public-fields")
  
  ignoreOverrideMethods?: boolean
}]
// ----- ts/consistent-generic-constructors -----
type TsConsistentGenericConstructors = []|[("type-annotation" | "constructor")]
// ----- ts/consistent-indexed-object-style -----
type TsConsistentIndexedObjectStyle = []|[("record" | "index-signature")]
// ----- ts/consistent-return -----
type TsConsistentReturn = []|[{
  treatUndefinedAsUnspecified?: boolean
}]
// ----- ts/consistent-type-assertions -----
type TsConsistentTypeAssertions = []|[({
  
  assertionStyle: "never"
} | {
  
  arrayLiteralTypeAssertions?: ("allow" | "allow-as-parameter" | "never")
  
  assertionStyle?: ("as" | "angle-bracket")
  
  objectLiteralTypeAssertions?: ("allow" | "allow-as-parameter" | "never")
})]
// ----- ts/consistent-type-definitions -----
type TsConsistentTypeDefinitions = []|[("interface" | "type")]
// ----- ts/consistent-type-exports -----
type TsConsistentTypeExports = []|[{
  
  fixMixedExportsWithInlineTypeSpecifier?: boolean
}]
// ----- ts/consistent-type-imports -----
type TsConsistentTypeImports = []|[{
  
  disallowTypeAnnotations?: boolean
  
  fixStyle?: ("separate-type-imports" | "inline-type-imports")
  
  prefer?: ("type-imports" | "no-type-imports")
}]
// ----- ts/dot-notation -----
type TsDotNotation = []|[{
  
  allowIndexSignaturePropertyAccess?: boolean
  
  allowKeywords?: boolean
  
  allowPattern?: string
  
  allowPrivateClassPropertyAccess?: boolean
  
  allowProtectedClassPropertyAccess?: boolean
}]
// ----- ts/explicit-function-return-type -----
type TsExplicitFunctionReturnType = []|[{
  
  allowConciseArrowFunctionExpressionsStartingWithVoid?: boolean
  
  allowDirectConstAssertionInArrowFunctions?: boolean
  
  allowedNames?: string[]
  
  allowExpressions?: boolean
  
  allowFunctionsWithoutTypeParameters?: boolean
  
  allowHigherOrderFunctions?: boolean
  
  allowIIFEs?: boolean
  
  allowTypedFunctionExpressions?: boolean
}]
// ----- ts/explicit-member-accessibility -----
type TsExplicitMemberAccessibility = []|[{
  
  accessibility?: ("explicit" | "no-public" | "off")
  
  ignoredMethodNames?: string[]
  
  overrides?: {
    
    accessors?: ("explicit" | "no-public" | "off")
    
    constructors?: ("explicit" | "no-public" | "off")
    
    methods?: ("explicit" | "no-public" | "off")
    
    parameterProperties?: ("explicit" | "no-public" | "off")
    
    properties?: ("explicit" | "no-public" | "off")
  }
}]
// ----- ts/explicit-module-boundary-types -----
type TsExplicitModuleBoundaryTypes = []|[{
  
  allowArgumentsExplicitlyTypedAsAny?: boolean
  
  allowDirectConstAssertionInArrowFunctions?: boolean
  
  allowedNames?: string[]
  
  allowHigherOrderFunctions?: boolean
  
  allowOverloadFunctions?: boolean
  
  allowTypedFunctionExpressions?: boolean
}]
// ----- ts/init-declarations -----
type TsInitDeclarations = ([]|["always"] | []|["never"]|["never", {
  ignoreForLoopInit?: boolean
}])
// ----- ts/max-params -----
type TsMaxParams = []|[{
  
  countVoidThis?: boolean
  
  max?: number
  
  maximum?: number
}]
// ----- ts/member-ordering -----
type TsMemberOrdering = []|[{
  
  classes?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  classExpressions?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  default?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  interfaces?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  typeLiterals?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
}]
// ----- ts/method-signature-style -----
type TsMethodSignatureStyle = []|[("property" | "method")]
// ----- ts/naming-convention -----
type _TsNamingConventionFormatOptionsConfig = (_TsNamingConventionPredefinedFormats[] | null)
type _TsNamingConventionPredefinedFormats = ("camelCase" | "strictCamelCase" | "PascalCase" | "StrictPascalCase" | "snake_case" | "UPPER_CASE")
type _TsNamingConventionUnderscoreOptions = ("forbid" | "allow" | "require" | "requireDouble" | "allowDouble" | "allowSingleOrDouble")
type _TsNamingConvention_PrefixSuffixConfig = string[]
type _TsNamingConventionTypeModifiers = ("boolean" | "string" | "number" | "function" | "array")
type TsNamingConvention = ({
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  modifiers?: ("const" | "readonly" | "static" | "public" | "protected" | "private" | "#private" | "abstract" | "destructured" | "global" | "exported" | "unused" | "requiresQuotes" | "override" | "async" | "default" | "namespace")[]
  selector: ("default" | "variableLike" | "memberLike" | "typeLike" | "method" | "property" | "accessor" | "variable" | "function" | "parameter" | "parameterProperty" | "classicAccessor" | "enumMember" | "classMethod" | "objectLiteralMethod" | "typeMethod" | "classProperty" | "objectLiteralProperty" | "typeProperty" | "autoAccessor" | "class" | "interface" | "typeAlias" | "enum" | "typeParameter" | "import")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "default"
  modifiers?: ("const" | "readonly" | "static" | "public" | "protected" | "private" | "#private" | "abstract" | "destructured" | "global" | "exported" | "unused" | "requiresQuotes" | "override" | "async" | "default" | "namespace")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "variableLike"
  modifiers?: ("unused" | "async")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "variable"
  modifiers?: ("const" | "destructured" | "exported" | "global" | "unused" | "async")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "function"
  modifiers?: ("exported" | "global" | "unused" | "async")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "parameter"
  modifiers?: ("destructured" | "unused")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "memberLike"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "readonly" | "requiresQuotes" | "static" | "override" | "async")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "classProperty"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "readonly" | "requiresQuotes" | "static" | "override")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "objectLiteralProperty"
  modifiers?: ("public" | "requiresQuotes")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "typeProperty"
  modifiers?: ("public" | "readonly" | "requiresQuotes")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "parameterProperty"
  modifiers?: ("private" | "protected" | "public" | "readonly")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "property"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "readonly" | "requiresQuotes" | "static" | "override" | "async")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "classMethod"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "requiresQuotes" | "static" | "override" | "async")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "objectLiteralMethod"
  modifiers?: ("public" | "requiresQuotes" | "async")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "typeMethod"
  modifiers?: ("public" | "requiresQuotes")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "method"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "requiresQuotes" | "static" | "override" | "async")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "classicAccessor"
  modifiers?: ("abstract" | "private" | "protected" | "public" | "requiresQuotes" | "static" | "override")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "autoAccessor"
  modifiers?: ("abstract" | "private" | "protected" | "public" | "requiresQuotes" | "static" | "override")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "accessor"
  modifiers?: ("abstract" | "private" | "protected" | "public" | "requiresQuotes" | "static" | "override")[]
  types?: _TsNamingConventionTypeModifiers[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "enumMember"
  modifiers?: ("requiresQuotes")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "typeLike"
  modifiers?: ("abstract" | "exported" | "unused")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "class"
  modifiers?: ("abstract" | "exported" | "unused")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "interface"
  modifiers?: ("exported" | "unused")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "typeAlias"
  modifiers?: ("exported" | "unused")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "enum"
  modifiers?: ("exported" | "unused")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "typeParameter"
  modifiers?: ("unused")[]
} | {
  custom?: _TsNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TsNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TsNamingConventionUnderscoreOptions
  prefix?: _TsNamingConvention_PrefixSuffixConfig
  suffix?: _TsNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TsNamingConventionUnderscoreOptions
  filter?: (string | _TsNamingConvention_MatchRegexConfig)
  selector: "import"
  modifiers?: ("default" | "namespace")[]
})[]
interface _TsNamingConvention_MatchRegexConfig {
  match: boolean
  regex: string
}
// ----- ts/no-base-to-string -----
type TsNoBaseToString = []|[{
  
  checkUnknown?: boolean
  
  ignoredTypeNames?: string[]
}]
// ----- ts/no-confusing-void-expression -----
type TsNoConfusingVoidExpression = []|[{
  
  ignoreArrowShorthand?: boolean
  
  ignoreVoidOperator?: boolean
  
  ignoreVoidReturningFunctions?: boolean
}]
// ----- ts/no-deprecated -----
type TsNoDeprecated = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
}]
// ----- ts/no-duplicate-type-constituents -----
type TsNoDuplicateTypeConstituents = []|[{
  
  ignoreIntersections?: boolean
  
  ignoreUnions?: boolean
}]
// ----- ts/no-empty-function -----
type TsNoEmptyFunction = []|[{
  
  allow?: ("functions" | "arrowFunctions" | "generatorFunctions" | "methods" | "generatorMethods" | "getters" | "setters" | "constructors" | "private-constructors" | "protected-constructors" | "asyncFunctions" | "asyncMethods" | "decoratedFunctions" | "overrideMethods")[]
}]
// ----- ts/no-empty-interface -----
type TsNoEmptyInterface = []|[{
  
  allowSingleExtends?: boolean
}]
// ----- ts/no-empty-object-type -----
type TsNoEmptyObjectType = []|[{
  
  allowInterfaces?: ("always" | "never" | "with-single-extends")
  
  allowObjectTypes?: ("always" | "never")
  
  allowWithName?: string
}]
// ----- ts/no-explicit-any -----
type TsNoExplicitAny = []|[{
  
  fixToUnknown?: boolean
  
  ignoreRestArgs?: boolean
}]
// ----- ts/no-extraneous-class -----
type TsNoExtraneousClass = []|[{
  
  allowConstructorOnly?: boolean
  
  allowEmpty?: boolean
  
  allowStaticOnly?: boolean
  
  allowWithDecorator?: boolean
}]
// ----- ts/no-floating-promises -----
type TsNoFloatingPromises = []|[{
  
  allowForKnownSafeCalls?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  allowForKnownSafePromises?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  checkThenables?: boolean
  
  ignoreIIFE?: boolean
  
  ignoreVoid?: boolean
}]
// ----- ts/no-inferrable-types -----
type TsNoInferrableTypes = []|[{
  
  ignoreParameters?: boolean
  
  ignoreProperties?: boolean
}]
// ----- ts/no-invalid-this -----
type TsNoInvalidThis = []|[{
  capIsConstructor?: boolean
}]
// ----- ts/no-invalid-void-type -----
type TsNoInvalidVoidType = []|[{
  
  allowAsThisParameter?: boolean
  
  allowInGenericTypeArguments?: (boolean | [string, ...(string)[]])
}]
// ----- ts/no-magic-numbers -----
type TsNoMagicNumbers = []|[{
  detectObjects?: boolean
  enforceConst?: boolean
  ignore?: (number | string)[]
  ignoreArrayIndexes?: boolean
  ignoreDefaultValues?: boolean
  ignoreClassFieldInitialValues?: boolean
  
  ignoreEnums?: boolean
  
  ignoreNumericLiteralTypes?: boolean
  
  ignoreReadonlyClassProperties?: boolean
  
  ignoreTypeIndexes?: boolean
}]
// ----- ts/no-meaningless-void-operator -----
type TsNoMeaninglessVoidOperator = []|[{
  
  checkNever?: boolean
}]
// ----- ts/no-misused-promises -----
type TsNoMisusedPromises = []|[{
  
  checksConditionals?: boolean
  
  checksSpreads?: boolean
  
  checksVoidReturn?: (boolean | {
    
    arguments?: boolean
    
    attributes?: boolean
    
    inheritedMethods?: boolean
    
    properties?: boolean
    
    returns?: boolean
    
    variables?: boolean
  })
}]
// ----- ts/no-misused-spread -----
type TsNoMisusedSpread = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
}]
// ----- ts/no-namespace -----
type TsNoNamespace = []|[{
  
  allowDeclarations?: boolean
  
  allowDefinitionFiles?: boolean
}]
// ----- ts/no-redeclare -----
type TsNoRedeclare = []|[{
  
  builtinGlobals?: boolean
  
  ignoreDeclarationMerge?: boolean
}]
// ----- ts/no-require-imports -----
type TsNoRequireImports = []|[{
  
  allow?: string[]
  
  allowAsImport?: boolean
}]
// ----- ts/no-restricted-imports -----
type TsNoRestrictedImports = ((string | {
  name: string
  message?: string
  importNames?: string[]
  allowImportNames?: string[]
  
  allowTypeImports?: boolean
})[] | []|[{
  paths?: (string | {
    name: string
    message?: string
    importNames?: string[]
    allowImportNames?: string[]
    
    allowTypeImports?: boolean
  })[]
  patterns?: (string[] | {
    
    importNames?: [string, ...(string)[]]
    
    allowImportNames?: [string, ...(string)[]]
    
    group?: [string, ...(string)[]]
    regex?: string
    importNamePattern?: string
    allowImportNamePattern?: string
    message?: string
    caseSensitive?: boolean
    
    allowTypeImports?: boolean
  }[])
}])
// ----- ts/no-restricted-types -----
type TsNoRestrictedTypes = []|[{
  
  types?: {
    [k: string]: (true | string | {
      
      fixWith?: string
      
      message?: string
      
      suggest?: string[]
    }) | undefined
  }
}]
// ----- ts/no-shadow -----
type TsNoShadow = []|[{
  
  allow?: string[]
  
  builtinGlobals?: boolean
  
  hoist?: ("all" | "functions" | "functions-and-types" | "never" | "types")
  
  ignoreFunctionTypeParameterNameValueShadow?: boolean
  
  ignoreOnInitialization?: boolean
  
  ignoreTypeValueShadow?: boolean
}]
// ----- ts/no-this-alias -----
type TsNoThisAlias = []|[{
  
  allowDestructuring?: boolean
  
  allowedNames?: string[]
}]
// ----- ts/no-type-alias -----
type TsNoTypeAlias = []|[{
  
  allowAliases?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
  
  allowCallbacks?: ("always" | "never")
  
  allowConditionalTypes?: ("always" | "never")
  
  allowConstructors?: ("always" | "never")
  
  allowGenerics?: ("always" | "never")
  
  allowLiterals?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
  
  allowMappedTypes?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
  
  allowTupleTypes?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
}]
// ----- ts/no-unnecessary-boolean-literal-compare -----
type TsNoUnnecessaryBooleanLiteralCompare = []|[{
  
  allowComparingNullableBooleansToFalse?: boolean
  
  allowComparingNullableBooleansToTrue?: boolean
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
}]
// ----- ts/no-unnecessary-condition -----
type TsNoUnnecessaryCondition = []|[{
  
  allowConstantLoopConditions?: (boolean | ("always" | "never" | "only-allowed-literals"))
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
  
  checkTypePredicates?: boolean
}]
// ----- ts/no-unnecessary-type-assertion -----
type TsNoUnnecessaryTypeAssertion = []|[{
  
  checkLiteralConstAssertions?: boolean
  
  typesToIgnore?: string[]
}]
// ----- ts/no-unsafe-member-access -----
type TsNoUnsafeMemberAccess = []|[{
  
  allowOptionalChaining?: boolean
}]
// ----- ts/no-unused-expressions -----
type TsNoUnusedExpressions = []|[{
  allowShortCircuit?: boolean
  allowTernary?: boolean
  allowTaggedTemplates?: boolean
  enforceForJSX?: boolean
  ignoreDirectives?: boolean
}]
// ----- ts/no-unused-vars -----
type TsNoUnusedVars = []|[(("all" | "local") | {
  
  args?: ("all" | "after-used" | "none")
  
  argsIgnorePattern?: string
  
  caughtErrors?: ("all" | "none")
  
  caughtErrorsIgnorePattern?: string
  
  destructuredArrayIgnorePattern?: string
  
  enableAutofixRemoval?: {
    
    imports?: boolean
  }
  
  ignoreClassWithStaticInitBlock?: boolean
  
  ignoreRestSiblings?: boolean
  
  ignoreUsingDeclarations?: boolean
  
  reportUsedIgnorePattern?: boolean
  
  vars?: ("all" | "local")
  
  varsIgnorePattern?: string
})]
// ----- ts/no-use-before-define -----
type TsNoUseBeforeDefine = []|[("nofunc" | {
  
  allowNamedExports?: boolean
  
  classes?: boolean
  
  enums?: boolean
  
  functions?: boolean
  
  ignoreTypeReferences?: boolean
  
  typedefs?: boolean
  
  variables?: boolean
})]
// ----- ts/no-useless-default-assignment -----
type TsNoUselessDefaultAssignment = []|[{
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
}]
// ----- ts/no-var-requires -----
type TsNoVarRequires = []|[{
  
  allow?: string[]
}]
// ----- ts/only-throw-error -----
type TsOnlyThrowError = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  allowRethrowing?: boolean
  
  allowThrowingAny?: boolean
  
  allowThrowingUnknown?: boolean
}]
// ----- ts/parameter-properties -----
type TsParameterProperties = []|[{
  
  allow?: ("readonly" | "private" | "protected" | "public" | "private readonly" | "protected readonly" | "public readonly")[]
  
  prefer?: ("class-property" | "parameter-property")
}]
// ----- ts/prefer-destructuring -----
type TsPreferDestructuring = []|[({
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
})]|[({
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
}), {
  
  enforceForDeclarationWithTypeAnnotation?: boolean
  
  enforceForRenamedProperties?: boolean
}]
// ----- ts/prefer-literal-enum-member -----
type TsPreferLiteralEnumMember = []|[{
  
  allowBitwiseExpressions?: boolean
}]
// ----- ts/prefer-nullish-coalescing -----
type TsPreferNullishCoalescing = []|[{
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
  
  ignoreBooleanCoercion?: boolean
  
  ignoreConditionalTests?: boolean
  
  ignoreIfStatements?: boolean
  
  ignoreMixedLogicalExpressions?: boolean
  
  ignorePrimitives?: ({
    
    bigint?: boolean
    
    boolean?: boolean
    
    number?: boolean
    
    string?: boolean
  } | true)
  
  ignoreTernaryTests?: boolean
}]
// ----- ts/prefer-optional-chain -----
type TsPreferOptionalChain = []|[{
  
  allowPotentiallyUnsafeFixesThatModifyTheReturnTypeIKnowWhatImDoing?: boolean
  
  checkAny?: boolean
  
  checkBigInt?: boolean
  
  checkBoolean?: boolean
  
  checkNumber?: boolean
  
  checkString?: boolean
  
  checkUnknown?: boolean
  
  requireNullish?: boolean
}]
// ----- ts/prefer-promise-reject-errors -----
type TsPreferPromiseRejectErrors = []|[{
  
  allowEmptyReject?: boolean
  
  allowThrowingAny?: boolean
  
  allowThrowingUnknown?: boolean
}]
// ----- ts/prefer-readonly -----
type TsPreferReadonly = []|[{
  
  onlyInlineLambdas?: boolean
}]
// ----- ts/prefer-readonly-parameter-types -----
type TsPreferReadonlyParameterTypes = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  checkParameterProperties?: boolean
  
  ignoreInferredTypes?: boolean
  
  treatMethodsAsReadonly?: boolean
}]
// ----- ts/prefer-string-starts-ends-with -----
type TsPreferStringStartsEndsWith = []|[{
  
  allowSingleElementEquality?: ("always" | "never")
}]
// ----- ts/promise-function-async -----
type TsPromiseFunctionAsync = []|[{
  
  allowAny?: boolean
  
  allowedPromiseNames?: string[]
  
  checkArrowFunctions?: boolean
  
  checkFunctionDeclarations?: boolean
  
  checkFunctionExpressions?: boolean
  
  checkMethodDeclarations?: boolean
}]
// ----- ts/require-array-sort-compare -----
type TsRequireArraySortCompare = []|[{
  
  ignoreStringArrays?: boolean
}]
// ----- ts/restrict-plus-operands -----
type TsRestrictPlusOperands = []|[{
  
  allowAny?: boolean
  
  allowBoolean?: boolean
  
  allowNullish?: boolean
  
  allowNumberAndString?: boolean
  
  allowRegExp?: boolean
  
  skipCompoundAssignments?: boolean
}]
// ----- ts/restrict-template-expressions -----
type TsRestrictTemplateExpressions = []|[{
  
  allowAny?: boolean
  
  allowArray?: boolean
  
  allowBoolean?: boolean
  
  allowNullish?: boolean
  
  allowNumber?: boolean
  
  allowRegExp?: boolean
  
  allowNever?: boolean
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
}]
// ----- ts/return-await -----
type TsReturnAwait = []|[(("always" | "error-handling-correctness-only" | "in-try-catch" | "never") & string)]
// ----- ts/sort-type-constituents -----
type TsSortTypeConstituents = []|[{
  
  caseSensitive?: boolean
  
  checkIntersections?: boolean
  
  checkUnions?: boolean
  
  groupOrder?: ("conditional" | "function" | "import" | "intersection" | "keyword" | "nullish" | "literal" | "named" | "object" | "operator" | "tuple" | "union")[]
}]
// ----- ts/strict-boolean-expressions -----
type TsStrictBooleanExpressions = []|[{
  
  allowAny?: boolean
  
  allowNullableBoolean?: boolean
  
  allowNullableEnum?: boolean
  
  allowNullableNumber?: boolean
  
  allowNullableObject?: boolean
  
  allowNullableString?: boolean
  
  allowNumber?: boolean
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
  
  allowString?: boolean
}]
// ----- ts/strict-void-return -----
type TsStrictVoidReturn = []|[{
  
  allowReturnAny?: boolean
}]
// ----- ts/switch-exhaustiveness-check -----
type TsSwitchExhaustivenessCheck = []|[{
  
  allowDefaultCaseForExhaustiveSwitch?: boolean
  
  considerDefaultExhaustiveForUnions?: boolean
  
  defaultCaseCommentPattern?: string
  
  requireDefaultForNonUnion?: boolean
}]
// ----- ts/triple-slash-reference -----
type TsTripleSlashReference = []|[{
  
  lib?: ("always" | "never")
  
  path?: ("always" | "never")
  
  types?: ("always" | "never" | "prefer-import")
}]
// ----- ts/typedef -----
type TsTypedef = []|[{
  
  arrayDestructuring?: boolean
  
  arrowParameter?: boolean
  
  memberVariableDeclaration?: boolean
  
  objectDestructuring?: boolean
  
  parameter?: boolean
  
  propertyDeclaration?: boolean
  
  variableDeclaration?: boolean
  
  variableDeclarationIgnoreFunction?: boolean
}]
// ----- ts/unbound-method -----
type TsUnboundMethod = []|[{
  
  ignoreStatic?: boolean
}]
// ----- ts/unified-signatures -----
type TsUnifiedSignatures = []|[{
  
  ignoreDifferentlyNamedParameters?: boolean
  
  ignoreOverloadsWithDifferentJSDoc?: boolean
}]
// ----- turbo/no-undeclared-env-vars -----
type TurboNoUndeclaredEnvVars = []|[{
  cwd?: string
  allowList?: string[]
}]
// ----- unicode-bom -----
type UnicodeBom = []|[("always" | "never")]
// ----- unicorn/better-regex -----
type UnicornBetterRegex = []|[{
  sortCharacterClasses?: boolean
}]
// ----- unicorn/catch-error-name -----
type UnicornCatchErrorName = []|[{
  name?: string
  ignore?: unknown[]
}]
// ----- unicorn/consistent-function-scoping -----
type UnicornConsistentFunctionScoping = []|[{
  checkArrowFunctions?: boolean
}]
// ----- unicorn/escape-case -----
type UnicornEscapeCase = []|[("uppercase" | "lowercase")]
// ----- unicorn/expiring-todo-comments -----
type UnicornExpiringTodoComments = []|[{
  terms?: string[]
  ignore?: unknown[]
  ignoreDatesOnPullRequests?: boolean
  allowWarningComments?: boolean
  date?: string
}]
// ----- unicorn/explicit-length-check -----
type UnicornExplicitLengthCheck = []|[{
  "non-zero"?: ("greater-than" | "not-equal")
}]
// ----- unicorn/filename-case -----
type UnicornFilenameCase = []|[({
  case?: ("camelCase" | "snakeCase" | "kebabCase" | "pascalCase")
  ignore?: unknown[]
  multipleFileExtensions?: boolean
} | {
  cases?: {
    camelCase?: boolean
    snakeCase?: boolean
    kebabCase?: boolean
    pascalCase?: boolean
  }
  ignore?: unknown[]
  multipleFileExtensions?: boolean
})]
// ----- unicorn/import-style -----
type UnicornImportStyle = []|[{
  checkImport?: boolean
  checkDynamicImport?: boolean
  checkExportFrom?: boolean
  checkRequire?: boolean
  extendDefaultStyles?: boolean
  styles?: _UnicornImportStyle_ModuleStyles
}]
type _UnicornImportStyleStyles = (false | _UnicornImportStyle_BooleanObject) | undefined
interface _UnicornImportStyle_ModuleStyles {
  [k: string]: _UnicornImportStyleStyles | undefined
}
interface _UnicornImportStyle_BooleanObject {
  [k: string]: boolean | undefined
}
// ----- unicorn/isolated-functions -----
type UnicornIsolatedFunctions = []|[{
  overrideGlobals?: {
    [k: string]: (boolean | ("readonly" | "writable" | "writeable" | "off")) | undefined
  }
  functions?: string[]
  selectors?: string[]
  comments?: string[]
}]
// ----- unicorn/no-array-reduce -----
type UnicornNoArrayReduce = []|[{
  allowSimpleOperations?: boolean
}]
// ----- unicorn/no-array-reverse -----
type UnicornNoArrayReverse = []|[{
  allowExpressionStatement?: boolean
}]
// ----- unicorn/no-array-sort -----
type UnicornNoArraySort = []|[{
  allowExpressionStatement?: boolean
}]
// ----- unicorn/no-instanceof-builtins -----
type UnicornNoInstanceofBuiltins = []|[{
  useErrorIsError?: boolean
  strategy?: ("loose" | "strict")
  include?: string[]
  exclude?: string[]
}]
// ----- unicorn/no-keyword-prefix -----
type UnicornNoKeywordPrefix = []|[{
  
  disallowedPrefixes?: []|[string]
  checkProperties?: boolean
  onlyCamelCase?: boolean
}]
// ----- unicorn/no-null -----
type UnicornNoNull = []|[{
  checkStrictEquality?: boolean
}]
// ----- unicorn/no-typeof-undefined -----
type UnicornNoTypeofUndefined = []|[{
  checkGlobalVariables?: boolean
}]
// ----- unicorn/no-unnecessary-polyfills -----
type UnicornNoUnnecessaryPolyfills = []|[{
  targets: (string | unknown[] | {
    [k: string]: unknown | undefined
  })
}]
// ----- unicorn/no-useless-undefined -----
type UnicornNoUselessUndefined = []|[{
  checkArguments?: boolean
  checkArrowFunctionBody?: boolean
}]
// ----- unicorn/number-literal-case -----
type UnicornNumberLiteralCase = []|[{
  hexadecimalValue?: ("uppercase" | "lowercase")
}]
// ----- unicorn/numeric-separators-style -----
type UnicornNumericSeparatorsStyle = []|[{
  binary?: {
    onlyIfContainsSeparator?: boolean
    minimumDigits?: number
    groupLength?: number
  }
  octal?: {
    onlyIfContainsSeparator?: boolean
    minimumDigits?: number
    groupLength?: number
  }
  hexadecimal?: {
    onlyIfContainsSeparator?: boolean
    minimumDigits?: number
    groupLength?: number
  }
  number?: {
    onlyIfContainsSeparator?: boolean
    minimumDigits?: number
    groupLength?: number
  }
  onlyIfContainsSeparator?: boolean
}]
// ----- unicorn/prefer-add-event-listener -----
type UnicornPreferAddEventListener = []|[{
  excludedPackages?: string[]
}]
// ----- unicorn/prefer-array-find -----
type UnicornPreferArrayFind = []|[{
  checkFromLast?: boolean
}]
// ----- unicorn/prefer-array-flat -----
type UnicornPreferArrayFlat = []|[{
  functions?: unknown[]
}]
// ----- unicorn/prefer-at -----
type UnicornPreferAt = []|[{
  getLastElementFunctions?: unknown[]
  checkAllIndexAccess?: boolean
}]
// ----- unicorn/prefer-export-from -----
type UnicornPreferExportFrom = []|[{
  ignoreUsedVariables?: boolean
}]
// ----- unicorn/prefer-number-properties -----
type UnicornPreferNumberProperties = []|[{
  checkInfinity?: boolean
  checkNaN?: boolean
}]
// ----- unicorn/prefer-object-from-entries -----
type UnicornPreferObjectFromEntries = []|[{
  functions?: unknown[]
}]
// ----- unicorn/prefer-single-call -----
type UnicornPreferSingleCall = []|[{
  ignore?: unknown[]
}]
// ----- unicorn/prefer-structured-clone -----
type UnicornPreferStructuredClone = []|[{
  functions?: unknown[]
}]
// ----- unicorn/prefer-switch -----
type UnicornPreferSwitch = []|[{
  minimumCases?: number
  emptyDefaultCase?: ("no-default-comment" | "do-nothing-comment" | "no-default-case")
}]
// ----- unicorn/prefer-ternary -----
type UnicornPreferTernary = []|[("always" | "only-single-line")]
// ----- unicorn/prevent-abbreviations -----
type UnicornPreventAbbreviations = []|[{
  checkProperties?: boolean
  checkVariables?: boolean
  checkDefaultAndNamespaceImports?: (boolean | string)
  checkShorthandImports?: (boolean | string)
  checkShorthandProperties?: boolean
  checkFilenames?: boolean
  extendDefaultReplacements?: boolean
  replacements?: _UnicornPreventAbbreviations_Abbreviations
  extendDefaultAllowList?: boolean
  allowList?: _UnicornPreventAbbreviations_BooleanObject
  ignore?: unknown[]
}]
type _UnicornPreventAbbreviationsReplacements = (false | _UnicornPreventAbbreviations_BooleanObject) | undefined
interface _UnicornPreventAbbreviations_Abbreviations {
  [k: string]: _UnicornPreventAbbreviationsReplacements | undefined
}
interface _UnicornPreventAbbreviations_BooleanObject {
  [k: string]: boolean | undefined
}
// ----- unicorn/relative-url-style -----
type UnicornRelativeUrlStyle = []|[("never" | "always")]
// ----- unicorn/string-content -----
type UnicornStringContent = []|[{
  patterns?: {
    [k: string]: (string | {
      suggest: string
      fix?: boolean
      message?: string
    }) | undefined
  }
}]
// ----- unicorn/switch-case-braces -----
type UnicornSwitchCaseBraces = []|[("always" | "avoid")]
// ----- unicorn/template-indent -----
type UnicornTemplateIndent = []|[{
  indent?: (string | number)
  tags?: string[]
  functions?: string[]
  selectors?: string[]
  comments?: string[]
}]
// ----- unicorn/text-encoding-identifier-case -----
type UnicornTextEncodingIdentifierCase = []|[{
  withDash?: boolean
}]
// ----- use-isnan -----
type UseIsnan = []|[{
  enforceForSwitchCase?: boolean
  enforceForIndexOf?: boolean
}]
// ----- valid-typeof -----
type ValidTypeof = []|[{
  requireStringLiterals?: boolean
}]
// ----- wrap-iife -----
type WrapIife = []|[("outside" | "inside" | "any")]|[("outside" | "inside" | "any"), {
  functionPrototypeMethods?: boolean
}]
// ----- yield-star-spacing -----
type YieldStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
})]
// ----- yml/block-mapping -----
type YmlBlockMapping = []|[(("always" | "never") | {
  singleline?: ("always" | "never" | "ignore")
  multiline?: ("always" | "never" | "ignore")
})]
// ----- yml/block-mapping-colon-indicator-newline -----
type YmlBlockMappingColonIndicatorNewline = []|[("always" | "never")]
// ----- yml/block-mapping-question-indicator-newline -----
type YmlBlockMappingQuestionIndicatorNewline = []|[("always" | "never")]
// ----- yml/block-sequence -----
type YmlBlockSequence = []|[(("always" | "never") | {
  singleline?: ("always" | "never" | "ignore")
  multiline?: ("always" | "never" | "ignore")
})]
// ----- yml/block-sequence-hyphen-indicator-newline -----
type YmlBlockSequenceHyphenIndicatorNewline = []|[("always" | "never")]|[("always" | "never"), {
  nestedHyphen?: ("always" | "never")
  blockMapping?: ("always" | "never")
}]
// ----- yml/file-extension -----
type YmlFileExtension = []|[{
  extension?: ("yaml" | "yml")
  caseSensitive?: boolean
}]
// ----- yml/flow-mapping-curly-newline -----
type YmlFlowMappingCurlyNewline = []|[(("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
})]
// ----- yml/flow-mapping-curly-spacing -----
type YmlFlowMappingCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
}]
// ----- yml/flow-sequence-bracket-newline -----
type YmlFlowSequenceBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- yml/flow-sequence-bracket-spacing -----
type YmlFlowSequenceBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- yml/indent -----
type YmlIndent = []|[number]|[number, {
  indentBlockSequences?: boolean
  indicatorValueIndent?: number
  alignMultilineFlowScalars?: boolean
}]
// ----- yml/key-name-casing -----
type YmlKeyNameCasing = []|[{
  camelCase?: boolean
  PascalCase?: boolean
  SCREAMING_SNAKE_CASE?: boolean
  "kebab-case"?: boolean
  snake_case?: boolean
  ignores?: string[]
}]
// ----- yml/key-spacing -----
type YmlKeySpacing = []|[({
  align?: (("colon" | "value") | {
    on?: ("colon" | "value")
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      on?: ("colon" | "value")
      mode?: ("strict" | "minimum")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    on?: ("colon" | "value")
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- yml/no-irregular-whitespace -----
type YmlNoIrregularWhitespace = []|[{
  skipComments?: boolean
  skipQuotedScalars?: boolean
}]
// ----- yml/no-multiple-empty-lines -----
type YmlNoMultipleEmptyLines = []|[{
  max: number
  maxEOF?: number
  maxBOF?: number
}]
// ----- yml/plain-scalar -----
type YmlPlainScalar = []|[("always" | "never")]|[("always" | "never"), {
  ignorePatterns?: string[]
  overrides?: {
    mappingKey?: ("always" | "never" | null)
  }
}]
// ----- yml/quotes -----
type YmlQuotes = []|[{
  prefer?: ("double" | "single")
  avoidEscape?: boolean
}]
// ----- yml/sort-keys -----
type YmlSortKeys = ([{
  pathPattern: string
  hasProperties?: string[]
  order: ((string | {
    keyPattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minKeys?: number
  allowLineSeparatedGroups?: boolean
}, ...({
  pathPattern: string
  hasProperties?: string[]
  order: ((string | {
    keyPattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minKeys?: number
  allowLineSeparatedGroups?: boolean
})[]] | []|[("asc" | "desc")]|[("asc" | "desc"), {
  caseSensitive?: boolean
  natural?: boolean
  minKeys?: number
  allowLineSeparatedGroups?: boolean
}])
// ----- yml/sort-sequence-values -----
type YmlSortSequenceValues = [{
  pathPattern: string
  order: ((string | {
    valuePattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minValues?: number
}, ...({
  pathPattern: string
  order: ((string | {
    valuePattern?: string
    order?: {
      type?: ("asc" | "desc")
      caseSensitive?: boolean
      natural?: boolean
    }
  })[] | {
    type?: ("asc" | "desc")
    caseSensitive?: boolean
    natural?: boolean
  })
  minValues?: number
})[]]
// ----- yml/spaced-comment -----
type YmlSpacedComment = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
  markers?: string[]
}]
// ----- yoda -----
type Yoda = []|[("always" | "never")]|[("always" | "never"), {
  exceptRange?: boolean
  onlyEquality?: boolean
}]
// ----- zod/array-style -----
type ZodArrayStyle = []|[{
  
  style?: ("function" | "method")
}]
// ----- zod/consistent-import -----
type ZodConsistentImport = []|[{
  
  syntax?: ("namespace" | "named")
}]
// ----- zod/consistent-import-source -----
type ZodConsistentImportSource = []|[{
  
  sources?: [("zod" | "zod/mini" | "zod/v4" | "zod/v4-mini" | "zod/v3"), ...(("zod" | "zod/mini" | "zod/v4" | "zod/v4-mini" | "zod/v3"))[]]
}]
// ----- zod/consistent-object-schema-type -----
type ZodConsistentObjectSchemaType = []|[{
  
  allow?: [("object" | "looseObject" | "strictObject"), ...(("object" | "looseObject" | "strictObject"))[]]
}]
// ----- zod/no-optional-and-default-together -----
type ZodNoOptionalAndDefaultTogether = []|[{
  
  preferredMethod?: ("none" | "default" | "optional")
}]
// ----- zod/require-schema-suffix -----
type ZodRequireSchemaSuffix = []|[{
  
  suffix?: string
}]
// ----- zod/schema-error-property-style -----
type ZodSchemaErrorPropertyStyle = []|[{
  
  selector?: string
  
  example?: string
}]
// Names of all the configs
export type ConfigNames = '2digits:antfu' | '2digits:boolean' | '2digits:comments' | '2digits:css' | '2digits:depend' | '2digits:drizzle' | '2digits:github-actions/setup' | '2digits:github-actions/recommended' | '2digits:graphql' | '2digits:ignores' | '2digits:gitignore' | '2digits:javascript' | '2digits:jsdoc' | '2digits:jsonc/base' | '2digits:jsonc/base' | '2digits:jsonc/json' | '2digits:jsonc/jsonc' | '2digits:jsonc/json5' | '2digits:jsonc/package.json' | '2digits:jsonc/tsconfig.json' | '2digits:jsonc/prettier' | '2digits:jsonc/prettier' | '2digits:jsonc/prettier' | '2digits:markdown/setup' | '2digits:markdown/processor' | '2digits:markdown/parser' | '2digits:markdown/rules' | '2digits:markdown/disables' | '2digits:next/setup' | '2digits:next/rules' | '2digits:next/proxy' | '2digits:node' | '2digits:pnpm/package-json' | '2digits:pnpm/pnpm-workspace-yaml' | '2digits:prettier' | '2digits:react/setup' | '2digits:react/rules' | '2digits:regexp' | '2digits:sonar' | '2digits:storybook/setup' | '2digits:storybook/rules' | '2digits:storybook/disables' | '2digits:storybook/config' | '2digits:tailwind' | '2digits:tanstack-query' | '2digits:tanstack-router' | '2digits:toml' | '2digits:turbo' | '2digits:typescript/setup' | '2digits:typescript/rules' | '2digits:typescript/disables/dts' | '2digits:typescript/disables/test' | '2digits:typescript/disables/cjs' | '2digits:unicorn' | '2digits:yaml/setup' | '2digits:yaml/base' | '2digits:yaml/recommended' | '2digits:yaml/standard' | '2digits:yaml/prettier' | '2digits:zod'
