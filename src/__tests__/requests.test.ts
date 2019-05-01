import { right } from "fp-ts/lib/Either";
import * as t from "io-ts";

import {
  basicResponseDecoder,
  BasicResponseType,
  createFetchRequestForApi,
  IGetApiRequestType,
  IPostApiRequestType
} from "../requests";

import { DateFromString } from "../dates";

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

const getSimpleT: GetSimpleT = {
  headers: () => ({
    Authorization: "Bearer: 123"
  }),
  method: "get",
  query: params => ({ param1: `${params.p1}`, param2: params.p2 }),
  response_decoder: basicResponseDecoder(SimpleModel),
  url: params => `/api/v1/simples/${params.id}`
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

function mockFetch<T>(status: number, json: T): typeof fetch {
  return jest.fn(() => ({
    json: () => Promise.resolve(json),
    status
  }));
}

const baseUrl = "https://localhost";
const simpleValue = {
  id: 123,
  name: "name"
};

const processedValue = {
  id: 123,
  name: "name processed"
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

    const res = await getSimple(simpleParams);

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi).toHaveBeenCalledWith(
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

    expect(res.isLeft()).toBeTruthy();
    if (res.isLeft()) {
      expect(res.value[0].value).toHaveProperty("status", 999);
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

    const res = await postSimple({
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

    const res = await getComplex({
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
