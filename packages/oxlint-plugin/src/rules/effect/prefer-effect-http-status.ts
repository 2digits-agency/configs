import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Tuple from 'effect/Tuple';
import type * as HttpApiSchema from 'effect/http-api/HttpApiSchema';
import type * as HttpServerResponse from 'effect/http/HttpServerResponse';
import * as HttpStatus from 'effect/http/HttpStatus';

import { argumentAt, objectProperty, plainProperty, propertyName, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

/**
 * Every `HttpStatus.Literal` except `Ok`, the alias of `OK`. Effect does not export its code table, so the type keeps
 * this list complete and `HttpStatus.fromLiteral` supplies the codes.
 */
const statusNames: Record<Exclude<HttpStatus.Literal, 'Ok'>, true> = {
  Continue: true,
  SwitchingProtocols: true,
  Processing: true,
  EarlyHints: true,
  OK: true,
  Created: true,
  Accepted: true,
  NonAuthoritativeInformation: true,
  NoContent: true,
  ResetContent: true,
  PartialContent: true,
  MultiStatus: true,
  AlreadyReported: true,
  ImUsed: true,
  MultipleChoices: true,
  MovedPermanently: true,
  Found: true,
  SeeOther: true,
  NotModified: true,
  TemporaryRedirect: true,
  PermanentRedirect: true,
  BadRequest: true,
  Unauthorized: true,
  PaymentRequired: true,
  Forbidden: true,
  NotFound: true,
  MethodNotAllowed: true,
  NotAcceptable: true,
  ProxyAuthenticationRequired: true,
  RequestTimeout: true,
  Conflict: true,
  Gone: true,
  LengthRequired: true,
  PreconditionFailed: true,
  PayloadTooLarge: true,
  UriTooLong: true,
  UnsupportedMediaType: true,
  RangeNotSatisfiable: true,
  ExpectationFailed: true,
  ImATeapot: true,
  MisdirectedRequest: true,
  UnprocessableEntity: true,
  Locked: true,
  FailedDependency: true,
  TooEarly: true,
  UpgradeRequired: true,
  PreconditionRequired: true,
  TooManyRequests: true,
  RequestHeaderFieldsTooLarge: true,
  UnavailableForLegalReasons: true,
  InternalServerError: true,
  NotImplemented: true,
  BadGateway: true,
  ServiceUnavailable: true,
  GatewayTimeout: true,
  HttpVersionNotSupported: true,
  VariantAlsoNegotiates: true,
  InsufficientStorage: true,
  LoopDetected: true,
  NotExtended: true,
  NetworkAuthenticationRequired: true,
};

const statusLiterals: ReadonlyMap<number, HttpStatus.Literal> = new Map(
  Arr.map(R.keys(statusNames), (name) => Tuple.make<[number, HttpStatus.Literal]>(HttpStatus.fromLiteral(name), name)),
);

type MessageId = 'httpStatus' | 'statusName';

/**
 * The status name for a numeric literal of a known status code.
 *
 * @param node Expression.
 */
function statusLiteral(node: ESTree.Expression): Opt.Option<readonly [ESTree.Expression, HttpStatus.Literal]> {
  const target = unwrapExpression(node);

  return target.type === 'Literal' && P.isNumber(target.value)
    ? Opt.fromNullishOr(statusLiterals.get(target.value)).pipe(Opt.map((name) => Tuple.make(target, name)))
    : Opt.none();
}

/**
 * The status code arguments of a call to an Effect HTTP API, with the message each one gets: `HttpApiSchema.status`
 * takes the status name itself, while `HttpApiSchema.Empty`, `HttpServerResponse.setStatus` and the `status` option of
 * `HttpServerResponse` constructors take `HttpStatus.fromLiteral`.
 *
 * @param node Call.
 * @param imports Effect imports of the file.
 */
function statusArguments(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): ReadonlyArray<readonly [ESTree.Expression, MessageId]> {
  if (imports.isApi(node.callee, 'HttpApiSchema', 'status' satisfies keyof typeof HttpApiSchema)) {
    return argumentAt(node, 0).pipe(
      Opt.toArray,
      Arr.map((argument) => Tuple.make(argument, 'statusName')),
    );
  }

  if (imports.isApi(node.callee, 'HttpApiSchema', 'Empty' satisfies keyof typeof HttpApiSchema)) {
    return argumentAt(node, 0).pipe(
      Opt.toArray,
      Arr.map((argument) => Tuple.make(argument, 'httpStatus')),
    );
  }

  // `setStatus(404)` or data-first `setStatus(response, 404)`; only a numeric literal is reported.
  if (imports.isApi(node.callee, 'HttpServerResponse', 'setStatus' satisfies keyof typeof HttpServerResponse)) {
    return Arr.map(Arr.getSomes([argumentAt(node, 0), argumentAt(node, 1)]), (argument) =>
      Tuple.make(argument, 'httpStatus'),
    );
  }

  // `HttpServerResponse.empty(options)` takes options first; the other constructors take them after the body, as in
  // `HttpServerResponse.json(body, options)`, so a body with its own `status` field is not read as one.
  const status = Opt.flatMap(imports.member(node.callee, 'HttpServerResponse'), (member) =>
    argumentAt(node, member === ('empty' satisfies keyof typeof HttpServerResponse) ? 0 : 1).pipe(
      Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
      Opt.flatMap((options) => objectProperty(options, 'status')),
    ),
  );

  return status.pipe(
    Opt.toArray,
    Arr.map(({ value }) => Tuple.make(value as ESTree.Expression, 'httpStatus')),
  );
}

export const preferEffectHttpStatus = Rule.define({
  name: 'prefer-effect-http-status',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer named HttpStatus literals over status code numbers passed to Effect HTTP APIs.',
    messages: {
      statusName: "Pass the status name: HttpApiSchema.status('{{literal}}') instead of {{code}}.",
      httpStatus: "Name the status: use HttpStatus.fromLiteral('{{literal}}') instead of {{code}}.",
    },
    url: 'https://www.effect.website/docs/v4/api/effect/http/HttpStatus',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.Expression, messageId: MessageId) {
      return Opt.match(statusLiteral(node), {
        onNone: () => Effect.void,
        onSome: ([literal, name]) =>
          ctx.report(
            Diagnostic.fromId({
              node: literal,
              messageId,
              data: { code: ctx.sourceCode.getText(literal), literal: name },
            }),
          ),
      });
    }

    return Visitor.merge(
      // `{ httpApiStatus: 404 }` in a schema annotation.
      Visitor.on('ObjectExpression', (node) =>
        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        Effect.forEach(
          Arr.filter(Arr.getSomes(Arr.map(node.properties, plainProperty)), (property) =>
            Opt.contains(propertyName(property), 'httpApiStatus'),
          ),
          (property) => report(property.value, 'httpStatus'),
          { discard: true },
        ),
      ),
      Visitor.on('CallExpression', (node) =>
        // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
        Effect.forEach(statusArguments(node, imports), ([argument, messageId]) => report(argument, messageId), {
          discard: true,
        }),
      ),
    );
  },
});
