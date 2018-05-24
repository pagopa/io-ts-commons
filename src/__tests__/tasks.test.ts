import { Either, isLeft, isRight, Left, left, right } from "fp-ts/lib/Either";
import { Task } from "fp-ts/lib/Task";
import { TaskEither, taskify } from "fp-ts/lib/TaskEither";

import {
  MaxRetries,
  RetriableTask,
  TransientError,
  withRetries
} from "../tasks";
import { Millisecond } from "../units";

const transientFailingTask: RetriableTask<Error, string> = new TaskEither(
  new Task(() =>
    Promise.resolve(left<Error | TransientError, string>(TransientError))
  )
);

const constantBackoff = () => 1 as Millisecond;

const withNoRetries = withRetries(0, constantBackoff);
const withConstantRetries = (n: number) => withRetries(n, constantBackoff);

describe("withRetries", () => {
  it("should fail permanently when retries are over", async () => {
    const t = withNoRetries(transientFailingTask);

    const r = await t.run();
    expect(r.isLeft()).toBeTruthy();
    if (isLeft(r)) {
      expect(r.value).toEqual(MaxRetries);
    }
  });

  it("should run the task once when the number of retries is 0", async () => {
    const taskMock = jest.fn(() =>
      Promise.resolve(left<Error | TransientError, string>(TransientError))
    );
    const transientFailingTaskMock: RetriableTask<
      Error,
      string
    > = new TaskEither(new Task(taskMock));

    const t = withNoRetries(transientFailingTaskMock);

    const r = await t.run();
    expect(r.isLeft()).toBeTruthy();
    if (isLeft(r)) {
      expect(r.value).toEqual(MaxRetries);
    }
    expect(taskMock).toHaveBeenCalledTimes(1);
  });

  it("should run the task the number of retries when maxRetries > 0", async () => {
    const taskMock = jest.fn(() =>
      Promise.resolve(left<Error | TransientError, string>(TransientError))
    );
    const transientFailingTaskMock: RetriableTask<
      Error,
      string
    > = new TaskEither(new Task(taskMock));

    const t = withConstantRetries(3)(transientFailingTaskMock);

    const r = await t.run();
    expect(r.isLeft()).toBeTruthy();
    if (isLeft(r)) {
      expect(r.value).toEqual(MaxRetries);
    }
    expect(taskMock).toHaveBeenCalledTimes(3);
  });

  it("should return the result when the task resolves", async () => {
    const taskMock = jest
      .fn()
      .mockResolvedValueOnce(
        left<Error | TransientError, string>(TransientError)
      )
      .mockResolvedValueOnce(
        left<Error | TransientError, string>(TransientError)
      )
      .mockResolvedValueOnce(right<Error | TransientError, string>("ok"));
    const transientFailingTaskMock: RetriableTask<
      Error,
      string
    > = new TaskEither(new Task(taskMock));

    const t = withConstantRetries(3)(transientFailingTaskMock);

    const r = await t.run();
    expect(r.isRight()).toBeTruthy();
    if (isRight(r)) {
      expect(r.value).toEqual("ok");
    }
    expect(taskMock).toHaveBeenCalledTimes(3);
  });
});
