import * as express from "express";
import * as t from "io-ts";

import { errorsToReadableMessages } from "./reporters";
import { enumType, withDefault } from "./types";
import { UrlFromString } from "./url";

// see https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
export enum HttpStatusCodeEnum {
  HTTP_STATUS_200 = 200,
  HTTP_STATUS_201 = 201,
  HTTP_STATUS_202 = 202,
  HTTP_STATUS_203 = 203,
  HTTP_STATUS_204 = 204,
  HTTP_STATUS_205 = 205,
  HTTP_STATUS_206 = 206,
  HTTP_STATUS_207 = 207,
  HTTP_STATUS_208 = 208,

  HTTP_STATUS_300 = 300,
  HTTP_STATUS_301 = 301,
  HTTP_STATUS_302 = 302,
  HTTP_STATUS_303 = 303,
  HTTP_STATUS_304 = 304,
  HTTP_STATUS_305 = 305,
  HTTP_STATUS_306 = 306,
  HTTP_STATUS_307 = 307,
  HTTP_STATUS_308 = 308,

  HTTP_STATUS_400 = 400,
  HTTP_STATUS_401 = 401,
  HTTP_STATUS_402 = 402,
  HTTP_STATUS_403 = 403,
  HTTP_STATUS_404 = 404,
  HTTP_STATUS_405 = 405,
  HTTP_STATUS_406 = 406,
  HTTP_STATUS_407 = 407,
  HTTP_STATUS_408 = 408,
  HTTP_STATUS_409 = 409,
  HTTP_STATUS_410 = 410,
  HTTP_STATUS_411 = 411,
  HTTP_STATUS_412 = 412,
  HTTP_STATUS_413 = 413,
  HTTP_STATUS_414 = 414,
  HTTP_STATUS_415 = 415,
  HTTP_STATUS_416 = 416,
  HTTP_STATUS_417 = 417,
  HTTP_STATUS_418 = 418,
  HTTP_STATUS_421 = 421,
  HTTP_STATUS_422 = 422,
  HTTP_STATUS_423 = 423,
  HTTP_STATUS_424 = 424,
  HTTP_STATUS_425 = 425,
  HTTP_STATUS_426 = 426,
  HTTP_STATUS_428 = 428,
  HTTP_STATUS_429 = 429,
  HTTP_STATUS_431 = 431,
  HTTP_STATUS_451 = 451,

  HTTP_STATUS_500 = 500,
  HTTP_STATUS_501 = 501,
  HTTP_STATUS_502 = 502,
  HTTP_STATUS_503 = 503,
  HTTP_STATUS_504 = 504,
  HTTP_STATUS_505 = 505,
  HTTP_STATUS_506 = 506,
  HTTP_STATUS_507 = 507,
  HTTP_STATUS_508 = 508,
  HTTP_STATUS_510 = 510,
  HTTP_STATUS_511 = 511
}
export const HttpStatusCode = enumType<HttpStatusCodeEnum>(
  HttpStatusCodeEnum,
  "HttpStatusCode"
);
export type HttpStatusCode = t.TypeOf<typeof HttpStatusCode>;

export const ProblemJson = t.partial({
  detail: t.string,
  instance: t.string,
  status: HttpStatusCode,
  title: t.string,
  type: withDefault(t.string, "about:blank")
});
export type ProblemJson = t.TypeOf<typeof ProblemJson>;

/**
 * Interface for a Response that can be returned by a middleware or
 * by the handlers.
 */
export interface IResponse<T> {
  readonly kind: T;
  readonly apply: (response: express.Response) => void;
  readonly detail?: string;
}

//
// Success reponses
//

/**
 * Interface for a successful response returning a json object.
 */
export interface IResponseSuccessJson<T>
  extends IResponse<"IResponseSuccessJson"> {
  readonly value: T; // needed to discriminate from other T subtypes
}

/**
 * Returns a successful json response.
 *
 * @param o The object to return to the client
 */
export function ResponseSuccessJson<T>(o: T): IResponseSuccessJson<T> {
  const kindlessObject = Object.assign(Object.assign({}, o), {
    kind: undefined
  });
  return {
    apply: res =>
      res.status(HttpStatusCodeEnum.HTTP_STATUS_200).json(kindlessObject),
    kind: "IResponseSuccessJson",
    value: o
  };
}

/**
 * Interface for a successful response returning a xml object.
 */
export interface IResponseSuccessXml<T>
  extends IResponse<"IResponseSuccessXml"> {
  readonly value: T; // needed to discriminate from other T subtypes
}

/**
 * Returns a successful xml response.
 *
 * @param o The object to return to the client
 */
export function ResponseSuccessXml<T>(o: T): IResponseSuccessXml<T> {
  return {
    apply: res =>
      res
        .status(HttpStatusCodeEnum.HTTP_STATUS_200)
        .set("Content-Type", "application/xml")
        .send(o),
    kind: "IResponseSuccessXml",
    value: o
  };
}

