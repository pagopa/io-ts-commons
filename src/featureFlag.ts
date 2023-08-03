import * as t from "io-ts";

import { enumType } from "./types";

export enum FeatureFlagEnum {
  ALL = "ALL",
  BETA = "BETA",
  CANARY = "CANARY",
  NONE = "NONE",
}

export const FeatureFlag = enumType<FeatureFlagEnum>(
  FeatureFlagEnum,
  "FeatureFlag"
);

export type FeatureFlag = t.TypeOf<typeof FeatureFlag>;

/**
 * Return a function that takes an input of type T and returns whether it's eligible for the feature,
 * based on the feature flag level:
 *
 * "NONE"   -> no one is enabled
 * "BETA"   -> only user that pass the `isUserBeta` check are enabled
 * "CANARY" -> only user that pass the `isUserBeta` or the `isUserCanary` check are enabled
 * "ALL"    ->  every user is enabled
 *
 * @param isUserBeta The function that checks if the user is enabled for beta testing
 * @param isUserCanary The function that checks if the user is enabled for canary testing
 * @param featureFlag The Feature Flag level defined
 */
export const getIsUserEligibleForNewFeature =
  <T>(
    isUserBeta: (i: T) => boolean,
    isUserCanary: (i: T) => boolean,
    featureFlag: FeatureFlag
  ): ((i: T) => boolean) =>
  (i): boolean => {
    switch (featureFlag) {
      case "ALL":
        return true;
      case "BETA":
        return isUserBeta(i);
      case "CANARY":
        return isUserCanary(i) || isUserBeta(i);
      case "NONE":
        return false;
      default:
        return false;
    }
  };
