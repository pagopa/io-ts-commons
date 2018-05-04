import { isLeft, isRight } from "fp-ts/lib/Either";
import { HttpsUrlFromString, HttpUrlFromString, UrlFromString } from "../url";

describe("enumType", () => {
  it("should get an href with a valid http URL", () => {
    const errorOrUrl = UrlFromString.decode("http://example.com");
    expect(isRight(errorOrUrl)).toBeTruthy();
    if (isRight(errorOrUrl)) {
      expect(errorOrUrl.value.href).toEqual("http://example.com/");
      expect(errorOrUrl.value.hostname).toEqual("example.com");
    }
  });
  it("should fail on invalid http URL", () => {
    const errorOrUrl = HttpUrlFromString.decode("https://example.com");
    expect(isLeft(errorOrUrl)).toBeTruthy();
  });
  it("should fail on invalid https URL", () => {
    const errorOrUrl = HttpsUrlFromString.decode("http://example.com");
    expect(isLeft(errorOrUrl)).toBeTruthy();
  });
});
