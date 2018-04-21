import * as t from "io-ts";
import * as validator from "validator";

import { tag, Tagged } from "./types";

/**
 * A non-empty string
 */

export interface INonEmptyStringTag {
  readonly kind: "INonEmptyStringTag";
}

export const NonEmptyString = tag<INonEmptyStringTag>()(
  t.refinement(t.string, s => s.length > 0, "non empty string")
);

export type NonEmptyString = t.TypeOf<typeof NonEmptyString>;

/**
 * A string guaranteed to have a length within the range [L,H)
 */

export interface IWithinRangeStringTag<L extends number, H extends number> {
  readonly lower: L;
  readonly higher: H;
  readonly kind: "IWithinRangeStringTag";
}

export const WithinRangeString = <
  L extends number,
  H extends number,
  T extends IWithinRangeStringTag<L, H>
>(
  l: L,
  h: H
): Tagged<T, string, string> =>
  tag<T>()(
    t.refinement(
      t.string,
      s => s.length >= l && s.length < h,
      `string of length >= ${l} and < ${h}`
    )
  );

export type WithinRangeString<L extends number, H extends number> = string &
  IWithinRangeStringTag<L, H>;

/**
 * A string that matches a pattern.
 */

export interface IPatternStringTag<P extends string> {
  readonly pattern: P;
  readonly kind: "IPatternStringTag";
}

export const PatternString = <P extends string, T extends IPatternStringTag<P>>(
  p: P
): Tagged<T, string, string> =>
  tag<T>()(
    t.refinement(
      t.string,
      s => s.match(p) !== null,
      `string that matches the pattern "${p}"`
    )
  );

export type PatternString<P extends string> = string & IPatternStringTag<P>;

/**
 * A string that represents a valid email address.
 */

export interface IEmailStringTag {
  readonly kind: "IEmailStringTag";
}

export const EmailString = tag<IEmailStringTag>()(
  t.refinement(
    t.string,
    s =>
      validator.isEmail(s, {
        allow_display_name: false,
        allow_utf8_local_part: false,
        require_tld: true
      }),
    "string that represents an email address"
  )
);

export type EmailString = t.TypeOf<typeof EmailString>;

/**
 * A string that represents an IP (v4 or v6).
 */

export interface IIPStringTag {
  readonly kind: "IIPStringTag";
}

export const IPString = tag<IIPStringTag>()(
  t.refinement(t.string, validator.isIP, "string that represents an IP address")
);

export type IPString = t.TypeOf<typeof IPString>;
