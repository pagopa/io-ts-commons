// eslint-disable @typescript-eslint/no-explicit-any

import {
  IRequestMiddleware,
  withRequestMiddlewaresStruct
} from "../request_middleware_2v";
import {
  IResponse,
  IResponseErrorValidation,
  ResponseErrorValidation
} from "../responses";

import { left, right } from "fp-ts/lib/Either";
import { string } from "fp-ts";

const ResolvingMiddleware: IRequestMiddleware<never, string> = req => {
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
    expect(withRequestMiddlewaresStruct.length).toBe(7);
  });

  // one case for any number of supported middlewares
  const cases = [1, 2, 3, 10];
  it.each(cases)(
    "should process a request with %i resolving middlewares",
    n => {
      const mockHandler = jest.fn(() => Promise.resolve(response));

      const middlewares = [...Array(n).keys()].reduce((prev, curr, i) => {
        prev["middleware_" + i] = ResolvingMiddleware;
        return prev;
      }, {} as Record<string, any>);
      const expected = [...Array(n).keys()].reduce((prev, curr, i) => {
        prev["middleware_" + i] = "dummy";
        return prev;
      }, {} as Record<string, string>);

      // @ts-ignore because withRequestMiddlewares complaints about middlewares could be any size
      const handler = withRequestMiddlewaresStruct(middlewares)(mockHandler);

      console.log(expected);

      return handler(request as any).then((r: any) => {
        expect(mockHandler).toHaveBeenCalledWith(expected);
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
      const middlewares = [...Array(n).keys()].reduce((prev, _, i) => {
        prev["middleware_" + i] =
          i < n - 1 ? ResolvingMiddleware : RejectingMiddleware;
        return prev;
      }, {} as Record<string, any>);

      // @ts-ignore because withRequestMiddlewares complaints about middlewares could be any size
      const handler = withRequestMiddlewaresStruct(middlewares)(mockHandler);

      return handler(request as any).then((r: any) => {
        expect(mockHandler).not.toHaveBeenCalled();
        expect(r.kind).toBe("IResponseErrorValidation");
      });
    }
  );

  it("should process a request with a rejecting middleware", () => {
    const mockHandler = jest.fn(({ reject }) => Promise.resolve(response));

    const handler = withRequestMiddlewaresStruct({
      reject: RejectingMiddleware
    })(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });

  it("should stop processing middlewares after a rejecting middleware", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewaresStruct({
      reject: RejectingMiddleware,
      resolve: ResolvingMiddleware
    })(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).not.toHaveBeenCalled();
      expect(r.kind).toBe("IResponseErrorValidation");
    });
  });
});
