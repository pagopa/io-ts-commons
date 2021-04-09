// eslint-disable @typescript-eslint/explicit-member-accessibility, @typescript-eslint/interface-name-prefix, sort-keys

import {
  Applicative2C,
  getApplicativeComposition
} from "fp-ts/lib/Applicative";
import { phantom } from "fp-ts/lib/function";
import { Functor2, getFunctorComposition } from "fp-ts/lib/Functor";
import * as option from "fp-ts/lib/Option";
import { Semigroup } from "fp-ts/lib/Semigroup";
import * as validation from "fp-ts/lib/Validation";

declare module "fp-ts/lib/HKT" {
  interface URI2HKT2<L, A> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly OptionValidation: OptionValidation<L, A>;
  }
}

const optionValidationFunctor = getFunctorComposition(
  option.option,
  validation.validation
);

export const URI = "OptionValidation";

export type URI = typeof URI;

export class OptionValidation<L, A> {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, @typescript-eslint/naming-convention
  readonly _A!: A;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, @typescript-eslint/naming-convention
  readonly _L!: L;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, @typescript-eslint/naming-convention
  readonly _URI!: URI;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(readonly value: option.Option<validation.Validation<L, A>>) {}
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  map<B>(f: (a: A) => B): OptionValidation<L, B> {
    return new OptionValidation(optionValidationFunctor.map(this.value, f));
  }
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  fold<R>(failure: (l: L) => R, success: (a: A) => R): option.Option<R> {
    return this.value.map(v => v.fold(failure, success));
  }
}

const map = <L, A, B>(
  fa: OptionValidation<L, A>,
  f: (a: A) => B
): OptionValidation<L, B> => fa.map(f);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getApplicative = <L>(S: Semigroup<L>): Applicative2C<URI, L> => {
  const optionValidationApplicative = getApplicativeComposition(
    option.option,
    validation.getApplicative(S)
  );

  const of = <A>(a: A): OptionValidation<L, A> =>
    new OptionValidation(optionValidationApplicative.of(a));

  const ap = <A, B>(
    fab: OptionValidation<L, (a: A) => B>,
    fa: OptionValidation<L, A>
  ): OptionValidation<L, B> =>
    new OptionValidation(optionValidationApplicative.ap(fab.value, fa.value));
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    URI,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _L: phantom,
    map,
    of,
    // eslint-disable-next-line sort-keys
    ap
  };
};

export const optionValidation: Functor2<URI> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  URI,
  map
};
