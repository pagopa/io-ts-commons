import { right } from "fp-ts/lib/Either";
import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { Millisecond } from "./units";

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
 * A Task that can be retried when it fails with a transient error
 */
export type RetriableTask<E, T> = E extends TransientError
  ? never
  : TaskEither<E | TransientError, T>;

/**
 * Wraps a RetriableTask with a number of retries
 */
export function withRetries<E, T>(
  maxRetries: number,
  backoff: (count: number) => Millisecond
): (_: RetriableTask<E, T>) => TaskEither<E | MaxRetries, T> {
  return task => {
    const runTaskOnce = (
      count: number,
      currentTask: RetriableTask<E, T>
    ): TaskEither<E | TransientError, T> => {
      // on first execution, count === 0
      if (count >= maxRetries - 1) {
        // no more retries left
        return currentTask;
      }
      // allow one run of the task
      return currentTask.orElse(l => {
        // if the task fails...
        if (l === TransientError) {
          // ...with a TransientError, chain it with a backoff delay
          // an then with another run.
          const delay = new TaskEither<E | TransientError, boolean>(
            delayTask(backoff(count), true).map(d => right(d))
          );
          return delay.applySecond(runTaskOnce(count + 1, currentTask));
        } else {
          // ...with an error that is not a TransientError, we just return it
          return currentTask;
        }
      });
    };

    // if the recursive task execution returns with a failure and the failure is
    // a TransientError, it means that the retries have been exausted - we map
    // the error to a MaxRetries error.
    return runTaskOnce(0, task).mapLeft(
      l => (l === TransientError ? MaxRetries : l)
    );
  };
}

/**
 * Returns a Task that resolves to a value after a delay.
 */
export const delayTask = <A>(n: Millisecond, a: A): Task<A> =>
  new Task<A>(
    () =>
      new Promise<A>(resolve => {
        setTimeout(() => resolve(a), n);
      })
  );
