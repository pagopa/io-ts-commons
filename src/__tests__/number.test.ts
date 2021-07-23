/* eslint-disable sonarjs/no-identical-functions */

import { isLeft, isRight } from "fp-ts/lib/Either";
import {
  IntegerFromString,
  NonNegativeInteger,
  NonNegativeNumber,
  NumberFromString,
  WithinRangeInteger,
  WithinRangeNumber,
  NonNegativeIntegerFromString
} from "../numbers";

describe("NonNegativeInteger", () => {
  it("should decode a valid NonNegativeInteger", async () => {
    const validation = NonNegativeInteger.decode(0);
    expect(isRight(validation)).toBeTruthy();
  });
  it("should fail on invalid NonNegativeInteger", async () => {
    const validation = NonNegativeInteger.decode(0.12);
    expect(isRight(validation)).toBeFalsy();
  });
  it("should fail on invalid NonNegativeInteger", async () => {
    const validation = NonNegativeInteger.decode(-1);
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("NonNegativeNumber", () => {
  it("should decode a valid NonNegativeNumber (int)", async () => {
    const validation = NonNegativeNumber.decode(0);
    expect(isRight(validation)).toBeTruthy();
  });
  it("should decode a valid NonNegativeNumber (float)", async () => {
    const validation = NonNegativeNumber.decode(0.12);
    expect(isRight(validation)).toBeTruthy();
  });
  it("should fail on invalid NonNegativeNumber", async () => {
    const validation = NonNegativeNumber.decode(-1);
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("WithinRangeInteger", () => {
  it("should decode a valid WithinRangeInteger", async () => {
    const iType = WithinRangeInteger(0, 10);
    const validation = iType.decode(1);
    expect(isRight(validation)).toBeTruthy();
  });
  it("should fail on invalid WithinRangeInteger", async () => {
    const iType = WithinRangeInteger(0, 10);
    const validation = iType.decode(1.12);
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("WithinRangeNumber", () => {
  it("should decode a valid WithinRangeNumber", async () => {
    const iType = WithinRangeNumber(0, 10);
    const validation = iType.decode(1.12);
    expect(isRight(validation)).toBeTruthy();
  });
  it("should fail on invalid WithinRangeNumber", async () => {
    const iType = WithinRangeNumber(0, 10);
    const validation = iType.decode(10.12);
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("IntegerFromString", () => {
  it("should parse a valid integer string", async () => {
    const validation = IntegerFromString.decode("123");
    expect(isRight(validation)).toBeTruthy();
    if (isRight(validation)) {
      expect(validation.right).toEqual(123);
    }
  });
  it("should parse a valid integer string", async () => {
    const validation = IntegerFromString.decode("123.00");
    expect(isRight(validation)).toBeTruthy();
    if (isRight(validation)) {
      expect(validation.right).toEqual(123);
    }
  });
  it("should fail with an invalid integer string", async () => {
    const validation = IntegerFromString.decode("123.01");
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("NumberFromString", () => {
  it("should parse a valid number string", async () => {
    const validation = NumberFromString.decode("123.12");
    expect(isRight(validation)).toBeTruthy();
    if (isRight(validation)) {
      expect(validation.right).toEqual(123.12);
    }
  });
  it("should fail with an invalid number string", async () => {
    const validation = NumberFromString.decode("123.AA");
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("NonNegativeIntegerFromString", () => {
  it("should get integer 1 from string '1'", async () => {
    const n = NonNegativeIntegerFromString.decode("1");
    expect(isRight(n)).toBeTruthy();
    if (isRight(n)) {
      expect(n.right).toEqual(1);
    }
  });
  it("should get error from string '-1'", () => {
    const n = NonNegativeIntegerFromString.decode("-1");
    expect(isLeft(n)).toBeTruthy();
  });
});
