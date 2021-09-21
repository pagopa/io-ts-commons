import * as express from "express";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { IResponse, ResponseErrorInternal } from "./responses";

export type RequestHandler<R> = (
  request: express.Request
) => Promise<IResponse<R>>;

/**
 * Transforms a typesafe RequestHandler into an Express Request Handler.
 *
 * Failed promises will be mapped to 500 errors handled by ResponseErrorGeneric.
 */
export const wrapRequestHandler = <R>(handler: RequestHandler<R>) => (
  request: express.Request,
  response: express.Response,
  _: express.NextFunction
): Promise<void> =>
  handler(request).then(
    r => {
      r.apply(response);
    },
    e => {
      ResponseErrorInternal(e).apply(response);
    }
  );

/**
 * Interface for implementing a request middleware.
 *
 * A RequestMiddleware is just a function that validates a request or
 * extracts some object out of it.
 * The middleware returns a promise that will resolve to a value that gets
 * passed to the handler.
 * In case the validation fails, the middleware rejects the promise (the
 * value of the error is discarded). In this case the processing of the
 * following middlewares will not happen.
 * Finally, when called, the middleware has full access to the request and
 * the response objects. Access to the response object is particulary useful
 * for returning error messages when the validation fails.
 */
export type IRequestMiddleware<R, T> = (
  request: express.Request
) => Promise<E.Either<IResponse<R>, T>>;

export type MiddlewareFailureResult<T> = T extends IRequestMiddleware<
  infer R,
  unknown
>
  ? R extends IResponse<infer Res>
    ? Res
    : R
  : never;

export type MiddlewareResult<T> = T extends IRequestMiddleware<unknown, infer R>
  ? R
  : never;

// -----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Head<T extends ReadonlyArray<any>> = T extends readonly [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...ReadonlyArray<any>
]
  ? T[0]
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tail<T extends ReadonlyArray<any>> = ((
  ...t: T
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
unknown) extends (_: any, ...tail: infer TT) => unknown
  ? TT
  : readonly [];

export type HasTail<T extends ReadonlyArray<unknown>> = T extends
  | readonly []
  | readonly [unknown]
  ? false
  : true;

export type MiddlewareFailure<
  M extends IRequestMiddleware<unknown, unknown>
> = M extends IRequestMiddleware<infer F, unknown> ? F : never;

export type MiddlewareFailures<
  T extends ReadonlyArray<IRequestMiddleware<unknown, unknown>>
> = {
  readonly 0: readonly [MiddlewareFailure<Head<T>>];
  readonly 1: readonly [
    MiddlewareFailure<Head<T>>,
    ...MiddlewareFailures<Tail<T>>
  ];
}[HasTail<T> extends true ? 1 : 0];

export type MiddlewareResults<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ReadonlyArray<IRequestMiddleware<any, any>>
> = {
  readonly 0: readonly [MiddlewareResult<Head<T>>];
  readonly 1: readonly [
    MiddlewareResult<Head<T>>,
    ...MiddlewareResults<Tail<T>>
  ];
}[HasTail<T> extends true ? 1 : 0];

export type TypeOfArray<T extends ReadonlyArray<unknown>> = {
  readonly 0: Head<T>;
  readonly 1: Head<T> | TypeOfArray<Tail<T>>;
}[HasTail<T> extends true ? 1 : 0];

export type WithRequestMiddlewaresT = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends ReadonlyArray<IRequestMiddleware<any, any>>
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...middlewares: M
) => <RH>(
  handler: (...values: MiddlewareResults<M>) => Promise<IResponse<RH>>
) => RequestHandler<
  | RH
  | "IResponseErrorInternal"
  | TypeOfArray<MiddlewareFailures<typeof middlewares>>
>;

export const withRequestMiddlewares: WithRequestMiddlewaresT = (
  ...middlewares
) => handler =>
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  request => {
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    const p = pipe(
      middlewares,
      middleware =>
        middleware.map(m =>
          pipe(
            TE.tryCatch(
              async () => await m(request),
              _ => ResponseErrorInternal(`error executing middleware`)
            ),
            TE.chain(TE.fromEither)
          )
        ),
      TE.sequenceSeqArray,
      TE.map(params => params as MiddlewareResults<typeof middlewares>),
      TE.chain(params =>
        pipe(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          TE.tryCatch(() => handler(...params), E.toError),
          TE.mapLeft(err =>
            ResponseErrorInternal(
              `Error executing endpoint handler: ${err.message}`
            )
          )
        )
      ),
      TE.toUnion
    );

    return p();
  };
