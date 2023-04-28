import * as crypto from "crypto";

import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";

// AES-128-CBC requires 16 random bytes for pseudo randomic string used in crypto algorithm
const IV_LENGTH = 16;

// aes-128-cbc uses a 128 bit key (16 bytes * 8)
const AES_KEY_LENGTH = 16;

export const EncryptedPayload = t.interface({
  // encrypted text (Base64)
  cypherText: t.string,

  // random string to feed AES (Base64)
  iv: t.string,

  // AES Key encrypted with RSA public key (Base64)
  // eslint-disable-next-line sort-keys
  encryptedKey: t.string,
});

export type EncryptedPayload = t.TypeOf<typeof EncryptedPayload>;

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function toEncryptedPayload(
  rsaPubKey: string,
  plainText: string
): E.Either<Error, EncryptedPayload> {
  return E.tryCatch(() => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const aesKey = crypto.randomBytes(AES_KEY_LENGTH);
    const cipher = crypto.createCipheriv("aes-128-cbc", aesKey, iv);
    // @see https://nodejs.org/api/crypto.html#crypto_class_cipher
    const cypherText = Buffer.concat([
      cipher.update(plainText),
      cipher.final(),
    ]).toString("base64");
    const encryptedKey = crypto
      .publicEncrypt(rsaPubKey, aesKey)
      .toString("base64");
    return {
      cypherText,
      encryptedKey,
      iv: iv.toString("base64"),
    };
  }, E.toError);
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function toPlainText(
  rsaPrivateKey: string,
  encryptedPayload: EncryptedPayload
): E.Either<Error, string> {
  return E.tryCatch(() => {
    const iv = Buffer.from(encryptedPayload.iv, "base64");
    const aesKey = crypto.privateDecrypt(
      rsaPrivateKey,
      Buffer.from(encryptedPayload.encryptedKey, "base64")
    );
    const decipher = crypto.createDecipheriv(
      "aes-128-cbc",
      Buffer.from(aesKey),
      iv
    );
    const decrypted = decipher.update(
      Buffer.from(encryptedPayload.cypherText, "base64")
    );
    const plainText = Buffer.concat([decrypted, decipher.final()]);
    return plainText.toString("utf-8");
  }, E.toError);
}
