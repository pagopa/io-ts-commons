import { Either, left, right } from "fp-ts/lib/Either";
import { ITuple3, Tuple3 } from "./tuples";
import { Millisecond } from "./units";

/**
 * Useful Promises combinators
 */

/**
 * Returns a Promise that resolves after millis milliseconds
 */
export function timeoutPromise(millis: Millisecond): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), millis);
  });
}

/**
 * Wraps a Promise with a timeout, resolves to Left<"timeout"> on timeout or
 * Right<T> on completion.
 */
export function withTimeout<T>(
  p: Promise<T>,
  millis: Millisecond,
  timeoutP: (_: Millisecond) => Promise<void> = timeoutPromise
): Promise<Either<"timeout", T>> {
  const t = timeoutP(millis);
  return new Promise((resolve, reject) => {
    // on timeout
    t.then(() => resolve(left<"timeout", T>("timeout"))).catch(reject);
    // on completion
    p.then(v => resolve(right<"timeout", T>(v))).catch(reject);
  });
}

/**
 * Creates a Promise whose resolve and reject implementations are not yet
 * provided.
 *
 * @return Array  A triplet with [Promise<T>, resolve(T), reject()]
 */
export function DeferredPromise<T>(): ITuple3<
  Promise<T>,
  (v: T) => void,
  (e: Error) => void
> {
  // tslint:disable-next-line:no-let
  let resolvePromise: (v: T) => void = () => {
    throw new Error("Promise.resolve not yet initialized");
  };
  // tslint:disable-next-line:no-let
  let rejectPromise: (e: Error) => void = () => {
    throw new Error("Promise.reject not yet initialized");
  };
  // tslint:disable-next-line:promise-must-complete
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return Tuple3(promise, resolvePromise, rejectPromise);
}
