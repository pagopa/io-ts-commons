import {
  getNodeEnvironmentFromProcessEnv,
  NodeEnvironmentEnum
} from "../environment";

describe("getNodeEnvironmentFromProcessEnv", () => {
  it("should resolve the dev environment", () => {
    expect(
      getNodeEnvironmentFromProcessEnv({
        NODE_ENV: "dev"
      })
    ).toEqual(NodeEnvironmentEnum.DEVELOPMENT);
  });

  it("should resolve the production environment", () => {
    expect(
      getNodeEnvironmentFromProcessEnv({
        NODE_ENV: "production"
      })
    ).toEqual(NodeEnvironmentEnum.PRODUCTION);
  });

  it("should defaults to the production environment", () => {
    expect(getNodeEnvironmentFromProcessEnv({})).toEqual(
      NodeEnvironmentEnum.PRODUCTION
    );
  });

  it("should defaults to the provided environment", () => {
    expect(
      getNodeEnvironmentFromProcessEnv({}, NodeEnvironmentEnum.DEVELOPMENT)
    ).toEqual(NodeEnvironmentEnum.DEVELOPMENT);
  });
});
