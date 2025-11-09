import type * as Command from '@effect/platform/Command';
import * as CommandExecutor from '@effect/platform/CommandExecutor';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Inspectable from 'effect/Inspectable';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';

/**
 * Represents a command that was executed during a test
 */
interface ExecutedCommand {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
  readonly shell: boolean | string;
}

/**
 * A spy/intercept implementation of CommandExecutor for testing.
 * Records all commands that would be executed and returns fake successful results.
 */
export class MockCommandExecutor extends Effect.Service<MockCommandExecutor>()('MockCommandExecutor', {
  effect: Effect.gen(function* () {
    const executed = yield* Ref.make<Array<ExecutedCommand>>([]);

    const recordCommand = (command: Command.Command): Effect.Effect<void> =>
      Effect.gen(function* () {
        if (command._tag === 'StandardCommand') {
          yield* Ref.update(executed, (cmds) =>
            Array.append(cmds, {
              command: command.command,
              args: command.args,
              shell: command.shell,
            }),
          );
        }
      });

    const createMockProcess = (_command: Command.Command): CommandExecutor.Process => ({
      [CommandExecutor.ProcessTypeId]: CommandExecutor.ProcessTypeId,
      pid: 12_345 as CommandExecutor.ProcessId,
      exitCode: Effect.succeed(0 as CommandExecutor.ExitCode),
      isRunning: Effect.succeed(false),
      kill: () => Effect.void,
      stderr: Stream.empty,
      stdin: Sink.drain,
      stdout: Stream.empty,
      [Symbol.for('nodejs.util.inspect.custom')]() {
        return 'MockProcess';
      },
      toJSON() {
        return { _tag: 'MockProcess', pid: 12_345 };
      },
      [Inspectable.NodeInspectSymbol](): unknown {
        throw new Error('Function not implemented.');
      },
    });

    const executor: CommandExecutor.CommandExecutor = {
      [CommandExecutor.TypeId]: CommandExecutor.TypeId,
      exitCode: (command) =>
        Effect.gen(function* () {
          yield* recordCommand(command);

          return 0 as CommandExecutor.ExitCode;
        }),
      start: (command) =>
        Effect.gen(function* () {
          yield* recordCommand(command);

          return createMockProcess(command);
        }),
      string: (command, _encoding) =>
        Effect.gen(function* () {
          yield* recordCommand(command);

          return '';
        }),
      lines: (command, _encoding) =>
        Effect.gen(function* () {
          yield* recordCommand(command);

          return [];
        }),
      stream: (command) => {
        return Stream.fromEffect(recordCommand(command)).pipe(Stream.flatMap(() => Stream.empty));
      },
      streamLines: (command, _encoding) => {
        return Stream.fromEffect(recordCommand(command)).pipe(Stream.flatMap(() => Stream.empty));
      },
    };

    return {
      executor,
      /**
       * Get all commands that were executed
       */
      getExecuted: Ref.get(executed),
      /**
       * Clear the list of executed commands
       */
      clear: Ref.set(executed, []),
    } as const;
  }),
  dependencies: [],
}) {}

/**
 * Layer that provides the mock CommandExecutor
 */
export const MockCommandExecutorLayer = Layer.effect(
  CommandExecutor.CommandExecutor,
  Effect.gen(function* () {
    const mock = yield* MockCommandExecutor;

    return mock.executor;
  }),
).pipe(Layer.provide(MockCommandExecutor.Default));

/**
 * Helper to get the executed commands in tests
 */
export const getExecutedCommands = MockCommandExecutor.pipe(Effect.flatMap((mock) => mock.getExecuted));

/**
 * Helper to clear executed commands in tests
 */
export const clearExecutedCommands = MockCommandExecutor.pipe(Effect.flatMap((mock) => mock.clear));
