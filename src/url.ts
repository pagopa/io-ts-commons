import * as t from "io-ts";
import * as url from "url";

const isUrl = (v: t.mixed): v is url.Url =>
  v !== null && typeof v === "object" && "href" in v;

export const UrlFromString = new t.Type<url.Url, string>(
  "UrlFromString",
  isUrl,
  (v, c) =>
    isUrl(v)
      ? t.success(v)
      : t.string.validate(v, c).chain(s => {
          const d = url.parse(s);
          return !d.href ? t.failure(s, c) : t.success(d);
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
