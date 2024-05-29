import { isLeft, isRight, toUnion } from "fp-ts/lib/Either";
import { Binary, BinaryFromArray } from "../binaries";

describe("BinaryFromArray", () => {

  it("should return a left with a nullable input", () => {
    expect(isLeft(BinaryFromArray.decode(undefined))).toBeTruthy();
    expect(isLeft(BinaryFromArray.decode(null))).toBeTruthy();
  });

  it("should return a left with an empty array", () => {
    expect(isLeft(BinaryFromArray.decode([]))).toBeTruthy();
  });

  it("should return a left with an array of no numbers", () => {
    expect(isLeft(BinaryFromArray.decode(["1", "2"]))).toBeTruthy();
  });

  it("should return a left with an array of numbers non Integer", () => {
    expect(isLeft(BinaryFromArray.decode([1.2, 2.3]))).toBeTruthy();
  });

  it("should return a left with an array of Integers outside the 8 bit range", () => {
    expect(isLeft(BinaryFromArray.decode([-1, 256]))).toBeTruthy();
  });

  it("should return a right with an array of Integers inside the 8 bit range", () => {
    expect(isRight(BinaryFromArray.decode([1, 2, 255]))).toBeTruthy();
  });

  it("should return true with an array of Integers between the 8 bit range", () => {
    expect(BinaryFromArray.is(toUnion(BinaryFromArray.decode([1, 2, 255])))).toBeTruthy();
  });

  it("should return false with an array of Integers outside of the 8 bit range", () => {
    expect(BinaryFromArray.is(toUnion(BinaryFromArray.decode([-1, 2, 255])))).toBeFalsy();
    expect(BinaryFromArray.is(toUnion(BinaryFromArray.decode([1, 2, 256])))).toBeFalsy();
  });

})

describe("Binary", () => {

  it("Should return false with an empty Buffer", () => {
    expect(Binary.is(Buffer.from([]))).toBeFalsy();
  });

  it("Should return true with a non empty Buffer", () => {
    expect(Binary.is(Buffer.from([1, 2, 3]))).toBeTruthy();
  });

})
