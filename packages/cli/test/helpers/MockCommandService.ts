import * as Array from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import type * as ChildProcess from 'effect/unstable/process/ChildProcess';
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner';

/**
 * Represents a command that was executed during a test.
 */
interface ExecutedCommand {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
  readonly shell: boolean | string;
}

function createMockProcess(): ChildProcessSpawner.ChildProcessHandle {
  return ChildProcessSpawner.makeHandle({
    pid: ChildProcessSpawner.ProcessId(12_345),
    exitCode: Effect.succeed(ChildProcessSpawner.ExitCode(0)),
    isRunning: Effect.succeed(false),
    kill: () => Effect.void,
    stdin: Sink.drain,
    stdout: Stream.empty,
    stderr: Stream.empty,
    all: Stream.empty,
    getInputFd: () => Sink.drain,
    getOutputFd: () => Stream.empty,
    unref: Effect.succeed(Effect.void),
  });
}

/**
 * A spy/intercept implementation of ChildProcessSpawner for testing. Records all commands that would be executed and
 * returns fake successful results.
 */
export class MockCommandExecutor extends Context.Service<
  MockCommandExecutor,
  {
    readonly executor: ChildProcessSpawner.ChildProcessSpawner['Service'];
    readonly getExecuted: Effect.Effect<Array<ExecutedCommand>>;
    readonly clear: Effect.Effect<void>;
  }
>()('@2digits/cli/test/helpers/MockCommandService/MockCommandExecutor', {
  make: Effect.gen(function* () {
    const executed = yield* Ref.make<Array<ExecutedCommand>>([]);

    const recordCommand = Effect.fn('MockCommandExecutor.recordCommand')(function* (command: ChildProcess.Command) {
      if (command._tag === 'StandardCommand') {
        yield* Ref.update(executed, (cmds) =>
          Array.append(cmds, {
            command: command.command,
            args: command.args,
            shell: command.options.shell ?? false,
          }),
        );
      }
    });

    return MockCommandExecutor.of({
      executor: ChildProcessSpawner.make((command) =>
        Effect.gen(function* () {
          yield* recordCommand(command);

          return createMockProcess();
        }),
      ),
      /**
       * Get all commands that were executed.
       */
      getExecuted: Ref.get(executed),
      /**
       * Clear the list of executed commands.
       */
      clear: Ref.set(executed, []),
    });
  }),
}) {
  /**
   * Layer that provides an isolated command-execution recorder.
   */
  static readonly Default = Layer.effect(MockCommandExecutor, MockCommandExecutor.make);
}

/**
 * Layer that provides the mock ChildProcessSpawner.
 */
export const MockCommandExecutorLayer = Layer.effect(
  ChildProcessSpawner.ChildProcessSpawner,
  Effect.gen(function* () {
    const mock = yield* MockCommandExecutor;

    return mock.executor;
  }),
).pipe(Layer.provide(MockCommandExecutor.Default));

/**
 * Helper to get the executed commands in tests.
 */
export const getExecutedCommands = MockCommandExecutor.pipe(Effect.flatMap((mock) => mock.getExecuted));

/**
 * Helper to clear executed commands in tests.
 */
export const clearExecutedCommands = MockCommandExecutor.pipe(Effect.flatMap((mock) => mock.clear));
