/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable sort-keys */

import * as t from "io-ts";

import { NonEmptyString } from "../strings";

import { NonNegativeNumber } from "../numbers";

import { strictInterfaceWithOptionals } from "../types";

import { left } from "fp-ts/lib/Either";
import { ReadableReporter, ReadableReporterSimplified } from "../reporters";
import { pipe } from "fp-ts/lib/function";

const TestType = t.interface(
  {
    a: t.number,
    b: t.string,
    c: t.interface(
      {
        a: t.number,
        b: NonEmptyString
      },
      "SubTestType"
    )
  },
  "TestType"
);

describe("ReadableReporter", () => {
  it("should report validation errors", () => {
    const fixtures: ReadonlyArray<any> = [
      {
        o: "",
        vt: NonEmptyString,
        e: ['value [""] at [root] is not a valid [non empty string]']
      },
      {
        o: -1,
        vt: NonNegativeNumber,
        e: ["value [-1] at [root] is not a valid [number >= 0]"]
      },
      {
        o: {
          a: "a",
          b: 1,
          c: {
            a: "b"
          }
        },
        vt: TestType,
        e: [
          'value ["a"] at [root.a] is not a valid [number]',
          "value [1] at [root.b] is not a valid [string]",
          'value ["b"] at [root.c.a] is not a valid [number]',
          "value [undefined] at [root.c.b] is not a valid [non empty string]"
        ]
      }
    ];

    fixtures.forEach(({ o, vt, e }) => {
      const validation = vt.decode(o);

      const res = ReadableReporter.report(validation);

      expect(res).toEqual(e);
    });
  });

  it("should report validation errors on unknown properties", () => {
    const aType = strictInterfaceWithOptionals(
      {
        foo: t.boolean
      },
      {},
      "aType"
    );
    const validation = aType.decode({ foo: true, x: true });
    const res = ReadableReporter.report(validation);
    expect(res).toEqual(["value [true] at [root.x] is not a known property"]);
  });

  it("should report validation errors on Errors with empty Context", () => {
    const errors = left([{ context: [], value: "some value" }]);
    const errorsReport = ReadableReporter.report(errors);
    expect(errorsReport).toEqual([
      'value ["some value"] at [root] (decoder info n/a)'
    ]);
  });

  it("should avoid the indexes of a t.intersection", () => {
    expect(
      pipe(
        t
          .intersection([t.type({ a: t.string }), t.type({ b: t.number })])
          .decode({}),
        ReadableReporterSimplified.report
      )
    ).toEqual([
      "value undefined at root.a is not a valid [string]",
      "value undefined at root.b is not a valid [number]"
    ]);
  });

  it("should contain the indexes of a t.array", () => {
    expect(
      pipe(
        t.array(t.number).decode([1, "2", 3]),
        ReadableReporterSimplified.report
      )
    ).toEqual(['value "2" at root[1] is not a valid [number]']);
  });

  it("should not contain any index", () => {
    expect(
      pipe(
        t.union([t.number, t.string]).decode(undefined),
        ReadableReporterSimplified.report
      )
    ).toEqual([
      "value undefined at root is not a valid [number]",
      "value undefined at root is not a valid [string]"
    ]);
  });

  it("should contain the index of the undefined element", () => {
    expect(
      pipe(
        t.array(t.union([t.number, t.string])).decode([1, undefined, "3"]),
        ReadableReporterSimplified.report
      )
    ).toEqual([
      "value undefined at root[1] is not a valid [number]",
      "value undefined at root[1] is not a valid [string]"
    ]);
  });

  it("should contain the index of the undefined element for a ReadonlyArray", () => {
    expect(
      ReadableReporterSimplified.report(
        t.readonlyArray(t.number).decode([1, 2, "invalid"])
      )
    ).toEqual(['value "invalid" at root[2] is not a valid [number]']);
  });

  it("should return no errors", () => {
    expect(
      ReadableReporterSimplified.report(
        t.readonlyArray(t.number).decode([1, 2, 3])
      )
    ).toEqual(["No errors!"]);
  });

  it("should avoid the indexes of a t.union", () => {
    expect(
      pipe(
        t.union([t.string, t.boolean]).decode([1, "2", 3]),
        ReadableReporterSimplified.report
      )
    ).toEqual([
      'value [1,"2",3] at root is not a valid [string]',
      'value [1,"2",3] at root is not a valid [boolean]'
    ]);
  });
});
