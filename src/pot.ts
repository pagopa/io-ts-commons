/**
 * A type for handling the states of remote (potential) data.
 */
// eslint-disable @typescript-eslint/no-explicit-any
// eslint-disable max-params
// eslint-disable @typescript-eslint/interface-name-prefix

import * as option from "fp-ts/lib/Option";

/**
 * Empty value, not yet retrieved.
 */
interface None {
  readonly kind: "PotNone";
}

export const none: None = {
  kind: "PotNone"
};

/**
 * Empty value, loading.
 */
interface NoneLoading {
  readonly kind: "PotNoneLoading";
}

export const noneLoading: NoneLoading = {
  kind: "PotNoneLoading"
};

/**
 * Empty value, updating a new value to remote store.
 */
interface NoneUpdating<T> {
  readonly kind: "PotNoneUpdating";
  readonly newValue: T;
}

export const noneUpdating = <T>(newValue: T): NoneUpdating<T> => ({
  kind: "PotNoneUpdating",
  newValue
});

/**
 * Empty value, loading failed.
 */
interface NoneError<E> {
  readonly kind: "PotNoneError";
  readonly error: E;
}

export const noneError = <E>(error: E): NoneError<E> => ({
  error,
  kind: "PotNoneError"
});

/**
 * Loaded value.
 */
interface Some<T> {
  readonly kind: "PotSome";
  readonly value: T;
}

export const some = <T>(value: T): Some<T> => ({
  kind: "PotSome",
  value
});

/**
 * Loaded value, loading a new value from remote.
 */
interface SomeLoading<T> {
  readonly kind: "PotSomeLoading";
  readonly value: T;
}

export const someLoading = <T>(value: T): SomeLoading<T> => ({
  kind: "PotSomeLoading",
  value
});

/**
 * Loaded value, updating a new value to remote store.
 */
interface SomeUpdating<T> {
  readonly kind: "PotSomeUpdating";
  readonly value: T;
  readonly newValue: T;
}

export const someUpdating = <T>(value: T, newValue: T): SomeUpdating<T> => ({
  kind: "PotSomeUpdating",
  newValue,
  value
});

/**
 * Loaded value, loading an updated value failed.
 */
interface SomeError<T, E> {
  readonly kind: "PotSomeError";
  readonly value: T;
  readonly error: E;
}

export const someError = <T, E>(value: T, error: E): SomeError<T, E> => ({
  error,
  kind: "PotSomeError",
  value
});

export type Pot<T, E> =
  | None
  | NoneLoading
  | NoneUpdating<T>
  | NoneError<E>
  | Some<T>
  | SomeLoading<T>
  | SomeUpdating<T>
  | SomeError<T, E>;

export type PotType<T> = T extends Some<infer A0>
  ? A0
  : T extends SomeLoading<infer A1>
  ? A1 // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : T extends SomeError<infer A2, any>
  ? A2
  : never;

export type PotErrorType<T> = T extends NoneError<infer E0>
  ? E0 // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : T extends SomeError<any, infer E1>
  ? E1
  : never;

export const toSomeLoading = <T>( // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: Some<T> | SomeError<T, any>
): SomeLoading<T> => someLoading(p.value);

export const isSome = <A, E = unknown>(
  p: Pot<A, E>
): p is Some<A> | SomeLoading<A> | SomeUpdating<A> | SomeError<A, E> =>
  p.kind === "PotSome" ||
  p.kind === "PotSomeLoading" ||
  p.kind === "PotSomeUpdating" ||
  p.kind === "PotSomeError";

export const isNone = <A, E = unknown>(
  p: Pot<A, E>
): p is None | NoneLoading | NoneUpdating<A> | NoneError<E> =>
  p.kind === "PotNone" ||
  p.kind === "PotNoneLoading" ||
  p.kind === "PotNoneUpdating" ||
  p.kind === "PotNoneError";

export const isLoading = <A>( // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: Pot<A, any>
): p is NoneLoading | SomeLoading<A> =>
  p.kind === "PotNoneLoading" || p.kind === "PotSomeLoading";

export const isUpdating = <A>(
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  p: Pot<A, any> // eslint-disable-next-line @typescript-eslint/no-explicit-any
): p is NoneUpdating<A> | SomeUpdating<A> =>
  p.kind === "PotNoneUpdating" || p.kind === "PotSomeUpdating";

