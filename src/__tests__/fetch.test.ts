import ServerMock = require("mock-http-server");
import nodeFetch from "node-fetch";
import {
  AbortableFetch,
  retriableFetch,
  setFetchTimeout,
  toFetch,
  retryLogicForTransientResponseError
} from "../fetch";
import { DeferredPromise, timeoutPromise } from "../promises";
import {
  MaxRetries,
  RetriableTask,
  RetryAborted,
  TransientError,
  withRetries
} from "../tasks";
import { Millisecond } from "../units";
import { fromPredicate } from "fp-ts/lib/TaskEither";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
(global as any).fetch = nodeFetch;

const TEST_HOST = "localhost";
const TEST_PORT = 40000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createServerMock(): any {
  const server = new ServerMock(
    { host: TEST_HOST, port: TEST_PORT },
    undefined
  );

  server.on({
    delay: 10 * 1000, // delay the response by 10 seconds
    method: "GET",
    path: "/long-delay",
    reply: {
      status: 200
    }
  });

  return server;
}

const longDelayUrl = `http://${TEST_HOST}:${TEST_PORT}/long-delay`;

// This test suite is based on functionality provided by a WIP branch of
// node-fetch that adds support for abort.
// see https://github.com/bitinn/node-fetch/pull/437
// TODO: eventually use npm version of node-fetch
describe("AbortableFetch", () => {
  const server = createServerMock();

  beforeEach(server.start);
  afterEach(server.stop);

  it("should abort a fetch request", async () => {
    const abortableFetch = AbortableFetch(fetch);

    // start the fetch request
    const { e1: responsePromise, e2: abortController } = abortableFetch(
      longDelayUrl
    );

    // abort the request after 100ms
    await timeoutPromise(100 as Millisecond);
    abortController.abort();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(responsePromise).rejects.toEqual(
      expect.objectContaining({
        message: "The user aborted a request."
      })
    );
    expect(server.requests().length).toEqual(1);
  });
});

describe("setFetchTimeout", () => {
  const server = createServerMock();

  beforeEach(server.start);
  afterEach(server.stop);

  it("should wrap fetch with a timeout", async () => {
    const abortableFetch = AbortableFetch(fetch);
    const timepoutFetch = setFetchTimeout(100 as Millisecond, abortableFetch);

    try {
      // start the fetch request
      await timepoutFetch(longDelayUrl).e1;
    } catch (e) {
      // fetch should abort after 100ms
      expect(server.requests().length).toEqual(1);
      expect(e).toEqual(
        expect.objectContaining({
          message: "The user aborted a request."
        })
      );
    }
  });
});

describe("retriableFetch", () => {
  const server = createServerMock();

  beforeEach(server.start);
  afterEach(server.stop);

  it("should wrap fetch with a retrying logic", async () => {
    // a fetch that can be aborted and that gets cancelled after 10ms
    const abortableFetch = AbortableFetch(fetch);
    const timeoutFetch = toFetch(
      setFetchTimeout(100 as Millisecond, abortableFetch)
    );

    // configure retriable logic with 5 retries and constant backoff
    const constantBackoff = () => 10 as Millisecond;
    const withSomeRetries = withRetries<Error, Response>(3, constantBackoff);

    // wraps the abortable fetch with the retry logic
    const fetchWithRetries = retriableFetch(withSomeRetries)(timeoutFetch);

    try {
      // start the fetch request
      await fetchWithRetries(longDelayUrl);
    } catch (e) {
      // fetch should abort with MaxRetries
      expect(server.requests().length).toEqual(3);
      expect(e).toEqual(MaxRetries);
    }
  });

  it("should stop retrying on abort", async () => {
    // creates a deferred promise that gets resolved by calling resolveShouldAbort
    const { e1: shouldAbort, e2: resolveShouldAbort } = DeferredPromise<
      boolean
    >();

    // a fetch that can be aborted and that gets cancelled after 10ms
    const abortableFetch = AbortableFetch(fetch);
    const timeoutFetch = toFetch(
      setFetchTimeout(10 as Millisecond, abortableFetch)
    );

    // retry 100 times with 10ms delay
    const constantBackoff = () => 10 as Millisecond;
    const withSomeRetries = withRetries<Error, Response>(100, constantBackoff);

    // wraps the abortable fetch with the retry logic
    const fetchWithRetries = retriableFetch(
      withSomeRetries,
      shouldAbort
    )(timeoutFetch);

    // stop retrying after 100ms
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    timeoutPromise(100 as Millisecond).then(() => resolveShouldAbort(true));

    try {
      // start the fetch request
      await fetchWithRetries(longDelayUrl);
    } catch (e) {
      // fetch should abort with RetryAborted after 100ms and 5 requests
      // 100ms / (10ms timeout + 10ms delay) = 5 requests total
      expect(server.requests().length).toEqual(5);
      expect(e).toEqual(RetryAborted);
    }
  });

  it("should retry on transient error", async () => {
    const delay = 10 as Millisecond;
    const retries = 3;
    const constantBackoff = () => delay;
    const retryLogic = withRetries<Error, Response>(retries, constantBackoff);
    const retryWithTransientError = retryLogicForTransientResponseError(
      _ => _.status === 404,
      retryLogic
    );
    const fetchWithRetries = retriableFetch(retryWithTransientError)(fetch);

    // start the fetch request
    await expect(fetchWithRetries(longDelayUrl)).rejects.toEqual("max-retries");
    expect(server.requests().length).toEqual(3);
  });

  it("should execute fetch again for every transient error", async () => {
    const mockResponse200 = ({ status: 200 } as unknown) as Response;
    const mockResponse404 = ({ status: 404 } as unknown) as Response;
    const mockFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >(async _ => mockResponse200);

    const delay = 10 as Millisecond;
    const retries = 3;
    const numberOfTransientErrors = retries - 1; // below maximum retries

    // fetch returns a transient error for numberOfTransientErrors of times
    Array.from({ length: numberOfTransientErrors }).forEach(_ =>
      mockFetch.mockImplementationOnce(async _ => mockResponse404)
    );

    const constantBackoff = () => delay;
    const retryLogic = withRetries<Error, Response>(retries, constantBackoff);
    const retryWithTransientError = retryLogicForTransientResponseError(
      _ => _.status === 404,
      retryLogic
    );
    const fetchWithRetries = retriableFetch(retryWithTransientError)(mockFetch);

    const req = fetchWithRetries(longDelayUrl);

    // expect the final result to be the success response
    await expect(req).resolves.toBe(mockResponse200);

    // expect fetch to be called once for every transient error plus the successful response
    expect(mockFetch).toHaveBeenCalledTimes(numberOfTransientErrors + 1);
  });

  it("should not retry if it is not a transient error", async () => {
    const mockResponse200 = ({ status: 200 } as unknown) as Response;
    const mockFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >(async _ => mockResponse200);

    const delay = 10 as Millisecond;
    const retries = 3;

    const constantBackoff = () => delay;
    const retryLogic = withRetries<Error, Response>(retries, constantBackoff);
    const retryWithTransientError = retryLogicForTransientResponseError(
      _ => _.status === 404,
      retryLogic
    );
    const fetchWithRetries = retriableFetch(retryWithTransientError)(mockFetch);

    const req = fetchWithRetries(longDelayUrl /** any url */);

    // expect the final result to be the success response
    await expect(req).resolves.toBe(mockResponse200);

    // expect fetch to be called once for every transient error plus the successful response
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
