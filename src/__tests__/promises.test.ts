// eslint-disable @typescript-eslint/no-explicit-any

import { isLeft, isRight } from "fp-ts/lib/Either";
import { DeferredPromise, withTimeout } from "../promises";

describe("withTimeout", () => {
  it("should resolve to completion", async () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, no-empty, no-empty-function
    const neverCompletesP = new Promise<void>(() => {});

    const r = await withTimeout(
      Promise.resolve(true),
      1000 as any,
      _ => neverCompletesP
    );

    expect(isRight(r)).toBeTruthy();
    if (isRight(r)) {
      expect(r.right).toEqual(true);
    }
  });

  it("should timeout", async () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, no-empty, no-empty-function
    const neverCompletesP = new Promise<void>(() => {});

    const r = await withTimeout(neverCompletesP, 1000 as any, _ =>
      Promise.resolve<void>(undefined)
    );

    expect(isLeft(r)).toBeTruthy();
    if (isLeft(r)) {
      expect(r.left).toEqual("timeout");
    }
  });
});

describe("DeferredPromise", () => {
  it("should resolve asyncronously", async () => {
    const { e1: p, e2: res } = DeferredPromise<number>();
    res(1);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(p).resolves.toEqual(1);
  });

  it("should reject asyncronously", async () => {
    const { e1: p, e3: rej } = DeferredPromise<number>();
    rej(new Error("failed"));
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(p).rejects.toEqual(new Error("failed"));
  });
});
