import * as HttpClient from 'effect/http/HttpClient';

export const retry = HttpClient.retryTransient({
  retryOn: 'errors-only',
  times: 2,
  while: () => false,
});
