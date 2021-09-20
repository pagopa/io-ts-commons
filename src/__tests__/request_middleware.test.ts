// eslint-disable @typescript-eslint/no-explicit-any

import {
  IRequestMiddleware,
  withRequestMiddlewares,
  withRequestMiddlewaresT
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

const request = {
  params: {
    dummy: "dummy"
  }
};

const response = {} as IResponse<{}>;

describe("withRequestMiddlewares", () => {
  it("should allow up to 7 middlewares", () => {
    expect(withRequestMiddlewares.length).toBe(7);
  });

  // one case for any number of supported middlewares
  const cases = [...Array(withRequestMiddlewares.length).keys()].map((_, i) => [
    i + 1
  ]);
  it.each(cases)(
    "should process a request with %i resolving middlewares",
    n => {
      const mockHandler = jest.fn(() => Promise.resolve(response));

      const middlewares = Array(n).fill(ResolvingMiddleware);
      const expected = Array(n).fill("dummy");

      // @ts-ignore because withRequestMiddlewares complaints about middlewares could be any size
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

      // @ts-ignore because withRequestMiddlewares complaints about middlewares could be any size
      const handler = withRequestMiddlewares(...middlewares)(mockHandler);

      return handler(request as any).then((r: any) => {
        expect(mockHandler).not.toHaveBeenCalled();
        expect(r.kind).toBe("IResponseErrorValidation");
      });
    }
  );

  it("should process a request with a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(RejectingMiddleware)(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });

  it("should stop processing middlewares after a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(
      RejectingMiddleware,
      ResolvingMiddleware
    )(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });
});

describe("withRequestMiddlewaresT", () => {
  // one case for any number of supported middlewares
  const cases = [1, 5, 10, 100];
  it.each(cases)(
    "should process a request with %i resolving middlewares",
    n => {
      const mockHandler = jest.fn(() => Promise.resolve(response));

      console.log("n: " + n);

      const middlewares = Array(n).fill(ResolvingMiddleware);
      const expected = Array(n).fill("dummy");

      const handler = withRequestMiddlewaresT(...middlewares)(mockHandler);

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

      const handler = withRequestMiddlewaresT(...middlewares)(mockHandler);

      return handler(request as any).then((r: any) => {
        expect(mockHandler).not.toHaveBeenCalled();
        expect(r.kind).toBe("IResponseErrorValidation");
      });
    }
  );

  it("should process a request with a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewaresT(RejectingMiddleware)(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });

  it("should stop processing middlewares after a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewaresT(
      RejectingMiddleware,
      ResolvingMiddleware
    )(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });
});
