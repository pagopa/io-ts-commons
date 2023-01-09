import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import * as semver from "semver";
import { NonEmptyString, Semver } from "./strings";
import { errorsToReadableMessages } from "./reporters";

export const UserAgentSemver = t.type({
  clientName: NonEmptyString,
  clientVersion: Semver
});

export type UserAgentSemver = t.TypeOf<typeof UserAgentSemver>;

/**
 * this comparator check if the second provided userAgentSemver's version is
 * prior or equal to the first one
 */
export const UserAgentSemverValid = {
  equals: (first: UserAgentSemver, second: UserAgentSemver): boolean =>
    first.clientName === second.clientName &&
    semver.satisfies(second.clientVersion, `<=${first.clientVersion}`)
};

/**
 * This custom decoder validates a string format (i.e AppName/<version>)
 * into a valid UserAgentSemver type object.
 * Encoder turns a UserAgentSemver object into a string representation.
 */
export const SemverFromFromUserAgentString = new t.Type<
  UserAgentSemver,
  string
>(
  "SemverFromFromUserAgent",
  (u): u is UserAgentSemver =>
    pipe(
      u,
      t.string.decode,
      E.fold(
        () => false,
        s =>
          pipe(
            s.substring(s.indexOf(`/`) + 1),
            ver => ({
              clientName: s.substring(0, s.indexOf(`/`)),
              clientVersion: ver
                // ignore extra user agents information
                .split(" ")[0]
                .split(".")
                .slice(0, 3)
                .join(".")
            }),
            UserAgentSemver.is
          )
      )
    ),
  (s, ctx) =>
    pipe(
      s,
      t.string.decode,
      E.mapLeft(errs => Error(errorsToReadableMessages(errs).join("|"))),
      E.map(str =>
        pipe(str.substring(str.indexOf(`/`) + 1), ver => ({
          clientName: str.substring(0, str.indexOf(`/`)),
          clientVersion: ver
            // ignore extra user agents information
            .split(" ")[0]
            .split(".")
            .slice(0, 3)
            .join(".")
        }))
      ),
      E.chainW(
        flow(
          UserAgentSemver.decode,
          E.mapLeft(errs => Error(errorsToReadableMessages(errs).join("|")))
        )
      ),
      E.fold(e => t.failure(s, ctx, e.message), t.success)
    ),
  u => `${u.clientName}/${u.clientVersion}`
);

export type SemverFromFromUserAgentString = t.TypeOf<
  typeof SemverFromFromUserAgentString
>;
