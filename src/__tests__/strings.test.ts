import * as t from "io-ts";

import { isLeft, isRight } from "fp-ts/lib/Either";
import { StrMap } from "fp-ts/lib/StrMap";
import { ItalianMobilePhoneNumber, PatternString } from "../strings";

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

describe("ItalianMobilePhoneNumber", () => {
  it("should match a valid italian mobile phone", () => {
    const phoneNumbers = new StrMap({
      "+39 355 5555 555": "+393555555555",
      "355 5555 555": "3555555555"
    });
    phoneNumbers.mapWithKey((k, v) => {
      const n = ItalianMobilePhoneNumber.decode(k);
      expect(isRight(n)).toBeTruthy();
      if (isRight(n)) {
        expect(n.value).toEqual(v);
      }
    });
  });
  it("should not match an invalid italian mobile phone", () => {
    const phoneNumbers: ReadonlyArray<string> = [
      "+33 555 5555 555",
      "555 555 555"
    ];
    phoneNumbers.map(v => {
      const n = ItalianMobilePhoneNumber.decode(v);
      expect(isLeft(n)).toBeTruthy();
    });
  });
});
