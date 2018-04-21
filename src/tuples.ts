/*
 * Simple type safe tuples
 */

// tslint:disable-next-line:interface-name
export interface Tuple2<A, B> {
  readonly e1: A;
  readonly e2: B;
}

export function Tuple2<A, B>(e1: A, e2: B): Tuple2<A, B> {
  return {
    e1,
    e2
  };
}

// tslint:disable-next-line:interface-name
export interface Tuple3<A, B, C> extends Tuple2<A, B> {
  readonly e3: C;
}

export function Tuple3<A, B, C>(e1: A, e2: B, e3: C): Tuple3<A, B, C> {
  return {
    e1,
    e2,
    e3
  };
}
