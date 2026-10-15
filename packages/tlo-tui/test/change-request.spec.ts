import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as Path from 'effect/Path';
import * as Schema from 'effect/Schema';
import { describe, expect, it } from 'vite-plus/test';

import { makeDemoMcpLayer } from '../src/demo/DemoMcp.js';
import { parseTicketId } from '../src/domain/ids.js';
import { unsafeLocalDate } from '../src/domain/time.js';
import {
  ChangeRequestStore,
  type DraftResult,
  correctionEditFrom,
  draftCorrection,
  draftCustomerReply,
  makeChangeRequestStoreLayer,
} from '../src/flows/ChangeRequest.js';
import { Orbit, makeOrbitLayer } from '../src/orbit/Orbit.js';

const today = unsafeLocalDate('2026-10-13');

function readyDraft(draft: DraftResult) {
  return Match.value(draft).pipe(
    Match.tag('Ready', (value) => value),
    Match.orElse((value) => {
      throw new Error(`Invalid draft: ${value.issues.join(', ')}`);
    }),
  );
}

describe('approval-only change requests', () => {
  it('persists exact correction arguments and the before state privately, without executing the correction', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path = yield* Path.Path;

        const temporary = yield* fs.makeTempDirectoryScoped({ prefix: 'tlo-tui-contract-' });

        const directory = path.join(temporary, 'requests');

        const store = makeChangeRequestStoreLayer({ directory, source: 'demo' });

        const orbit = makeOrbitLayer({ source: 'demo', writeMode: 'direct-writes' }).pipe(
          Layer.provide(makeDemoMcpLayer({ today })),
        );

        const saved = yield* Effect.gen(function* () {
          const api = yield* Orbit;

          const week = yield* api.timesheetWeek(today);

          const row = Opt.getOrThrow(
            Opt.fromUndefinedOr(
              week.entries.filter((entry) => entry.date === today).find((entry) => entry.start === '09:15'),
            ),
          );

          const before = yield* api.timeEntry(row.id);

          const draft = readyDraft(
            draftCorrection(before, {
              ...correctionEditFrom(before),
              date: '2026-10-14',
              start: '16:43',
              billable: 'non-billable',
            }),
          );

          expect(draft.request.arguments).toStrictEqual({
            entryId: before.id,
            date: '2026-10-14 16:43',
            billable: 'false',
          });

          const requests = yield* ChangeRequestStore;

          const file = yield* requests.save(draft.request);

          expect(yield* api.timeEntry(before.id)).toStrictEqual(before);

          return { file, request: draft.request };
        }).pipe(Effect.provide(Layer.mergeAll(store, orbit)));

        expect(path.dirname(saved.file)).toBe(directory);

        const document = yield* Schema.decodeEffect(
          Schema.fromJsonString(
            Schema.Struct({
              status: Schema.String,
              source: Schema.String,
              kind: Schema.String,
              tool: Schema.String,
              arguments: Schema.JsonObject,
              before: Schema.JsonObject,
              readback: Schema.Array(Schema.String),
              approval: Schema.String,
              createdAt: Schema.String,
            }),
          ),
        )(yield* fs.readFileString(saved.file));

        expect(document).toMatchObject({
          status: 'concept-niet-uitgevoerd',
          source: 'demo',
          kind: 'correction',
          tool: 'UpdateTimeEntry',
          arguments: saved.request.arguments,
          before: saved.request.before,
          readback: saved.request.readback,
        });

        expect({
          approval: document.approval,
          timestampValid: Opt.isSome(DateTime.make(document.createdAt)),
          directoryMode: (yield* fs.stat(directory)).mode & 0o777,
          fileMode: (yield* fs.stat(saved.file)).mode & 0o777,
        }).toStrictEqual({
          approval: expect.stringMatching(/NIET uitgevoerd.*browser-approval/s) as unknown,
          timestampValid: true,
          directoryMode: 0o700,
          fileMode: 0o600,
        });
      }).pipe(Effect.scoped, Effect.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer))),
    ));

  it('drafts a customer-visible reply with explicit follow-up but no implicit logged time or ticket mutation', () =>
    Effect.runPromise(
      Effect.gen(function* () {
        const orbit = yield* Orbit;

        const row = Opt.getOrThrow(Opt.fromUndefinedOr((yield* orbit.tickets({ state: 'CLOSED' }))[0]));

        const ticketId = Opt.getOrThrow(parseTicketId(row.ticketId));

        const before = yield* orbit.ticketDetail(ticketId);

        const comments = yield* orbit.ticketComments(ticketId);

        const input = {
          message: '  Please check the reset email  ',
          waitForClient: true,
          followUpAction: 'REMINDER' as const,
          followUpDate: '',
        };

        expect(draftCustomerReply(before, input)._tag).toBe('Invalid');

        const draft = readyDraft(draftCustomerReply(before, { ...input, followUpDate: '2026-10-19' }));

        expect(draft.request.arguments).toStrictEqual({
          ticketId: before.ticketId,
          message: 'Please check the reset email',
          waitForClient: true,
          followUpAction: 'REMINDER',
          followUpDate: '2026-10-19',
        });

        expect(draft.request.sideEffects.join(' ')).toContain('heropent');

        expect(yield* orbit.ticketDetail(ticketId)).toStrictEqual(before);

        expect(yield* orbit.ticketComments(ticketId)).toStrictEqual(comments);
      }).pipe(
        Effect.provide(
          makeOrbitLayer({ source: 'demo', writeMode: 'direct-writes' }).pipe(
            Layer.provide(makeDemoMcpLayer({ today })),
          ),
        ),
      ),
    ));
});
