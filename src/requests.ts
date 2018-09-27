/**
 * Type safe wrapper around the fetch API
 */

// tslint:disable:variable-name

// TODO: support for optional query parameters
// TODO: when query/headers type is "never", it should not allow any query/header to be produced
// TODO: add etag support in responses

// The type definition of fetch is needed because it's not provided by TypeScript
export declare function fetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response>;

import * as t from "io-ts";

/**
 * Describes the possible methods of a request
 */
export type RequestMethod = "get" | "post" | "put" | "delete";

/**
 * Describes the possible header keys of a request
 */
// tslint:disable-next-line:no-duplicate-string
export type RequestHeaderKey =
  | "Accept-Encoding"
  | "Authorization"
  | "Content-Type" // tslint:disable-line:no-duplicate-string
  | "Host"
  | "If-None-Match"
  | "Ocp-Apim-Subscription-Key";

/**
 * Describes a set of headers whose keys are of type RequestHeaderKey
 */
export type RequestHeaders<HS extends RequestHeaderKey> = {
  [key in HS]: string
};

/**
 * Describes the query params for this request
 */
export type RequestQuery<K extends string> = Record<K, string>;

/**
 * Generates a set of headers with certain keys (KH) from a parameters object
 * of type P.
 */
export type RequestHeaderProducer<P, KH extends RequestHeaderKey> = (
  params: P
) => RequestHeaders<KH>;

/**
 * Composes two RequestHeaderProducer(s)
 */
export function composeHeaderProducers<
  PI,
  KI extends RequestHeaderKey,
  PH,
  KH extends RequestHeaderKey
>(
  p0: RequestHeaderProducer<PI, KI>,
  p1: RequestHeaderProducer<PH, KH>
): RequestHeaderProducer<PI & PH, KI | KH> {
  return params => {
    const headers0 = p0(params);
    const headers1 = p1(params);
    return {
      // tslint:disable-next-line:no-any
      ...(headers0 as any),
      // tslint:disable-next-line:no-any
      ...(headers1 as any)
    };
  };
}

export type BasicResponseHeaderKey =
  | "Cache-Control"
  | "Content-Encoding"
  | "Content-Type"
  | "Date"
  | "ETag"
  | "Expires"
  | "Transfer-Encoding";

export type ResponseHeaders<H extends string = never> = {
  [key in BasicResponseHeaderKey | H]?: string
};

/**
 * Describes a possible response type: when the status code is S, the response
 * type is T.
 */
export interface IResponseType<S extends number, T, H extends string = never> {
  readonly status: S;
  readonly value: T;
  readonly headers: ResponseHeaders<H>;
}

/**
 * A function that generates a typed representation of a response.
 * It should return undefined in case the response cannot be decoded (e.g.
 * in case of a parsing error).
 */
export type ResponseDecoder<R> = (response: Response) => Promise<R | undefined>;

/**
 * Composes two ResponseDecoder(s)
 */
export function composeResponseDecoders<R1, R2>(
  d1: ResponseDecoder<R1>,
  d2: ResponseDecoder<R2>
): ResponseDecoder<R1 | R2> {
  // TODO: make sure R1, R2 don't intersect
  return async response => {
    const r1 = await d1(response);
    return r1 !== undefined ? r1 : await d2(response);
  };
}

/**
 * Fully describes an API request.
 *
 * @param M   The request method
 * @param P   The type of input parameters
 * @param H   The headers that must be defined for this request
 * @param R   The possible response types for this request
 */
export interface IBaseApiRequestType<
  M extends RequestMethod,
  P,
  H extends RequestHeaderKey,
  Q extends string,
  R
> {
  readonly method: M;
  readonly url: (params: P) => string;
  readonly query: (params: P) => RequestQuery<Q>;
  readonly headers: RequestHeaderProducer<P, H>;
  readonly response_decoder: ResponseDecoder<R>;
}

/**
 * Fully describes a GET request.
 */
export interface IGetApiRequestType<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> extends IBaseApiRequestType<"get", P, KH, Q, R> {
  readonly method: "get";
}

