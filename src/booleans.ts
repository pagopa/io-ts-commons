import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

export type BooleanFromString = t.Type<boolean, string, unknown>;

export const BooleanFromString: BooleanFromString = new t.Type<
  boolean,
  string,
  unknown
>(
  "BooleanFromString",
  t.boolean.is,
  (u, c) =>
    pipe(
      t.string.validate(u, c),
      E.chain(s =>
        s === "true"
          ? t.success(true)
          : s === "false"
          ? t.success(false)
          : t.failure(u, c)
      )
    ),
  String
);
