import * as crypto from "crypto";
import * as t from "io-ts";

const IV_LENGTH = 16;
const AES_LENGTH = 16;

const EncryptTuple = t.interface({
  // Hybrid encrypted result (Base64)
  encryptedOutput: t.string,

  // random AES string (Base64)
  iv: t.string,

  // AES Key encrypted with RSA public key (Base64)
  rsaAesKey: t.string
});

export type EncryptTuple = t.TypeOf<typeof EncryptTuple>;

export function hybridEncrypt(input: string, rsaPubKey: string): EncryptTuple {
  const iv = crypto.randomBytes(IV_LENGTH);
  const aesKey = crypto.randomBytes(AES_LENGTH);
  const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(aesKey), iv);
  const encryptedOutput = Buffer.concat([
    cipher.update(input),
    cipher.final()
  ]).toString("base64");
  const rsaAesKey = crypto
    .publicEncrypt(rsaPubKey, Buffer.from(aesKey))
    .toString("base64");
  return {
    encryptedOutput,
    iv: iv.toString("base64"),
    rsaAesKey
  } as EncryptTuple;
}

export function hybridDecrypt(
  encryptTuple: EncryptTuple,
  rsaPrivateKey: string
): string {
  const iv = Buffer.from(encryptTuple.iv, "base64");
  const aesKey = crypto.privateDecrypt(
    rsaPrivateKey,
    Buffer.from(encryptTuple.rsaAesKey, "base64")
  );
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(aesKey),
    iv
  );
  const decrypted = decipher.update(
    Buffer.from(encryptTuple.encryptedOutput, "base64")
  );
  const output = Buffer.concat([decrypted, decipher.final()]);
  return output.toString("utf-8");
}
