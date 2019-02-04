// tslint:disable:member-access interface-name object-literal-sort-keys

/**
 * An optional value that can be valid
 */

import { Either } from "fp-ts/lib/Either";
import * as eitherT from "fp-ts/lib/EitherT";
import { constFalse, constTrue, Lazy } from "fp-ts/lib/function";
import { Monad2 } from "fp-ts/lib/Monad";
import * as option from "fp-ts/lib/Option";

declare module "fp-ts/lib/HKT" {
  interface URI2HKT2<L, A> {
    readonly OptionEither: OptionEither<L, A>;
  }
}

const eitherTOption = eitherT.getEitherT(option.option);

export const URI = "OptionEither";

export type URI = typeof URI;

const eitherTfold = eitherT.fold(option.option);

export class OptionEither<L, A> {
  readonly _A!: A;
  readonly _L!: L;
  readonly _URI!: URI;

  constructor(readonly value: option.Option<Either<L, A>>) {}

  map<B>(f: (a: A) => B): OptionEither<L, B> {
    return new OptionEither(eitherTOption.map(this.value, f));
  }

  ap<B>(fab: OptionEither<L, (a: A) => B>): OptionEither<L, B> {
    return new OptionEither(eitherTOption.ap(fab.value, this.value));
  }

  ap_<B, C>(
    this: OptionEither<L, (b: B) => C>,
    fb: OptionEither<L, B>
  ): OptionEither<L, C> {
    return fb.ap(this);
  }

  chain<B>(f: (a: A) => OptionEither<L, B>): OptionEither<L, B> {
    return new OptionEither(eitherTOption.chain(a => f(a).value, this.value));
  }

  fold<R>(lf: (l: L) => R, rf: (r: A) => R): option.Option<R> {
    return eitherTfold(lf, rf, this.value);
  }

  isSome(): boolean {
    return option.isSome(this.value);
  }

  isNone(): boolean {
    return option.isNone(this.value);
  }

  isRight(): boolean {
    return this.fold(constFalse, constTrue).getOrElse(false);
  }

  isLeft(): boolean {
    return this.fold(constTrue, constFalse).getOrElse(false);
  }

  getOrElse(a: A): A {
    return this.value.map(_ => _.getOrElse(a)).getOrElse(a);
  }

  getOrElseL(a: Lazy<A>): A {
    return this.value.map(_ => _.getOrElseL(a)).getOrElseL(a);
  }
}

const map = <L, A, B>(
  fa: OptionEither<L, A>,
  f: (a: A) => B
): OptionEither<L, B> => {
  return fa.map(f);
};

const eitherTright = eitherT.right(option.option);
const of = <L, A>(a: A): OptionEither<L, A> => {
  return new OptionEither(eitherTright(option.some(a)));
};

const ap = <L, A, B>(
  fab: OptionEither<L, (a: A) => B>,
  fa: OptionEither<L, A>
): OptionEither<L, B> => {
  return fa.ap(fab);
};

const chain = <L, A, B>(
  fa: OptionEither<L, A>,
  f: (a: A) => OptionEither<L, B>
): OptionEither<L, B> => {
  return fa.chain(f);
};

export const optionEither: Monad2<URI> = {
  URI,
  map,
  ap,
  of,
  chain
};