/**
 * Fully describes a POST request.
 *
 * POST requests require to provide the "Content-Type" header.
 */
export interface IPostApiRequestType<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> extends IBaseApiRequestType<"post", P, KH | "Content-Type", Q, R> {
  readonly method: "post";
  readonly body: (params: P) => string;
}

/**
 * Fully describes a PUT request.
 *
 * PUT requests require to provide the "Content-Type" header.
 */
export interface IPutApiRequestType<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> extends IBaseApiRequestType<"put", P, KH | "Content-Type", Q, R> {
  readonly method: "put";
  readonly body: (params: P) => string;
}

/**
 * Fully describes a DELETE request.
 */
export interface IDeleteApiRequestType<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> extends IBaseApiRequestType<"delete", P, KH, Q, R> {
  readonly method: "delete";
}

/**
 * The union of the possible ApiRequest types
 */
export type ApiRequestType<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> =
  | IGetApiRequestType<P, KH, Q, R>
  | IPostApiRequestType<P, KH, Q, R>
  | IPutApiRequestType<P, KH, Q, R>
  | IDeleteApiRequestType<P, KH, Q, R>;

/**
 * The type of the Params of an ApiRequestType
 */
export type TypeofApiParams<T> = T extends ApiRequestType<
  infer P,
  infer KH,
  infer Q,
  infer R
>
  ? P
  : never;

/**
 * The type of the Response of an ApiRequestType
 */
export type TypeofApiResponse<T> = T extends ApiRequestType<
  infer P,
  infer KH,
  infer Q,
  infer R
>
  ? R
  : never;

/**
 * A union type of the Response statuses of an ApiRequestType
 */
export type TypeOfApiResponseStatus<T> = TypeofApiResponse<
  T
  // tslint:disable-next-line:no-any
> extends IResponseType<infer S, any>
  ? S
  : never;

/**
 * The type of the method that runs an ApiRequestType
 */
export type TypeofApiCall<T> = (
  params: TypeofApiParams<T>
) => Promise<TypeofApiResponse<T> | undefined>;

export type ApiRequestTypeForMethod<
  M extends RequestMethod,
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> = M extends "get"
  ? IGetApiRequestType<P, KH, Q, R>
  : M extends "post"
    ? IPostApiRequestType<P, KH, Q, R>
    : M extends "put" ? IPutApiRequestType<P, KH, Q, R> : never;

//
// builder
//

export type EmptyApiRequestBuilder<
  M extends RequestMethod,
  P = {},
  KH extends RequestHeaderKey = never,
  Q extends string = never,
  R = never
> = ApiRequestBuilder<M, P, KH, Q, R, ApiRequestTypeForMethod<M, P, KH, Q, R>>;

const emptyBaseRequest = {
  headers: () => ({}),
  query: () => ({}),
  response_decoder: () => Promise.reject({}),
  url: () => ""
};

const emptyBasePutOrPostRequest = {
  ...emptyBaseRequest,
  body: () => JSON.stringify({}),
  headers: () => ({ "Content-Type": "application/json" })
};

/**
 * A class for building ApiRequest(s)
 */
export class ApiRequestBuilder<
  M extends RequestMethod,
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R,
  T extends ApiRequestTypeForMethod<M, P, KH, Q, R>
