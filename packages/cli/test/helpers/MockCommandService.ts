/* eslint-disable react-extra/rules-of-hooks -- Effect service accessors are not React hooks. */
import * as Arr from 'effect/Array';
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
    stderr: Stream.empty,
    stdin: Sink.drain,
    stdout: Stream.empty,
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
export class MockCommandExecutor extends Context.Service<MockCommandExecutor>()(
  '@2digits/cli/test/helpers/MockCommandService/MockCommandExecutor',
  {
    make: Effect.gen(function* () {
      const executed = yield* Ref.make<Array<ExecutedCommand>>([]);

      const recordCommand = Effect.fn('MockCommandExecutor.recordCommand')(function* (command: ChildProcess.Command) {
        if (command._tag === 'StandardCommand') {
          yield* Ref.update(executed, (commands) =>
            Arr.append(commands, {
              command: command.command,
              args: command.args,
              shell: command.options.shell ?? false,
            }),
          );
        }
      });

      const spawner = ChildProcessSpawner.make(
        Effect.fn('MockCommandExecutor.spawn')(function* (command) {
          yield* recordCommand(command);

          return createMockProcess();
        }),
      );

      return {
        spawner,
        getExecuted: Ref.get(executed),
        clear: Ref.set(executed, []),
      } as const;
    }),
  },
) {
  static readonly Default = Layer.effectContext(
    Effect.gen(function* () {
      const mock = yield* MockCommandExecutor.make;

      return Context.empty().pipe(
        Context.add(MockCommandExecutor, mock),
        Context.add(ChildProcessSpawner.ChildProcessSpawner, mock.spawner),
      );
    }),
  );
}

/**
 * Helper to get the executed commands in tests.
 */
export const getExecutedCommands = MockCommandExecutor.use((mock) => mock.getExecuted);

/**
 * Helper to clear executed commands in tests.
 */
export const clearExecutedCommands = MockCommandExecutor.use((mock) => mock.clear);
