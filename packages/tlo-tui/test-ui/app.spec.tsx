import { expect, test } from 'bun:test';

import { act } from 'react';

import * as RegistryContext from '@effect/atom-react/RegistryContext';
import { testRender } from '@opentui/react/test-utils';
import * as Effect from 'effect/Effect';

import * as AppLayer from '../src/app/AppLayer.js';
import { unsafeLocalDate } from '../src/domain/time.js';
import { App } from '../src/ui/App.js';
import * as Atoms from '../src/ui/atoms.js';
import { AtomsContext } from '../src/ui/context.js';

test('renders demo week and keyboard navigation without losing the safety banner', () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const today = unsafeLocalDate('2026-10-13');

      const atoms = Atoms.makeAtoms(
        AppLayer.makeAppLayer({
          source: 'demo',
          today,
          url: 'http://127.0.0.1:4790/mcp',
          keyFile: '',
          writeMode: 'direct-writes',
          requestDirectory: '/tmp/tlo-ui-test-requests',
          demoFault: undefined,
        }),
        today,
      );

      const setup = yield* Effect.tryPromise((_signal) =>
        testRender(
          <RegistryContext.RegistryProvider>
            <AtomsContext value={atoms}>
              <App />
            </AtomsContext>
          </RegistryContext.RegistryProvider>,
          { width: 148, height: 52 },
        ),
      );

      const context = yield* Effect.context();

      try {
        yield* Effect.tryPromise((_signal) => act(() => Effect.runPromiseWith(context)(Effect.sleep('100 millis'))));

        yield* Effect.tryPromise((_signal) => setup.renderOnce());

        const frame = setup.captureCharFrame();

        expect(frame).toContain('DEMO-DATA');

        expect(frame).toContain('Zoeken');

        expect(frame).toContain('Development');

        act(() => setup.mockInput.pressKey('2'));

        yield* Effect.tryPromise((_signal) => setup.renderOnce());

        act(() => setup.mockInput.pressKey('/'));

        yield* Effect.tryPromise((_signal) => setup.renderOnce());

        act(() => setup.mockInput.pressKey('RETURN'));

        yield* Effect.tryPromise((_signal) => act(() => Effect.runPromiseWith(context)(Effect.sleep('100 millis'))));

        yield* Effect.tryPromise((_signal) => setup.renderOnce());

        expect(setup.captureCharFrame()).toContain('Development');

        expect(setup.captureCharFrame()).not.toContain('Geen treffers');

        act(() => {
          setup.mockInput.pressKey('7');
        });

        yield* Effect.tryPromise((_signal) => setup.renderOnce());

        expect(setup.captureCharFrame()).toContain('GetTimesheetWeek');

        expect(setup.captureCharFrame()).toContain('DEMO-DATA');
      } finally {
        act(() => setup.renderer.destroy());
      }
    }),
  ));
