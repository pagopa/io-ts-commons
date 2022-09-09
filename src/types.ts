import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";

import { Set as SerializableSet } from "json-set-map";
import { pipe } from "fp-ts/lib/function";

/**
 * Returns a subset of the input objects fields.
 *
 * @param obj the input object
 * @param props an array of keys to preserve
 */
export const pick = <T, K extends keyof T>(
  props: ReadonlyArray<K>,
  obj: T
): Pick<T, K> =>
  props.reduce(
    (result: Pick<T, K>, key: K) =>
      Object.assign({}, result, { [key]: obj[key] }),
    {} as Pick<T, K>
  );

/**
 * An io-ts Type tagged with T
 */
export type Tagged<T, A, O = A, I = t.mixed> = t.Type<A & T, O & T, I>;

/**
 * Tags an io-ts type with an interface T
 */
export const tag = <T>() => <A, O = A, I = t.mixed>(
  type: t.Type<A, O, I>
): Tagged<T, A, O, I> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type as any;

/**
 * Removes any extra tags from a type that extends a basic type.
 *
 * Basic types: string, number, boolean
 */
export type UntagBasicType<A> = A extends string
  ? string
  : A extends number
  ? number
  : A extends boolean
  ? boolean
  : never;

/**
 * Returns the passed tagged basic value after converting it to its basic type.
 */
export const untag = <T>(a: T): UntagBasicType<T> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a as any;

/**
 * Returns an object where the keys are the values
 * of the object passed as input and all values are undefined
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const getObjectValues = (e: object): Record<string, undefined> =>
  Object.keys(e).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o, k) => ({ ...o, [(e as any)[k]]: undefined }),
    {} as Record<string, undefined>
  );

/**
 * Creates an io-ts Type from an enum
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const enumType = <E>(e: object, name: string): t.Type<E> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t.keyof(getObjectValues(e), name) as any;

/**
 * Creates an io-ts Type from a ReadonlySet
 */
export const readonlySetType = <E>(
  o: t.Type<E, t.mixed>,
  name: string
): t.Type<ReadonlySet<E>, t.mixed> => {
  const arrayType = t.readonlyArray(o, name);
  return new t.Type<ReadonlySet<E>, t.mixed>(
    name,
    (s): s is ReadonlySet<E> => s instanceof Set && arrayType.is(Array.from(s)),
    (s, c) => {
      if (
        (s instanceof Set && arrayType.is(Array.from(s))) ||
        arrayType.is(s)
      ) {
        return t.success(new SerializableSet(Array.from(s)));
      }
      return t.failure(s, c);
    },
    t.identity
  );
};

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-empty-interface
export interface ReadOnlyNonEmptySet<T> extends ReadonlySet<T> {}

/**
 * Creates an io-ts Type from a ReadonlyNonEmptySet
 */
export const readonlyNonEmptySetType = <E>(
  o: t.Type<E, t.mixed>,
  name: string
): t.Type<ReadOnlyNonEmptySet<E>, t.mixed> =>
  t.refinement(readonlySetType(o, name), e => e.size > 0, name);

/**
 * Returns a new type that has only the F fields of type T.
 */
export type LimitedFields<T, F extends keyof T> = { [P in F]: T[P] };

/**
 *  True when the input is an object (and not array).
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const isObject = (o: {}): boolean =>
  o instanceof Object && o.constructor === Object;

/**
 * Return an object filtering out keys that point to undefined values.
 */
export const withoutUndefinedValues = <T, K extends keyof T>(input: T): T => {
  // note that T has been already validated by the type system and we can
  // be sure now that only attributes that may be undefined can be actually
  // filtered out by the following code, so the output type T is always
  // a valid T
  if (Array.isArray(input)) {
    return (input.map(withoutUndefinedValues) as unknown) as T;
  } else if (isObject(input)) {
    return Object.keys(input)
      .filter(key => input[key as K] !== undefined)
      .reduce(
        (acc, k) => ({ ...acc, [k]: withoutUndefinedValues(input[k as K]) }),
        {} as T
      );
  } else {
    return input;
  }
};

/**
 *  Return a new type that validates successfully only
 *  when the instance (object) contains no unknown properties.
 *
 *  See https://github.com/gcanti/io-ts/issues/106
 *
 *  @\required  required properties
 *  @optional   optional object properties
 */
