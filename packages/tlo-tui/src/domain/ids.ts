import type * as Brand from 'effect/Brand';
import * as Opt from 'effect/Option';

/**
 * Orbit api_ids are 15 characters: a two-letter type prefix plus 13 alphanumerics. Visible numbers (ticket `9116`,
 * project `2050`) are different values and are never passed where an api_id is required.
 */
const API_ID = /^[A-Z]{2}[A-Z0-9]{13}$/;

export type TimeEntryId = string & Brand.Brand<'TimeEntryId'>;

export type TaskId = string & Brand.Brand<'TaskId'>;

export type TicketId = string & Brand.Brand<'TicketId'>;

function prefixed<T extends string>(input: string, prefix: string): Opt.Option<T> {
  const value = input.trim();

  return API_ID.test(value) && value.startsWith(prefix) ? Opt.some(value as T) : Opt.none();
}

export function parseTaskId(input: string): Opt.Option<TaskId> {
  return prefixed<TaskId>(input, 'PT');
}

export function parseTicketId(input: string): Opt.Option<TicketId> {
  return prefixed<TicketId>(input, 'TC');
}

/**
 * Finds the first api_id with this prefix in free text, e.g. a write acknowledgement.
 *
 * @param text
 * @param prefix
 */
export function findApiId(text: string, prefix: string): Opt.Option<string> {
  const match = new RegExp(String.raw`\b(${prefix}[A-Z0-9]{13})\b`).exec(text);

  return Opt.fromNullishOr(match?.[1]);
}
