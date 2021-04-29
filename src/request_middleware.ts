import * as express from "express";

import { Either, isLeft } from "fp-ts/lib/Either";

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
) => Promise<Either<IResponse<R>, T>>;

//
// The following are the type definitions for withRequestMiddlewares(...)
// Each overloaded type provided a type safe signature of withRequestMiddlewares with
// a certain number of middlewares. This is useful for enforcing the constraint that
// the handler should have the same number of parameters as the number of middlewares
// and each parameter must be of the same type returned by the corresponding middleware.
//

export function withRequestMiddlewares<R1, T1>(
  v1: IRequestMiddleware<R1, T1>
): <RH>(handler: (v1: T1) => Promise<IResponse<RH>>) => RequestHandler<RH | R1>;

export function withRequestMiddlewares<R1, R2, T1, T2>(
  v1: IRequestMiddleware<R1, T1>,
  v2: IRequestMiddleware<R2, T2>
): <RH>(
  handler: (v1: T1, v2: T2) => Promise<IResponse<RH>>
) => RequestHandler<RH | R1 | R2>;

export function withRequestMiddlewares<R1, R2, R3, T1, T2, T3>(
  v1: IRequestMiddleware<R1, T1>,
  v2: IRequestMiddleware<R2, T2>,
  v3: IRequestMiddleware<R3, T3>
): <RH>(
  handler: (v1: T1, v2: T2, v3: T3) => Promise<IResponse<RH>>
) => RequestHandler<RH | R1 | R2 | R3>;

export function withRequestMiddlewares<R1, R2, R3, R4, T1, T2, T3, T4>(
  v1: IRequestMiddleware<R1, T1>,
  v2: IRequestMiddleware<R2, T2>,
  v3: IRequestMiddleware<R3, T3>,
  v4: IRequestMiddleware<R4, T4>
): <RH>(
  handler: (v1: T1, v2: T2, v3: T3, v4: T4) => Promise<IResponse<RH>>
) => RequestHandler<RH | R1 | R2 | R3 | R4>;

export function withRequestMiddlewares<R1, R2, R3, R4, R5, T1, T2, T3, T4, T5>(
  v1: IRequestMiddleware<R1, T1>,
  v2: IRequestMiddleware<R2, T2>,
  v3: IRequestMiddleware<R3, T3>,
  v4: IRequestMiddleware<R4, T4>,
  v5: IRequestMiddleware<R5, T5>
): <RH>(
  handler: (v1: T1, v2: T2, v3: T3, v4: T4, v5: T5) => Promise<IResponse<RH>>
) => RequestHandler<RH | R1 | R2 | R3 | R4 | R5>;

export function withRequestMiddlewares<
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6
>(
  v1: IRequestMiddleware<R1, T1>,
  v2: IRequestMiddleware<R2, T2>,
  v3: IRequestMiddleware<R3, T3>,
  v4: IRequestMiddleware<R4, T4>,
  v5: IRequestMiddleware<R5, T5>,
  v6: IRequestMiddleware<R6, T6>
): <RH>(
  handler: (
    v1: T1,
    v2: T2,
    v3: T3,
    v4: T4,
    v5: T5,
    v6: T6
  ) => Promise<IResponse<RH>>
) => RequestHandler<RH | R1 | R2 | R3 | R4 | R5 | R6>;

/**
 * Returns a request handler wrapped with the provided middlewares.
 *
 * The wrapper will process the request with each provided middleware in sequence.
 * Each middleware will return a response or a value.
 * When a response gets returned, the response gets sent back to the client and the
 * processing stops.
 * When all the provided middlewares complete by returning a value, all the values
 * gets passed to the custom handler that in turn will return a response.
 * That final response gets sent to the client.
 */
// TODO: Refactor this function to reduce its Cognitive Complexity
// eslint-disable-next-line sonarjs/cognitive-complexity, max-params, prefer-arrow/prefer-arrow-functions
export function withRequestMiddlewares<
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
  T1,
  T2,
  T3,
  T4,
  T5,
  T6
