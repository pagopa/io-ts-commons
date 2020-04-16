import { isLeft, isRight } from "fp-ts/lib/Either";
import { toEncryptedPayload, toPlainText } from "../encrypt";

const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDhiXpvLD8UMMUy1T2JCzo/Sj5E
l09Fs0z2U4aA37BrXlSo1DwQ2O9i2XFxXGJmE83siSWEfRlMWlabMu7Yj6dkZvmj
dGIO4gotO33TgiAQcwRo+4pwjoCN7Td47yssCcj9C727zBt+Br+XK7B1bRcqjc0J
YdF4yiVtD7G4RDXmRQIDAQAB
-----END PUBLIC KEY-----`;

const rsaPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQDhiXpvLD8UMMUy1T2JCzo/Sj5El09Fs0z2U4aA37BrXlSo1DwQ
2O9i2XFxXGJmE83siSWEfRlMWlabMu7Yj6dkZvmjdGIO4gotO33TgiAQcwRo+4pw
joCN7Td47yssCcj9C727zBt+Br+XK7B1bRcqjc0JYdF4yiVtD7G4RDXmRQIDAQAB
AoGAJlqjyI4kuAFHN8rNqSWQpTyx9CYrI/ZG60jvAbGIpemnygI1qMPLierigN2u
Gh/aEBSOncZMbBCc083IkmlzlKy3gJH0shgBQrfqGFbqh3i7f/lHkL+lZtXW+fF4
bXo4vdaArHhQW1oKQOHA9BO8uuqCOEaA7OtVLWiZxqe9u80CQQDyuNWZLqlDZT8c
yB6mnLh7KVGY1RYphY0HputmC3Z0qr+bAFT8plNB2SkJwsnD2YSpOj4jzzePZShP
aDNS+LQzAkEA7d/6rtzYVqX4XEvmrdQwXKvq937MgRec7Q6jzmSHSHxBLcsvJ40n
xiBoe1TJWGn866Ug/tBauF8Ws5SgCPVDpwJBAOZc9pzD5HHKjfPLGwwWgiCiPodG
9hnCXu98RL488tgXlnKOBhsj4LEGYiSZctUmhPn4BTIHYTv/ThrPUqbU1HECQDAg
/UucC3mcox+pi8boA9D8R9JDqYUFDg84wxPjayvTWCy3y5apDL8dl4Y8pXBqIW5c
PszPw0tCkglLrQWi+kkCQDzR5FI2eGvXYdkJdAqofbEFDdP+N0ZMWdJITVntrhZO
zsAyYUBrD/FpfHSA5UY9UsldiilvJeCzYbM6Rm1fpmc=
-----END RSA PRIVATE KEY-----`;

const aTextToEncrypt = "<xml>A text to encrypt</xml>";

describe("encrypt", () => {
  it("should encrypt and decrypt a string with combination AES/RSA", async () => {
    const errorOrEncryptedPayload = toEncryptedPayload(
      rsaPublicKey,
      aTextToEncrypt
    );
    expect(isRight(errorOrEncryptedPayload)).toBeTruthy();
    if (isRight(errorOrEncryptedPayload)) {
      const errorOrdecryptedString = toPlainText(
        rsaPrivateKey,
        errorOrEncryptedPayload.value
      );
      expect(errorOrdecryptedString.value).toEqual(aTextToEncrypt);
    }
  });
  it("should catch any exception thrown", async () => {
    const invalidKey = "foo";
    const errorOrEncryptedPayload = toEncryptedPayload(
      invalidKey,
      aTextToEncrypt
    );
    expect(isLeft(errorOrEncryptedPayload)).toBeTruthy();
    if (isLeft(errorOrEncryptedPayload)) {
      expect(errorOrEncryptedPayload.value).toBeInstanceOf(Error);
    }
  });
});
