/**
 * Type safe wrapper around the fetch API
 */

// eslint-disable camelcase

// TODO: support for optional query parameters
// TODO: when query/headers type is "never", it should not allow any query/header to be produced
// TODO: add etag support in responses

import { left, right } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";

/**
 * Describes the possible methods of a request
 */
export type RequestMethod = "get" | "post" | "put" | "delete" | "patch";

/**
 * Describes the possible header keys of a request
 *
 * @deprecated This type used to enforce a contraint on a specific set of headers to be allowed. We decided to relax such constraint and to accept any string as the friction of being constrained on which header to use is not worth the little value it adds.
 */
export type RequestHeaderKey = string;

/**
 * Describes a set of headers whose keys are of type RequestHeaderKey
 */
export type RequestHeaders<HS extends RequestHeaderKey> = Record<HS, string>;

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
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function composeHeaderProducers<
  PI,
  KI extends RequestHeaderKey,
  PH,
  KH extends RequestHeaderKey
>(
  p0: RequestHeaderProducer<PI, KI>,
  p1: RequestHeaderProducer<PH, KH>
): RequestHeaderProducer<PI & PH, KI | KH> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return params => {
    const headers0 = p0(params);
    const headers1 = p1(params);
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(headers0 as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(headers1 as any)
    };
  };
}

export type BasicResponseHeaderKey =
  | "Cache-Control"
  | "Content-Encoding"
  | "Content-Type" // eslint-disable-line sonarjs/no-duplicate-string
  | "Date"
  | "ETag"
  | "Expires"
  | "Transfer-Encoding";

