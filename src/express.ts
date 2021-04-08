import * as express from "express";
import { IResponse, ResponseErrorInternal } from "./responses";

/**
 * Convenience method that transforms a function (handler),
 * which takes an express.Request as input and returns an IResponse,
 * into an express controller.
 */
// eslint-disable-next-line  prefer-arrow/prefer-arrow-functions
export function toExpressHandler<T>(
  handler: (req: express.Request) => Promise<IResponse<T>>
): <P>(req: express.Request, res: express.Response, object?: P) => void {
  // eslint-disable-next-line  @typescript-eslint/explicit-function-return-type
  return async (req, res, object) => {
    try {
      const response = await handler.call(object, req);
      response.apply(res);
    } catch (e) {
      ResponseErrorInternal(e).apply(res);
    }
  };
}
