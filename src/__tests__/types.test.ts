import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import {
  HasTail,
  readonlyNonEmptySetType,
  strictInterfaceWithOptionals,
  Tail,
  withoutNullValues,
  withoutUndefinedValues
} from "../types";

import { isLeft, isRight } from "fp-ts/lib/Either";
import { readableReport } from "../reporters";

import { enumType, readonlySetType, withDefault, Head } from "../types";

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

  it.each`
    title                  | f
    ${"an empty array"}    | ${[]}
    ${"a not empty array"} | ${["a", "b"]}
    ${"a non empty set"}   | ${new Set("x")}
  `("should validate $title", ({ f }) => {
    const v = aSetOfStrings.decode(f);
    expect(E.isRight(v)).toBeTruthy();
  });
});

describe("readonlyNonEmptySetType", () => {
  const aReadonlyNonEmptySet = readonlyNonEmptySetType(
    t.string,
    "Set of strings"
  );

  it.each`
    title                   | f
    ${"an empty set array"} | ${new Set()}
    ${"an empty array"}     | ${[]}
  `("should not validate if is $title", ({ f }) => {
    const v = aReadonlyNonEmptySet.decode(f);
    expect(E.isLeft(v)).toBeTruthy();
    expect(aReadonlyNonEmptySet.is(f)).toBeFalsy();
  });

  it("should create immutable set from an array", () => {
    const anArray = ["a", "b"];
    const anUnexpectedValue = "foo";

    const maybeFromArray = aReadonlyNonEmptySet.decode(anArray);

    anArray.push(anUnexpectedValue);

    if (E.isRight(maybeFromArray)) {
      expect(maybeFromArray.right.has(anUnexpectedValue)).toBe(false);
    }
  });
  it("should create immutable set from a set", () => {
    const aSet = new Set("x");
    const anUnexpectedValue = "foo";

    const maybeFromSet = aReadonlyNonEmptySet.decode(aSet);

    aSet.add(anUnexpectedValue);

    if (E.isRight(maybeFromSet)) {
      expect(maybeFromSet.right.has(anUnexpectedValue)).toBe(false);
    }
  });
  it.each`
    title                    | f
    ${"a one element array"} | ${["a"]}
    ${"a two element array"} | ${["a", "b"]}
    ${"a non empty set"}     | ${new Set("x")}
  `("should validate $title", ({ f }) => {
    const v = aReadonlyNonEmptySet.decode(f);
    expect(E.isRight(v)).toBeTruthy();
    // We use the decoded value where Array are trasformed to Set
    if (E.isRight(v)) {
      expect(aReadonlyNonEmptySet.is(v.right)).toBeTruthy();
    }
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

  it("should recursively filter out properties pointing to null values", async () => {
    const obj = {
      a: 1,
      b: null,
      c: {
        d: [1, 2],
        e: null
      },
      f: [{g: null}]
    };

    const newObj = withoutNullValues(obj);

    expect(newObj).toStrictEqual({
      a: 1,
      c: {
        d: [1, 2]
      },
      f: [{}]
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
      const errors = readableReport(validation.left);
      expect(errors).toEqual(
        "value [true] at [root.x] is not a known property"
      );
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
    if (E.isRight(r)) {
      expect(r.right).toEqual("hello");
    }
  });

  it("should evaluate to the default value/1", () => {
    const r = defaultString.decode(undefined);
    expect(isRight(r));
    if (E.isRight(r)) {
      expect(r.right).toEqual("DEFAULT");
    }
  });

  it("should evaluate to the default value/2", () => {
    // eslint-disable-next-line no-null/no-null
    const r = defaultString.decode(null);
    expect(isRight(r));
    if (E.isRight(r)) {
      expect(r.right).toEqual("DEFAULT");
    }
  });
});

describe("withDefault (composed partial)", () => {
  it("should evaluate to the valid value", () => {
    const r = defaultObject.decode({ k: "hello" });
    expect(isRight(r));
    if (E.isRight(r)) {
      expect(r.right).toEqual({ k: "hello" });
    }
  });

  it("should evaluate to the default value/3", () => {
    const r = defaultObject.decode({});
    expect(isRight(r));
    if (E.isRight(r)) {
      expect(r.right).toEqual({ k: "DEFAULT" });
    }
  });

  it("should evaluate to the default value/4", () => {
    // eslint-disable-next-line no-null/no-null
    const r = defaultObject.decode({ k: undefined });
    expect(isRight(r));
    if (E.isRight(r)) {
      expect(r.right).toEqual({ k: "DEFAULT" });
    }
  });
});

describe(`Head<T>`, () => {
  it("should map correct type for an array", () => {
    const c = [1, "two", false] as const;

    const c0: Head<typeof c> = c[0];
    const c0_: typeof c[0] = c[0];
    // @ts-expect-error
    const c1: typeof c[0] = c[1];
  });

  it("should map correct type for an array of functions", () => {
    const c = [() => "hello world", () => 1] as const;

    const c0: string = c[0]();
    // @ts-expect-error expect error because "hello world" isn't const
    const c0a: "hello world" = c[0]();
  });

  it("should map correct type for an empty array", () => {
    const c = [] as const;

    const c0: Head<typeof c> = undefined;
  });
});

describe("Tail<T>", () => {
  // enforce a variable to be a Tail
  const tail = <C extends ReadonlyArray<unknown>>([_, ...rest]: C): Tail<C> =>
    rest as Tail<C>;

  it("should infer an empty array for empty arrays", () => {
    const c = [] as const;

    // @ts-expect-error expect error because lenght is fixed to 0
    const _x1: 1 = tail(c).length;
    const _x2: 0 = tail(c).length;

    const _x3: Tail<typeof c> = [];
    // @ts-expect-error expect error because is expecting an empty array
    const _x4: Tail<typeof c> = [undefined];
  });

  it("should infer an empty array for arrays of one element", () => {
    const c = ["foo"] as const;

    // @ts-expect-error expect error because lenght is fixed to 0
    const _x1: 1 = tail(c).length;
    const _x2: 0 = tail(c).length;

    const _x3: Tail<typeof c> = [];
    // @ts-expect-error expect error because is expecting an empty array
    const _x4: Tail<typeof c> = [undefined];
  });

  it("should infer an array for arrays of more than one element", () => {
    const c = [1, "two", false] as const;

    // @ts-expect-error expect error because lenght is not fixed to 0
    const _x1: 0 = tail(c).length;
    // @ts-expect-error
    const _x2: 1 = tail(c).length;
    const _x3: 2 = tail(c).length;

    const _x4: Tail<typeof c> = ["two", false];
  });
});

describe("HasTail<T>", () => {
  it("should infer false for empty arrays", () => {
    const c = [] as const;

    // @ts-expect-error
    const _x1: HasTail<typeof c> = true;
    const _x2: HasTail<typeof c> = false;
  });

  it("should infer false for arrays of one element", () => {
    const c = ["foo"] as const;

    // @ts-expect-error
    const _x1: HasTail<typeof c> = true;
    const _x2: HasTail<typeof c> = false;
  });

  it("should infer true for arrays of more than one element", () => {
    const c = ["foo", "bar"] as const;

    // @ts-expect-error
    const _x1: HasTail<typeof c> = false;
    const _x2: HasTail<typeof c> = true;
  });
});
