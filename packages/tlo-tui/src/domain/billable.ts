import * as Opt from 'effect/Option';

/**
 * The user's explicit choice. There is no default: Orbit tools encode billability differently per contract.
 */
export type BillableChoice = 'billable' | 'non-billable';

/**
 * `CreateTimeEntry.billable` is a boolean.
 *
 * @param choice
 */
export function toCreateBillable(choice: BillableChoice): boolean {
  return choice === 'billable';
}

/**
 * `UpdateTimeEntry.billable` is the string `'true'` or `'false'`; empty would mean "unchanged".
 *
 * @param choice
 */
export function toUpdateBillable(choice: BillableChoice): 'true' | 'false' {
  return choice === 'billable' ? 'true' : 'false';
}

/**
 * `ListTimeEntries.billable` filter: `'true'`, `'false'` or empty for all.
 *
 * @param choice
 */
export function toListBillableFilter(choice: BillableChoice | undefined): 'true' | 'false' | '' {
  return choice === undefined ? '' : toUpdateBillable(choice);
}

/**
 * Readback from `GetTimeEntry`, e.g. `Billable: yes` or `Billable: no (no rate)`. The reason matters: a zero-rate task
 * reads back as non-billable even when billable was requested.
 */
export interface BillableReadback {
  readonly billable: boolean;
  readonly reason: string | undefined;
  readonly raw: string;
}

export function parseBillableReadback(raw: string): Opt.Option<BillableReadback> {
  const match = /^(yes|no|ja|nee|true|false)\b\s*(?:\((.+)\))?/i.exec(raw.trim());

  if (match === null) {
    return Opt.none();
  }

  const word = match[1]?.toLowerCase() ?? '';

  return Opt.some({
    billable: ['yes', 'ja', 'true'].includes(word),
    reason: match[2]?.trim(),
    raw: raw.trim(),
  });
}

export function billableLabel(value: boolean | BillableChoice): string {
  return value === true || value === 'billable' ? 'billable' : 'niet-billable';
}
