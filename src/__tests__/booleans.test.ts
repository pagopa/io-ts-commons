/* eslint-disable sonarjs/no-identical-functions */

import { isLeft, isRight } from "fp-ts/lib/Either";
import {
  BooleanFromString
} from "../booleans";

describe("BooleanFromString", () => {
    it("should get boolean true from string 'true'", async () => {
      const n = BooleanFromString.decode("true");
      expect(isRight(n)).toBeTruthy();
      if (isRight(n)) {
        expect(n.right).toEqual(true);
      }
    });

    it("should get boolean false from string 'false'", async () => {
      const n = BooleanFromString.decode("false");
      expect(isRight(n)).toBeTruthy();
      if (isRight(n)) {
        expect(n.right).toEqual(false);
      }
    });

    it("should get error from string 'astring'", () => {
      const n = BooleanFromString.decode("astring");
      expect(isLeft(n)).toBeTruthy();
    });
  });