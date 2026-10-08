// Native timing-safe equality is intentional at the HTTP authentication boundary.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { homedir } from 'node:os';

import * as ByteSize from 'effect/ByteSize';
import * as Effect from 'effect/Effect';
import * as FileSystem from 'effect/FileSystem';
import * as Layer from 'effect/Layer';
import * as Path from 'effect/Path';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import * as McpProtocol from 'effect/ai/McpProtocol';
import * as McpServer from 'effect/ai/McpServer';
import { HttpIncomingMessage, HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http';

import { OrbitClient } from '../mcp/OrbitClient.js';
import { OrbitToolsLive } from '../mcp/proxy.js';

export const KEY_FILE = `${homedir()}/.config/2digits/tlo-mcp/gateway.key`;

const GatewayKey = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)).pipe(Schema.RedactedFromValue);

export class GatewayError extends Schema.TaggedError<GatewayError>()('GatewayError', {
  message: Schema.String,
}) {}

/**
 * A separate gateway credential, never an Orbit token. Existing keys are not replaced.
 */
export const loadGatewayKey = Effect.fn('Gateway.loadKey')(
  function* (file: string) {
    const fs = yield* FileSystem.FileSystem;

    const path = yield* Path.Path;

    const directory = path.dirname(file);

    yield* fs.makeDirectory(directory, { recursive: true, mode: 0o700 });

    yield* fs.chmod(directory, 0o700);

    yield* fs
      .writeFileString(file, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 })
      .pipe(Effect.catchReason('PlatformError', 'AlreadyExists', () => Effect.void));

    const info = yield* fs.stat(file);

    if (info.type !== 'File' || (info.mode & 0o077) !== 0) {
      return yield* GatewayError.make({ message: 'Gateway key must be a private file (chmod 600).' });
    }

    return yield* fs.readFileString(file).pipe(Effect.flatMap(Schema.decodeEffect(GatewayKey)));
  },
  Effect.mapError(() =>
    GatewayError.make({ message: 'Cannot load private gateway key. Check its permissions and format.' }),
  ),
);

/**
 * Authenticate before parsing or dispatching MCP, including unsupported methods and paths.
 *
 * @param key
 */
function gatewayAuthentication(key: Redacted.Redacted) {
  const expected = createHash('sha256')
    .update(`Bearer ${Redacted.value(key)}`)
    .digest();

  return HttpRouter.middleware(
    (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;

        const received = createHash('sha256')
          .update(request.headers.authorization ?? '')
          .digest();

        if (!timingSafeEqual(expected, received)) {
          return HttpServerResponse.empty({
            status: 401,
            headers: { 'www-authenticate': 'Bearer', 'cache-control': 'no-store' },
          });
        }

        if (request.headers.origin !== undefined) {
          return HttpServerResponse.empty({ status: 403, headers: { 'cache-control': 'no-store' } });
        }

        return yield* httpEffect.pipe(
          Effect.provideService(HttpIncomingMessage.MaxBodySize, ByteSize.bytes(1024 * 1024)),
          Effect.map((response) => HttpServerResponse.setHeader(response, 'cache-control', 'no-store')),
        );
      }),
    { global: true },
  );
}

export function gatewayRoutes(key: Redacted.Redacted) {
  const mcp = Layer.unwrap(
    Effect.gen(function* () {
      const upstream = yield* OrbitClient;

      return OrbitToolsLive.pipe(
        Layer.provide(
          McpServer.layerHttp({
            name: 'tlo-mcp',
            version: '1.0.0',
            instructions: upstream.instructions,
            path: '/mcp',
            protocols: [McpProtocol.v2025_11_25, McpProtocol.v2025_06_18, McpProtocol.v2025_03_26],
          }),
        ),
      );
    }),
  );

  return Layer.merge(mcp, gatewayAuthentication(key));
}
