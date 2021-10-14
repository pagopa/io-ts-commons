import * as t from "io-ts";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadonlyArray";
import { flow, identity, pipe } from "fp-ts/lib/function";

/**
 * A codec that maps a Record of scalar values to a serialized form of it.
 * Useful to serialize/deserialize strucired data to/from strings.
 * Only one level of depth is supported.
 *
 * @param recordCodec a codec which implements the required shape of the record
 * @param pairSeparator a character to separate key-value BETWEEN pairs
 * @param keyvalueSeparator a character to separate key-value INSIDE pairs
 * @returns
 */

export const SerializedOf = <T extends Record<string, unknown>>(
  recordCodec: t.Type<T, T>,
  pairSeparator = "|",
  keyvalueSeparator = ":"
): t.Type<T, string, string | undefined> =>
  new t.Type<T, string, string | undefined>(
    `SerializedOf<${recordCodec.name}>`,
    recordCodec.is,
    (input, context) =>
      pipe(
        input,
        O.fromNullable,
        O.chain(s => (s.length ? O.some(s) : O.none)),
        O.map(x => x.split(pairSeparator).map(e => e.split(keyvalueSeparator))),
        /*         O.map(x =>
          x.map(ee =>
            ee.map(([k, v, ...rest]) =>
              typeof v === "string" && v.length === 0
                ? [k, v, ...rest]
                : [k, undefined, ...rest]
            )
          )
        ), */
        O.fold(() => [], identity),
        E.of,
        E.chain(
          E.fromPredicate(
            entries => entries.every(e => e.length === 2),
            _ => "Cannot deserialize: malformed record" + JSON.stringify(_)
          )
        ),
        E.map(entries =>
          entries
            .map(([key, value]) => ({
              [key]: value.length ? value : undefined
            }))
            .reduce((acc, e) => ({ ...acc, ...e }), {})
        ),
        E.fold(msg => t.failure(input, context, msg), E.right),
        E.chainW(recordCodec.decode)
      ),
    flow(
      Object.entries,
      RA.map(keyvalue => keyvalue.join(keyvalueSeparator)),
      _ => _.join(pairSeparator)
    )
  );
