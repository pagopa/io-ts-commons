import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import * as J from "fp-ts/lib/Json";
import { flow, pipe } from "fp-ts/lib/function";
import * as jose from "jose";
import { NonEmptyString } from "./strings";
import { errorsToReadableMessages } from "./reporters";

/**
 * This is the JWK JSON type for the EC keys.
 */
export const ECKey = t.type({
  crv: t.string,
  kty: t.literal("EC"),
  x: t.string,
  y: t.string
});

export type ECKey = t.TypeOf<typeof ECKey>;

/**
 * This is the JWK JSON type for the RSA keys.
 */
export const RSAKey = t.type({
  alg: t.string,
  e: t.string,
  kty: t.literal("RSA"),
  n: t.string
});

export type RSAKey = t.TypeOf<typeof RSAKey>;

/**
 * The Public Key JWK type. It could be either an ECKey or an RSAKey.
 */
export const JwkPublicKey = t.union([RSAKey, ECKey], "JwkPublicKey");
export type JwkPublicKey = t.TypeOf<typeof JwkPublicKey>;

export const parseJwkOrError = (token: unknown): E.Either<Error, J.Json> =>
  pipe(
    token,
    NonEmptyString.decode,
    E.mapLeft(E.toError),
    E.chain(tokenStr =>
      E.tryCatch(
        () =>
          pipe(
            Buffer.from(jose.base64url.decode(tokenStr)),
            E.fromPredicate(
              b => b.length > 0,
              () => {
                throw new Error("Unexpected JWK empty buffer");
              }
            ),
            E.map(b => b.toString()),
            E.toUnion
          ),
        _ => Error("Cannot decode JWK Base64")
      )
    ),
    E.chain(
      flow(
        J.parse,
        E.mapLeft(_ => Error("Cannot parse JWK to JSON format"))
      )
    )
  );

export const JwkPublicKeyFromToken = new t.Type<JwkPublicKey, string>(
  "JwkPublicKeyFromToken",
  (s): s is JwkPublicKey =>
    pipe(s, parseJwkOrError, E.toUnion, JwkPublicKey.is),
  (s, ctx) =>
    pipe(
      s,
      parseJwkOrError,
      E.chainW(
        flow(
          JwkPublicKey.decode,
          E.mapLeft(errs => Error(errorsToReadableMessages(errs).join("|")))
        )
      ),
      E.fold(e => t.failure(s, ctx, e.message), t.success)
    ),
  flow(
    J.stringify,
    E.map(jose.base64url.encode),
    E.getOrElseW(_ => {
      throw new Error("Cannot stringify a malformed json");
    })
  )
);
export type JwkPublicKeyFromToken = t.TypeOf<typeof JwkPublicKeyFromToken>;
