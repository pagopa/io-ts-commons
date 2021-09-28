import { isLeft, isRight } from "fp-ts/lib/Either";
import { HttpsUrlFromString, HttpUrlFromString, UrlFromString } from "../url";

const anHostName = "example.com";
const anHttpUrl = "http://" + anHostName;
const anHttpsUrl = "https://" + anHostName;

describe("UrlFromString", () => {
  it("should get an href with a valid http URL", () => {
    const errorOrUrl = UrlFromString.decode(anHttpUrl);
    expect(isRight(errorOrUrl)).toBeTruthy();
    if (isRight(errorOrUrl)) {
      expect(errorOrUrl.right.href).toEqual(anHttpUrl + "/");
      expect(errorOrUrl.right.hostname).toEqual(anHostName);
    }
  });
  it("should fail on invalid http URL", () => {
    const errorOrUrl = HttpUrlFromString.decode(anHttpsUrl);
    expect(isLeft(errorOrUrl)).toBeTruthy();
  });
  it("should fail on invalid https URL", () => {
    const errorOrUrl = HttpsUrlFromString.decode(anHttpUrl);
    expect(isLeft(errorOrUrl)).toBeTruthy();
  });
  it("should pass on valid http URL", () => {
    const errorOrUrl = HttpUrlFromString.decode(anHttpUrl);
    expect(isRight(errorOrUrl)).toBeTruthy();
  });
  it("should pass on valid https URL", () => {
    const errorOrUrl = HttpsUrlFromString.decode(anHttpsUrl);
    expect(isRight(errorOrUrl)).toBeTruthy();
  });
});
