import { ResponseSuccessJson } from "../responses";

import MockResponse from "../__mocks__/response";

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
