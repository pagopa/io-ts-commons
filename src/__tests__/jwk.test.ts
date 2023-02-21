import { JwkPublicKey, JwkPublicKeyFromToken, parseJwkOrError } from "../jwk";
import * as jose from "jose";
import * as E from "fp-ts/lib/Either";

const algorithm = "ES256";
const spki = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEQ8K81dZcC4DdKl52iW7bT0ubXXm2amN8
35M/v5AgpSGUuzDzZDjXjM9Y+W4jkGZ0ocrpdsV+KdzxpGptkIS/QA==
-----END PUBLIC KEY-----`;

const getJwkToken = () => jose.importSPKI(spki, algorithm);

const aJwkPublicKey: JwkPublicKey = {
  kty: "EC",
  crv: "crv",
  x: "x",
  y: "y"
};

const aRsaJwkPublicKey: JwkPublicKey = {
  kty: "RSA",
  alg: "alg",
  e: "e",
  n: "n"
};
describe("parseJwkOrError", () => {
  it("should parse a valid jwk token", async () => {
    const jwkToken = await getJwkToken();
    const jwk = await jose.exportJWK(jwkToken);
    const result = parseJwkOrError(jose.base64url.encode(JSON.stringify(jwk)));
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual(jwk);
    }
  });

  it("should return an error if jwk is empty", async () => {
    const result = parseJwkOrError("");
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.name).toContain("Error");
    }
  });

  it("should return an error if token contains non base64 chars", async () => {
    const result = parseJwkOrError(" # ");
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.name).toContain("Error");
      expect(result.left.message).toEqual("Cannot decode JWK Base64");
    }
  });

  it("should return an error if token is not well formed", async () => {
    const result = parseJwkOrError("e2E6ICJCIn0=");
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left.name).toContain("Error");
      expect(result.left.message).toEqual("Cannot parse JWK to JSON format");
    }
  });
});

describe("JwkPublicKeyFromToken", () => {
  it("should decode a correct input", async () => {
    const jwkToken = await getJwkToken();
    const jwk = await jose.exportJWK(jwkToken);
    const result = JwkPublicKeyFromToken.decode(
      jose.base64url.encode(JSON.stringify(jwk))
    );
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual(jwk);
    }
  });

  it("should NOT decode a wrong input", async () => {
    const jwkToken = await getJwkToken();
    const jwk = await jose.exportJWK(jwkToken);
    const result = JwkPublicKeyFromToken.decode(
      jose.base64url.encode(JSON.stringify({ ...jwk, kty: -1 }))
    );
    expect(E.isLeft(result)).toBeTruthy();
    if (E.isLeft(result)) {
      expect(result.left).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("is not a valid [JwkPublicKey]")
          })
        ])
      );
    }
  });

  it("should decode if a JWKPubKey object as input", () => {
    const result = JwkPublicKeyFromToken.decode(aJwkPublicKey);
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) expect(result.right).toEqual(aJwkPublicKey);
  });

  it("should encode a correct input", async () => {
    const jwkToken = await getJwkToken();
    const jwk = await jose.exportJWK(jwkToken);
    const result = JwkPublicKeyFromToken.encode(jwk as JwkPublicKey);
    expect(result).toStrictEqual(jose.base64url.encode(JSON.stringify(jwk)));
  });

  it("should NOT encode a wrong input", async () => {
    const circular: any = { ref: null };
    circular.ref = circular;
    // JSON stringify only throws when argument is an overflowed bigint or a circular structure
    expect(() => JwkPublicKeyFromToken.encode(circular)).toThrow();
  });

  it("should guard correctly a correct input", async () => {
    const jwkToken = await getJwkToken();
    const jwk = await jose.exportJWK(jwkToken);
    const result = JwkPublicKeyFromToken.is(
      jose.base64url.encode(JSON.stringify(jwk))
    );
    expect(result).toBeTruthy();
  });

  it("should guard correctly a wrong input", async () => {
    const result = JwkPublicKeyFromToken.is("");
    expect(result).toBeFalsy();
  });

  it("should guard if a JWKPubKey object as input", () => {
    const result = JwkPublicKeyFromToken.is(aJwkPublicKey);
    expect(result).toBeTruthy();
  });
});

describe("JwkPublicKey", () => {
  it("should decode an ECKey removing extra properties", () => {
    const result = JwkPublicKey.decode({
      ...aJwkPublicKey,
      otherProp: "other"
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual(aJwkPublicKey);
    }
  });

  it("should decode a RSAKey removing extra properties", () => {
    const result = JwkPublicKey.decode({
      ...aRsaJwkPublicKey,
      otherProp: "other"
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toStrictEqual(aRsaJwkPublicKey);
    }
  });
});
