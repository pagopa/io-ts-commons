import * as t from "io-ts";

import { strictInterfaceWithOptionals, withoutUndefinedValues } from "../types";

import { isLeft, isRight } from "fp-ts/lib/Either";
import { readableReport } from "../reporters";

import { enumType, readonlySetType, withDefault } from "../types";

enum aValidEnum {
  "foo" = "fooValue",
  "bar" = "barValue"
}

describe("enumType", () => {
  it("should validate with valid enum values", () => {
    const aValidEnumType = enumType<aValidEnum>(aValidEnum, "aValidEnum");
    const validation = aValidEnumType.decode("fooValue");
    expect(isRight(validation)).toBeTruthy();
  });
  it("should not validate invalid enum values", () => {
    const aValidEnumType = enumType<aValidEnum>(aValidEnum, "aValidEnum");
    const validation = aValidEnumType.decode("booValue");
    expect(isRight(validation)).toBeFalsy();
  });
});

describe("readonlySetType", () => {
  const aSetOfStrings = readonlySetType(t.string, "Set of strings");

  it("should validate", () => {
    // tslint:disable-next-line:no-any
    const fixtures: ReadonlyArray<any> = [[], ["a"], new Set("x")];

    fixtures.forEach(f => {
      const v = aSetOfStrings.decode(f);
      expect(v.isRight()).toBeTruthy();
    });
  });
});

describe("definedValues", () => {
  it("should filter out undefined properties recursively", async () => {
    const obj = {
      a: 1,
      b: undefined,
      c: {
        d: [1, 2],
        e: undefined
      }
    };

    const newObj = withoutUndefinedValues(obj);

    expect(Object.keys(newObj).length).toEqual(2);
    expect(Object.keys(newObj.c).length).toEqual(1);

    expect(newObj).toEqual({
      a: 1,
      c: {
        d: [1, 2]
      }
    });
  });
});

describe("strictInterfaceWithOptionals", () => {
  it("should reject unknown properties", async () => {
    const aType = strictInterfaceWithOptionals(
      {
        required: t.boolean
      },
      {
        optional: t.boolean
      },
      "aName"
    );
    const validation = aType.decode({ required: true, x: true });
    expect(isLeft(validation)).toBeTruthy();
    if (isLeft(validation)) {
      const errors = readableReport(validation.value);
      expect(errors).toEqual("value.x: unknown property");
    }
  });
});

const defaultString = withDefault(t.string, "DEFAULT");

const defaultObject = t.partial({
  k: defaultString
});

describe("withDefault (single value)", () => {
  it("should return true with a valid value", () => {
    const r = defaultString.is("hello");
    expect(r).toBeTruthy();
  });

  it("should return false with an invalid value", () => {
    const r = defaultString.is(1);
    expect(r).toBeFalsy();
  });

  it("should evaluate to the valid value", () => {
    const r = defaultString.decode("hello");
    expect(isRight(r));
    expect(r.value).toEqual("hello");
  });

  it("should evaluate to the default value/1", () => {
    const r = defaultString.decode(undefined);
    expect(isRight(r));
    expect(r.value).toEqual("DEFAULT");
  });

  it("should evaluate to the default value/2", () => {
    // tslint:disable-next-line:no-null-keyword
    const r = defaultString.decode(null);
    expect(isRight(r));
    expect(r.value).toEqual("DEFAULT");
  });
});

describe("withDefault (composed partial)", () => {
  it("should evaluate to the valid value", () => {
    const r = defaultObject.decode({ k: "hello" });
    expect(isRight(r));
    expect(r.value).toEqual({ k: "hello" });
  });

  it("should evaluate to the default value/3", () => {
    const r = defaultObject.decode({});
    expect(isRight(r));
    expect(r.value).toEqual({ k: "DEFAULT" });
  });

  it("should evaluate to the default value/4", () => {
    // tslint:disable-next-line:no-null-keyword
    const r = defaultObject.decode({ k: undefined });
    expect(isRight(r));
    expect(r.value).toEqual({ k: "DEFAULT" });
  });
});
