import * as t from "io-ts";

const isDate = (v: t.mixed): v is Date => v instanceof Date;

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
