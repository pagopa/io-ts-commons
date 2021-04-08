import * as t from "io-ts";
import { enumType } from "./types";

export enum NodeEnvironmentEnum {
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  DEVELOPMENT = "dev",
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  PRODUCTION = "production"
}

/**
 * A type for describing the node runtime environment
 */
// eslint-disable-next-line  @typescript-eslint/naming-convention
export const NodeEnvironment = enumType<NodeEnvironmentEnum>(
  NodeEnvironmentEnum,
  "NodeEnvironment"
);

export type NodeEnvironment = t.TypeOf<typeof NodeEnvironment>;

/**
 * Resolves the Node environment from the process environment.
 * Defaults to PRODUCTION if no environment is set.
 *
 * @param env The environment variables (defaults to `process.env`)
 * @param defaultEnv The default environment (`NodeEnvironmentEnum.PRODUCTION`)
 */
// eslint-disable-next-line  prefer-arrow/prefer-arrow-functions
export function getNodeEnvironmentFromProcessEnv(
  env: NodeJS.ProcessEnv = process.env,
  defaultEnv: NodeEnvironment = NodeEnvironmentEnum.PRODUCTION
): NodeEnvironment {
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv === NodeEnvironmentEnum.DEVELOPMENT) {
    return NodeEnvironmentEnum.DEVELOPMENT;
  } else if (nodeEnv === NodeEnvironmentEnum.PRODUCTION) {
    return NodeEnvironmentEnum.PRODUCTION;
  }
  return defaultEnv;
}
