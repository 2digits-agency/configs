#!/usr/bin/env bun
import { homedir } from 'node:os';

import * as RegistryContext from '@effect/atom-react/RegistryContext';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import { CliRenderEvents, createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Command from 'effect/cli/Command';
import * as Flag from 'effect/cli/Flag';

import * as AppLayer from './app/AppLayer.js';
import { PREFERRED_ZONE, localDateAt, parseLocalDate } from './domain/time.js';
import { DEFAULT_KEY_FILE } from './mcp/GatewayKey.js';
import { DEFAULT_GATEWAY_URL } from './mcp/McpClient.js';
import { App } from './ui/App.js';
import * as Atoms from './ui/atoms.js';
import { AtomsContext } from './ui/context.js';

const TaggedErrorClass = Schema.TaggedError;

class CliError extends TaggedErrorClass<CliError>()('CliError', { message: Schema.String }) {}

function isLocalEndpoint(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
      url.username === '' &&
      url.password === ''
    );
  } catch {
    return false;
  }
}

const launch = Effect.fn('Tlo.launch')(function* (config: AppLayer.AppConfig) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return yield* CliError.make({ message: 'TLO vereist een interactieve terminal. Gebruik --help voor startopties.' });
  }

  const renderer = yield* Effect.acquireRelease(
    Effect.tryPromise((_signal) => createCliRenderer({ exitOnCtrlC: false })),
    (renderer) => Effect.sync(() => renderer.destroy()),
  );

  const atoms = Atoms.makeAtoms(AppLayer.makeAppLayer(config), config.today);

  createRoot(renderer).render(
    <RegistryContext.RegistryProvider>
      <AtomsContext value={atoms}>
        <App />
      </AtomsContext>
    </RegistryContext.RegistryProvider>,
  );

  yield* Effect.callback<boolean>((resume) => {
    function done() {
      resume(Effect.succeed(true));
    }

    renderer.once(CliRenderEvents.DESTROY, done);

    return Effect.sync(() => renderer.off(CliRenderEvents.DESTROY, done));
  });
});

const command = Command.make(
  'tlo',
  {
    demo: Flag.Boolean('demo').pipe(Flag.withDefault(false)),
    readOnly: Flag.Boolean('read-only').pipe(Flag.withDefault(false)),
    directWrites: Flag.Boolean('direct-writes').pipe(Flag.withDefault(false)),
    date: Flag.String('date').pipe(
      Flag.filterMap(parseLocalDate, () => 'Gebruik een geldige datum als YYYY-MM-DD.'),
      Flag.optional,
    ),
    url: Flag.String('url').pipe(
      Flag.filterMap(
        (value) => (isLocalEndpoint(value) ? Opt.some(value) : Opt.none()),
        () => 'Gebruik een lokale HTTP loopback-MCP-route.',
      ),
      Flag.withDefault(DEFAULT_GATEWAY_URL),
    ),
    keyFile: Flag.String('key-file').pipe(Flag.withDefault(DEFAULT_KEY_FILE)),
    requestDirectory: Flag.String('request-directory').pipe(
      Flag.withDefault(`${homedir()}/.config/2digits/tlo-tui/requests`),
    ),
    demoFault: Flag.Literals('demo-fault', ['timeout']).pipe(Flag.optional),
  },
  (options) =>
    Effect.gen(function* () {
      if (options.readOnly && options.directWrites) {
        return yield* CliError.make({ message: 'Kies --read-only of --direct-writes, niet beide.' });
      }

      if (!options.demo && Opt.isSome(options.demoFault)) {
        return yield* CliError.make({ message: '--demo-fault vereist --demo.' });
      }

      const now = yield* Clock.currentTimeMillis;

      const today = Opt.match(options.date, {
        onNone: () => localDateAt(now, PREFERRED_ZONE),
        onSome: (value) => value,
      });

      yield* launch({
        source: options.demo ? 'demo' : 'live',
        url: options.url,
        keyFile: options.keyFile,
        writeMode: options.readOnly || (!options.demo && !options.directWrites) ? 'read-only' : 'direct-writes',
        requestDirectory: options.requestDirectory,
        demoFault: Opt.getOrUndefined(options.demoFault),
        today,
      }).pipe(Effect.scoped);
    }),
);

// The CLI owns service lifetimes and restores the terminal on exit or interruption.
// oxlint-disable-next-line effecttsgo/strict-effect-provide -- process entry point
Command.runWith(command, { version: '0.0.0' })(process.argv.slice(2)).pipe(
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
