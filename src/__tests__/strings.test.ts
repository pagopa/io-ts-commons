import * as t from "io-ts";

import { isLeft, isRight } from "fp-ts/lib/Either";
import { PatternString, Semver, Ulid } from "../strings";

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

describe("Semver PatternString", () => {
  it("should match the pattern", () => {
    expect(isRight(Semver.decode("1.20.3"))).toBeTruthy();
    expect(isLeft(Semver.decode("0.01.0"))).toBeTruthy();
  });
  it("should match the pattern with build", () => {
    expect(isRight(Semver.decode("1.20.3.0"))).toBeTruthy();
    expect(isLeft(Semver.decode("0.01.0.0"))).toBeTruthy();
  });

  it("should match the type", () => {
    const s1 = "1.2.10" as Semver;

    // dummy check for verifying that encoding is isomorphic
    expect(Semver.encode(Semver.encode(s1))).toEqual(s1);
  });
});

describe("Ulid PatternString", () => {
  it("should match the pattern", () => {
    expect(isRight(Ulid.decode("01DEYQGXBN1XB9W6RDZV94V20A"))).toBeTruthy();
    expect(isRight(Ulid.decode("01deyqgxbn1xb9w6rdzv94v20a"))).toBeTruthy();
    expect(isLeft(Ulid.decode("01DEYQGXBN1XB-W6RDZV94V20A"))).toBeTruthy();
    expect(isLeft(Ulid.decode("01DEYQGXBN1XB/W6RDZV94V20A"))).toBeTruthy();
    expect(isLeft(Ulid.decode("01ILOUGXBN1XB9W6RDZV94V20A"))).toBeTruthy();
  });

  it("should match the type", () => {
    const s1 = "01DEYQGXBN1XB9W6RDZV94V20A" as Ulid;

    // dummy check for verifying that encoding is isomorphic
    expect(Ulid.encode(Ulid.encode(s1))).toEqual(s1);
  });
});