// tslint:disable:no-any

import * as Express from "express";
import { response as MockResponse } from "jest-mock-express";

import { right } from "fp-ts/lib/Either";
import { none, some } from "fp-ts/lib/Option";

import { ResponseSuccessJson } from "../responses";

function flushPromises<T>(): Promise<T> {
  return new Promise(resolve => setImmediate(resolve));
}

describe("ResponseSuccessJson", () => {
  it("should remove the kind property", () => {
    const kindlessData = {
      a: 1,
      b: "2"
    };

    const kindedData = {
      ...kindlessData,
      kind: "I_AM_UNIQUE"
    };

    const mockResponse = MockResponse() as Express.Response;

    const jsonResponse = ResponseSuccessJson(kindedData);

    jsonResponse.apply(mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith(kindlessData);
  });
});