> {
  /**
   * Creates a new empty request with the GET method.
   */
  public static ofGet(): EmptyApiRequestBuilder<"get"> {
    return new ApiRequestBuilder<
      "get",
      {},
      never,
      never,
      never,
      ApiRequestTypeForMethod<"get", {}, never, never, never>
    >({ ...emptyBaseRequest, method: "get" });
  }

  /**
   * Creates a new empty request with the POST method.
   */
  public static ofPost(): EmptyApiRequestBuilder<"post", {}, "Content-Type"> {
    return new ApiRequestBuilder<
      "post",
      {},
      "Content-Type",
      never,
      never,
      ApiRequestTypeForMethod<"post", {}, "Content-Type", never, never>
    >({
      ...emptyBasePutOrPostRequest,
      method: "post"
    });
  }

  /**
   * Creates a new empty request with the PUT method.
   */
  /* tslint:disable-next-line:no-identical-functions */
  public static ofPut(): EmptyApiRequestBuilder<"put", {}, "Content-Type"> {
    return new ApiRequestBuilder<
      "put",
      {},
      "Content-Type",
      never,
      never,
      ApiRequestTypeForMethod<"put", {}, "Content-Type", never, never>
    >({
      ...emptyBasePutOrPostRequest,
      method: "put"
    });
  }

  constructor(private readonly _request: T) {}

  public get(): T {
    return this._request;
  }

  /**
   * Adds query parameters
   */
  public withQuery<P1, Q1 extends string>(
    query: (params: P1) => RequestQuery<Q1>
  ): ApiRequestBuilder<
    M,
    P & P1,
    KH,
    Q | Q1,
    R,
    ApiRequestTypeForMethod<M, P & P1, KH, Q | Q1, R>
  > {
    const newQuery = (p: P & P1) => ({
      // tslint:disable-next-line:no-any
      ...(this._request.query(p) as any),
      // tslint:disable-next-line:no-any
      ...(query(p) as any)
    });
    return new ApiRequestBuilder({
      // tslint:disable-next-line:no-any
      ...(this._request as any),
      query: newQuery
    });
  }

  /**
   * Adds headers
   */
  public withHeaders<P1, KH1 extends RequestHeaderKey>(
    headers: RequestHeaderProducer<P1, KH1>
  ): ApiRequestBuilder<
    M,
    P & P1,
    KH | KH1,
    Q,
    R,
    ApiRequestTypeForMethod<M, P & P1, KH | KH1, Q, R>
  > {
    const newHeaders = (p: P & P1) => ({
      // tslint:disable-next-line:no-any
      ...(this._request.headers(p) as any),
      // tslint:disable-next-line:no-any
      ...(headers(p) as any)
    });
    return new ApiRequestBuilder({
      // tslint:disable-next-line:no-any
      ...(this._request as any),
      headers: newHeaders
    });
  }

  /**
   * Adds response decoder
   */
  public withResponseDecoder<R1>(
    response_decoder: ResponseDecoder<R1>
  ): ApiRequestBuilder<
    M,
    P,
    KH,
    Q,
    R1,
    ApiRequestTypeForMethod<M, P, KH, Q, R1>
  > {
    return new ApiRequestBuilder({
      // tslint:disable-next-line:no-any
      ...(this._request as any),
      response_decoder
    });
  }
}

//
// helpers
//

