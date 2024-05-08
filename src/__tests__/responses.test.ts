import {
  HttpStatusCodeEnum,
  ResponseErrorPreconditionFailed,
  ResponseErrorUnauthorized,
  ResponseSuccessJson,
} from "../responses";

import MockResponse from "../__mocks__/response";

import {
  getResponseErrorForbiddenNoAuthorizationGroups,
  ResponseErrorForbiddenNoAuthorizationGroups,
  ResponseErrorForbiddenNotAuthorized,
  getResponseErrorForbiddenNotAuthorized,
} from "../responses";

describe("ResponseSuccessJson", () => {
  it("should remove the kind property", () => {
    const kindlessData = {
      a: 1,
      b: "2",
    };

    const kindedData = {
      ...kindlessData,
      kind: "I_AM_UNIQUE",
    };

    const mockResponse = MockResponse();

    const jsonResponse = ResponseSuccessJson(kindedData);

    jsonResponse.apply(mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith(kindlessData);
  });
});

describe("ResponseErrorUnauthorized", () => {
  const anErrorDetail = "Invalid credentials";
  it("should return the standard response", () => {
    expect(ResponseErrorUnauthorized(anErrorDetail)).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorUnauthorized",
        detail: `Unauthorized: ${anErrorDetail}`,
      })
    );
  });
});

describe("ResponseErrorForbiddenNotAuthorized", () => {
  it("should return the standard response", () => {
    expect(getResponseErrorForbiddenNotAuthorized()).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorForbiddenNotAuthorized",
        detail: expect.stringContaining(
          "You do not have enough permission to complete the operation you requested"
        ),
      })
    );
    expect(ResponseErrorForbiddenNotAuthorized).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorForbiddenNotAuthorized",
        detail: expect.stringContaining(
          "You do not have enough permission to complete the operation you requested"
        ),
      })
    );
  });

  it("should return a response with a custom detail", () => {
    const customDetail = "aCustomDetail";
    expect(getResponseErrorForbiddenNotAuthorized(customDetail)).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorForbiddenNotAuthorized",
        detail: expect.stringContaining(customDetail),
      })
    );
  });
});

describe("ResponseErrorForbiddenNoAuthorizationGroups ", () => {
  it("should return the standard response", () => {
    expect(getResponseErrorForbiddenNoAuthorizationGroups()).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorForbiddenNoAuthorizationGroups",
        detail: expect.stringContaining(
          "You are not part of any valid scope, you should ask the administrator to give you the required permissions."
        ),
      })
    );
    expect(ResponseErrorForbiddenNoAuthorizationGroups).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorForbiddenNoAuthorizationGroups",
        detail: expect.stringContaining(
          "You are not part of any valid scope, you should ask the administrator to give you the required permissions."
        ),
      })
    );
  });

  it("should return a response with a custom detail", () => {
    const customDetail = "aCustomDetail";
    expect(
      getResponseErrorForbiddenNoAuthorizationGroups(customDetail)
    ).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorForbiddenNoAuthorizationGroups",
        detail: expect.stringContaining(customDetail),
      })
    );
  });
});

describe("ResponseErrorPreconditionFailed", () => {
  const expectedDetail = "The precondition are failed";
  it("should return the standard response with a detail", () => {
    expect(ResponseErrorPreconditionFailed(expectedDetail)).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorPreconditionFailed",
        detail: expect.stringContaining(expectedDetail),
      })
    );
  });

  it("should return a response with detail and custom problemType", () => {
    const customProblemType = "https://customproblemtype.com";
    const mockResponse = MockResponse();
    const response = ResponseErrorPreconditionFailed(
      expectedDetail,
      customProblemType
    );
    expect(response).toMatchObject(
      expect.objectContaining({
        kind: "IResponseErrorPreconditionFailed",
        detail: expect.stringContaining(expectedDetail),
      })
    );

    response.apply(mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatusCodeEnum.HTTP_STATUS_412,
        type: customProblemType,
        detail: expect.stringContaining(expectedDetail),
        title: "Precondition Failed",
      })
    );
  });
});
