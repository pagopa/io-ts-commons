import * as t from "io-ts";

import { isLeft, isRight } from "fp-ts/lib/Either";
import { PatternString } from "../strings";

describe("PatternString", () => {
  it("should match a pattern", () => {
    const ps = PatternString("^\\d+$");
    expect(isRight(ps.decode("123"))).toBeTruthy();
    expect(isLeft(ps.decode("abc"))).toBeTruthy();
  });

  it("should match the type", () => {
    const ps1 = PatternString("^\\d+$");

    type PS1 = t.TypeOf<typeof ps1>;
    const s1 = "123" as PS1;

    // dummy check for verifying that encoding is isomorphic
    expect(ps1.encode(ps1.encode(s1))).toEqual(s1);
  });
});
