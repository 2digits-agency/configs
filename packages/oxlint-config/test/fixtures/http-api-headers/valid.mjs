import { Schema } from 'effect';
import { HttpApiEndpoint } from 'effect/unstable/httpapi';

HttpApiEndpoint.get('me', '/me', { headers: { 'x-api-key': Schema.String } });
HttpApiEndpoint.post('me', '/me', { headers: { foo: Schema.String } });
new Headers({ 'X-Api-Key': 'present' }).get('X-Api-Key');
