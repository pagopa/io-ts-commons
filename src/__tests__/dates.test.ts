import { DateFromString } from "../dates";

import { isLeft, isRight } from "fp-ts/lib/Either";

describe("DateFromString", () => {
  it("should validate an ISO string", async () => {
    const isoDate = new Date().toISOString();
    const validation = DateFromString.decode(isoDate);
    expect(isRight(validation)).toBeTruthy();
    expect(DateFromString.is(new Date())).toBeTruthy();
  });
  it("should fail on invalid ISO string", async () => {
    const noDate = {};
    const validation = DateFromString.decode(noDate);
    expect(isLeft(validation)).toBeTruthy();
    expect(DateFromString.is(noDate)).toBeFalsy();
  });
});
