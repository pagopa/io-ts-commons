import { isLeft, right } from "fp-ts/lib/Either";
import * as t from "io-ts";

import {
  basicResponseDecoder,
  BasicResponseType,
  bufferArrayResponseDecoder,
  createFetchRequestForApi,
  IGetApiRequestType,
  IPatchApiRequestType,
  IPostApiRequestType,
  IResponseType,
  RequestResponseTypes
} from "../requests";

import { DateFromString } from "../dates";
import { withoutUndefinedValues } from "../types";

const SimpleModel = t.interface({
  id: t.number,
  name: t.string
});

type SimpleModel = t.TypeOf<typeof SimpleModel>;

type GetSimpleT = IGetApiRequestType<
  {
    readonly id: string;
    readonly p1: number;
    readonly p2: string;
  },
  "Authorization",
  "param1" | "param2",
  BasicResponseType<SimpleModel>
>;

type GetBufferT = IGetApiRequestType<
  {},
  "Authorization",
  never,
  IResponseType<200, Buffer, never>
>;

const getSimpleT: GetSimpleT = {
  headers: () => ({
    // eslint-disable-next-line sonarjs/no-duplicate-string
    Authorization: "Bearer: 123"
  }),
  method: "get",
  query: params => ({ param1: `${params.p1}`, param2: params.p2 }),
  response_decoder: basicResponseDecoder(SimpleModel),
  url: params => `/api/v1/simples/${params.id}`
};

const processedValue = {
  id: 123,
  name: "name processed"
};

const getSimpleTP: GetSimpleT = {
  headers: () => ({
    Authorization: "Bearer: 123"
  }),
  method: "get",
  query: params => ({ param1: `${params.p1}`, param2: params.p2 }),
  response_decoder: basicResponseDecoder(SimpleModel, _ => processedValue),
  url: params => `/api/v1/simples/${params.id}`
};

const getBufferTP: GetBufferT = {
  headers: () => ({
    Authorization: "Bearer: 123"
  }),
  method: "get",
  query: () => withoutUndefinedValues({}),
  response_decoder: bufferArrayResponseDecoder(200),
  url: params => `/api/v1/buffer`
};

type PostSimpleT = IPostApiRequestType<
  {
    readonly value: SimpleModel;
  },
  never,
  never,
  BasicResponseType<SimpleModel>
>;

const postSimpleT: PostSimpleT = {
  body: params => JSON.stringify(params.value),
  headers: () => ({
    "Content-Type": "application/json"
  }),
  method: "post",
  query: () => ({}),
  response_decoder: basicResponseDecoder(SimpleModel),
  url: () => "/api/v1/simples"
};

type PatchSimpleT = IPatchApiRequestType<
  {
    readonly value: SimpleModel;
  },
  never,
  never,
  BasicResponseType<SimpleModel>
>;

const patchSimpleT: PatchSimpleT = {
  body: params => JSON.stringify(params.value),
  headers: () => ({
    "Content-Type": "application/json"
  }),
  method: "patch",
  query: () => ({}),
  response_decoder: basicResponseDecoder(SimpleModel),
  url: () => "/api/v1/simples"
};

const mockFetch = <T>(status: number, json: T) => {
  return (jest.fn(() => ({
    json: () => Promise.resolve(json),
    status
  })) as unknown) as typeof fetch;
};

const baseUrl = "https://localhost";
const simpleValue = {
  id: 123,
  name: "name"
};

const simpleParams = {
  id: "123",
  p1: 1,
  p2: "should be&encoded"
};

