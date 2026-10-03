/* oxlint-disable unicorn/no-null -- JSON null is a required malformed-success fixture. */
/* eslint-disable unicorn/no-null -- JSON null is a required malformed-success fixture. */
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vite-plus/test';

interface Contact {
  readonly id: string;
  readonly email: string;
}

interface Probe {
  baseUrl: string;
  headers: () => Record<string, string>;
  http: { request: (url: string) => Promise<Response> };
  contactByEmail: (email: string) => Promise<Contact | null>;
}

// Unchanged helper and consumer bodies from BillyBird db538e3, ExternalIntegrations.ts:87–97 and 124–133.
const source = stripTypeScriptTypes(readFileSync(new URL('fixtures/json-boundary.txt', import.meta.url), 'utf8'));
const email = 'demo@example.test';

function isContact(value: unknown): value is Contact {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'email' in value &&
    typeof value.email === 'string'
  );
}

function isContactsResponse(value: unknown): value is { contacts: Array<Contact> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'contacts' in value &&
    Array.isArray(value.contacts) &&
    value.contacts.every((contact) => isContact(contact))
  );
}

async function validatedJson(_provider: string, response: Response): Promise<{ contacts: Array<Contact> }> {
  const value: unknown = await response.json();

  if (!isContactsResponse(value)) {
    throw new Error('Invalid contacts response');
  }

  return value;
}

function probe(body: unknown, validated: boolean): Probe {
  const Constructor = runInNewContext(`${source}\n${validated ? 'json = validatedJson;' : ''}\nMailBlueProbe`, {
    Response,
    IntegrationError: { make: () => new Error('HTTP error') },
    validatedJson,
  }) as new () => Probe;
  const adapter = new Constructor();

  adapter.baseUrl = 'https://example.test/';
  adapter.headers = () => ({});
  adapter.http = { request: () => Promise.resolve(Response.json(body)) };

  return adapter;
}

describe('json boundary malformed-success demo (no provider calls)', () => {
  it.for([false, true])('preserves valid and empty contacts (validated=%s)', async (validated) => {
    await expect(probe({ contacts: [{ id: '7', email }] }, validated).contactByEmail(email)).resolves.toStrictEqual({
      id: '7',
      email,
    });
    await expect(probe({ contacts: [] }, validated).contactByEmail(email)).resolves.toBeNull();
  });

  it('reproduces unchecked malformed success at the consumer', async () => {
    await expect(probe({}, false).contactByEmail(email)).rejects.toThrow(
      "Cannot read properties of undefined (reading '0')",
    );
  });

  it.for([{}, null, { contacts: [{ id: 7, email }] }])(
    'rejects malformed success before consumer field access: %j',
    async (body) => {
      await expect(probe(body, true).contactByEmail(email)).rejects.toThrow('Invalid contacts response');
    },
  );
});
