import { Either, left, right } from "fp-ts/lib/Either";

/**
 * Useful Promises combinators
 */

/**
 * Returns a Promise that resolves after millis milliseconds
 */
export function timeoutPromise(millis: number): Promise<void> {
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
  millis: number,
  timeoutP: (_: number) => Promise<void> = timeoutPromise
): Promise<Either<"timeout", T>> {
  const t = timeoutP(millis);
  return new Promise((resolve, reject) => {
    // on timeout
    t.then(() => resolve(left<"timeout", T>("timeout"))).catch(reject);
    // on completion
    p.then(v => resolve(right<"timeout", T>(v))).catch(reject);
  });
}
