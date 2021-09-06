import * as t from "io-ts";

export type BooleanFromString = t.Type<boolean, string, unknown>;

export const BooleanFromString: BooleanFromString = new t.Type<
  boolean,
  string,
  unknown
>(
  "BooleanFromString",
  t.boolean.is,
  (s, c) =>
    s === "true"
      ? t.success(true)
      : s === "false"
      ? t.success(false)
      : t.failure(s, c),
  String
);
