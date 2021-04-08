import * as express from "express";
import { toExpressHandler } from "../express";

describe("toExpressHandler", () => {
  it("should return an express handler", async () => {
    const mockRequest = {
      params: {
        test
      }
    };
    const mockResponse = jest
      .fn()
      .mockReturnValue({ apply: jest.fn(), status: 200 });
    const handler = toExpressHandler(async req => {
      return mockResponse(req.params.test);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler(mockRequest as any, {} as any);
    expect(mockResponse).toHaveBeenCalledTimes(1);
  });
});
