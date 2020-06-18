/**
 * Declares common unit types
 */

export interface IUnitTag<T> {
  readonly kind: T;
}

export type Millisecond = number & IUnitTag<"Millisecond">;

export type Second = number & IUnitTag<"Second">;

export type Minute = number & IUnitTag<"Minute">;

export type Hour = number & IUnitTag<"Hour">;

export type Day = number & IUnitTag<"Day">;
