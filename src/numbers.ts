/*
 * Useful tagged types for numbers
 */

import * as t from "io-ts";

import { tag, Tagged } from "./types";

export interface IWithinRangeNumberTag<L extends number, H extends number> {
  readonly lower: L;
  readonly higher: H;
  readonly kind: "IWithinRangeNumberTag";
}

/**
 * A number guaranteed to be within the range [L,H)
 */
export const WithinRangeNumber = <
  L extends number,
  H extends number,
  T extends IWithinRangeNumberTag<L, H>
>(
  l: L,
  h: H
): Tagged<T, number> =>
  tag<T>()(
    t.refinement(t.number, s => s >= l && s < h, `number >= ${l} and < ${h}`)
  );

export type WithinRangeNumber<L extends number, H extends number> = number &
  IWithinRangeNumberTag<L, H>;

export interface INonNegativeNumberTag {
  readonly kind: "INonNegativeNumberTag";
}

/**
 * A non negative number
 */
export const NonNegativeNumber = tag<INonNegativeNumberTag>()(
  t.refinement(t.number, s => s >= 0, "number >= 0")
);

export type NonNegativeNumber = t.TypeOf<typeof NonNegativeNumber>;

//
//  Integers
//
export type Integer = typeof t.Integer;

export interface IWithinRangeIntegerTag<L extends number, H extends number> {
  readonly lower: L;
  readonly higher: H;
  readonly kind: "IWithinRangeIntegerTag";
}

/**
 * An integer guaranteed to be within the range [L,H)
 */
export const WithinRangeInteger = <
  L extends number,
  H extends number,
  T extends IWithinRangeIntegerTag<L, H>
>(
  l: L,
  h: H
): Tagged<T, number> =>
  tag<T>()(
    t.refinement(
      t.Integer,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s => s >= l && s < h,
      `integer >= ${l} and < ${h}`
    )
  );
export type WithinRangeInteger<L extends number, H extends number> = Integer &
  IWithinRangeIntegerTag<L, H>;

export interface INonNegativeIntegerTag {
  readonly kind: "INonNegativeIntegerTag";
}

/**
 * A non negative integer
 */
export const NonNegativeInteger = tag<INonNegativeIntegerTag>()(
  t.refinement(t.Integer, s => s >= 0, "integer >= 0")
);
export type NonNegativeInteger = t.TypeOf<typeof NonNegativeInteger>;

/**
 * Parses a string into a decimal
 */
export const NumberFromString = new t.Type<number, string>(
  "NumberFromString",
  t.number.is,
  (m, c) =>
    t.string.validate(m, c).chain(s => {
      const n = +s;
      return isNaN(n) ? t.failure(s, c) : t.success(n);
    }),
  String
);
export type NumberFromString = t.TypeOf<typeof NumberFromString>;

/**
 * Parses a string into an integer
 */
export const IntegerFromString = t.refinement(
  NumberFromString,
  t.Integer.predicate,
  "IntegerFromString"
);
export type IntegerFromString = t.TypeOf<typeof IntegerFromString>;

/**
 * Parses a string into a non negative integer
 */
export const NonNegativeIntegerFromString = tag<INonNegativeIntegerTag>()(
  t.refinement(IntegerFromString, i => i >= 0, "NonNegativeIntegerFromString")
);
type NonNegativeIntegerFromString = t.TypeOf<
  typeof NonNegativeIntegerFromString
>;
