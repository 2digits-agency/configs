import type { ReactNode } from 'react';

import { TextAttributes } from '@opentui/core';
import * as Cause from 'effect/Cause';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { describeOrbitError, isOrbitError } from '../orbit/Orbit.js';
import { theme } from './theme.js';

export function Panel({
  title,
  children,
  borderColor = theme.border,
  flexGrow,
  width,
  height,
  flexDirection = 'column',
}: {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly borderColor?: string;
  readonly flexGrow?: number;
  readonly width?: number | `${number}%`;
  readonly height?: number | `${number}%`;
  readonly flexDirection?: 'row' | 'column';
}) {
  return (
    <box
      title={title === undefined ? undefined : ` ${title} `}
      border
      borderStyle="rounded"
      borderColor={borderColor}
      paddingLeft={1}
      paddingRight={1}
      flexDirection={flexDirection}
      flexGrow={flexGrow}
      flexShrink={flexGrow === undefined ? 0 : 1}
      flexBasis={flexGrow === undefined ? undefined : 0}
      minWidth={0}
      minHeight={0}
      width={width}
      height={height}>
      {children}
    </box>
  );
}

export function Badge({
  label,
  fg = theme.black,
  bg,
}: {
  readonly label: string;
  readonly fg?: string;
  readonly bg: string;
}) {
  return (
    <text fg={fg} bg={bg} attributes={TextAttributes.BOLD}>
      {` ${label} `}
    </text>
  );
}

export function Hint({ keys, label }: { readonly keys: string; readonly label: string }) {
  return (
    <text>
      <span fg={theme.cyan}>{keys}</span>

      <span fg={theme.muted}>{` ${label}  `}</span>
    </text>
  );
}

export function Muted({ children }: { readonly children?: ReactNode }) {
  return <text fg={theme.muted}>{children}</text>;
}

export function Line({ children, fg = theme.text }: { readonly children?: ReactNode; readonly fg?: string }) {
  return <text fg={fg}>{children}</text>;
}

/**
 * A human message for a failure, keeping Orbit's own words and the "not retried" semantics.
 *
 * @param cause
 */
export function failureMessage(cause: Cause.Cause<unknown>): string {
  const error = Cause.findErrorOption(cause);

  if (Opt.isSome(error)) {
    const value = error.value;

    if (isOrbitError(value)) {
      return describeOrbitError(value);
    }

    if (typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string') {
      return value.message;
    }

    if (typeof value === 'object' && value !== null && 'messages' in value && Array.isArray(value.messages)) {
      return value.messages.join(' ');
    }
  }

  return `Onverwachte fout: ${String(Cause.squash(cause))}`;
}

function rawText(cause: Cause.Cause<unknown>): string | undefined {
  const error = Cause.findErrorOption(cause);

  return Opt.isSome(error) && isOrbitError(error.value) && P.isTagged(error.value, 'OrbitUnreadable')
    ? error.value.raw
    : undefined;
}

export function ErrorBox({ cause }: { readonly cause: Cause.Cause<unknown> }) {
  const raw = rawText(cause);

  return (
    <box flexDirection="column" flexGrow={1}>
      <text fg={theme.red}>{`✗ ${failureMessage(cause)}`}</text>

      {raw === undefined ? undefined : (
        <scrollbox flexGrow={1} border borderStyle="single" borderColor={theme.dim} title=" ruwe tekst ">
          <text fg={theme.muted}>{raw}</text>
        </scrollbox>
      )}
    </box>
  );
}

/**
 * Renders an AsyncResult: loading, error with Orbit's message, or the value. Stale values stay visible while
 * refreshing.
 *
 * @param props
 * @param props.result
 * @param props.children
 * @param props.loading
 */
export function Async<TValue, TError>({
  result,
  children,
  loading = 'Laden…',
}: {
  readonly result: AsyncResult.AsyncResult<TValue, TError>;
  readonly children: (value: TValue, waiting: boolean) => ReactNode;
  readonly loading?: string;
}) {
  return AsyncResult.match(result, {
    onInitial: () => <text fg={theme.muted}>{loading}</text>,
    onFailure: (failure) =>
      Opt.match(failure.previousSuccess, {
        onNone: () => <ErrorBox cause={failure.cause} />,
        onSome: (previous) => (
          <box flexDirection="column" flexGrow={1}>
            <text fg={theme.red}>{`✗ ${failureMessage(failure.cause)} (oude gegevens getoond)`}</text>

            {children(previous.value, false)}
          </box>
        ),
      }),
    onSuccess: (success) => children(success.value, success.waiting),
  });
}

export function Field({
  label,
  active,
  children,
  hint,
  invalid,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly children?: ReactNode;
  readonly hint?: string;
  readonly invalid?: boolean;
}) {
  return (
    <box flexDirection="row" height={1} flexShrink={0}>
      <text
        width={16}
        flexShrink={0}
        fg={active ? theme.focus : invalid === true ? theme.red : theme.muted}
        attributes={active ? TextAttributes.BOLD : TextAttributes.NONE}>
        {`${active ? '▸' : ' '} ${label}`}
      </text>

      <box flexGrow={1} flexBasis={0} minWidth={0} flexDirection="row" overflow="hidden">
        {children}
      </box>

      {hint === undefined ? undefined : <text flexShrink={0} fg={theme.dim}>{` ${hint}`}</text>}
    </box>
  );
}

export function JsonBlock({
  value,
  title = 'payload',
  color = theme.cyan,
}: {
  readonly value: unknown;
  readonly title?: string;
  readonly color?: string;
}) {
  return (
    <box border borderStyle="single" borderColor={theme.dim} title={` ${title} `} paddingLeft={1}>
      <text fg={color}>{JSON.stringify(value, undefined, 2)}</text>
    </box>
  );
}
