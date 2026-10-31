// Native timing-safe equality is intentional at the HTTP authentication boundary.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { timingSafeEqual } from 'node:crypto';
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
import * as Digest from 'effect/crypto/Digest';
import * as SecureRandom from 'effect/crypto/SecureRandom';
import * as Hex from 'effect/encoding/Hex';
import * as HttpIncomingMessage from 'effect/http/HttpIncomingMessage';
import * as HttpRouter from 'effect/http/HttpRouter';
import * as HttpServerRequest from 'effect/http/HttpServerRequest';
import * as HttpServerResponse from 'effect/http/HttpServerResponse';

import { OrbitClient } from '../mcp/OrbitClient.js';
import { OrbitToolsLive } from '../mcp/proxy.js';

export const KEY_FILE = `${homedir()}/.config/2digits/tlo-mcp/gateway.key`;

const MAX_BODY_SIZE = ByteSize.mebibytes(1);

const unauthorized = HttpServerResponse.empty({
  status: 401,
  headers: { 'www-authenticate': 'Bearer', 'cache-control': 'no-store' },
});

const forbidden = HttpServerResponse.empty({ status: 403, headers: { 'cache-control': 'no-store' } });

const encoder = new TextEncoder();

const GatewayKey = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/)).pipe(Schema.RedactedFromValue);

export class GatewayError extends Schema.TaggedError<GatewayError, { readonly brand: unique symbol }>()(
  'GatewayError',
  {
    message: Schema.String,
  },
) {}

/**
 * A separate gateway credential, never an Orbit token. Existing keys are not replaced.
 */
export const loadGatewayKey = Effect.fn('Gateway.loadKey')(
  function* (file: string) {
    const fs = yield* FileSystem.FileSystem;

    const random = yield* SecureRandom.SecureRandom;

    const path = yield* Path.Path;

    const directory = path.dirname(file);

    yield* fs.makeDirectory(directory, { recursive: true, mode: 0o700 });

    yield* fs.chmod(directory, 0o700);

    const bytes = yield* random.randomBytes(32);

    yield* fs
      .writeFileString(file, Hex.encode(bytes), { flag: 'wx', mode: 0o600 })
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
 * Hash before comparing so both sides of the equality check have the same length.
 *
 * @param digest
 * @param value
 */
function sha256(digest: Digest.Digest['Service'], value: string) {
  return digest.digest(Digest.sha256, encoder.encode(value));
}

/**
 * Authenticate before parsing or dispatching MCP, including unsupported methods and paths.
 *
 * @param key
 */
function gatewayAuthentication(key: Redacted.Redacted) {
  return Layer.unwrap(
    Effect.gen(function* () {
      // Resolve Digest when the layer is built: request handlers do not receive the layer's services.
      const digest = yield* Digest.Digest;

      const expected = yield* sha256(digest, `Bearer ${Redacted.value(key)}`);

      return HttpRouter.middleware(
        (httpEffect) =>
          Effect.gen(function* () {
            const request = yield* HttpServerRequest.HttpServerRequest;

            const received = yield* sha256(digest, request.headers.authorization ?? '');

            if (!timingSafeEqual(expected, received)) {
              return unauthorized;
            }

            if (request.headers.origin !== undefined) {
              return forbidden;
            }

            return yield* httpEffect.pipe(
              Effect.provideService(HttpIncomingMessage.MaxBodySize, MAX_BODY_SIZE),
              Effect.map((response) => HttpServerResponse.setHeader(response, 'cache-control', 'no-store')),
            );
          }),
        { global: true },
      );
    }),
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
