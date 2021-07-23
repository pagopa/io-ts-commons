import { CommaSeparatedListOf } from "../comma-separated-list";
import { withDefault } from "../types";
import { NonEmptyString } from "../strings";
import * as t from "io-ts";
import { isLeft, isRight } from "fp-ts/lib/Either";

describe("CommaSeparatedListOf", () => {
  it("should succeed to decode a comma separated list of strings", () => {
    const value = "Lorem,ipsum,dolor,sit, amet, consectetur,adipiscing,elit";
    const expected = [
      "Lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit"
    ];

    const CommaSeparatedListOfStrings = CommaSeparatedListOf(t.string);

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual(expected);
    }
  });

  it("should succeed to decode a comma separated list of falsy values", () => {
    const value = "0,1,false";
    const expected = ["0", "1", "false"];

    const CommaSeparatedListOfStrings = CommaSeparatedListOf(t.string);

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual(expected);
    }
  });

  it("should succeed to decode a comma separated list with empty values", () => {
    const value = ",0,1,,false,";
    const expected = ["0", "1", "false"];

    const CommaSeparatedListOfStrings = CommaSeparatedListOf(t.string);

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual(expected);
    }
  });

  it("should succeed to decode an empty comma separated list of strings", () => {
    const value = "";
    const expected: string[] = [];

    const CommaSeparatedListOfStrings = CommaSeparatedListOf(t.string);

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual(expected);
    }
  });

  it("should succeed to decode an empty comma separated list of NonEmptyString", () => {
    const value = "";
    const expected: string[] = [];

    const CommaSeparatedListOfStrings = CommaSeparatedListOf(NonEmptyString);

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual(expected);
    }
  });

  it("should fail to decode an undefined value", () => {
    const value = undefined;

    const CommaSeparatedListOfStrings = CommaSeparatedListOf(t.string);

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(false);
  });

  it("should combine well with withDefault", () => {
    const value = undefined;
    const expected: ReadonlyArray<string> = [];

    const CommaSeparatedListOfStrings = withDefault(
      CommaSeparatedListOf(t.string),
      expected
    );

    const result = CommaSeparatedListOfStrings.decode(value);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual(expected);
    }
  });
});
