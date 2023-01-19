import * as t from "io-ts";
import * as validator from "validator";

import { tag, Tagged } from "./types";

export interface INonEmptyStringTag {
  readonly kind: "INonEmptyStringTag";
}

/**
 * A non-empty string
 */
export const NonEmptyString = tag<INonEmptyStringTag>()(
  t.refinement(t.string, s => s.length > 0, "non empty string")
);

export type NonEmptyString = t.TypeOf<typeof NonEmptyString>;

export interface IWithinRangeStringTag<L extends number, H extends number> {
  readonly lower: L;
  readonly higher: H;
  readonly kind: "IWithinRangeStringTag";
}

/**
 * A string guaranteed to have a length within the range [L,H)
 */
export const WithinRangeString = <
  L extends number,
  H extends number,
  T extends IWithinRangeStringTag<L, H>
>(
  l: L,
  h: H
): Tagged<T, string> =>
  tag<T>()(
    t.refinement(
      t.string,
      s => s.length >= l && s.length < h,
      `string of length >= ${l} and < ${h}`
    )
  );

export type WithinRangeString<L extends number, H extends number> = string &
  IWithinRangeStringTag<L, H>;

export interface IPatternStringTag<P extends string> {
  readonly pattern: P;
  readonly kind: "IPatternStringTag";
}

/**
 * A string that matches a pattern.
 */
export const PatternString = <P extends string, T extends IPatternStringTag<P>>(
  p: P
): Tagged<T, string> =>
  tag<T>()(
    t.refinement(
      t.string,
      s => s.match(p) !== null,
      `string that matches the pattern "${p}"`
    )
  );

export type PatternString<P extends string> = string & IPatternStringTag<P>;

export interface IEmailStringTag {
  readonly kind: "IEmailStringTag";
}

/**
 * A string that represents a valid email address.
 */
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

export interface IIPStringTag {
  readonly kind: "IIPStringTag";
}

/**
 * A string that represents an IP (v4 or v6).
 */
export const IPString = tag<IIPStringTag>()(
  t.refinement(t.string, validator.isIP, "string that represents an IP address")
);

export type IPString = t.TypeOf<typeof IPString>;

const v4 =
  "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}\\/(3[0-2]|[12]?[0-9])";

const v6seg = "[0-9a-fA-F]{1,4}";
const v6 = `
(
(?:${v6seg}:){7}(?:${v6seg}|:)|                                // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6seg}:){6}(?:${v4}|:${v6seg}|:)|                         // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6seg}:){5}(?::${v4}|(:${v6seg}){1,2}|:)|                 // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6seg}:){4}(?:(:${v6seg}){0,1}:${v4}|(:${v6seg}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6seg}:){3}(?:(:${v6seg}){0,2}:${v4}|(:${v6seg}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6seg}:){2}(?:(:${v6seg}){0,3}:${v4}|(:${v6seg}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6seg}:){1}(?:(:${v6seg}){0,4}:${v4}|(:${v6seg}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::((?::${v6seg}){0,5}:${v4}|(?::${v6seg}){1,7}|:))           // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(%[0-9a-zA-Z]{1,})?                                           // %eth0            %1
\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])
`
  .replace(/\s*\/\/.*$/gm, "")
  .replace(/\n/g, "")
  .trim();

/**
 * A string that represents a valid CIDR.
 */
export const CIDR = PatternString(`(?:^${v4}$)|(?:^${v6}$)`);

export type CIDR = t.TypeOf<typeof CIDR>;

/**
 * A valid Fiscal Number (for persons)
 */
export const FiscalCode = PatternString(
  "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"
);

export type FiscalCode = t.TypeOf<typeof FiscalCode>;

/**
 * A sandbox Fiscal Code (used for development)
 * Note that this pattern doesn't generate valid fiscal codes
 */
export const SandboxFiscalCode = PatternString(
  "^[A-Z]{6}[0-9]{2}A[0-9]{2}Y[0-9]{3}X$"
);

export type SandboxFiscalCode = t.TypeOf<typeof SandboxFiscalCode>;

/**
 * A valid Fiscal Number (for organizations)
 */
export const OrganizationFiscalCode = PatternString("^[0-9]{11}$");

export type OrganizationFiscalCode = t.TypeOf<typeof OrganizationFiscalCode>;

/**
 * The App version using the format {major}.{minor}.{patch}(.{build})
 * The build value is optional.
 */
export const Semver = PatternString(
  "^((0|[1-9]\\d*)\\.){2}(0|[1-9]\\d*)(\\.(0|[1-9]\\d*)){0,1}$"
);

export type Semver = t.TypeOf<typeof Semver>;

/**
 * A valid ULID string
 */
export const Ulid = PatternString("^[0-9a-hjkmnp-tv-zA-HJKMNP-TV-Z]{26}$");

export type Ulid = t.TypeOf<typeof Ulid>;
