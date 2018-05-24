import * as t from "io-ts";
import { enumType } from "./types";

export enum NodeEnvironmentEnum {
  DEVELOPMENT = "dev",
  PRODUCTION = "production"
}

/**
 * A type for describing the node runtime environment
 */
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
export function getNodeEnvironmentFromProcessEnv(
  env: typeof process.env = process.env,
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
