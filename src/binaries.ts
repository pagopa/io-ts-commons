import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { WithinRangeInteger } from "./numbers";

/**
Check wether the input is a valid Uint8Array
 */
// eslint-disable-next-line
const checkUint8Array = (toCheck: any): boolean =>
  Array.isArray(toCheck) &&
  toCheck.length > 0 &&
  // eslint-disable-next-line
  toCheck.every((e: any) => WithinRangeInteger(0, 256).is(e));

/**
In order to be a valid array to generate a buffer:
1. It must be a non empty array
2. Every element must be an integer with the value between 0 and 255
If an element of the array is outside of this range, it will be converted with the % operator
from the Buffer.from() method, in order to avoid reading problems this function will consider any Array with at
least one number outside of the range 0 - 255 non valid.
 */

const Uint8ArrayValidator = (
  arr: any, // eslint-disable-line
  c: t.Context
): E.Either<t.Errors, Buffer> =>
  pipe(
    arr,
    E.fromPredicate(
      () => checkUint8Array(arr),
      () => [{ context: c, value: "Invalid Uint8Array" }]
    ),
    E.map(a => Buffer.from(a))
  );

/**
Get a Buffer from a valid number[]  
 */

export const BinaryFromArray = new t.Type<Buffer, unknown, unknown>(
  "BinaryFromArray",
  (input): input is Buffer => Buffer.isBuffer(input),
  (input, context) => Uint8ArrayValidator(input, context),
  (input: Buffer) => input
);

/**
Check wether the buffer is valid and non empty
 */
// eslint-disable-next-line
const checkBuffer = (b: any): boolean => Buffer.isBuffer(b) && b.length > 0;

const BufferValidator = (
  toCheck: any, // eslint-disable-line
  context: t.Context
): E.Either<t.Errors, Buffer> =>
  pipe(
    toCheck,
    E.fromPredicate(
      v => checkBuffer(v),
      () => [{ context, value: "Invalid Buffer" }]
    )
  );

/**
A Binary tipe should be a correct and non empty Buffer
 */

export const Binary = new t.Type<Buffer, unknown, unknown>(
  "Binary",
  (input): input is Buffer =>
    Buffer.isBuffer(input) && input.length ? true : false,
  (input, context) => BufferValidator(input, context),
  (input: Buffer) => input
);

export type Binary = t.TypeOf<typeof Binary>;
export type BinaryFromArray = t.TypeOf<typeof BinaryFromArray>;