export type ResponseHeaders<H extends string = never> = {
  [key in BasicResponseHeaderKey | H]?: string;
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
export type ResponseDecoder<R> = (
  response: Response
) => Promise<t.Validation<R> | undefined>;

/**
 * Composes two ResponseDecoder(s)
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function composeResponseDecoders<R1, R2>(
  d1: ResponseDecoder<R1>,
  d2: ResponseDecoder<R2>
): ResponseDecoder<R1 | R2> {
  // TODO: make sure R1, R2 don't intersect
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
  readonly body: (params: P) => string | FormData;
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
  readonly body: (params: P) => string | FormData;
}

/**
 * Fully describes a PATCH request.
 *
 * PATCH requests require to provide the "Content-Type" header.
 */
export interface IPatchApiRequestType<
  P,
  KH extends RequestHeaderKey,
  Q extends string,
  R
> extends IBaseApiRequestType<"patch", P, KH | "Content-Type", Q, R> {
  readonly method: "patch";
  readonly body: (params: P) => string | FormData;
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
  | IPatchApiRequestType<P, KH, Q, R>
  | IDeleteApiRequestType<P, KH, Q, R>;

/**
 * The type of the Params of an ApiRequestType
 */
export type TypeofApiParams<T> = T extends ApiRequestType<
  infer P,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _KH,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _Q,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _R
>
  ? P
  : never;

/**
 * The type of the Response of an ApiRequestType
 */
export type TypeofApiResponse<T> = T extends ApiRequestType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _P,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _KH,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _Q,
  infer R
>
  ? R
  : never;

/**
 * A union type of the Response statuses of an ApiRequestType
 */
export type TypeOfApiResponseStatus<T> = TypeofApiResponse<
  T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> extends IResponseType<infer S, any>
  ? S
  : never;

/**
 * The type of the method that runs an ApiRequestType
 */
export type TypeofApiCall<T> = (
  params: TypeofApiParams<T>
) => Promise<t.Validation<TypeofApiResponse<T>>>;

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
  : M extends "put"
  ? IPutApiRequestType<P, KH, Q, R>
  : never;

//
// builder
//

export type EmptyApiRequestBuilder<
  M extends RequestMethod,
  // eslint-disable-next-line @typescript-eslint/ban-types
  P = {},
  KH extends RequestHeaderKey = never,
  Q extends string = never,
  R = never
> = ApiRequestBuilder<M, P, KH, Q, R, ApiRequestTypeForMethod<M, P, KH, Q, R>>;

const emptyBaseRequest = {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  headers: () => ({}),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  query: () => ({}),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  response_decoder: () => Promise.reject({}),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  url: () => ""
};

const emptyBasePutOrPostRequest = {
  ...emptyBaseRequest,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  body: () => JSON.stringify({}),
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
  constructor(private readonly _request: T) {}
  /**
   * Creates a new empty request with the GET method.
   */
  public static ofGet(): EmptyApiRequestBuilder<"get"> {
    return new ApiRequestBuilder<
      "get",
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      never,
      never,
      never,
      // eslint-disable-next-line @typescript-eslint/ban-types
      ApiRequestTypeForMethod<"get", {}, never, never, never>
    >({ ...emptyBaseRequest, method: "get" });
  }

  /**
   * Creates a new empty request with the POST method.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static ofPost(): EmptyApiRequestBuilder<"post", {}, "Content-Type"> {
    return new ApiRequestBuilder<
      "post",
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      "Content-Type",
      never,
      never,
      // eslint-disable-next-line @typescript-eslint/ban-types
      ApiRequestTypeForMethod<"post", {}, "Content-Type", never, never>
    >({
      ...emptyBasePutOrPostRequest,
      method: "post"
    });
  }

  /**
   * Creates a new empty request with the PUT method.
   */
  /* eslint-disable-next-line sonarjs/no-identical-functions */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static ofPut(): EmptyApiRequestBuilder<"put", {}, "Content-Type"> {
    return new ApiRequestBuilder<
      "put",
      // eslint-disable-next-line @typescript-eslint/ban-types
      {},
      "Content-Type",
      never,
      never,
      // eslint-disable-next-line @typescript-eslint/ban-types
      ApiRequestTypeForMethod<"put", {}, "Content-Type", never, never>
    >({
      ...emptyBasePutOrPostRequest,
      method: "put"
    });
  }

  public get(): T {
    // eslint-disable-next-line no-underscore-dangle
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
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const newQuery = (p: P & P1) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
      ...(this._request.query(p) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(query(p) as any)
    });
    return new ApiRequestBuilder({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
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
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const newHeaders = (p: P & P1) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
      ...(this._request.headers(p) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(headers(p) as any)
    });
    return new ApiRequestBuilder({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
      ...(this._request as any),
      response_decoder
    });
  }
}

//
// helpers
//

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
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
// eslint-disable-next-line sonarjs/cognitive-complexity, prefer-arrow/prefer-arrow-functions
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
): (params: P) => Promise<t.Validation<R>> {
  // TODO: handle unsuccessful fetch and HTTP errors
  // @see https://www.pivotaltracker.com/story/show/154661120
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
    const headers = requestType.headers(params);

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
    const decoded = await requestType.response_decoder(response);

    return decoded !== undefined
      ? decoded
      : left<t.Errors, R>([
          {
            context: [],
            value: response
          }
        ]);
  };
}

/**
 * An header producer that sets the Content-Type to application/json
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const ApiHeaderJson: RequestHeaderProducer<{}, "Content-Type"> = () => ({
  "Content-Type": "application/json"
});

/**
 * An io-ts based ResponseDecoder, it checks the response status and the
 * payload against the provided type.
 *
 * @param status  The response status handled by this decoder
 * @param type    The response type corresponding to the status
 * @param preprocessor A function that takes the object corresponding to the json response as input
 * and returns the processed object (usefull when you want alterate the json body received)
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function ioResponseDecoder<
  S extends number,
  R,
  O = R,
  H extends string = never
>(
  status: S,
  type: t.Type<R, O>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
  preprocessor: (i: any) => any = _ => _
): ResponseDecoder<IResponseType<S, R, H>> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return async (response: Response) => {
    if (response.status !== status) {
      // skip this decoder if status doesn't match
      return undefined;
    }
    const json = await response.json();
    const validated = type.decode(preprocessor(json));
    return pipe(
      validated,
      E.map(value => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        headers: response.headers as any,
        status,
        value
      }))
    );
  };
}

/**
 * An arrayBuffer ResponseDecoder
 * it returns an IResponse with a Buffer value
 *
 * @param status  The response status handled by this decoder
 */
