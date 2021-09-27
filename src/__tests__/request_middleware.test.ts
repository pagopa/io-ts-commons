// eslint-disable @typescript-eslint/no-explicit-any

import {
  IRequestMiddleware,
  withRequestMiddlewares
} from "../request_middleware";
import {
  IResponse,
  IResponseErrorValidation,
  ResponseErrorValidation
} from "../responses";

import { left, right } from "fp-ts/lib/Either";

const ResolvingMiddleware: IRequestMiddleware<
  "IResponseErrorNever",
  string
> = req => {
  return Promise.resolve(right<never, string>(req.params.dummy));
};

const ResolvingNumberMiddleware: IRequestMiddleware<
  "IResponseErrorNever",
  number
> = req => {
  return Promise.resolve(right<never, number>(1));
};

const RejectingMiddleware: IRequestMiddleware<
  "IResponseErrorValidation",
  string
> = _ => {
  return Promise.resolve(
    left<IResponseErrorValidation, string>(
      ResponseErrorValidation("NOK", "NOT")
    )
  );
};

const DelayedFailureMiddleware: IRequestMiddleware<
"IResponseErrorValidation",
string
> = _ => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Error")), 500)
  })
};

const request = {
  params: {
    dummy: "dummy"
  }
};

const response = {} as IResponse<{}>;

describe("withRequestMiddlewares", () => {
  // one case for any number of supported middlewares
  const cases = [1, 5, 10, 100];
  it.each(cases)(
    "should process a request with %i resolving middlewares",
    n => {
      const mockHandler = jest.fn(() => Promise.resolve(response));

      const middlewares = Array(n).fill(ResolvingMiddleware);
      const expected = Array(n).fill("dummy");

      const handler = withRequestMiddlewares(...middlewares)(mockHandler);

      return handler(request as any).then((r: any) => {
        expect(mockHandler).toHaveBeenCalledWith(...expected);
        expect(r).toEqual(response);
      });
    }
  );

  it.each(cases)(
    "should process a request with %i middlewares whose last one rejects",
    n => {
      const mockHandler = jest.fn(() => Promise.resolve(response));

      // Provide a series of resolving middlewares followed by a rejecting one
      //   by providing the rejecting middleware at last, we ensure it's actually executed and its result matters
      const middlewares = [
        ...Array(n - 1).fill(ResolvingMiddleware),
        RejectingMiddleware
      ];

      const handler = withRequestMiddlewares(...middlewares)(mockHandler);

      return handler(request as any).then((r: any) => {
        expect(mockHandler).not.toHaveBeenCalled();
        expect(r.kind).toBe("IResponseErrorValidation");
      });
    }
  );

  it("should accept handler with right parameters", () => {
    const mockHandler: (
      param1: string,
      param2: number
    ) => Promise<IResponse<{}>> = jest.fn((param1, param2) =>
      Promise.resolve(response)
    );

    const handler = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingNumberMiddleware
    )(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).toHaveBeenCalledWith(...["dummy", 1]);
      expect(r).toEqual(response);
    });
  });

  it("should NOT accept handler with type mismatching parameters", () => {
    // an handler with [string, string] arguments
    const mockHandler: (
      param1: string,
      param2: string
    ) => Promise<IResponse<{}>> = jest.fn(() => Promise.resolve(response));

    // composing middleware resulting in [string, number]
    const withComposedMiddlewares = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingNumberMiddleware
    );

    // @ts-expect-error as we want the compiler to notice we're passing an handler with wrong signature
    const _handler = withComposedMiddlewares(mockHandler);
  });

  it("should NOT accept handler with more parameters than middlewares", () => {
    const mockHandler: (
      param1: string,
      param2: number,
      param3: number
    ) => Promise<IResponse<{}>> = jest.fn(() => Promise.resolve(response));

    const withComposedMiddlewares = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingNumberMiddleware
    );

    // @ts-expect-error
    const _handler = withComposedMiddlewares(mockHandler);
  });

  it("should accept handler with less parameters than middlewares", () => {
    const mockHandler: (
      param1: string,
      param2: number
    ) => Promise<IResponse<{}>> = jest.fn(() => Promise.resolve(response));

    const withComposedMiddlewares = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingNumberMiddleware,
      ResolvingNumberMiddleware
    );

    const _handler = withComposedMiddlewares(mockHandler);
  });

  it("should process a request with a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(RejectingMiddleware)(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });

  it("should return an IResponseErrorInternal in case middleware fails", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(DelayedFailureMiddleware)(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorInternal");
    });
  });

  it("should stop processing middlewares after a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));

    const mockMiddlewareBeforeReject = jest.fn();
    const mockMiddlewareAfterReject = jest.fn();

    const handler = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingMiddleware,
      RejectingMiddleware,
      mockMiddlewareAfterReject
    )(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockMiddlewareAfterReject).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });
});