describe("A simple GET API", () => {
  it("should produce the URL from params", async () => {
    const fetchApi = mockFetch(200, simpleValue);

    const getSimple = createFetchRequestForApi(getSimpleT, {
      baseUrl,
      fetchApi
    });

    await getSimple(simpleParams);

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(
      fetchApi
    ).toHaveBeenCalledWith(
      "https://localhost/api/v1/simples/123?param1=1&param2=should%20be%26encoded",
      { headers: { Authorization: "Bearer: 123" }, method: "get" }
    );
  });

  it("should parse a valid 200 response with pre-processor", async () => {
    const fetchApi = mockFetch(200, simpleValue);

    const getSimple = createFetchRequestForApi(getSimpleTP, {
      baseUrl,
      fetchApi
    });

    const res = await getSimple(simpleParams);
    expect(res).toEqual(right({ status: 200, value: processedValue }));
  });

  it("should parse a valid 200 response", async () => {
    const fetchApi = mockFetch(200, simpleValue);

    const getSimple = createFetchRequestForApi(getSimpleT, {
      baseUrl,
      fetchApi
    });

    const res = await getSimple(simpleParams);

    expect(res).toEqual(right({ status: 200, value: simpleValue }));
  });

  it("should parse a valid 200 response that returns a Buffer", async () => {
    const base64File =
      "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";
    var buffer = Buffer.from(base64File);
    var arrayBuffer = new Uint8Array(buffer).buffer;

    const mockFetch = (jest.fn(() => ({
      arrayBuffer: async (): Promise<ArrayBuffer> => arrayBuffer,
      ok: true,
      status: 200
    })) as any) as typeof fetch;

    const getBuffer = createFetchRequestForApi(getBufferTP, {
      baseUrl,
      fetchApi: mockFetch
    });

    const res = await getBuffer({});
    expect(res).toEqual(right({ status: 200, value: buffer }));
  });

  it("should return an error on 404 response", async () => {
    const fetchApi = mockFetch(404, undefined);

    const getSimple = createFetchRequestForApi(getSimpleT, {
      baseUrl,
      fetchApi
    });

    const res = await getSimple(simpleParams);

    expect(res).toEqual(
      right({
        status: 404,
        value: undefined
      })
    );
  });

  it("should return a generic error on an unknown response", async () => {
    const fetchApi = mockFetch(999, undefined);

    const getSimple = createFetchRequestForApi(getSimpleT, {
      baseUrl,
      fetchApi
    });

    const res = await getSimple(simpleParams);

    expect(isLeft(res)).toBeTruthy();
    if (isLeft(res)) {
      expect(res.left[0].value).toHaveProperty("status", 999);
    }
  });
});

describe("A simple POST API", () => {
  it("should post the right payload", async () => {
    const fetchApi = mockFetch(200, simpleValue);

    const postSimple = createFetchRequestForApi(postSimpleT, {
      baseUrl,
      fetchApi
    });

    await postSimple({
      value: simpleValue
    });

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi).toHaveBeenCalledWith("https://localhost/api/v1/simples", {
      body: JSON.stringify(simpleValue),
      headers: { "Content-Type": "application/json" },
      method: "post"
    });
  });
});

describe("A simple PATCH API", () => {
  it("should patch the right payload", async () => {
    const fetchApi = mockFetch(200, simpleValue);

    const patchSimple = createFetchRequestForApi(patchSimpleT, {
      baseUrl,
      fetchApi
    });

    await patchSimple({
      value: simpleValue
    });

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi).toHaveBeenCalledWith("https://localhost/api/v1/simples", {
      body: JSON.stringify(simpleValue),
      headers: { "Content-Type": "application/json" },
      method: "patch"
    });
  });
});

describe("RequestReturn", () => {
  it("prova", async () => {
    type ResponseTypes = RequestResponseTypes<GetSimpleT>;

    type Statuses = ResponseTypes["status"];
    const s1: Statuses = 200;
    const s2: Statuses = 404;
    const s3: Statuses = 500;
    // @ts-expect-error expect error because 418 is not a status listed in GetSimpleT responses
    const sErr: Statuses = 418;

    type ValueTypes = ResponseTypes["value"];
    const v1: ValueTypes = "aString";
    const v2: ValueTypes = { id: 1, name: "" };
    // @ts-expect-error expect error because number is not a type returned by GetSimpleT
    const vErr: ValueTypes = 43;

    const res1: ResponseTypes = {
      status: 200,
      value: v2,
      headers: {}
    };
    const res2: ResponseTypes = {
      status: 404,
      value: v1,
      headers: {}
    };
    const res3: ResponseTypes = {
      status: 500,
      value: v1,
      headers: {}
    };

    // @ts-expect-error expect error because string value is not accepted with 200 status
    const resErr: ResponseTypes = {
      status: 200,
      value: v1,
      headers: {}
    };
  });
});

/////////////////////////////////

const aComplexType = t.interface({
  created_at: DateFromString
});
type aComplexType = t.TypeOf<typeof aComplexType>;

type GetComplexT = IGetApiRequestType<
  aComplexType,
  never,
  "created_at",
  BasicResponseType<aComplexType>
>;

const getComplexT: GetComplexT = {
  headers: () => ({}),
  method: "get",
  query: params => ({ created_at: `${params.created_at.toISOString()}` }),
  response_decoder: basicResponseDecoder(aComplexType),
  url: params => `/api/v1/complex`
};

describe("Complex types", () => {
  it("should handle complex types (ie. DateFromString)", async () => {
    const complexValue = {};

    const fetchApi = mockFetch(200, complexValue);

    const getComplex = createFetchRequestForApi(getComplexT, {
      baseUrl,
      fetchApi
    });

    await getComplex({
      created_at: new Date()
    });

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi).toHaveBeenCalledWith(
      expect.stringMatching(
        /https\:\/\/localhost\/api\/v1\/complex\?created_at\=[0-9]{4}\-[0-9]{2}\-(.+)/
      ),
      { method: "get" }
    );
  });
});