export const bufferArrayResponseDecoder = <
  S extends number,
  H extends string = never
>(
  status: S
): ResponseDecoder<IResponseType<S, Buffer, H>> => async (
  response: Response
): Promise<t.Validation<IResponseType<S, Buffer, H>> | undefined> => {
  if (response.status !== status) {
    // skip this decoder if status doesn't match
    return undefined;
  }

  const arrayBuffer = await response.arrayBuffer();
  return pipe(
    arrayBuffer,
    E.of,
    E.map(ab => Buffer.from(ab)),
    E.map(buffer => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      headers: response.headers as any,
      status,
      value: buffer
    }))
  );
};

/**
 * A basic ResponseDecoder that returns an Error with the status text if the
 * response status is S.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function basicErrorResponseDecoder<
  S extends number,
  H extends string = never
>(status: S): ResponseDecoder<IResponseType<S, string, H>> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return async response => {
    if (response.status !== status) {
      // skip this decoder if status doesn't match
      return undefined;
    }
    return right<t.Errors, IResponseType<S, string, H>>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      headers: response.headers as any,
      status,
      value: response.statusText
    });
  };
}

/**
 * A basic set of responses where the 200 status corresponds to a payload of
 * type R and 404 and 500 to an Error
 */
export type BasicResponseType<R, H extends string = never> =
  | IResponseType<200, R, H>
  | IResponseType<404, string, H>
  | IResponseType<500, string, H>;

/**
 * Returns a ResponseDecoder for BasicResponseType<R>
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function basicResponseDecoder<R, O = R, H extends string = never>(
  type: t.Type<R, O>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preprocessor?: (i: any) => any
): ResponseDecoder<BasicResponseType<R, H>> {
  return composeResponseDecoders(
    composeResponseDecoders(
      ioResponseDecoder<200, R, O, H>(200, type, preprocessor),
      basicErrorResponseDecoder<404, H>(404)
    ),
    basicErrorResponseDecoder<500, H>(500)
  );
}

/**
 * A response decoder that ignores the payload and returns a constant value
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function constantResponseDecoder<
  T,
  S extends number,
  H extends string = never
>(status: S, value: T): ResponseDecoder<IResponseType<S, T, H>> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return async response => {
    if (response.status !== status) {
      return undefined;
    }
    return right<t.Errors, IResponseType<S, T, H>>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      headers: response.headers as any,
      status,
      value
    });
  };
}

/**
 * Returns a RequestHeaderProducer that produces an Authorization header of type
 * "bearer token" taking the value from the "token" parameter of each request.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function ParamAuthorizationBearerHeaderProducer<
  P extends { readonly token: string }
>(): RequestHeaderProducer<P, "Authorization"> {
  return (p: P): RequestHeaders<"Authorization"> => ({
    Authorization: `Bearer ${p.token}`
  });
}

/**
 * Returns a RequestHeaderProducer that produces an Authorization header of type
 * "bearer token" with a fixed token value.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function AuthorizationBearerHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, "Authorization"> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return () => ({
    Authorization: `Bearer ${token}`
  });
}

type MapTypeInApiResponse<T, S extends number, B> = T extends IResponseType<
  S,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _R
>
  ? IResponseType<S, B>
  : T;

/**
 * Changes the response with status S to have type B
 */
export type MapResponseType<
  T,
  S extends number,
  B
