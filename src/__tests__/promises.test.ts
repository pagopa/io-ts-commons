import { isRight, isLeft } from "fp-ts/lib/Either";
import { withTimeout } from "../promises";

describe("withTimeout", () => {
  it("should resolve to completion", async () => {
    // tslint:disable-next-line:promise-must-complete no-empty
    const neverCompletesP = new Promise<void>(() => {});

    const r = await withTimeout(
      Promise.resolve(true),
      1000,
      _ => neverCompletesP
    );

    expect(isRight(r)).toBeTruthy();
    if (isRight(r)) {
      expect(r.value).toEqual(true);
    }
  });

  it("should timeout", async () => {
    // tslint:disable-next-line:promise-must-complete no-empty
    const neverCompletesP = new Promise<void>(() => {});

    const r = await withTimeout(neverCompletesP, 1000, _ =>
      Promise.resolve<void>(undefined)
    );

    expect(isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.value).toEqual("timeout");
    }
  });
});