export const isError = <A, E = unknown>(
  p: Pot<A, E>
): p is NoneError<E> | SomeError<A, E> =>
  p.kind === "PotNoneError" || p.kind === "PotSomeError";

export const toLoading = <T>(
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  p: Pot<T, any>
): SomeLoading<T> | NoneLoading => // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isSome(p) ? someLoading(p.value) : noneLoading;

export const toUpdating = <T>( // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: Pot<T, any>,
  newValue: T
): SomeUpdating<T> | NoneUpdating<T> =>
  isSome(p) ? someUpdating(p.value, newValue) : noneUpdating(newValue);

export const toError = <T, E = unknown>(
  p: Pot<T, E>,
  error: E
): NoneError<E> | SomeError<T, E> =>
  isSome(p) ? someError(p.value, error) : noneError(error);

export const fold = <A, E, O>(
  p: Pot<A, E>,
  foldNone: () => O,
  foldNoneLoading: () => O,
  foldNoneUpdating: (newValue: A) => O,
  foldNoneError: (error: E) => O,
  foldSome: (value: A) => O,
  foldSomeLoading: (value: A) => O,
  foldSomeUpdating: (value: A, newValue: A) => O,
  foldSomeError: (value: A, error: E) => O
  // eslint-disable-next-line  max-params
): O => {
  // eslint-disable-next-line  default-case
  switch (p.kind) {
    case "PotNone":
      return foldNone();
    case "PotNoneLoading":
      return foldNoneLoading();
    case "PotNoneUpdating":
      return foldNoneUpdating(p.newValue);
    case "PotNoneError":
      return foldNoneError(p.error);
    case "PotSome":
      return foldSome(p.value);
    case "PotSomeLoading":
      return foldSomeLoading(p.value);
    case "PotSomeUpdating":
      return foldSomeUpdating(p.value, p.newValue);
    case "PotSomeError":
      return foldSomeError(p.value, p.error);
  }
};

export const map = <A, B, E = unknown>(
  p: Pot<A, E>,
  f: (_: A) => B
): Pot<B, E> =>
  fold<A, E, Pot<B, E>>(
    p,
    () => none,
    () => noneLoading,
    newValue => noneUpdating(f(newValue)),
    error => noneError(error),
    value => some(f(value)),
    value => someLoading(f(value)),
    (value, newValue) => someUpdating(f(value), f(newValue)),
    (value, error) => someError(f(value), error)
  );

export const filter = <A, E = unknown>(
  p: Pot<A, E>,
  f: (v: A) => boolean
): Pot<A, E> =>
  fold(
    p,
    () => p,
    () => p,
    () => p,
    () => p,
    value => (f(value) ? p : none),
    value => (f(value) ? p : noneLoading),
    (value, newValue) => (f(value) ? p : noneUpdating(newValue)),
    (value, error) => (f(value) ? p : noneError(error))
  );

export const mapNullable = <A, B, E = unknown>(
  p: Pot<A, E>,
  f: (_: A) => B | undefined | null
): Pot<B, E> => {
  const mapped = map(p, f);
  return filter(mapped, _ => _ !== undefined && _ !== null) as Pot<B, E>;
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const getOrElse = <A>(p: Pot<A, any>, o: A): A =>
  isSome(p) ? p.value : o;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const getOrElseWithUpdating = <A>(p: Pot<A, any>, o: A): A =>
  isUpdating(p) ? p.newValue : isSome(p) ? p.value : o;

export const orElse = <A, E = unknown>(p: Pot<A, E>, o: Pot<A, E>): Pot<A, E> =>
  isSome(p) ? p : o;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const toUndefined = <A>(p: Pot<A, any>): A | undefined =>
  isSome(p) ? p.value : undefined;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const toOption = <A>(p: Pot<A, any>): option.Option<A> =>
  option.fromNullable(toUndefined(p));

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
type PotKinds = { [index in Pot<any, any>["kind"]]: 0 };

// eslint-disable-next-line  @typescript-eslint/naming-convention
const PotKinds: PotKinds = {
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotNone: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotNoneError: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotNoneLoading: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotNoneUpdating: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotSome: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotSomeError: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotSomeLoading: 0,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PotSomeUpdating: 0
};

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const isPot = (value: any): value is Pot<any, any> =>
  value !== null &&
  typeof value === "object" &&
  value.kind !== undefined &&
  value.kind in PotKinds;
