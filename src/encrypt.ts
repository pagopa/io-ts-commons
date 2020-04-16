import * as crypto from "crypto";
import * as t from "io-ts";

// AES-128-CBC requires 16 random bytes for pseudo randomic string used in crypto algorithm
const IV_LENGTH = 16;
const AES_LENGTH = 16;

const EncryptedPayload = t.interface({
  // Hybrid encrypted result (Base64)
  encryptedPayload: t.string,

  // random AES string (Base64)
  iv: t.string,

  // AES Key encrypted with RSA public key (Base64)
  encryptedKey: t.string
});

export type EncryptedPayload = t.TypeOf<typeof EncryptedPayload>;

export function toEncryptedPayload(
  rsaPubKey: string,
  payload: string
): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH);
  const aesKey = crypto.randomBytes(AES_LENGTH);
  const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(aesKey), iv);
  const encryptedPayload = Buffer.concat([
    cipher.update(payload),
    cipher.final()
  ]).toString("base64");
  const encryptedKey = crypto
    .publicEncrypt(rsaPubKey, Buffer.from(aesKey))
    .toString("base64");
  return {
    encryptedKey,
    encryptedPayload,
    iv: iv.toString("base64")
  } as EncryptedPayload;
}

export function fromEncryptedPayload(
  rsaPrivateKey: string,
  encryptedPayload: EncryptedPayload
): string {
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
    Buffer.from(encryptedPayload.encryptedPayload, "base64")
  );
  const output = Buffer.concat([decrypted, decipher.final()]);
  return output.toString("utf-8");
}
