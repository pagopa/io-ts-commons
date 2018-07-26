import * as t from "io-ts";

import { Set as SerializableSet } from "json-set-map";

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
  // tslint:disable-next-line:no-any
  type as any;

/**
 * Removes any extra tags from a type that extends a basic type.
 *
 * Basic types: string, number, boolean
 */
export type UntagBasicType<A> = A extends string
  ? string
  : A extends number ? number : A extends boolean ? boolean : never;

/**
 * Returns the passed tagged basic value after converting it to its basic type.
 */
export function untag<T>(a: T): UntagBasicType<T> {
  // tslint:disable-next-line:no-any
  return a as any;
}

/**
 * Returns an object where the keys are the values
 * of the object passed as input and all values are undefined
 */
const getObjectValues = (e: object) =>
  Object.keys(e).reduce(
    // tslint:disable-next-line:no-any
    (o, k) => ({ ...o, [(e as any)[k]]: undefined }),
    {} as Record<string, undefined>
  );

/**
 * Creates an io-ts Type from an enum
 */
export const enumType = <E>(e: object, name: string): t.Type<E> =>
  // tslint:disable-next-line:no-any
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
      if (s instanceof Set && arrayType.is(Array.from(s))) {
        return t.success(s);
      }
      if (arrayType.is(s)) {
        return t.success(new SerializableSet(Array.from(s)));
      }
      return t.failure(s, c);
    },
    t.identity
  );
};

/**
 * Returns a new type that has only the F fields of type T.
 */
export type LimitedFields<T, F extends keyof T> = { [P in F]: T[P] };

/**
 *  True when the input is an object (and not array).
 */
export const isObject = (o: {}) =>
  o instanceof Object && o.constructor === Object;

/**
 * Return an object filtering out keys that point to undefined values.
 */
export function withoutUndefinedValues<T, K extends keyof T>(obj: T): T {
  // note that T has been already validated by the type system and we can
  // be sure now that only attributes that may be undefined can be actually
  // filtered out by the following code, so the output type T is always
  // a valid T
  const keys = Object.keys(obj);
  return keys.reduce(
    (acc, key) => {
      const value = obj[key as K];
      return value !== undefined
        ? {
            // see https://github.com/Microsoft/TypeScript/pull/13288
            // tslint:disable-next-line:no-any
            ...(acc as any),
            // tslint:disable-next-line:no-any
            [key]: isObject(value as any)
              ? withoutUndefinedValues(value)
              : value
          }
        : acc;
    },
    {} as T
  ) as T;
}

/**
 *  Return a new type that validates successfully only
 *  when the instance (object) contains no unknown properties.
 *
 *  See https://github.com/gcanti/io-ts/issues/106
 *
 *  @\required  required properties
 *  @optional   optional object properties
 */
export function strictInterfaceWithOptionals<
  R extends t.Props,
  O extends t.Props
>(
  required: R,
  optional: O,
  name: string
): t.Type<
  t.TypeOfProps<R> & t.TypeOfPartialProps<O>,
  t.OutputOfProps<R> & t.OutputOfPartialProps<O>
> {
  const loose = t.intersection([t.interface(required), t.partial(optional)]);
  const props = Object.assign({}, required, optional);
  return new t.Type(
    name,
    (m): m is t.TypeOfProps<R> & t.TypeOfPartialProps<O> =>
      loose.is(m) &&
      // check if all object properties belong to the strict interface
      Object.getOwnPropertyNames(m).every(k => props.hasOwnProperty(k)),
    (m, c) =>
      loose.validate(m, c).chain(o => {
        const errors: t.Errors = Object.getOwnPropertyNames(o)
          .map(
            key =>
              !props.hasOwnProperty(key)
                ? t.getValidationError(o[key], t.appendContext(c, key, t.never))
                : undefined
          )
          .filter((e): e is t.ValidationError => e !== undefined);
        return errors.length ? t.failures(errors) : t.success(o);
      }),
    loose.encode
  );
}

/**
 * Sets properties default values when calling t.validate() method on models
 * see https://github.com/gcanti/io-ts/issues/8
 */
// tslint:disable:no-any
export function withDefault<T extends t.Any>(
  type: T,
  defaultValue: t.TypeOf<T>
): t.Type<t.TypeOf<T>, any> {
  return new t.Type(
    type.name,
    (v: any): v is T => type.is(v),
    (v: any, c: any) =>
      // tslint:disable-next-line:no-null-keyword
      type.validate(v !== undefined && v !== null ? v : defaultValue, c),
    (v: any) => type.encode(v)
  );
}
