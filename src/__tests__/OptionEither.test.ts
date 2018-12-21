import { liftA3 } from "fp-ts/lib/Apply";
import * as either from "fp-ts/lib/Either";
import * as option from "fp-ts/lib/Option";
import { OptionEither, optionEither } from "../OptionEither";

describe("EitherOption", () => {
  it("should be created from an Either<Option<>>", () => {
    const fromNone = new OptionEither(option.none);
    expect(fromNone.isNone()).toBeTruthy();

    const fromSomeRight = new OptionEither(option.some(either.right(true)));
    expect(fromSomeRight.isRight()).toBeTruthy();

    const fromSomeLeft = new OptionEither(option.some(either.left(true)));
    expect(fromSomeLeft.isLeft()).toBeTruthy();
  });

  it("should be lifted", () => {
    const f = (a: string) => (b: string) => (c: string) => [a, b, c];

    const fe = liftA3(optionEither)(f);

    const none = new OptionEither<Error, string>(option.none);
    const some = optionEither.of<Error, string>("a");
    const left = new OptionEither<Error, string>(
      option.some(either.left(Error()))
    );

    expect(fe(none)(none)(none)).toEqual(none);
    expect(fe(none)(none)(some)).toEqual(none);
    expect(fe(none)(some)(some)).toEqual(none);
    expect(fe(some)(some)(some)).toEqual(optionEither.of(["a", "a", "a"]));
    expect(fe(some)(some)(left)).toEqual(left);
    expect(fe(some)(left)(some)).toEqual(left);
    expect(fe(left)(some)(some)).toEqual(left);
  });
});
