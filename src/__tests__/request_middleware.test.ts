// tslint:disable:no-any

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
  it("should process a request with a resolving middleware (1)", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(ResolvingMiddleware)(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).toHaveBeenCalledWith("dummy");
      expect(r).toEqual(response);
    });
  });

  it("should process a request with a resolving middleware (2)", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingMiddleware
    )(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).toHaveBeenCalledWith("dummy", "dummy");
      expect(r).toEqual(response);
    });
  });

  it("should process a request with a resolving middleware (3)", () => {
    const mockHandler = jest.fn(() => Promise.resolve(response));
    const handler = withRequestMiddlewares(
      ResolvingMiddleware,
      ResolvingMiddleware,
      ResolvingMiddleware
    )(mockHandler);

    return handler(request as any).then(r => {
      expect(mockHandler).toHaveBeenCalledWith("dummy", "dummy", "dummy");
      expect(r).toEqual(response);
    });
  });

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
