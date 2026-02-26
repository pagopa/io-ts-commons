/**
 * Declares common unit types
 */

export type Day = IUnitTag<"Day"> & number;

export type Hour = IUnitTag<"Hour"> & number;

export interface IUnitTag<T> {
  readonly kind: T;
}

export type Millisecond = IUnitTag<"Millisecond"> & number;

export type Minute = IUnitTag<"Minute"> & number;

export type Second = IUnitTag<"Second"> & number;
