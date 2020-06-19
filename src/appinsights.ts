import * as appInsights from "applicationinsights";
import { DistributedTracingModes } from "applicationinsights";
// tslint:disable-next-line: no-submodule-imports
import Config = require("applicationinsights/out/Library/Config");
import { constVoid } from "fp-ts/lib/function";
import {
  getKeepAliveAgentOptions,
  isFetchKeepaliveEnabled,
  newHttpAgent,
  newHttpsAgent
} from "./agent";

interface IInsightsRequestData {
  baseType: "RequestData";
  baseData: {
    ver: number;
    properties: {};
    measurements: {};
    id: string;
    name: string;
    url: string;
    source?: string;
    duration: string;
    responseCode: string;
    success: boolean;
  };
}

export interface IInsightsTracingConfig {
  isTracingDisabled?: boolean;
  cloudRole?: string;
  applicationVersion?: string;
}

export type ApplicationInsightsConfig = IInsightsTracingConfig &
  Partial<
    Pick<
      Config,
      // tslint:disable-next-line: max-union-size
      "httpAgent" | "httpsAgent" | "samplingPercentage" | "disableAppInsights"
    >
  >;

/**
 * Internal usage, do not export
 */
function startAppInsights(
  instrumentationKey: string,
  aiConfig: ApplicationInsightsConfig
): appInsights.TelemetryClient {
  const ai = appInsights.setup(instrumentationKey);

  if (aiConfig.isTracingDisabled) {
    ai.setAutoCollectConsole(false)
      .setAutoCollectPerformance(false)
      .setAutoCollectDependencies(false)
      .setAutoCollectRequests(false)
      .setAutoDependencyCorrelation(false)
      .setSendLiveMetrics(false);
  }

  // @see https://github.com/Azure/azure-functions-host/issues/3747
  // @see https://github.com/Azure/azure-functions-nodejs-worker/pull/244
  ai.setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C)
    // @see https://stackoverflow.com/questions/49438235/application-insights-metric-in-aws-lambda/49441135#49441135
    .setUseDiskRetryCaching(false)
    .start();

  appInsights.defaultClient.addTelemetryProcessor(
    removeQueryParamsPreprocessor
  );

  // Configure the data context of the telemetry client
  // refering to the current application version with a specific CloudRole

  if (aiConfig.applicationVersion !== undefined) {
    // tslint:disable-next-line: no-object-mutation
    appInsights.defaultClient.context.tags[
      appInsights.defaultClient.context.keys.applicationVersion
    ] = aiConfig.applicationVersion;
  }

  if (aiConfig.cloudRole !== undefined) {
    // tslint:disable-next-line: no-object-mutation
    appInsights.defaultClient.context.tags[
      appInsights.defaultClient.context.keys.cloudRole
    ] = aiConfig.cloudRole;
  }

  // override some default values when provided
  const config = appInsights.defaultClient.config;

  // tslint:disable-next-line: no-object-mutation
  config.httpAgent = aiConfig.httpAgent ?? config.httpAgent;

  // tslint:disable-next-line: no-object-mutation
  config.httpsAgent = aiConfig.httpsAgent ?? config.httpsAgent;

  // tslint:disable-next-line: no-object-mutation
  config.samplingPercentage =
    aiConfig.samplingPercentage ?? config.samplingPercentage;

  // tslint:disable-next-line: no-object-mutation
  config.disableAppInsights =
    aiConfig.disableAppInsights ?? config.disableAppInsights;

  return appInsights.defaultClient;
}

export function removeQueryParamsPreprocessor(
  envelope: appInsights.Contracts.Envelope,
  _?: {
    [name: string]: unknown;
  }
): boolean {
  if (envelope.data.baseType === "RequestData") {
    const originalUrl = (envelope.data as IInsightsRequestData).baseData.url;
    // tslint:disable-next-line: no-object-mutation
    (envelope.data as IInsightsRequestData).baseData.url = originalUrl.split(
      "?"
    )[0];
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
export function initAppInsights(
  aiInstrumentationKey: string,
  config?: ApplicationInsightsConfig,
  env: typeof process.env = process.env
): ReturnType<typeof startAppInsights> {
  // @see https://github.com/pagopa/io-ts-commons/blob/master/src/agent.ts
  // @see https://docs.microsoft.com/it-it/azure/load-balancer/load-balancer-outbound-connections
  const agentOpts = isFetchKeepaliveEnabled(env)
    ? {
        httpAgent: newHttpAgent(getKeepAliveAgentOptions(env)),
        httpsAgent: newHttpsAgent(getKeepAliveAgentOptions(env))
      }
    : {};

  // defaults to the name of the function app if not set in config
  const cloudRole = config?.cloudRole || env.WEBSITE_SITE_NAME;

  return startAppInsights(aiInstrumentationKey, {
    cloudRole,
    ...config,
    ...agentOpts
  });
}

/**
 * Wraps ApplicationInsights' defaultClient to provide a version which is never undefined.
 * ApplicationInsights' defaultClient is instantiated as a singleton inside its module. If no env configuration is provided, this results to be undefined and forces user to check everytime before using it
 * In case is not defined, we provide a dummy clone in which its methods results in no-operations, avoiding unhandled exceptions.
 */
export const defaultClient: typeof appInsights.defaultClient = appInsights.defaultClient
  ? appInsights.defaultClient
  : (new Proxy(
      {},
      {
        // tslint:disable-next-line: typedef
        get(_, name: string) {
          const objectProps: ReadonlyArray<keyof typeof appInsights.defaultClient> = [
            "config",
            "context",
            "commonProperties",
            "channel",
            "quickPulseClient"
          ];
          return (objectProps as readonly string[]).includes(name)
            ? {}
            : () => constVoid;
        }
      }
    ) as typeof appInsights.defaultClient);
