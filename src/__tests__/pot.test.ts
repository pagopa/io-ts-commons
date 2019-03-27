import * as pot from "../pot";

describe("toLoading", () => {
  it("should transition non-loading states to loading states", () => {
    expect(pot.isLoading(pot.toLoading(pot.none))).toBeTruthy();
    expect(pot.isLoading(pot.toLoading(pot.noneError(Error())))).toBeTruthy();
    expect(pot.isLoading(pot.toLoading(pot.some(1)))).toBeTruthy();
    expect(
      pot.isLoading(pot.toLoading(pot.someError(1, Error())))
    ).toBeTruthy();

    const p: pot.Pot<number, Error> = pot.some(1);
    if (!pot.isLoading(p)) {
      expect(pot.toLoading(p)).toBeTruthy();
    }
  });
});

describe("isPot", () => {
  it("should return false if value is not a valid Pot", () => {
    expect(pot.isPot({})).toBeFalsy();
    expect(pot.isPot({ kind: "INVALIDKIND" }));
  });

  it("should return true if value is a valid Pot", () => {
    expect(pot.isPot({ kind: "PotNone" }));
  });
});
