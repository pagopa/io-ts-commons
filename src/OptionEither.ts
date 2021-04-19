/* eslint-disable @typescript-eslint/explicit-member-accessibility, sort-keys */

/**
 * An optional value that can be valid
 */

import { Either } from "fp-ts/lib/Either";
import * as eitherT from "fp-ts/lib/EitherT";
import { constFalse, constTrue, Lazy } from "fp-ts/lib/function";
import { Monad2 } from "fp-ts/lib/Monad";
import * as option from "fp-ts/lib/Option";

declare module "fp-ts/lib/HKT" {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface URI2HKT2<L, A> {
    readonly OptionEither: OptionEither<L, A>;
  }
}

const eitherTOption = eitherT.getEitherT(option.option);

export const URI = "OptionEither";

export type URI = typeof URI;

const eitherTfold = eitherT.fold(option.option);

export class OptionEither<L, A> {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  readonly _A!: A;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  readonly _L!: L;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  readonly _URI!: URI;

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(readonly value: option.Option<Either<L, A>>) {}

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  map<B>(f: (a: A) => B): OptionEither<L, B> {
    return new OptionEither(eitherTOption.map(this.value, f));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  ap<B>(fab: OptionEither<L, (a: A) => B>): OptionEither<L, B> {
    return new OptionEither(eitherTOption.ap(fab.value, this.value));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  ap_<B, C>(
    this: OptionEither<L, (b: B) => C>,
    fb: OptionEither<L, B>
  ): OptionEither<L, C> {
    return fb.ap(this);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  chain<B>(f: (a: A) => OptionEither<L, B>): OptionEither<L, B> {
    return new OptionEither(eitherTOption.chain(a => f(a).value, this.value));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  fold<R>(lf: (l: L) => R, rf: (r: A) => R): option.Option<R> {
    return eitherTfold(lf, rf, this.value);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  isSome(): boolean {
    return option.isSome(this.value);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  isNone(): boolean {
    return option.isNone(this.value);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  isRight(): boolean {
    return this.fold(constFalse, constTrue).getOrElse(false);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  isLeft(): boolean {
    return this.fold(constTrue, constFalse).getOrElse(false);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  getOrElse(a: A): A {
    return this.value.map(_ => _.getOrElse(a)).getOrElse(a);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  getOrElseL(a: Lazy<A>): A {
    return this.value.map(_ => _.getOrElseL(a)).getOrElseL(a);
  }
}

const map = <L, A, B>(
  fa: OptionEither<L, A>,
  f: (a: A) => B
): OptionEither<L, B> => fa.map(f);

const eitherTright = eitherT.right(option.option);
const of = <L, A>(a: A): OptionEither<L, A> =>
  new OptionEither(eitherTright(option.some(a)));

const ap = <L, A, B>(
  fab: OptionEither<L, (a: A) => B>,
  fa: OptionEither<L, A>
): OptionEither<L, B> => fa.ap(fab);

const chain = <L, A, B>(
  fa: OptionEither<L, A>,
  f: (a: A) => OptionEither<L, B>
): OptionEither<L, B> => fa.chain(f);

export const optionEither: Monad2<URI> = {
  URI,
  map,
  // eslint-disable-next-line sort-keys
  ap,
  of,
  // eslint-disable-next-line sort-keys
  chain
};
