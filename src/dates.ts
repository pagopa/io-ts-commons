import * as t from "io-ts";
import { PatternString } from "./strings";

const isDate = (v: t.mixed): v is Date => v instanceof Date;

/**
 * Accepts short formats (ie. "2018-10-13")
 * with or without time and timezone parts.
 */
// eslint-disable-next-line  @typescript-eslint/naming-convention
export const DateFromString = new t.Type<Date, string>(
  "DateFromString",
  isDate,
  (v, c) =>
    isDate(v)
      ? t.success(v)
      : t.string.validate(v, c).chain(s => {
          const d = new Date(s);
          return isNaN(d.getTime()) ? t.failure(s, c) : t.success(d);
        }),
  a => a.toISOString()
);

export type DateFromString = t.TypeOf<typeof DateFromString>;

/**
 * ISO8601 format for dates.
 *
 * Date and time is separated with a capital T.
 * UTC time is defined with a capital letter Z.
 *
 */
const UTC_ISO8601_FULL_REGEX = PatternString(
  "^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(\\.\\d+)?(Z)?$"
);

/**
 * Accepts only full ISO8601 format with UTC (Z) timezone
 *
 * ie. "2018-10-13T00:00:00.000Z"
 */
// eslint-disable-next-line  @typescript-eslint/naming-convention
export const UTCISODateFromString = new t.Type<Date, string>(
  "UTCISODateFromString",
  isDate,
  (v, c) =>
    isDate(v)
      ? t.success(v)
      : UTC_ISO8601_FULL_REGEX.validate(v, c).chain(s => {
          const d = new Date(s);
          return isNaN(d.getTime()) ? t.failure(s, c) : t.success(d);
        }),
  a => a.toISOString()
);

export type UTCISODateFromString = t.TypeOf<typeof UTCISODateFromString>;
