import type * as OAuth from '@yielded/oauth/OAuth';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

export const ORBIT_ORIGIN = 'https://api.orbit.teamleader.eu';

export const ORBIT_RESOURCE = `${ORBIT_ORIGIN}/mcp`;

const Secret = Schema.String.check(Schema.isMinLength(1)).pipe(Schema.RedactedFromValue);

export const Session = Schema.Struct({
  clientId: Schema.String.check(Schema.isMinLength(1)),
  clientSecret: Secret.pipe(Schema.optionalKey),
  accessToken: Secret,
  refreshToken: Secret.pipe(Schema.optionalKey),
  expiresAt: Schema.Finite.pipe(Schema.optionalKey),
});

export interface Session extends Schema.Schema.Type<typeof Session> {}

export class OrbitAuthError extends Schema.TaggedError<OrbitAuthError, { readonly brand: unique symbol }>()(
  'OrbitAuthError',
  {
    message: Schema.String,
  },
) {}

/**
 * An omitted rotated refresh token preserves the previous grant, not its expiry.
 *
 * @param client
 * @param tokens
 * @param now
 */
export function updateSession(
  client: Pick<Session, 'clientId' | 'clientSecret' | 'refreshToken'>,
  tokens: OAuth.TokenSet,
  now: number,
): Session {
  const refreshToken = tokens.refreshToken ?? client.refreshToken;

  return {
    clientId: client.clientId,
    ...(client.clientSecret === undefined ? {} : { clientSecret: client.clientSecret }),
    accessToken: tokens.accessToken,
    ...(refreshToken === undefined ? {} : { refreshToken }),
    ...(tokens.expiresIn === undefined ? {} : { expiresAt: now + tokens.expiresIn * 1000 }),
  };
}

export function needsRefresh(session: Session, now: number): boolean {
  return session.expiresAt === undefined || session.expiresAt <= now + 60_000;
}

export function authentication(session: Pick<Session, 'clientSecret'>): OAuth.Authentication {
  return session.clientSecret === undefined
    ? { method: 'none', publicClient: true }
    : { method: 'client_secret_post', secret: session.clientSecret.pipe(Redacted.value, Redacted.make) };
}
