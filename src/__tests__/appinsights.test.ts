import * as appInsights from "applicationinsights";
import { Configuration } from "applicationinsights";
import {
  initAppInsights,
  removeQueryParamsPreprocessor,
  withAppInsightsContext
} from "../appinsights";

// tslint:disable-next-line: no-submodule-imports
import { CorrelationContextManager } from "applicationinsights/out/AutoCollection/CorrelationContextManager";

describe("Create an App Insights Telemetry Client", () => {
  const mockSetup = jest.spyOn(appInsights, "setup");
  const spySetAutoDependencyCorrelation = jest.spyOn(
    Configuration,
    "setAutoCollectDependencies"
  );
  const spyStart = jest.spyOn(Configuration, "start");

  const expectedAppInsightsKey = "SECRET-KEY";

  it("should create a new App Insights Telemetry Client with tracing enabled", () => {
    // tslint:disable-next-line: no-unused-expression
    const telemetryClient = initAppInsights(
      expectedAppInsightsKey,
      {},
      {
        applicationVersion: "1.1.1",
        cloudRole: "ai.role"
      }
    );
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(spySetAutoDependencyCorrelation).not.toBeCalled();
    expect(spyStart).toHaveReturnedWith(Configuration);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
  });

  it("should create a new App Insights Telemetry Client with tracing disabled", () => {
    // tslint:disable-next-line: no-unused-expression
    const telemetryClient = initAppInsights(
      expectedAppInsightsKey,
      {},
      {
        applicationVersion: "1.1.1",
        cloudRole: "ai.role",
        isTracingDisabled: true
      }
    );
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(spySetAutoDependencyCorrelation).toBeCalledWith(false);
    expect(spyStart).toHaveReturnedWith(Configuration);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
  });
  it("should set some default settings in case they are not provided", () => {
    // tslint:disable-next-line: no-unused-expression
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
    // tslint:disable-next-line: no-unused-expression
    const telemetryClient = initAppInsights(
      expectedAppInsightsKey,
      {},
      {
        applicationVersion: "1.1.1",
        cloudRole: "ai.role",
        // tslint:disable-next-line: no-any
        httpAgent: {} as any,
        samplingPercentage: 20
      }
    );
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(telemetryClient).toEqual(appInsights.defaultClient);
    expect(telemetryClient.config.httpAgent).not.toBeUndefined();
    expect(telemetryClient.config.samplingPercentage).toBe(20);
  });
});

describe("Wrap an handler with Application Insights context", () => {
  const CollerationContextSpy = jest.spyOn(
    CorrelationContextManager,
    "generateContextObject"
  );

  it("should return the handler value", async () => {
    const handler = (a: string, b: number) => `${a}${b}`;
    const ret = withAppInsightsContext(
      {
        executionContext: {
          functionName: "foo"
        },
        invocationId: "123"
        // tslint:disable-next-line: no-any
      } as any,
      () => handler("bar", 2)
    );
    expect(CollerationContextSpy).toHaveBeenCalledWith("123", "123", "foo");
    expect(ret).toEqual("bar2");
  });
  it("should set traceId to traceparent.traceId", async () => {
    const handler = (a: string, b: number) => `${a}${b}`;
    const ret = withAppInsightsContext(
      {
        executionContext: {
          functionName: "foo"
        },
        invocationId: "123",
        traceContext: {
          traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
        }
        // tslint:disable-next-line: no-any
      } as any,
      () => handler("bar", 2)
    );
    expect(CollerationContextSpy).toHaveBeenCalledWith(
      "0af7651916cd43dd8448eb211c80319c",
      "0af7651916cd43dd8448eb211c80319c",
      "foo"
    );
    expect(ret).toEqual("bar2");
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
