import * as appInsights from "applicationinsights";
import { DistributedTracingModes } from "applicationinsights";
import Config = require("applicationinsights/out/Library/Config");
import {
  getKeepAliveAgentOptions,
  isFetchKeepaliveEnabled,
  newHttpAgent,
  newHttpsAgent,
} from "./agent";

interface IInsightsRequestData {
  readonly baseType: "RequestData";
  readonly baseData: {
    readonly ver: number;
    // eslint-disable-next-line @typescript-eslint/ban-types
    readonly properties: {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    readonly measurements: {};
    readonly id: string;
    readonly name: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    url: string;
    readonly source?: string;
    readonly duration: string;
    readonly responseCode: string;
    readonly success: boolean;
  };
}

export interface IInsightsTracingConfig {
  readonly isTracingDisabled?: boolean;
  readonly cloudRole?: string;
  readonly applicationVersion?: string;
}

export type ApplicationInsightsConfig = IInsightsTracingConfig &
  Partial<
    Pick<
      Config,
      "httpAgent" | "httpsAgent" | "samplingPercentage" | "disableAppInsights"
    >
  >;

/**
 * Internal usage, do not export
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function startAppInsights(
  connectionString: string,
  aiConfig: ApplicationInsightsConfig
): appInsights.TelemetryClient {
  const ai = appInsights.setup(connectionString);

  if (aiConfig.isTracingDisabled) {
    ai.setAutoCollectConsole(false)
      .setAutoCollectPerformance(false)
      .setAutoCollectDependencies(false)
      .setAutoCollectRequests(false)
      .setAutoDependencyCorrelation(false);
  }

  // @see https://github.com/Azure/azure-functions-host/issues/3747
  // @see https://github.com/Azure/azure-functions-nodejs-worker/pull/244
  ai.setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C)
    .setSendLiveMetrics(true)
    // @see https://stackoverflow.com/questions/49438235/application-insights-metric-in-aws-lambda/49441135#49441135
    .setUseDiskRetryCaching(false)
    .start();

  appInsights.defaultClient.addTelemetryProcessor(
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    removeQueryParamsPreprocessor
  );

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  appInsights.defaultClient.addTelemetryProcessor(disableSamplingByTag);

  // Configure the data context of the telemetry client
  // refering to the current application version with a specific CloudRole

  if (aiConfig.applicationVersion !== undefined) {
    // eslint-disable-next-line functional/immutable-data
    appInsights.defaultClient.context.tags[
      appInsights.defaultClient.context.keys.applicationVersion
    ] = aiConfig.applicationVersion;
  }

  if (aiConfig.cloudRole !== undefined) {
    // eslint-disable-next-line functional/immutable-data
    appInsights.defaultClient.context.tags[
      appInsights.defaultClient.context.keys.cloudRole
    ] = aiConfig.cloudRole;
  }

  // override some default values when provided
  const config = appInsights.defaultClient.config;

  // eslint-disable-next-line functional/immutable-data
  config.httpAgent = aiConfig.httpAgent ?? config.httpAgent;

  // eslint-disable-next-line functional/immutable-data
  config.httpsAgent = aiConfig.httpsAgent ?? config.httpsAgent;

  // eslint-disable-next-line functional/immutable-data
  config.samplingPercentage =
    aiConfig.samplingPercentage ?? config.samplingPercentage;

  // eslint-disable-next-line functional/immutable-data
  config.disableAppInsights =
    aiConfig.disableAppInsights ?? config.disableAppInsights;

  return appInsights.defaultClient;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function removeQueryParamsPreprocessor(
  envelope: appInsights.Contracts.Envelope,
  _?: {
    readonly [name: string]: unknown;
  }
): boolean {
  if (envelope.data.baseType === "RequestData") {
    const originalUrl = (envelope.data as IInsightsRequestData).baseData.url;
    // eslint-disable-next-line functional/immutable-data
    (envelope.data as IInsightsRequestData).baseData.url =
      originalUrl.split("?")[0];
  }
  return true;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function disableSamplingByTag(
  envelope: appInsights.Contracts.Envelope,
  _?: {
    readonly [name: string]: unknown;
  }
): boolean {
  if (envelope.tags.samplingEnabled === "false") {
    // eslint-disable-next-line functional/immutable-data
    envelope.sampleRate = 100;
  }
  return true;
}

/**
 * Configure Application Insights default client
 * using settings taken from the environment:
 *
 * - setup tracing options
 * - setup cloudRole and version
 * - eventually setup http keeplive to prevent SNAT port exhaustion
 * - start application insights
 *
 * As the default client is a singleton shared between functions
 * you may want to prevent bootstrapping insights more than once
 * checking if appInsights.defaultClient id already set in the caller.
 *
 * To enable http agent keepalive set up these environment variables:
 * https://github.com/pagopa/io-ts-commons/blob/master/src/agent.ts#L11
 *
 * If you need to programmatically call Application Insights methods
 * set operationId = context.Tracecontext.traceparent to correlate
 * the call with the parent request.
 *
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function initAppInsights(
  aiConnectionString: string,
  config?: ApplicationInsightsConfig,
  env: typeof process.env = process.env
): ReturnType<typeof startAppInsights> {
  // @see https://github.com/pagopa/io-ts-commons/blob/master/src/agent.ts
  // @see https://docs.microsoft.com/it-it/azure/load-balancer/load-balancer-outbound-connections
  const agentOpts = isFetchKeepaliveEnabled(env)
    ? {
        httpAgent: newHttpAgent(getKeepAliveAgentOptions(env)),
        httpsAgent: newHttpsAgent(getKeepAliveAgentOptions(env)),
      }
    : {};

  // defaults to the name of the function app if not set in config
  const cloudRole = config?.cloudRole || env.WEBSITE_SITE_NAME;

  return startAppInsights(aiConnectionString, {
    cloudRole,
    ...config,
    ...agentOpts,
  });
}