function queryStringFromParams<P extends string>(
  params: RequestQuery<P>
): string | undefined {
  const keys = Object.getOwnPropertyNames(params);
  if (keys.length === 0) {
    return undefined;
  }
  return keys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k as P])}`)
    .join("&");
}

/**
 * Returns an async method that implements the provided ApiRequestType backed
 * by the "fetch" API.
 */
export function createFetchRequestForApi<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
>(
  requestType: ApiRequestType<P, KH, Q, R>,
  options: {
    readonly baseUrl?: string;
    readonly fetchApi?: typeof fetch;
  } = {}
): (params: P) => Promise<R | undefined> {
  // TODO: handle unsuccessful fetch and HTTP errors
  // @see https://www.pivotaltracker.com/story/show/154661120
  return async params => {
    // Build operationUrl from the params
    const operationUrl = requestType.url(params);

    // Build request url from baseUrl if provided
    const requestUrl = options.baseUrl
      ? options.baseUrl +
        (options.baseUrl.endsWith("/") || operationUrl.startsWith("/")
          ? ""
          : "/") +
        operationUrl
      : operationUrl;

    // Generate the query params
    const queryParams = requestType.query(params);
    const queryString = queryStringFromParams(queryParams);

    // Append the query params to the URL
    const url =
      queryString === undefined ? requestUrl : `${requestUrl}?${queryString}`;

    // get the headers from the params
    const headers = requestType.headers.apply(params);

    // build the request
    const baseRequest: RequestInit = {
      method: requestType.method
    };

    const requestWithOptionalHeaders =
      Object.keys(headers).length === 0
        ? baseRequest
        : {
            ...baseRequest,
            headers
          };

    const requestWithOptionalHeadersAndBody =
      requestType.method === "get" || requestType.method === "delete"
        ? requestWithOptionalHeaders
        : {
            ...requestWithOptionalHeaders,
            body: requestType.body(params)
          };

    // Get the fetch client
    const myFetch = options.fetchApi ? options.fetchApi : fetch;

    // make the async call
    const response = await myFetch(url, requestWithOptionalHeadersAndBody);

    // decode the response
    return requestType.response_decoder(response);
  };
}

/**
 * An header producer that sets the Content-Type to application/json
 */
export const ApiHeaderJson: RequestHeaderProducer<{}, "Content-Type"> = () => ({
  "Content-Type": "application/json"
});

/**
 * An io-ts based ResponseDecoder, it checks the response status and the
 * payload against the provided type.
 *
 * @param status  The response status handled by this decoder
 * @param type    The response type corresponding to the status
 */
export function ioResponseDecoder<
  S extends number,
  R,
  O = R,
  H extends string = never
>(status: S, type: t.Type<R, O>): ResponseDecoder<IResponseType<S, R, H>> {
  return async (response: Response) => {
    if (response.status !== status) {
      return undefined;
    }
    const json = await response.json();
    const validated = type.decode(json);
    if (validated.isLeft()) {
      return undefined;
    }
    return {
      // tslint:disable-next-line:no-any
      headers: response.headers as any,
      status,
      value: validated.value
    };
  };
}

/**
 * A basic ResponseDecoder that returns an Error with the status text if the
 * response status is S.
 */
export function basicErrorResponseDecoder<
  S extends number,
  H extends string = never
>(status: S): ResponseDecoder<IResponseType<S, Error, H>> {
  return async response => {
    if (response.status !== status) {
      return undefined;
    }
    return {
      // tslint:disable-next-line:no-any
      headers: response.headers as any,
      status,
      value: new Error(response.statusText)
    };
  };
}

/**
 * A basic set of responses where the 200 status corresponds to a payload of
 * type R and 404 and 500 to an Error
 */
export type BasicResponseType<R, H extends string = never> =
  | IResponseType<200, R, H>
  | IResponseType<404, Error, H>
  | IResponseType<500, Error, H>;

/**
 * Returns a ResponseDecoder for BasicResponseType<R>
 */
export function basicResponseDecoder<R, O = R, H extends string = never>(
  type: t.Type<R, O>
): ResponseDecoder<BasicResponseType<R, H>> {
  return composeResponseDecoders(
    composeResponseDecoders(
      ioResponseDecoder<200, R, O, H>(200, type),
      basicErrorResponseDecoder<404, H>(404)
    ),
    basicErrorResponseDecoder<500, H>(500)
  );
}

/**
 * A response decoder that ignores the payload and returns a constant value
 */
export function constantResponseDecoder<
  T,
  S extends number,
  H extends string = never
>(status: S, value: T): ResponseDecoder<IResponseType<S, T, H>> {
  return async response => {
    if (response.status !== status) {
      return undefined;
    }
    return {
      // tslint:disable-next-line:no-any
      headers: response.headers as any,
      status,
      value
    };
  };
}

/**
 * Returns a RequestHeaderProducer that produces an Authorization header of type
 * "bearer token" taking the value from the "token" parameter of each request.
 */
export function ParamAuthorizationBearerHeaderProducer<
  P extends { readonly token: string }
>(): RequestHeaderProducer<P, "Authorization"> {
  return (p: P): RequestHeaders<"Authorization"> => {
    return {
      Authorization: `Bearer ${p.token}`
    };
  };
}

/**
 * Returns a RequestHeaderProducer that produces an Authorization header of type
 * "bearer token" with a fixed token value.
 */
export function AuthorizationBearerHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, "Authorization"> {
  return () => ({
    Authorization: `Bearer ${token}`
  });
}
