import * as t from "io-ts";
import * as url from "url";

export type ValidUrl = url.Url & { readonly href: string };

const isUrl = (v: t.mixed): v is ValidUrl =>
  // tslint:disable-next-line:no-any
  t.object.is(v) && t.string.is((v as any).href);

/**
 * io-ts type that decodes a Url from a string
 *
 * ie. UrlFromString.decode("http://example.com")
 */
export const UrlFromString = new t.Type<ValidUrl, string>(
  "UrlFromString",
  isUrl,
  (v, c) =>
    isUrl(v)
      ? t.success(v)
      : t.string.validate(v, c).chain(s => {
          const d = url.parse(s);
          // we can safely use url.href in calling methods
          return !d.href ? t.failure(s, c) : t.success(d as ValidUrl);
        }),
  a => a.toString()
);

export type UrlFromString = t.TypeOf<typeof UrlFromString>;

export const HttpsUrlFromString = t.refinement(
  UrlFromString,
  o => o.protocol === "https:"
);
export type HttpsUrlFromString = t.Type<typeof HttpsUrlFromString>;

export const HttpUrlFromString = t.refinement(
  UrlFromString,
  o => o.protocol === "http:"
);
export type HttpUrlFromString = t.Type<typeof HttpsUrlFromString>;
