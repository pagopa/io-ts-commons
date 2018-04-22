/*
 * Simple type safe tuples
 */

/**
 * A Tuple composed of 2 elements
 */
export interface ITuple2<A, B> {
  readonly e1: A;
  readonly e2: B;
}

/**
 * Creates a Tuple composed of 2 elements
 * @param e1 Element 1
 * @param e2 Element 2
 */
export function Tuple2<A, B>(e1: A, e2: B): ITuple2<A, B> {
  return {
    e1,
    e2
  };
}

/**
 * A Tuple composed of 3 elements
 */
export interface ITuple3<A, B, C> extends ITuple2<A, B> {
  readonly e3: C;
}

/**
 * Creates a Tuple composed of 3 elements
 * @param e1 Element 1
 * @param e2 Element 2
 * @param e3 Element 3
 */
export function Tuple3<A, B, C>(e1: A, e2: B, e3: C): ITuple3<A, B, C> {
  return {
    e1,
    e2,
    e3
  };
}
