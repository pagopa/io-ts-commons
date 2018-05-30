/**
 * Helpers for dealing with fetch requests
 */

import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { timeoutPromise } from "./promises";
import {
  MaxRetries,
  RetriableTask,
  RetryAborted,
  TransientError
} from "./tasks";
import { ITuple2, Tuple2 } from "./tuples";
import { Millisecond } from "./units";

/**
 * An instance of fetch, along its associated AbortController
 */
export type AbortableFetch = (
  input?: Request | string,
  init?: RequestInit
) => ITuple2<Promise<Response>, AbortController>;

/**
 * Makes fetch abortable and returns an AbortableFetch.
 *
 * The fetch request can be aborted by calling `AbortController`'s `abort()`.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
 */
export function AbortableFetch(f: typeof fetch = fetch): AbortableFetch {
  return (input, init) => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    // augment the provided fetch with the signal controller
    const newInit = {
      ...init,
      signal
    };

    return Tuple2(f(input, newInit), abortController);
  };
}

/**
 * Converts an AbortableFetch back to a simple fetch
 */
export function toFetch(f: AbortableFetch): typeof fetch {
  return (init, input) => f(init, input).e1;
}

/**
 * Sets a timeout on an AbortableFetch.
 *
 * When the timeout expires, the controller's `abort()` method gets called.
 */
export function setFetchTimeout(
  timeout: Millisecond,
  abortableFetch: AbortableFetch
): AbortableFetch {
  return (input, init) => {
    const result = abortableFetch(input, init);
    // abort the fetch request on timeout
    timeoutPromise(timeout)
      .then(() => {
        result.e2.abort();
      })
      .catch(_ => void 0);
    return result;
  };
}

/**
 * Given a function that wraps a RetriableTask with retries, it returns an
 * fetch that wraps the original fetch with retries on transient errors such
 * as network errors and timeouts.
 */
export const retriableFetch: (
  retryWrapper: (
    _: RetriableTask<Error, Response>
  ) => TaskEither<Error | MaxRetries | RetryAborted, Response>
) => (f: typeof fetch) => typeof fetch = retryWrapper => f => (input, init) => {
  // wraps the fetch call with a TaskEither type, mapping certain promise
  // rejections to TransientError(s)
  const fetchTask = tryCatch<Error | TransientError, Response>(
    () => {
      return f(input, init);
    },
    reason => {
      // map rejection reason to a transient or permanent error
      if (
        (reason as Error).name === "Aborted" ||
        (reason as Error).name === "Network request failed" ||
        // tslint:disable-next-line:no-any
        (reason as any).type === "aborted"
      ) {
        // We return a TransientError in case the request got aborted by
        // a timeout or there was a network request.
        // See possible rejections of fetch here:
        // https://github.com/github/fetch/blob/master/fetch.js#L441
        // TODO: make this logic customizable (e.g. via response status)
        return TransientError;
      }

      // in all other case we return the reject reason
      // TODO: provide reason?
      return new Error("Promise has been rejected");
    }
  );

  // wrap the fetch task with the provided retry wrapper
  const fetchWithRetries = retryWrapper(fetchTask);

  // return a new promise that gets resolved when the task resolves to a Right
  // or gets rejected in all other cases
  return new Promise((resolve, reject) => {
    fetchWithRetries.run().then(result => {
      result.fold(reject, resolve);
    }, reject);
  });
};
