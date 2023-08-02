import * as jwt from "jsonwebtoken";

import * as E from "fp-ts/Either";

import { NonEmptyString } from "../strings";
import { Second } from "../units";

import { getGenerateJWT, getValidateJWT } from "../jwt_with_key_rotation";

import {
  aDifferentPrivateKey,
  aPrimaryKey,
  aSecondaryKey,
} from "../__mocks__/keys";

const issuer = "test-issuer" as NonEmptyString;

const aPayload = { a: "a", b: 1 };
const aTtl = 7200 as Second;

const jwt_with_key_rotation = require("../jwt_with_key_rotation");
const spy_validateJWTWithKey = jest.spyOn(
  jwt_with_key_rotation,
  "validateJWTWithKey"
);

describe("getGenerateJWT", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should generate a valid JWT", async () => {
    const generateJWT = getGenerateJWT(issuer, aPrimaryKey.privateKey);

    const res = await generateJWT(aPayload, aTtl)();

    expect(res).toMatchObject(
      E.right(expect.stringMatching(`[A-Za-z0-9-_]{1,520}`))
    );
  });
});

describe("getValidateJWT - Success", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should succeed validating a valid JWT generated with primary key, during standard period", async () => {
    // Setup
    const generateJWT = getGenerateJWT(issuer, aPrimaryKey.privateKey);
    const token = await generateJWT(aPayload, aTtl)();

    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      // Test
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey
      )(token.right)();

      checkDecodedToken(result);
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(1);
    }
  });

  it("should succeed validating a valid JWT generated with new primary key, during key rotation period", async () => {
    // Setup
    const generateJWT = getGenerateJWT(issuer, aPrimaryKey.privateKey);
    const token = await generateJWT(aPayload, aTtl)();

    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      // Test
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey,
        aSecondaryKey.publicKey
      )(token.right)();

      checkDecodedToken(result);
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(1);
    }
  });

  it("should succeed validating a valid JWT generated with old primary key, during key rotation period", async () => {
    // Setup
    const generateJWT = getGenerateJWT(issuer, aSecondaryKey.privateKey);
    const token = await generateJWT(aPayload, aTtl)();

    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      // Test
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey,
        aSecondaryKey.publicKey
      )(token.right)();

      checkDecodedToken(result);
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(2);
    }
  });
});

describe("getValidateJWT - Failure", () => {
  beforeEach(() => jest.clearAllMocks());

  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it("should fail validating an invalid JWT with only public primary key, during standard period", async () => {
    // Setup
    const generateJWT = getGenerateJWT(issuer, aSecondaryKey.privateKey);
    const token = await generateJWT(aPayload, aTtl)();

    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      // Test
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey
      )(token.right)();

      expect(result).toMatchObject(
        E.left(E.toError("JsonWebTokenError - invalid signature"))
      );
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(1);
    }
  });

  it("should fail validating an invalid JWT with both public primary key and public secondary key, during key rotation period", async () => {
    // Setup
    const generateJWT = getGenerateJWT(issuer, aDifferentPrivateKey);
    const token = await generateJWT(aPayload, aTtl)();

    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      // Test
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey,
        aSecondaryKey.publicKey
      )(token.right)();

      expect(result).toMatchObject(
        E.left(E.toError("JsonWebTokenError - invalid signature"))
      );
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(2);
    }
  });

  it("should fail validating an expired JWT", async () => {
    // Setup
    const generateJWT = getGenerateJWT(issuer, aPrimaryKey.privateKey);
    const token = await generateJWT(aPayload, 1 as Second)();

    // Test
    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      // Wait 1.5s for letting the token to expire
      await delay(1500);
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey
      )(token.right)();

      expect(result).toMatchObject(
        E.left(E.toError("TokenExpiredError - jwt expired"))
      );
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(1);
    }
  });

  it("should fail validating a JWT with different issuer", async () => {
    // Setup
    const generateJWT = getGenerateJWT(
      "anotherIssuer" as NonEmptyString,
      aPrimaryKey.privateKey
    );
    const token = await generateJWT(aPayload, aTtl)();

    // Test
    expect(E.isRight(token)).toBeTruthy();
    if (E.isRight(token)) {
      const result = await getValidateJWT(
        issuer,
        aPrimaryKey.publicKey,
        aSecondaryKey.privateKey
      )(token.right)();

      expect(result).toMatchObject(
        E.left(
          E.toError(
            `JsonWebTokenError - jwt issuer invalid. expected: ${issuer}`
          )
        )
      );
      expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(1);
    }
  });

  it("should fail validating a malformed JWT", async () => {
    const result = await getValidateJWT(
      issuer,
      aPrimaryKey.publicKey,
      aSecondaryKey.publicKey
    )("aMalformedJWT" as NonEmptyString)();

    expect(result).toMatchObject(
      E.left(E.toError(`JsonWebTokenError - jwt malformed`))
    );
    expect(spy_validateJWTWithKey).toHaveBeenCalledTimes(1);
  });
});

// -------------------
// private methods
// -------------------

const checkDecodedToken = async (result: E.Either<Error, jwt.JwtPayload>) => {
  expect(result).toMatchObject(
    E.right(
      expect.objectContaining({
        ...aPayload,
        iss: issuer,
        iat: expect.any(Number),
        exp: expect.any(Number),
        jti: expect.any(String),
      })
    )
  );

  const decoded = (result as E.Right<jwt.JwtPayload>).right;
  expect((decoded.exp ?? 0) - (decoded.iat ?? 0)).toEqual(aTtl);
};