/**
 * Interface for a issuing a request accepted response.
 */
export interface IResponseSuccessAccepted
  extends IResponse<"IResponseSuccessAccepted"> {}

/**
 * Returns a request accepted response.
 */
export function ResponseSuccessAccepted(
  detail?: string
): IResponseSuccessAccepted {
  return {
    apply: res => res.send(HttpStatusCodeEnum.HTTP_STATUS_202),
    detail,
    kind: "IResponseSuccessAccepted"
  };
}

/**
 * Interface for a issuing a client redirect .
 */
export interface IResponsePermanentRedirect
  extends IResponse<"IResponsePermanentRedirect"> {}

/**
 * Returns a redirect response.
 *
 * @param o The object to return to the client
 */
export function ResponsePermanentRedirect(
  location: UrlFromString
): IResponsePermanentRedirect {
  return {
    apply: res =>
      res.redirect(HttpStatusCodeEnum.HTTP_STATUS_301, location.href),
    detail: location.href,
    kind: "IResponsePermanentRedirect"
  };
}

/**
 * Interface for a successful response returning a redirect to a resource.
 */
export interface IResponseSuccessRedirectToResource<T, V>
  extends IResponse<"IResponseSuccessRedirectToResource"> {
  readonly resource: T; // type checks the right kind of resource
  readonly payload: V;
}

/**
 * Returns a successful response returning a redirect to a resource.
 */
export function ResponseSuccessRedirectToResource<T, V>(
  resource: T,
  url: string,
  payload: V
): IResponseSuccessRedirectToResource<T, V> {
  return {
    apply: res =>
      res
        .set("Location", url)
        .status(HttpStatusCodeEnum.HTTP_STATUS_201)
        .json(payload),
    detail: url,
    kind: "IResponseSuccessRedirectToResource",
    payload,
    resource
  };
}

//
// Error responses
//

/**
 * Interface for a response describing a generic server error.
 */
export interface IResponseErrorGeneric
  extends IResponse<"IResponseErrorGeneric"> {}

/**
 * Returns a response describing a generic error.
 *
 * The error is translated to an RFC 7807 response (Problem JSON)
 * See https://zalando.github.io/restful-api-guidelines/index.html#176
 *
 */
export function ResponseErrorGeneric(
  status: HttpStatusCode,
  title: string,
  detail: string,
  problemType?: string
): IResponseErrorGeneric {
  const problem: ProblemJson = {
    detail,
    status,
    title,
    type: problemType
  };
  return {
    apply: res =>
      res
        .status(status)
        .set("Content-Type", "application/problem+json")
        .json(problem),
    detail: `${title}: ${detail}`,
    kind: "IResponseErrorGeneric"
  };
}

/**
 * Interface for a response describing a 404 error.
 */
export interface IResponseErrorNotFound
  extends IResponse<"IResponseErrorNotFound"> {}

/**
 * Returns a response describing a 404 error.
 *
 * @param title The error message
 */
export function ResponseErrorNotFound(
  title: string,
  detail: string
): IResponseErrorNotFound {
  return {
    ...ResponseErrorGeneric(HttpStatusCodeEnum.HTTP_STATUS_404, title, detail),
    detail: `${title}: ${detail}`,
    kind: "IResponseErrorNotFound"
  };
}

/**
 * Interface for a response describing a validation error.
 */
export interface IResponseErrorValidation
  extends IResponse<"IResponseErrorValidation"> {}

/**
 * Returns a response describing a validation error.
 */
export function ResponseErrorValidation(
  title: string,
  detail: string
): IResponseErrorValidation {
  return {
    ...ResponseErrorGeneric(HttpStatusCodeEnum.HTTP_STATUS_400, title, detail),
    detail: `${title}: ${detail}`,
    kind: "IResponseErrorValidation"
  };
}

/**
 * Returns a response describing a validation error.
 */
export function ResponseErrorFromValidationErrors<S, A>(
  type: t.Type<A, S>
): (errors: ReadonlyArray<t.ValidationError>) => IResponseErrorValidation {
  return errors => {
    const detail = errorsToReadableMessages(errors).join("\n");
    return ResponseErrorValidation(`Invalid ${type.name}`, detail);
  };
}

/**
 * The user is not allowed here.
 */
export interface IResponseErrorForbiddenNotAuthorized
  extends IResponse<"IResponseErrorForbiddenNotAuthorized"> {}

/**
 * The user is not allowed here.
 */
export const ResponseErrorForbiddenNotAuthorized: IResponseErrorForbiddenNotAuthorized = {
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_403,
    "You are not allowed here",
    "You do not have enough permission to complete the operation you requested"
  ),
  kind: "IResponseErrorForbiddenNotAuthorized"
};

/**
 * The user is not allowed to issue production requests.
 */
export interface IResponseErrorForbiddenNotAuthorizedForProduction
  extends IResponse<"IResponseErrorForbiddenNotAuthorizedForProduction"> {}