>(
  v1: IRequestMiddleware<R1, T1>,
  v2?: IRequestMiddleware<R2, T2>,
  v3?: IRequestMiddleware<R3, T3>,
  v4?: IRequestMiddleware<R4, T4>,
  v5?: IRequestMiddleware<R5, T5>,
  v6?: IRequestMiddleware<R6, T6>
): <RH>(
  handler: (
    v1: T1,
    v2?: T2,
    v3?: T3,
    v4?: T4,
    v5?: T5,
    v6?: T6
  ) => Promise<IResponse<RH>>
) => RequestHandler<R1 | R2 | R3 | R4 | R5 | R6 | RH> {
  return <RH>(
    handler: (
      v1: T1,
      v2?: T2,
      v3?: T3,
      v4?: T4,
      v5?: T5,
      v6?: T6
    ) => Promise<IResponse<RH>>
    // eslint-disable-next-line arrow-body-style, sonarjs/cognitive-complexity
  ) => {
    // The outer promise with resolve to a type that can either be the the type returned
    // by the handler or one of the types returned by any of the middlewares (i.e., when
    // a middleware returns an error response).
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return request =>
      new Promise<IResponse<R1 | R2 | R3 | R4 | R5 | R6 | RH>>(
        (resolve, reject) => {
          // we execute each middleware in sequence, stopping at the first middleware that is
          // undefined or when a middleware returns an error response.
          // when we find an undefined middleware, we call the handler with all the results of
          // the executed middlewares
          v1(request).then(r1 => {
            if (isLeft(r1)) {
              // 1st middleware returned a response
              // stop processing the middlewares
              resolve(r1.value);
            } else if (v2 !== undefined) {
              // 1st middleware returned a value
              // process 2nd middleware
              v2(request).then(r2 => {
                if (isLeft(r2)) {
                  // 2nd middleware returned a response
                  // stop processing the middlewares
                  resolve(r2.value);
                } else if (v3 !== undefined) {
                  // process 3rd middleware
                  v3(request).then(r3 => {
                    if (isLeft(r3)) {
                      // 3rd middleware returned a response
                      // stop processing the middlewares
                      resolve(r3.value);
                    } else if (v4 !== undefined) {
                      v4(request).then(r4 => {
                        if (isLeft(r4)) {
                          // 4th middleware returned a response
                          // stop processing the middlewares
                          resolve(r4.value);
                        } else if (v5 !== undefined) {
                          v5(request).then(r5 => {
                            if (isLeft(r5)) {
                              // 5th middleware returned a response
                              // stop processing the middlewares
                              resolve(r5.value);
                            } else if (v6 !== undefined) {
                              v6(request).then(r6 => {
                                if (isLeft(r6)) {
                                  // 6th middleware returned a response
                                  // stop processing the middlewares
                                  resolve(r6.value);
                                } else {
                                  // 6th middleware returned a value
                                  // run handler
                                  handler(
                                    r1.value,
                                    r2.value,
                                    r3.value,
                                    r4.value,
                                    r5.value,
                                    r6.value
                                  ).then(resolve, reject);
                                }
                              }, reject);
                            } else {
                              // 5th middleware returned a value
                              // run handler
                              handler(
                                r1.value,
                                r2.value,
                                r3.value,
                                r4.value,
                                r5.value
                              ).then(resolve, reject);
                            }
                          }, reject);
                        } else {
                          // 4th middleware returned a value
                          // run handler
                          handler(r1.value, r2.value, r3.value, r4.value).then(
                            resolve,
                            reject
                          );
                        }
                      }, reject);
                    } else {
                      // 3rd middleware returned a value
                      // run handler
                      handler(r1.value, r2.value, r3.value).then(
                        resolve,
                        reject
                      );
                    }
                  }, reject);
                } else {
                  // 2nd middleware returned a value
                  // run handler
                  handler(r1.value, r2.value).then(resolve, reject);
                }
              }, reject);
            } else {
              // 1st middleware returned a value
              // run handler
              handler(r1.value).then(resolve, reject);
            }
          }, reject);
        }
      );
  };
}
