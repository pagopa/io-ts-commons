import * as appInsights from "applicationinsights";
import { Configuration } from "applicationinsights";
import {
  disableSamplingByTag,
  initAppInsights,
  removeQueryParamsPreprocessor
} from "../appinsights";

describe("Create an App Insights Telemetry Client", () => {
  const mockSetup = jest.spyOn(appInsights, "setup");
  const spySetAutoDependencyCorrelation = jest.spyOn(
    Configuration,
    "setAutoCollectDependencies"
  );
  const spyStart = jest.spyOn(Configuration, "start");

  const expectedAppInsightsKey = "SECRET-KEY";

  it("should create a new App Insights Telemetry Client with tracing enabled", () => {
    // eslint-disable-next-line no-new, no-unused-expressions
    const telemetryClient = initAppInsights(expectedAppInsightsKey, {
      applicationVersion: "1.1.1",
      cloudRole: "ai.role"
    });
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(spySetAutoDependencyCorrelation).not.toBeCalled();
    expect(spyStart).toHaveReturnedWith(Configuration);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
  });

  it("should create a new App Insights Telemetry Client with tracing disabled", () => {
    // eslint-disable-next-line no-new, no-unused-expressions
    const telemetryClient = initAppInsights(expectedAppInsightsKey, {
      applicationVersion: "1.1.1",
      cloudRole: "ai.role",
      isTracingDisabled: true
    });
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(spySetAutoDependencyCorrelation).toBeCalledWith(false);
    expect(spyStart).toHaveReturnedWith(Configuration);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
  });
  it("should set some default settings in case they are not provided", () => {
    // eslint-disable-next-line no-new, no-unused-expressions
    const telemetryClient = initAppInsights(
      expectedAppInsightsKey,
      {},
      {
        applicationVersion: "1.1.1",
        cloudRole: "ai.role"
      }
    );
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
    expect(telemetryClient.config.httpAgent).toBeUndefined();
    expect(telemetryClient.config.samplingPercentage).toBe(100);
  });
  it("should set client configuration settings", () => {
    // eslint-disable-next-line no-new, no-unused-expressions
    const telemetryClient = initAppInsights(expectedAppInsightsKey, {
      applicationVersion: "1.1.1",
      cloudRole: "ai.role",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      httpAgent: {} as any,
      samplingPercentage: 20
    });
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
    expect(telemetryClient.config.httpAgent).not.toBeUndefined();
    expect(telemetryClient.config.samplingPercentage).toBe(20);
  });
});

describe("Custom Telemetry Preprocessor", () => {
  it("should remove query params from http requests", () => {
    const expectedUrl = "https://test-url.com";
    const testValidEnvelope = {
      data: {
        baseData: {
          duration: 1,
          id: "ID",
          measurements: {},
          name: "GET /test",
          properties: {},
          responseCode: 200,
          success: true,
          url: `${expectedUrl}?param1=true&param2=false`,
          ver: 1
        },
        baseType: "RequestData"
      }
    };
    removeQueryParamsPreprocessor(
      (testValidEnvelope as unknown) as appInsights.Contracts.Envelope
    );
    expect(testValidEnvelope.data.baseData.url).toEqual(expectedUrl);
  });
});

describe("Disable sampling with custom Telemetry Preprocessor", () => {
  it("should override sampleRate (defined in ai config) with 100", () => {
    const expectedSampleRate = 100;
    const testValidEnvelope: appInsights.Contracts.Envelope = {
      data: {
        baseType: "RequestData"
      },
      iKey: "key",
      name: "GET /test",
      sampleRate: 20,
      seq: "1",
      tags: { samplingEnabled: "false" },
      time: "",
      ver: 1
    };
    disableSamplingByTag(testValidEnvelope);
    expect(testValidEnvelope.sampleRate).toEqual(expectedSampleRate);
  });

  it("should NOT override sampleRate", () => {
    const expectedSampleRate = 20;
    const testValidEnvelope: appInsights.Contracts.Envelope = {
      data: {
        baseType: "RequestData"
      },
      iKey: "key",
      name: "GET /test",
      sampleRate: 20,
      seq: "1",
      tags: { test: "test" },
      time: "",
      ver: 1
    };
    disableSamplingByTag(testValidEnvelope);
    expect(testValidEnvelope.sampleRate).toEqual(expectedSampleRate);
  });
});
