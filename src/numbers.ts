/*
 * Useful tagged types for numbers
 */

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { tag, Tagged } from "./types";

export interface IWithinRangeNumberTag<L extends number, H extends number> {
  readonly higher: H;
  readonly kind: "IWithinRangeNumberTag";
  readonly lower: L;
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
    t.refinement(t.number, (s) => s >= l && s < h, `number >= ${l} and < ${h}`)
  );

export interface INonNegativeNumberTag {
  readonly kind: "INonNegativeNumberTag";
}

export type WithinRangeNumber<
  L extends number,
  H extends number
> = IWithinRangeNumberTag<L, H> & number;

/**
 * A non negative number
 */
export const NonNegativeNumber = tag<INonNegativeNumberTag>()(
  t.refinement(t.number, (s) => s >= 0, "number >= 0")
);

//
//  Integers
//
export type Integer = typeof t.Integer;

export interface IWithinRangeIntegerTag<L extends number, H extends number> {
  readonly higher: H;
  readonly kind: "IWithinRangeIntegerTag";
  readonly lower: L;
}

export type NonNegativeNumber = t.TypeOf<typeof NonNegativeNumber>;

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

      (s) => s >= l && s < h,
      `integer >= ${l} and < ${h}`
    )
  );
export interface INonNegativeIntegerTag {
  readonly kind: "INonNegativeIntegerTag";
}

export type WithinRangeInteger<L extends number, H extends number> = Integer &
  IWithinRangeIntegerTag<L, H>;

/**
 * A non negative integer
 */
export const NonNegativeInteger = tag<INonNegativeIntegerTag>()(
  t.refinement(t.Integer, (s) => s >= 0, "integer >= 0")
);
export type NonNegativeInteger = t.TypeOf<typeof NonNegativeInteger>;

/**
 * Parses a string into a decimal
 */
export const NumberFromString = new t.Type<number, string>(
  "NumberFromString",
  t.number.is,
  (m, c) =>
    pipe(
      t.string.validate(m, c),
      E.chain((s) => {
        const n = +s;
        return isNaN(n) ? t.failure(s, c) : t.success(n);
      })
    ),
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
  t.refinement(IntegerFromString, (i) => i >= 0, "NonNegativeIntegerFromString")
);
type NonNegativeIntegerFromString = t.TypeOf<
  typeof NonNegativeIntegerFromString
>;
