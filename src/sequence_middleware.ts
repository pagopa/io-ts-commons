import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import * as express from "express";
import { IRequestMiddleware } from "./request_middleware";
import { IResponse } from "./responses";

export type SequenceMiddlewareT = <E>(
  defaultError: IResponse<E>
) => <R0, R1>(
  middleware0: IRequestMiddleware<unknown, R0>,
  middleware1: IRequestMiddleware<unknown, R1>
) => IRequestMiddleware<E, R0 | R1>;

export const SequenceMiddleware: SequenceMiddlewareT = defaultError => (
  // TODO: the helper is intended for an undefined number of middleware
  // however, we decided to implement the simplest case so far (two middlewares only)
  // Please enhance the type definition to allow more middlewares if needed
  middleware0,
  middleware1
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => async <R extends express.Request, R0, R1>(request: R) =>
  await pipe(
    [middleware0, middleware1],
    RA.map(middleware =>
      pipe(
        TE.tryCatch(
          async () =>
            (await middleware(request)) as E.Either<
              IResponse<unknown>,
              R0 | R1
            >,
          _ => void 0 // We can ignore the error because we handle with defaultError
        ),
        TE.chainW(TE.fromEither)
      )
    ),
    T.sequenceSeqArray,
    T.map(RA.rights),
    T.map(rights =>
      rights.length > 0 ? E.of(rights[0]) : E.left(defaultError)
    )
  )();