/**
 * The user is not allowed to issue production requests.
 */
export const ResponseErrorForbiddenNotAuthorizedForProduction: IResponseErrorForbiddenNotAuthorizedForProduction = {
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_403,
    "Production call forbidden",
    "You are not allowed to issue production calls at this time."
  ),
  kind: "IResponseErrorForbiddenNotAuthorizedForProduction"
};

/**
 * The user is not allowed to issue requests for the recipient.
 */
export interface IResponseErrorForbiddenNotAuthorizedForRecipient
  extends IResponse<"IResponseErrorForbiddenNotAuthorizedForRecipient"> {}

/**
 * The user is not allowed to issue requests for the recipient.
 */
export const ResponseErrorForbiddenNotAuthorizedForRecipient: IResponseErrorForbiddenNotAuthorizedForRecipient = {
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_403,
    "Recipient forbidden",
    "You are not allowed to issue requests for the recipient."
  ),
  kind: "IResponseErrorForbiddenNotAuthorizedForRecipient"
};

/**
 * The user is not allowed to send messages with default addresses.
 */
export interface IResponseErrorForbiddenNotAuthorizedForDefaultAddresses
  extends IResponse<
    "IResponseErrorForbiddenNotAuthorizedForDefaultAddresses"
  > {}

/**
 * The user is not allowed to send messages with default addresses.
 */
export const ResponseErrorForbiddenNotAuthorizedForDefaultAddresses: IResponseErrorForbiddenNotAuthorizedForDefaultAddresses = {
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_403,
    "Call forbidden",
    "You are not allowed to send messages by providing default addresses."
  ),
  kind: "IResponseErrorForbiddenNotAuthorizedForDefaultAddresses"
};

/**
 * The user is anonymous.
 */
export interface IResponseErrorForbiddenAnonymousUser
  extends IResponse<"IResponseErrorForbiddenAnonymousUser"> {}

/**
 * The user is anonymous.
 */
export const ResponseErrorForbiddenAnonymousUser: IResponseErrorForbiddenAnonymousUser = {
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_403,
    "Anonymous user",
    "The request could not be associated to a user, missing userId or subscriptionId."
  ),
  kind: "IResponseErrorForbiddenAnonymousUser"
};

/**
 * The user is not part of any valid authorization groups.
 */
export interface IResponseErrorForbiddenNoAuthorizationGroups
  extends IResponse<"IResponseErrorForbiddenNoAuthorizationGroups"> {}

/**
 * The user is not part of any valid authorization groups.
 */
export const ResponseErrorForbiddenNoAuthorizationGroups: IResponseErrorForbiddenNoAuthorizationGroups = {
  ...ResponseErrorGeneric(
    HttpStatusCodeEnum.HTTP_STATUS_403,
    "User has no valid scopes",
    "You are not part of any valid scope, you should ask the administrator to give you the required permissions."
  ),
  kind: "IResponseErrorForbiddenNoAuthorizationGroups"
};

/**
 * Interface for a response describing a conflict error (409).
 */
export interface IResponseErrorConflict
  extends IResponse<"IResponseErrorConflict"> {}

/**
 * Returns a response describing an conflict error (409).
 *
 * @param detail The error message
 */
export function ResponseErrorConflict(detail: string): IResponseErrorConflict {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_409,
      "Conflict",
      detail
    ),
    kind: "IResponseErrorConflict"
  };
}

/**
 * Interface for a response describing a too many requests error (429).
 */
export interface IResponseErrorTooManyRequests
  extends IResponse<"IResponseErrorTooManyRequests"> {}

/**
 * Returns a response describing a too many requests error (429).
 *
 * @param detail The error message
 */
export function ResponseErrorTooManyRequests(
  detail?: string
): IResponseErrorTooManyRequests {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_429,
      "Too many requests",
      detail === undefined ? "" : detail
    ),
    kind: "IResponseErrorTooManyRequests"
  };
}

/**
 * Interface for a response describing an internal server error.
 */
export interface IResponseErrorInternal
  extends IResponse<"IResponseErrorInternal"> {}

/**
 * Returns a response describing an internal server error.
 *
 * @param detail The error message
 */
export function ResponseErrorInternal(detail: string): IResponseErrorInternal {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_500,
      "Internal server error",
      detail
    ),
    kind: "IResponseErrorInternal"
  };
}

/**
 * Interface for a response describing a service unavailable error.
 */
export interface IResponseErrorServiceUnavailable
  extends IResponse<"IResponseErrorServiceUnavailable"> {}

/**
 * Returns a response describing a service unavailable error.
 *
 * @param detail The error message
 */
export function ResponseErrorServiceUnavailable(
  detail: string
): IResponseErrorInternal {
  return {
    ...ResponseErrorGeneric(
      HttpStatusCodeEnum.HTTP_STATUS_503,
      "Service temporarily unavailable",
      detail
    ),
    kind: "IResponseErrorInternal"
  };
}
