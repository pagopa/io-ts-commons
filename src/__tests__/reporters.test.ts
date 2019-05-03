/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import * as t from "io-ts";

import { NonEmptyString } from "../strings";

import { NonNegativeNumber } from "../numbers";

import { strictInterfaceWithOptionals } from "../types";

import { ReadableReporter } from "../reporters";

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
});
