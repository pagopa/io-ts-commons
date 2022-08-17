import { Context, ContextEntry, ValidationError } from "io-ts";
import { Reporter } from "io-ts/lib/Reporter";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { includes } from "fp-ts/lib/string";

/**
 * Translate a context to a more readable path.
 *
 * e.g.:
 *
 *   "is not a non empty string"
 *   ".a is not a number"
 *   ".c.b is not a non empty string"
 */
const getContextPath = (context: Context): string => {
  if (context.length === 0) {
    return "] (decoder info n/a)";
  }
  const keysPath = context.map(({ key }) => key).join(".");
  const lastType = context[context.length - 1].type;

  if ("never" === lastType.name) {
    return `${keysPath}] is not a known property`;
  }

  return `${keysPath}] is not a valid [${lastType.name}]`;
};

/**
format path without usless indexes
 */
const isArrayIndex = (
  prev: ReadonlyArray<string>,
  c: ContextEntry,
  i: number,
  context: Context
): boolean =>
  /*
    we keep the key in 2 cases: 
      1. the key is a valid integer and the previous element was any type of array
      2. the key is not an integer 
    those 2 cases are separated cause we want to use the dot notation in the second case, in the first one 
    we want to use the square brackets instead
  */
  c.key !== "" &&
  Number.isInteger(+c.key) &&
  i > 0 &&
  // eslint-disable-next-line
  includes("Array")(context[i - 1].type.name);

const getContextPathSimplified = (context: Context): string => {
  if (context.length === 0) {
    return " (decoder info n/a)";
  }

  /*
    in order to get a more readable ouptut we want to avoid those keys that represent the index of a t.union or a t.intersection, 
    to do this we want to render the key in the output just in 2 cases: 
      1. the key can be parsed as a valid integer and the element right before was an ArrayType
      2. the key is not parsable as a valid integer but it is also a non empty string
  */
  const keysPath = context.reduce(
    (prev: ReadonlyArray<string>, c: ContextEntry, i: number) =>
      isArrayIndex(prev, c, i, context) || !Number.isInteger(+c.key)
        ? Number.isInteger(+c.key)
          ? [...prev, `[${c.key}]`]
          : [...prev, `.${c.key}`]
        : prev,
    []
  );

  const lastType = context[context.length - 1].type;

  if ("never" === lastType.name) {
    return `${keysPath.join("")} is not a known property`;
  }

  return `${keysPath.join("")} is not a valid [${lastType.name}]`;
};

const getMessage = (value: unknown, context: Context): string =>
  `value [${JSON.stringify(value)}] at [root${getContextPath(context)}`;

const getMessageSimplified = (value: unknown, context: Context): string =>
  `value ${JSON.stringify(value)} at root${getContextPathSimplified(context)}`;

/**
 * Translates validation errors to more readable messages.
 */
export const errorsToReadableMessages = (
  es: ReadonlyArray<ValidationError>,
  isSimplified = false
): ReadonlyArray<string> =>
  isSimplified
    ? es.map(e => getMessageSimplified(e.value, e.context))
    : es.map(e => getMessage(e.value, e.context));

const success = (): ReadonlyArray<string> => ["No errors!"];

export const readableReport = (
  errors: ReadonlyArray<ValidationError>
): string => errorsToReadableMessages(errors).join("\n");

/**
 * A validation error reporter that translates validation errors to more
 * readable messages.
 */
export const ReadableReporter: Reporter<ReadonlyArray<string>> = {
  report: validation =>
    pipe(validation, E.fold(errorsToReadableMessages, success))
};

export const readableReportSimplified = (
  errors: ReadonlyArray<ValidationError>
): string =>
  errors
    .map(({ context, value }: ValidationError) =>
      getMessageSimplified(value, context)
    )
    .join("\n");

/**
 * A validation error reporter that translates validation errors to more
 * readable messages avoiding indexes for types such as t.intersection or t.union.
 */

export const ReadableReporterSimplified: Reporter<ReadonlyArray<string>> = {
  report: validation =>
    pipe(
      validation,
      E.fold(v => errorsToReadableMessages(v, true), success)
    )
};
