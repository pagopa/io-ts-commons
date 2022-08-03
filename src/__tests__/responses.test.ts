import { ResponseSuccessJson } from "../responses";

import MockResponse from "../__mocks__/response";

import { getResponseErrorForbiddenNoAuthorizationGroups, ResponseErrorForbiddenNoAuthorizationGroups, ResponseErrorForbiddenNotAuthorized, getResponseErrorForbiddenNotAuthorized} from "../responses";

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

    const mockResponse = MockResponse();

    const jsonResponse = ResponseSuccessJson(kindedData);

    jsonResponse.apply(mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith(kindlessData);
  });
});

describe("ResponseErrorForbiddenNotAuthorized", () => {

  it("should return the standard response", () => {
    expect(getResponseErrorForbiddenNotAuthorized())
      .toMatchObject(expect.objectContaining({kind: "IResponseErrorForbiddenNotAuthorized", detail: expect.stringContaining("You do not have enough permission to complete the operation you requested")}));
    expect(ResponseErrorForbiddenNotAuthorized)
      .toMatchObject(expect.objectContaining({kind: "IResponseErrorForbiddenNotAuthorized", detail: expect.stringContaining("You do not have enough permission to complete the operation you requested")}));
  })

  it("should return a response with a custom detail", () => {
    const customDetail = "aCustomDetail";
    expect(getResponseErrorForbiddenNotAuthorized(customDetail))
      .toMatchObject(expect.objectContaining({kind: "IResponseErrorForbiddenNotAuthorized", detail: expect.stringContaining(customDetail)}));
  })

})

describe("ResponseErrorForbiddenNoAuthorizationGroups ", () => {

  it("should return the standard response", () => {
    expect(getResponseErrorForbiddenNoAuthorizationGroups())
      .toMatchObject(expect.objectContaining({kind: "IResponseErrorForbiddenNoAuthorizationGroups", detail: expect.stringContaining("You are not part of any valid scope, you should ask the administrator to give you the required permissions.")}));
    expect(ResponseErrorForbiddenNoAuthorizationGroups)
      .toMatchObject(expect.objectContaining({kind: "IResponseErrorForbiddenNoAuthorizationGroups", detail: expect.stringContaining("You are not part of any valid scope, you should ask the administrator to give you the required permissions.")}));
  })

  it("should return a response with a custom detail", () => {
    const customDetail = "aCustomDetail";
    expect(getResponseErrorForbiddenNoAuthorizationGroups(customDetail))
      .toMatchObject(expect.objectContaining({kind: "IResponseErrorForbiddenNoAuthorizationGroups", detail: expect.stringContaining(customDetail)}));
  })

})
