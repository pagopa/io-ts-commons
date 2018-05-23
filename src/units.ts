/**
 * Declares common unit types
 */

export interface IUnitTag<T> {
  readonly kind: T;
}

export type Millisecond = number & IUnitTag<"Millisecond">;

export type Second = number & IUnitTag<"Second">;
