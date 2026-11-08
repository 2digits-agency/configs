import { preferDataMatch } from '../../../src/rules/effect/prefer-data-match';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Exit from 'effect/Exit'
  import * as Option from 'effect/Option'
  const label = Exit.match(exit, { onFailure: () => 'failed', onSuccess: () => 'ok' })
  function* warn(user: Option.Option<User>) {
    if (Option.isNone(user)) {
      yield* Effect.logWarning('missing user')
    }
  }
  function first(option: Option.Option<number>) {
    if (Option.isSome(option)) {
      log(option.value)
    }
    return 0
  }
  function* fromExit(exit: Exit.Exit<number>) {
    if (Exit.isFailure(exit)) {
      return yield* exit
    }
    return exit.value
  }
  function guard(option: Option.Option<number>) {
    if (Option.isNone(option)) {
      return 0
    }
    log(option.value)
    return option.value
  }
  const local = { isSome: (value: unknown) => value !== undefined }
  local.isSome(value) ? 1 : 2
  isSome(value) ? 1 : 2
`;

for (const invalid of [
  `
    import * as Exit from 'effect/Exit'
    const label = Exit.isSuccess(exit) ? exit.value : 'failed'
  `,
  `
    import { Result } from 'effect'
    const label = !Result.isFailure(result) ? result.success : result.failure.message
  `,
  `
    import * as Option from 'effect/Option'
    function name(user: Option.Option<User>) {
      if (Option.isSome(user)) {
        return user.value.name
      } else {
        return 'anonymous'
      }
    }
  `,
  `
    import * as O from 'effect/Option'
    function name(user: O.Option<User>) {
      if (O.isNone(user)) return 'anonymous'
      return user.value.name
    }
  `,
]) {
  testRule('prefer-data-match', preferDataMatch, { valid, invalid, messageId: 'preferMatch' });
}