> = T extends IGetApiRequestType<infer P1, infer H1, infer Q1, infer R1>
  ? IGetApiRequestType<P1, H1, Q1, MapTypeInApiResponse<R1, S, B>>
  : T extends IPostApiRequestType<infer P2, infer H2, infer Q2, infer R2>
  ? IPostApiRequestType<P2, H2, Q2, MapTypeInApiResponse<R2, S, B>>
  : T extends IPutApiRequestType<infer P3, infer H3, infer Q3, infer R3>
  ? IPutApiRequestType<P3, H3, Q3, MapTypeInApiResponse<R3, S, B>>
  : T extends IDeleteApiRequestType<infer P4, infer H4, infer Q4, infer R4>
  ? IDeleteApiRequestType<P4, H4, Q4, MapTypeInApiResponse<R4, S, B>>
  : T extends IPatchApiRequestType<infer P5, infer H5, infer Q5, infer R5>
  ? IPatchApiRequestType<P5, H5, Q5, MapTypeInApiResponse<R5, S, B>>
  : never;

/**
 * The parameters of the request T
 */
export type RequestParams<T> = T extends IGetApiRequestType<
  infer P1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _H1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _Q1,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _R1
>
  ? P1 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IPostApiRequestType<infer P2, infer _H2, infer _Q2, infer _R2>
  ? P2 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IPutApiRequestType<infer P3, infer _H3, infer _Q3, infer _R3>
  ? P3 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IDeleteApiRequestType<infer P4, infer _H4, infer _Q4, infer _R4>
  ? P4 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IPatchApiRequestType<infer P5, infer _H5, infer _Q5, infer _R5>
  ? P5
  : never;

/**
 * The IResponseType of the request T
 */
export type RequestResponseTypes<T> = T extends IBaseApiRequestType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _M,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _P,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _H,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _Q,
  infer R
>
  ? R
  : never;

/**
 * Replaces the parameters of the request T with the type P
 */
export type ReplaceRequestParams<T, P> = T extends IGetApiRequestType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  infer _P1,
  infer H1,
  infer Q1,
  infer R1
>
  ? IGetApiRequestType<P, H1, Q1, R1> // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IPostApiRequestType<infer _P2, infer H2, infer Q2, infer R2>
  ? IPostApiRequestType<P, H2, Q2, R2> // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IPutApiRequestType<infer _P3, infer H3, infer Q3, infer R3>
  ? IPutApiRequestType<P, H3, Q3, R3> // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IDeleteApiRequestType<infer _P4, infer H4, infer Q4, infer R4>
  ? IDeleteApiRequestType<P, H4, Q4, R4> // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : T extends IPatchApiRequestType<infer _P4, infer H5, infer Q5, infer R5>
  ? IPatchApiRequestType<P, H5, Q5, R5>
  : never;

/**
 * Adds the status S with response type A to the responses of the request
 */
export type AddResponseType<
  T,
  S extends number,
  A
> = T extends IGetApiRequestType<infer P1, infer H1, infer Q1, infer R1>
  ? IGetApiRequestType<P1, H1, Q1, R1 | IResponseType<S, A>>
  : T extends IPostApiRequestType<infer P2, infer H2, infer Q2, infer R2>
  ? IPostApiRequestType<P2, H2, Q2, R2 | IResponseType<S, A>>
  : T extends IPutApiRequestType<infer P3, infer H3, infer Q3, infer R3>
  ? IPutApiRequestType<P3, H3, Q3, R3 | IResponseType<S, A>>
  : T extends IDeleteApiRequestType<infer P4, infer H4, infer Q4, infer R4>
  ? IDeleteApiRequestType<P4, H4, Q4, R4 | IResponseType<S, A>>
  : T extends IPatchApiRequestType<infer P5, infer H5, infer Q5, infer R5>
  ? IPatchApiRequestType<P5, H5, Q5, R5 | IResponseType<S, A>>
  : never;

/**
 * Removes a status from the union of IResponseType(s)
 */
export type OmitStatusFromResponse<
  T,
  S extends number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = T extends IResponseType<S, any> ? never : T;
