import { SerializedOf } from "../serialized";
import * as E from "fp-ts/Either";
import * as t from "io-ts";
import { readableReport } from "../reporters";
import { NumberFromString } from "../numbers";
import { NonEmptyString } from "../strings";
import { withDefault } from "../types";

const anInterface = t.interface({ foo: t.string, bar: NumberFromString });
const aPartialInterface = t.partial({ foo: t.string, bar: NumberFromString });

const aRecordWithDefault = t.record(
  t.string,
  withDefault(NumberFromString, 999)
);
const aDefaultString = "HERE_THERE-WAS-AN-EMPTY-VALUE";
const aRecordOfNumbers = t.record(t.string, NumberFromString);
const aRecordWithDefaults = t.record(
  t.string,
  withDefault(t.string, aDefaultString)
);
const aRecordOfNonEmptyStrings = t.record(t.string, NonEmptyString);
//console.log("---->", aRecordOfNumber.is({}));

describe("SerializedOf", () => {
  it.each`
    scenario                                 | input                                    | shape                  | expected
    ${"empty interface with partials"}       | ${""}                                    | ${aPartialInterface}   | ${{}}
    ${"interface with partials"}             | ${"foo:foo-value"}                       | ${aPartialInterface}   | ${{ foo: "foo-value" }}
    ${"interface with duplicated keys"}      | ${"foo:foo-value|foo:another-foo-value"} | ${aPartialInterface}   | ${{ foo: "another-foo-value" }}
    ${"interface without partials"}          | ${"bar:10|foo:foo-value"}                | ${anInterface}         | ${{ foo: "foo-value", bar: 10 }}
    ${"a record"}                            | ${"a:12|b:123|c:-234"}                   | ${aRecordOfNumbers}    | ${{ a: 12, b: 123, c: -234 }}
    ${"an empty record (from empty string)"} | ${""}                                    | ${aRecordOfNumbers}    | ${{}}
    ${"an empty record (from undefined)"}    | ${undefined}                             | ${aRecordOfNumbers}    | ${{}}
    ${"a record with default values"}        | ${"a:12|b:|c:C-VALUE"}                   | ${aRecordWithDefaults} | ${{ a: "12", b: aDefaultString, c: "C-VALUE" }}
  `("should decode into $title", ({ shape, input, expected }) => {
    const result = SerializedOf(shape).decode(input);

    if (E.isRight(result)) {
      expect(result.right).toEqual(expected);
    } else {
      console.log("eee", result.left);
      fail(`Cannot decode '${input}', reason: ${readableReport(result.left)}`);
    }
  });

  it.each`
    scenario                                                            | input                                 | shape
    ${"an incomplete keyvalue pair and with a codec handling defaults"} | ${"foo:foo-value|bar|baz:baz-value"}  | ${aRecordWithDefaults}
    ${"an incomplete keyvalue pair"}                                    | ${"foo:foo-value|bar|baz:baz-value"}  | ${aRecordOfNonEmptyStrings}
    ${"a pair with empty values"}                                       | ${"foo:foo-value|bar:|baz:baz-value"} | ${aRecordOfNonEmptyStrings}
  `("should fail decode", ({ shape, input }) => {
    const result = SerializedOf(shape).decode(input);

    if (E.isRight(result)) {
      fail("expected failure");
    }
  });

  it("should be composed to depth bigger than 1", () => {
    const depth2 = SerializedOf<Record<string, NonEmptyString>>(
      aRecordOfNonEmptyStrings,
      "|",
      ":"
    ) as t.Mixed;
    const depth1 = SerializedOf(
      t.record(t.string, depth2),
      "||",
      "::"
    ) as t.Mixed;
    const depth0 = SerializedOf(t.record(t.string, depth1), "|||", ":::");

    const input = "depth_0:::depth_1::depth_2:value";
    const expected = {
      depth_0: {
        depth_1: {
          depth_2: "value"
        }
      }
    };

    const result = depth0.decode(input);

    if (E.isRight(result)) {
      expect(result.right).toEqual(expected);
    } else {
      fail(`Cannot decode '${input}', reason: ${readableReport(result.left)}`);
    }
  });

  it("should be BLA BLA BLA", () => {
    type Address = t.TypeOf<typeof Address>;
    const Address = t.interface({ city: t.string, street: t.string });

    const address = (SerializedOf(Address) as unknown) as t.Type<Address>;

    const struct = SerializedOf(
      t.interface({
        address,
        name: t.string
      }),
      "||",
      "::"
    );

    const input = "name::Mario||address::city:Rome|street:piazza Colonna";
    const expected = {
      name: "Mario",
      address: {
        city: "Rome",
        street: "piazza Colonna"
      }
    };

    const result = struct.decode(input);

    if (E.isRight(result)) {
      expect(result.right).toEqual(expected);
    } else {
      fail(`Cannot decode '${input}', reason: ${readableReport(result.left)}`);
    }
  });
});