export const strictInterfaceWithOptionals = <
  R extends t.Props,
  O extends t.Props
>(
  required: R,
  optional: O,
  name: string
): t.Type<
  t.TypeOfProps<R> & t.TypeOfPartialProps<O>,
  t.OutputOfProps<R> & t.OutputOfPartialProps<O>
> => {
  const loose = t.intersection([t.interface(required), t.partial(optional)]);
  const props = Object.assign({}, required, optional);
  return new t.Type(
    name,
    (m): m is t.TypeOfProps<R> & t.TypeOfPartialProps<O> =>
      loose.is(m) &&
      // check if all object properties belong to the strict interface
      // eslint-disable-next-line no-prototype-builtins
      Object.getOwnPropertyNames(m).every(k => props.hasOwnProperty(k)),
    (m, c) =>
      pipe(
        loose.validate(m, c),
        E.chain(o => {
          const errors: t.Errors = Object.getOwnPropertyNames(o)
            .map(key =>
              // eslint-disable-next-line no-prototype-builtins
              !props.hasOwnProperty(key)
                ? t.getValidationError(o[key], t.appendContext(c, key, t.never))
                : undefined
            )
            .filter((e): e is t.ValidationError => e !== undefined);
          return errors.length ? t.failures(errors) : t.success(o);
        })
      ),
    loose.encode
  );
};

/**
 * Sets properties default values when calling t.validate() method on models
 * see https://github.com/gcanti/io-ts/issues/8
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withDefault = <T extends t.Any>(
  type: T,
  defaultValue: t.TypeOf<T>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): t.Type<t.TypeOf<T>, any> =>
  new t.Type(
    type.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (v: any): v is T => type.is(v),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (v: any, c: any) =>
      type.validate(v !== undefined && v !== null ? v : defaultValue, c),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (v: any) => type.encode(v)
  );

/**
 * From T omit a set of properties K
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type ReplaceProp1<T, P1 extends keyof T, A> = { [K in P1]: A } &
  Pick<T, Exclude<keyof T, P1>>;

export type ReplaceProp2<T, P1 extends keyof T, P2 extends keyof T[P1], A> = {
  [K in P1]: ReplaceProp1<T[K], P2, A>;
} &
  Pick<T, Exclude<keyof T, P1>>;

/**
 * Removes null/undefined types from T[P1]
 */
export type RequiredProp1<T, P1 extends keyof T> = ReplaceProp1<
  T,
  P1,
  NonNullable<T[P1]>
>;

/**
 * Removes null/undefined types from T[P1][P2]
 */
export type RequiredProp2<
  T,
  P1 extends keyof T,
  P2 extends keyof T[P1]
> = ReplaceProp2<T, P1, P2, NonNullable<T[P1][P2]>>;

export const requiredProp1 = <A, O, I, P extends keyof A>(
  type: t.Type<A, O, I>,
  p: P,
  name?: string
): t.Type<RequiredProp1<A, P>, O, I> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t.refinement(type, o => o[p] !== undefined, name) as any;

export const replaceProp1 = <
  A,
  O,
  I,
  P extends keyof A,
  A1 extends A[P],
  O1,
  I1
>(
  type: t.Type<A, O, I>,
  p: P,
  typeB: t.Type<A1, O1, I1>,
  name?: string
): t.Type<ReplaceProp1<A, P, A1>, O, I> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t.refinement(type, o => typeB.is(o[p]), name) as any;

/**
 * Returns the type `A` if `T` is a `Promise<A>`, or else returns `never`
 */
export type PromiseType<T> = T extends Promise<infer A> ? A : never;

/**
 * Extract the type of the first element of an array
 */
export type Head<T extends ReadonlyArray<unknown>> = T[0];

/**
 * Extract the type of the sub-array of the tail of an array
 */
export type Tail<T extends ReadonlyArray<unknown>> = T extends readonly [
  unknown,
  ...(infer Rest)
]
  ? Rest
  : readonly [];

/**
 * Whether an array is empty or has only one element
 */
export type HasTail<T extends ReadonlyArray<unknown>> = T extends
  | readonly []
  | readonly [unknown]
  ? false
  : true;
