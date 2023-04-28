import { right } from "fp-ts/lib/Either";
import { Task } from "fp-ts/lib/Task";
import * as T from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Millisecond } from "./units";

/**
 * Returns a Task that resolves to a value after a delay.
 */
export const delayTask = <A>(n: Millisecond, a: A): Task<A> =>
  T.delay(n)(T.of(a));

/**
 * In the context of a retriable task, when it returns a TransientError the
 * task can be executed again.
 */
export type TransientError = "transient";
export const TransientError: TransientError = "transient";

/**
 * A RetriableTask failed too many times.
 */
export type MaxRetries = "max-retries";
export const MaxRetries: MaxRetries = "max-retries";

/**
 * A RetriableTask has been aborted.
 */
export type RetryAborted = "retry-aborted";
export const RetryAborted: RetryAborted = "retry-aborted";

/**
 * A Task that can be retried when it fails with a transient error
 */
export type RetriableTask<E, T> = E extends TransientError
  ? never
  : TaskEither<E | TransientError, T>;

/**
 * Wraps a RetriableTask with a number of retries
 */
export const withRetries =
  <E, T>(
    maxRetries: number,
    backoff: (count: number) => Millisecond
  ): ((
    _: RetriableTask<E, T>,
    shouldAbort?: Promise<boolean>
  ) => TaskEither<E | MaxRetries | RetryAborted, T>) =>
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  (task, shouldAbort = Promise.resolve(false)) => {
    // Whether we must stop retrying
    // the abort process gets triggered when the shouldAbort promise resolves
    // to true. Not that aborting stops the retry process, it does NOT stop
    // the execution of the current task.
    // eslint-disable-next-line functional/no-let
    let mustAbort = false;
    shouldAbort.then(
      (v) => {
        mustAbort = v;
      },
      (_) => void 0
    );

    const runTaskOnce = (
      count: number,
      currentTask: RetriableTask<E, T>
    ): TaskEither<E | TransientError | RetryAborted, T> => {
      // on first execution, count === 0
      if (count >= maxRetries - 1) {
        // no more retries left
        return currentTask;
      }
      // allow one run of the task
      return pipe(
        currentTask,
        TE.orElse((l) => {
          // if the task fails...
          if (mustAbort) {
            return TE.left(RetryAborted);
          }
          if (l === TransientError) {
            // ...with a TransientError, chain it with a backoff delay
            // an then with another run.
            return pipe(
              delayTask(backoff(count), true),
              T.map((d) => right(d)),
              TE.chain(() => runTaskOnce(count + 1, currentTask))
            );
          }
          // ...with an error that is not a TransientError, we just return it
          return TE.left(l);
        })
      );
    };

    // if the recursive task execution returns with a failure and the failure is
    // a TransientError, it means that the retries have been exausted - we map
    // the error to a MaxRetries error.
    return pipe(
      runTaskOnce(0, task),
      TE.mapLeft((l) => (l === TransientError ? MaxRetries : l))
    );
  };
