import {
  DateFromString,
  DateFromTimestamp,
  UTCISODateFromString
} from "../dates";

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

describe("UTCISODateFromString", () => {
  it("should validate a full ISO8601 string", async () => {
    const isoDates: ReadonlyArray<string> = [
      new Date().toISOString(),
      "2018-07-10T13:53:03.987Z"
    ];
    isoDates.forEach(isoDate => {
      const validation = UTCISODateFromString.decode(isoDate);
      expect(isRight(validation)).toBeTruthy();
      expect(UTCISODateFromString.is(new Date())).toBeTruthy();
    });
  });
  it("should fail on invalid full ISO8601 string", async () => {
    const noDates: ReadonlyArray<string> = ["2018-10-13", "2018-10-13 00:00"];
    noDates.forEach(noDate => {
      const validation = UTCISODateFromString.decode(noDate);
      expect(isLeft(validation)).toBeTruthy();
      expect(UTCISODateFromString.is(noDate)).toBeFalsy();
    });
  });
});

describe("DateFromTimestamp", () => {
  it("should validate a timestamp", async () => {
    const timestamp = 1577836800000;
    const validation = DateFromTimestamp.decode(timestamp);
    expect(isRight(validation)).toBeTruthy();
    if (isRight(validation)) {
      expect(validation.right instanceof Date).toBeTruthy();
    }
    expect(DateFromTimestamp.is(new Date())).toBeTruthy();
  });
  it("should fail on invalid timestamp", async () => {
    const invalidTimestamps = ["2018-10-13", "1577836800000"];
    invalidTimestamps.forEach(noDate => {
      const validation = DateFromTimestamp.decode(noDate);
      expect(isLeft(validation)).toBeTruthy();
      expect(DateFromTimestamp.is(noDate)).toBeFalsy();
    });
  });
});
