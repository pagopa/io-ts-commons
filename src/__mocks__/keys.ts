import { generateKeyPairSync, KeyPairSyncResult } from "crypto";
import { NonEmptyString } from "../strings";

export const aDifferentPrivateKey = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
  privateKeyEncoding: {
    format: "pem",
    type: "pkcs1",
  },
}).privateKey as NonEmptyString;

// ---------------------------------

export const aPrimaryKey = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
  privateKeyEncoding: {
    format: "pem",
    type: "pkcs1",
  },
}) as KeyPairSyncResult<NonEmptyString, NonEmptyString>;

export const aSecondaryKey = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
  privateKeyEncoding: {
    format: "pem",
    type: "pkcs1",
  },
}) as KeyPairSyncResult<NonEmptyString, NonEmptyString>;
