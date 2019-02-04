import { liftA3 } from "fp-ts/lib/Apply";
import * as option from "fp-ts/lib/Option";
import * as semigroup from "fp-ts/lib/Semigroup";
import * as validation from "fp-ts/lib/Validation";
import {
  getApplicative,
  OptionValidation,
  optionValidation
} from "../OptionValidation";

describe("OptionValidation", () => {
  it("should be lifted", () => {
    const f = (a: string) => (b: string) => (c: string) => [a, b, c];

    const ap = getApplicative<Error>(semigroup.getFirstSemigroup());

    const fe = liftA3(ap)(f);

    const none = new OptionValidation<Error, string>(option.none);
    const some = ap.of("a");
    const left = new OptionValidation<Error, string>(
      option.some(validation.failure(Error()))
    );

    expect(fe(none)(none)(none)).toEqual(none);
    expect(fe(none)(none)(some)).toEqual(none);
    expect(fe(none)(some)(some)).toEqual(none);
    expect(fe(some)(some)(some)).toEqual(ap.of(["a", "a", "a"]));
    expect(fe(some)(some)(left)).toEqual(left);
    expect(fe(some)(left)(some)).toEqual(left);
    expect(fe(left)(some)(some)).toEqual(left);
  });
});
