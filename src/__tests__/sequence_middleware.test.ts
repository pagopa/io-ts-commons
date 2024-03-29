import * as E from "fp-ts/lib/Either";
import { ResponseErrorForbiddenNotAuthorized } from "../responses";
import { SequenceMiddleware } from "../sequence_middleware";

interface SampleAuth {
  kind: number;
  result: string;
}

interface SampleAuthManage extends SampleAuth {
  isManageFlow: boolean;
}

const aFirstMiddlewareResult = 5;
const aSecondMiddlewareResult: SampleAuthManage = {
  kind: 1,
  result: "SUCCESS",
  isManageFlow: true
};

const aFirstMiddlewareReturningRightResult = (_serviceModel: any) => async (
  _request: any
): Promise<E.Either<never, typeof aFirstMiddlewareResult>> => {
  return E.right(aFirstMiddlewareResult);
};

const aSecondMiddlewareReturningRightResult = () => async (
  _request: any
): Promise<E.Either<never, SampleAuthManage>> => {
  return E.right(aSecondMiddlewareResult);
};

const aFirstMiddlewareReturningAnError = () => async (_request: any) => {
  return E.left(ResponseErrorForbiddenNotAuthorized);
};
const aSecondMiddlewareReturningAnError = () => async (_request: any) => {
  return E.left(ResponseErrorForbiddenNotAuthorized);
};
const aMiddlewareThrowingAnError = () => async (_request: any) => {
  throw new Error("Error");
};

const aRequestMock: any = {
  body: {
    firstName: "John",
    lastName: "Doe"
  }
};

describe("SequenceMiddleware", () => {
  it("should return the first middleware 'R0' result if both middlewares return an Either Right", async () => {
    const result = await SequenceMiddleware(
      ResponseErrorForbiddenNotAuthorized
    )(
      aFirstMiddlewareReturningRightResult("fakeServiceModel"),
      aSecondMiddlewareReturningRightResult()
    )(aRequestMock);

    expect(E.isRight(result)).toBeTruthy();
    expect(result).toEqual(E.right(aFirstMiddlewareResult));
  });

  it("should return the first middleware 'R0' result if first middleware return an Either Right", async () => {
    const result = await SequenceMiddleware(
      ResponseErrorForbiddenNotAuthorized
    )(
      aFirstMiddlewareReturningRightResult("fakeServiceModel"),
      aSecondMiddlewareReturningAnError()
    )(aRequestMock);

    expect(E.isRight(result)).toBeTruthy();
    expect(result).toEqual(E.right(aFirstMiddlewareResult));
    // @ts-expect-error
    const _check_type_ko: E.Either<
      unknown,
      typeof aSecondMiddlewareResult
    > = result;
    const _check_type_ok: E.Either<
      unknown,
      typeof aFirstMiddlewareResult
    > = result;
  });

  it("should return the second middleware 'R1' result if only second middleware return an Either Right", async () => {
    const result = await SequenceMiddleware(
      ResponseErrorForbiddenNotAuthorized
    )(
      aFirstMiddlewareReturningAnError(),
      aSecondMiddlewareReturningRightResult()
    )(aRequestMock);

    expect(E.isRight(result)).toBeTruthy();
    expect(result).toEqual(E.right(aSecondMiddlewareResult));

    // @ts-expect-error
    const _check_type_ko: E.Either<
      unknown,
      typeof aFirstMiddlewareResult
    > = result;
    const _check_type_ok: E.Either<
      unknown,
      typeof aSecondMiddlewareResult
    > = result;
  });

  it("should return the default error if both middlewares return a Promise of an Either Left", async () => {
    const result = await SequenceMiddleware(
      ResponseErrorForbiddenNotAuthorized
    )(
      aFirstMiddlewareReturningAnError(),
      aSecondMiddlewareReturningAnError()
    )(aRequestMock);

    expect(E.isLeft(result)).toBeTruthy();
    expect(result).toEqual(E.left(ResponseErrorForbiddenNotAuthorized));
  });

  it("should return the default error if both middlewares throws an exception", async () => {
    const result = await SequenceMiddleware(
      ResponseErrorForbiddenNotAuthorized
    )(
      aMiddlewareThrowingAnError(),
      aMiddlewareThrowingAnError()
    )(aRequestMock);

    expect(E.isLeft(result)).toBeTruthy();
    expect(result).toEqual(E.left(ResponseErrorForbiddenNotAuthorized));
  });
});
