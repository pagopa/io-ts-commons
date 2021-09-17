import * as express from "express";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { sequenceS } from "fp-ts/lib/Apply";

import { pipe } from "fp-ts/lib/function";
import { IResponse, ResponseErrorInternal } from "./responses";

export type EnforceNonEmptyRecord<R> = keyof R extends never ? never : R;

export type RequestHandler<R> = (
  request: express.Request
) => Promise<IResponse<R>>;

/**
 * Request handler type
 */
type IRequestHandler<Params, Return> = (
  args: Params
) => Promise<IResponse<Return>>;

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

/**
 * A typed map containing all the middlewares needed by the request.
 * `Params` defines a Record containing all the values names to be returned.
 *
 * @example
 * {
 *  context: ContextMiddleware(),
 *  fiscalCode: FiscalCodeMiddleware()
 * }
 */
export type IRequestMiddlewares<Params> = {
  [key in keyof Params]: IRequestMiddleware<unknown, Params[key]>;
};

type MiddlewaresTaskEithers<
  MiddlewareStruct extends IRequestMiddlewares<unknown>
> = {
  readonly [key in keyof MiddlewareStruct]: MiddlewareStruct[key] extends IRequestMiddleware<
    unknown,
    infer T
  >
    ? TE.TaskEither<AllMiddlewaresFailureResults<MiddlewareStruct>, T>
    : never;
};

export type ParamsUnion<OBJ> = OBJ[keyof OBJ];

// ----- Middlewares  Failure Result Types

export type MiddlewareFailureResult<T> = T extends IRequestMiddleware<
  infer R,
  unknown
>
  ? R extends IResponse<infer Res>
    ? Res
    : R
  : never;

export type MiddlewaresFailureResults<
  M extends IRequestMiddlewares<unknown>
> = {
  readonly [k in keyof M]: MiddlewareFailureResult<M[k]>;
};

export type AllMiddlewaresFailureResults<
  M extends IRequestMiddlewares<unknown>
> = ParamsUnion<MiddlewaresFailureResults<M>>;

// ----- Middlewares Result Types

export type MiddlewareResult<T> = T extends IRequestMiddleware<unknown, infer R>
  ? R
  : never;
export type MiddlewaresResults<M extends IRequestMiddlewares<unknown>> = {
  readonly [k in keyof M]: MiddlewareResult<M[k]>;
};
export type AllMiddlewaresResults<
  M extends IRequestMiddlewares<unknown>
> = ParamsUnion<MiddlewaresResults<M>>;

/**
 * Builds a record of TaskEither from a record of IRequestMiddleware promise
 * @param middlewares the record containing all the Middlewares to process
 * @returns a function that takes an express.Request and returns a TaskEither
 * contaiing either one of the Middlerwares' errors or a structure with Middlewares' results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMiddlewaresTaskEithers = <K extends IRequestMiddlewares<any>>(
  middlewares: K
) => (req: express.Request): EnforceNonEmptyRecord<MiddlewaresTaskEithers<K>> =>
  Object.keys(middlewares).reduce(
    (prev, name) => ({
      ...prev,
      [name]: pipe(
        TE.tryCatch(
          async () => await middlewares[name](req),
          _ => ResponseErrorInternal(`error executing middleware ${name}`)
        ),
        TE.chain(TE.fromEither)
      )
    }),
    {}
  ) as EnforceNonEmptyRecord<MiddlewaresTaskEithers<K>>;

/**
 * Wraps a request handler with a record of Middlewares.
 * If all Middlewares returns the right value, the handler will be called
 * with the resulting record of values.
 * @param middlewares The record containing the middlewares to call
 * @returns a promise containing the handler responce or a Middleware's failure result.
 */
export const withRequestMiddlewaresStruct = <Params>(
  middlewares: IRequestMiddlewares<Params>
) => <RH>(
  handler: IRequestHandler<MiddlewaresResults<typeof middlewares>, RH>
): RequestHandler<
  | RH
  | "IResponseErrorInternal"
  | AllMiddlewaresFailureResults<typeof middlewares>
> => async (
  request: express.Request
): Promise<
  IResponse<
    | RH
    | "IResponseErrorInternal"
    | AllMiddlewaresFailureResults<typeof middlewares>
  >
> => {
  type Failures = AllMiddlewaresFailureResults<typeof middlewares>;
  type StructResult = MiddlewaresResults<typeof middlewares>;

  if (Object.keys(middlewares).length > 0) {
    return pipe(
      request,
      getMiddlewaresTaskEithers(middlewares),
      val =>
        sequenceS(TE.ApplicativePar)(val) as TE.TaskEither<
          Failures,
          StructResult
        >,
      TE.chainW(params =>
        pipe(
          TE.tryCatch(() => handler(params), E.toError),
          TE.mapLeft(err =>
            ResponseErrorInternal(
              `Error executing endpoint handler: ${err.message}`
            )
          )
        )
      ),
      TE.toUnion
    )() as Promise<IResponse<RH | Failures | "IResponseErrorInternal">>;
  } else {
    return handler({} as StructResult);
  }
};

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
