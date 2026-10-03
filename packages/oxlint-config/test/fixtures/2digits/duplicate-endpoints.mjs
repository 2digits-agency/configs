import { HttpApiEndpoint as E, HttpApiGroup as G } from 'effect/http-api';

export const Users = G.make('users')
  .add(E.get('list', '/users'))
  .add(E.get('copy', '/users'));
