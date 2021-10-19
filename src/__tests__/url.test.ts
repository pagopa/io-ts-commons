import { string } from "fp-ts";
import { isLeft, isRight, getOrElseW } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
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
  it.each`
    scenario               | url           | codec
    ${"invalid http URL"}  | ${anHttpsUrl} | ${HttpUrlFromString}
    ${"invalid https URL"} | ${anHttpUrl}  | ${HttpsUrlFromString}
  `("should fail on $scenario", ({ url, codec }) => {
    const errorOrUrl = codec.decode(url);
    expect(isLeft(errorOrUrl)).toBeTruthy();
  });

  it.each`
    scenario             | url           | codec
    ${"valid http URL"}  | ${anHttpUrl}  | ${HttpUrlFromString}
    ${"valid https URL"} | ${anHttpsUrl} | ${HttpsUrlFromString}
  `("should pass on $scenario", ({ url, codec }) => {
    const errorOrUrl = codec.decode(url);
    expect(isRight(errorOrUrl)).toBeTruthy();
  });

  it.each`
    scenario             | url           | codec
    ${"valid http URL"}  | ${anHttpUrl}  | ${HttpUrlFromString}
    ${"valid https URL"} | ${anHttpsUrl} | ${HttpsUrlFromString}
  `("should encode a $scenario", ({ url, codec }) => {
    const decodedUrl = pipe(
      codec.decode(url),
      getOrElseW(_ => fail(`Cannot decode url`))
    );
    const encodedUrl = codec.encode(decodedUrl);

    // url parsing add ending slashes
    const expectedUrl = url.endsWith("/") ? url : url + "/";

    expect(encodedUrl).toBe(expectedUrl);
  });
});
