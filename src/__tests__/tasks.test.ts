import { Either, isLeft, isRight, Left, left, right } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import { Task } from "fp-ts/lib/Task";
import * as T from "fp-ts/lib/Task";
import { TaskEither, taskify } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import { DeferredPromise } from "../promises";
import {
  MaxRetries,
  RetriableTask,
  RetryAborted,
  TransientError,
  withRetries
} from "../tasks";
import { Millisecond } from "../units";

const transientFailingTask: RetriableTask<Error, string> = () =>
  Promise.resolve(left<Error | TransientError, string>(TransientError));

const constantBackoff = () => 1 as Millisecond;

const withNoRetries = withRetries(0, constantBackoff);
const withConstantRetries = (n: number) => withRetries(n, constantBackoff);

describe("withRetries", () => {
  it("should fail permanently when retries are over", async () => {
    const t = withNoRetries(transientFailingTask);

    const r = await t();
    expect(E.isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.left).toEqual(MaxRetries);
    }
  });

  it("should run the task once when the number of retries is 0", async () => {
    const taskMock = jest.fn(() =>
      Promise.resolve(left<Error | TransientError, string>(TransientError))
    );
    const transientFailingTaskMock: RetriableTask<Error, string> = taskMock;

    const t = withNoRetries(transientFailingTaskMock);

    const r = await t();
    expect(E.isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.left).toEqual(MaxRetries);
    }
    expect(taskMock).toHaveBeenCalledTimes(1);
  });

  it("should run the task the number of retries when maxRetries > 0", async () => {
    const taskMock = jest.fn(() =>
      Promise.resolve(left<Error | TransientError, string>(TransientError))
    );
    const transientFailingTaskMock: RetriableTask<Error, string> = taskMock;

    const t = withConstantRetries(3)(transientFailingTaskMock);

    const r = await t();
    expect(E.isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.left).toEqual(MaxRetries);
    }
    expect(taskMock).toHaveBeenCalledTimes(3);
  });

  it("should run the task once when the task return a non transient error", async () => {
    const [err1, err2]: ReadonlyArray<Error> = [new Error("1"), new Error("2")];
    const taskMock = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(left(err1)))
      .mockImplementationOnce(() => Promise.resolve(left(err2)))
      .mockImplementationOnce(() =>
        Promise.resolve(right<Error | TransientError, string>("ok"))
      );
    const transientFailingTaskMock: RetriableTask<Error, string> = taskMock;

    const t = withConstantRetries(3)(transientFailingTaskMock);

    const r = await t();
    expect(E.isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.left).toEqual(err1);
    }
    expect(taskMock).toHaveBeenCalledTimes(1);
  });

  it("should return the result when the task resolves", async () => {
    const taskMock = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(left(TransientError)))
      .mockImplementationOnce(() => Promise.resolve(left(TransientError)))
      .mockImplementationOnce(() =>
        Promise.resolve(right<Error | TransientError, string>("ok"))
      );
    const transientFailingTaskMock: RetriableTask<Error, string> = taskMock;

    const t = withConstantRetries(3)(transientFailingTaskMock);

    const r = await t();
    expect(E.isRight(r)).toBeTruthy();
    if (isRight(r)) {
      expect(r.right).toEqual("ok");
    }
    expect(taskMock).toHaveBeenCalledTimes(3);
  });

  it("should abort retries", async () => {
    const transientError = Promise.resolve(
      left<Error | TransientError, boolean>(TransientError)
    );

    // create a deferred promise that we will use to abort a RetriableTask
    const { e1: abortPromise, e2: abortResolve } = DeferredPromise<boolean>();
    const taskMock: () => Promise<
      Either<Error | TransientError, boolean>
    > = jest
      .fn()
      // first run, fail with a TransientError
      .mockImplementationOnce(() => transientError)
      .mockImplementationOnce(() => {
        // On the second run we still fail with a TransientError and also
        // resolve the abort promise on the second run.
        // There should be no more retries after this one.
        abortResolve(true);
        return transientError;
      });
    const transientFailingTaskMock: RetriableTask<Error, boolean> = taskMock;

    // Retry this task for max 5 times
    const t = withConstantRetries(5)(transientFailingTaskMock, abortPromise);

    const r = await t();
    expect(E.isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.left).toEqual(RetryAborted);
    }
    expect(taskMock).toHaveBeenCalledTimes(2);
  });
});
