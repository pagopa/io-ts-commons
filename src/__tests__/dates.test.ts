import {
  DateFromString,
  DateFromTimestamp,
  IsoDateFromString,
  TimezoneOnlyIsoDateFromString,
  UTCISODateFromString,
  UtcOnlyIsoDateFromString
} from "../dates";
import { getOrElseW, isLeft, isRight } from "fp-ts/Either";
import * as t from "io-ts";

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

describe("UtcOnlyIsoDateFromString", () => {
  it("should validate a full ISO8601 string", async () => {
    const isoDates: ReadonlyArray<string> = [
      new Date().toISOString(),
      "2018-07-10T13:53:03.987Z"
    ];
    isoDates.forEach(isoDate => {
      const validation = UtcOnlyIsoDateFromString.decode(isoDate);
      expect(isRight(validation)).toBeTruthy();
      expect(UtcOnlyIsoDateFromString.is(new Date())).toBeTruthy();
    });
  });
  it("should fail on invalid full ISO8601 string", async () => {
    const noDates: ReadonlyArray<string> = ["2018-10-13", "2018-10-13 00:00"];
    noDates.forEach(noDate => {
      const validation = UtcOnlyIsoDateFromString.decode(noDate);
      expect(isLeft(validation)).toBeTruthy();
      expect(UtcOnlyIsoDateFromString.is(noDate)).toBeFalsy();
    });
  });
});

describe("TimezoneOnlyIsoDateFromString", () => {
  it("should decode a valid format", () => {
    const parsed = TimezoneOnlyIsoDateFromString.decode(
      "2021-12-22T10:56:03+01:00"
    );
    console.log(JSON.stringify(parsed));
    expect(isRight(parsed)).toBeTruthy();
  });

  it("should not decode an invalid format", () => {
    const parsed = TimezoneOnlyIsoDateFromString.decode("2021-12-22T10:56:03Z");
    expect(isLeft(parsed)).toBeTruthy();
  });
});

describe("IsoDateFromString", () => {
  it("should validate a full ISO8601 string", async () => {
    const isoDates: ReadonlyArray<string> = [
      new Date().toISOString(),
      "2018-07-10T13:53:03.987Z",
      "2021-12-22T10:56:03+01:00"
    ];
    isoDates.forEach(isoDate => {
      const validation = IsoDateFromString.decode(isoDate);
      expect(isRight(validation)).toBeTruthy();
      expect(IsoDateFromString.is(new Date())).toBeTruthy();
    });
  });
  it("should fail on invalid full ISO8601 string", async () => {
    const noDates: ReadonlyArray<string> = ["2018-10-13", "2018-10-13 00:00"];
    noDates.forEach(noDate => {
      const validation = IsoDateFromString.decode(noDate);
      expect(isLeft(validation)).toBeTruthy();
      expect(IsoDateFromString.is(noDate)).toBeFalsy();
    });
  });

  it("isomorphic test", () => {
    const now = new Date();
    expect(`${UTCISODateFromString.encode(now)}`).toBe(now.toISOString());
    expect(
      isRight(IsoDateFromString.decode(IsoDateFromString.encode(now)))
    ).toBeTruthy();
    expect(
      isRight(UTCISODateFromString.decode(UTCISODateFromString.encode(now)))
    ).toBeTruthy();
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
