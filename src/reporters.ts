import { Context, ValidationError } from "io-ts";
import { Reporter } from "io-ts/lib/Reporter";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

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
    return " (decoder info n/a)";
  }

  /*
    in order to get a more readable ouptut we want to avoid those keys that represent the index of a t.union or a t.intersection, 
    to do this we want to render the key in the output just in 2 cases: 
      1. the key can be parsed as a valid integer and the element right before was an ArrayType
      2. the key is not parsable as a valid integer but it is also a non empty string
  */
  const keysPath = context
    .filter(
      // eslint-disable-next-line
      (c: any, i: number) =>
        (!isNaN(parseInt(c.key, 10)) &&
          context[i - 1] &&
          // eslint-disable-next-line
          (context[i - 1].type as any)._tag === "ArrayType") ||
        (isNaN(parseInt(c.key, 10)) && c.key !== "")
    )
    .map(({ key }) => (isNaN(parseInt(key, 10)) ? `.${key}` : `[${key}]`));

  const lastType = context[context.length - 1].type;

  if ("never" === lastType.name) {
    return `${keysPath.join("")} is not a known property`;
  }

  return `${keysPath.join("")} is not a valid [${lastType.name}]`;
};

const getMessage = (value: unknown, context: Context): string =>
  `value ${JSON.stringify(value)} at root${getContextPath(context)}`;

/**
 * Translates validation errors to more readable messages.
 */
export const errorsToReadableMessages = (
  es: ReadonlyArray<ValidationError>
): ReadonlyArray<string> => es.map(e => getMessage(e.value, e.context));

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
