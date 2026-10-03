import { Schema } from 'effect';
import { HttpApiEndpoint } from 'effect/unstable/httpapi';

HttpApiEndpoint.get('me', '/me', { headers: { 'X-Api-Key': Schema.String } });
HttpApiEndpoint.post('me', '/me', { headers: { Foo: Schema.String, foo: Schema.String } });
