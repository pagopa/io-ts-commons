import { SemverFromFromUserAgentString } from "../http-user-agent";
import * as E from "fp-ts/lib/Either";
const aUserAgentClientName = "AppName";
const aUserAgentClientVersion = "0.1.0";
const aUserAgentSemverString = `${aUserAgentClientName}/${aUserAgentClientVersion}`;

describe("SemverFromFromUserAgentString", () => {
  it("should decode successfully a valid string representation of a UserAgentSemver", () => {
    const result = SemverFromFromUserAgentString.decode(aUserAgentSemverString);
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right.clientName).toEqual(aUserAgentClientName);
      expect(result.right.clientVersion).toEqual(aUserAgentClientVersion);
    }
  });

  it("should decode successfully a valid string representation of a UserAgentSemver with version infos", () => {
    const result = SemverFromFromUserAgentString.decode(
      `${aUserAgentSemverString} extra user agent infos`
    );
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right.clientName).toEqual(aUserAgentClientName);
      expect(result.right.clientVersion).toEqual(aUserAgentClientVersion);
    }
  });

  it("should not decode successfully a wrong string representation of a UserAgentSemver", () => {
    const result = SemverFromFromUserAgentString.decode(
      `${aUserAgentClientName}${aUserAgentClientVersion}`
    );
    expect(E.isLeft(result)).toBeTruthy();
  });

  it("should encode a correct input", async () => {
    const result = SemverFromFromUserAgentString.encode({
      clientName: aUserAgentClientName,
      clientVersion: aUserAgentClientVersion
    } as any);
    expect(result).toStrictEqual(aUserAgentSemverString);
  });

  it("should guard correctly a correct input", async () => {
    const result = SemverFromFromUserAgentString.is(aUserAgentSemverString);
    expect(result).toBeTruthy();
  });

  it("should guard correctly a wrong input", async () => {
    const result = SemverFromFromUserAgentString.is("a/b");
    expect(result).toBeFalsy();
  });
});
