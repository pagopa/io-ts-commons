import * as agentkeepalive from "agentkeepalive";
import nodeFetch from "node-fetch";

// whether we want to reuse sockets in the fetch client
// this is expecially useful to avoid SNAT exhaustion in Azure
// see https://blog.botframework.com/2018/03/05/fix-snat-exhaustion-node-js-bots/
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const isFetchKeepaliveEnabled = (env: typeof process.env) =>
  env.FETCH_KEEPALIVE_ENABLED === "true";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getKeepAliveAgentOptions = (env: typeof process.env) => ({
  freeSocketTimeout:
    env.FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT === undefined
      ? undefined
      : parseInt(env.FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT, 10),
  keepAlive: true,
  keepAliveMsecs:
    env.FETCH_KEEPALIVE_KEEPALIVE_MSECS === undefined
      ? undefined
      : parseInt(env.FETCH_KEEPALIVE_KEEPALIVE_MSECS, 10),
  maxFreeSockets:
    env.FETCH_KEEPALIVE_MAX_FREE_SOCKETS === undefined
      ? undefined
      : parseInt(env.FETCH_KEEPALIVE_MAX_FREE_SOCKETS, 10),
  maxSockets:
    env.FETCH_KEEPALIVE_MAX_SOCKETS === undefined
      ? undefined
      : parseInt(env.FETCH_KEEPALIVE_MAX_SOCKETS, 10),
  socketActiveTTL:
    env.FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL === undefined
      ? undefined
      : parseInt(env.FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL, 10),
  timeout:
    env.FETCH_KEEPALIVE_TIMEOUT === undefined
      ? undefined
      : parseInt(env.FETCH_KEEPALIVE_TIMEOUT, 10)
});

// We need the following two exports to prevent the caller module
// to access the unptached version of agentkeepalive which has a bug
// @see https://github.com/node-modules/agentkeepalive/issues/76

// HTTP-only agent, with optional keepalive agent
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const newHttpAgent = (httpOptions: agentkeepalive.HttpOptions) =>
  new agentkeepalive(httpOptions);

// HTTPs-only agent, with optional keepalive agent
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const newHttpsAgent = (httpsOptions: agentkeepalive.HttpsOptions) =>
  new agentkeepalive.HttpsAgent(httpsOptions);

// Returns a fetch instance backed by a keepalive-enabled HTTP agent
const getKeepaliveHttpFetch: (
  _: agentkeepalive.HttpOptions
) => typeof fetch = httpOptions => {
  // custom HTTP agent that will reuse sockets
  // see https://github.com/node-modules/agentkeepalive#new-agentoptions
  const httpAgent = newHttpAgent(httpOptions);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return (input, init) => {
    const initWithKeepalive = {
      ...(init === undefined ? {} : init),
      agent: httpAgent
    };
    // need to cast to any since node-fetch has a slightly different type
    // signature that DOM's fetch
    // TODO: possibly avoid using DOM's fetch type altoghether?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return nodeFetch(input as any, initWithKeepalive as any) as any;
  };
};

// Returns a fetch instance backed by a keepalive-enabled HTTP agent
const getKeepaliveHttpsFetch: (
  _: agentkeepalive.HttpsOptions
) => typeof fetch = httpsOptions => {
  // custom HTTP agent that will reuse sockets
  // see https://github.com/node-modules/agentkeepalive#new-agentoptions
  const httpAgent = newHttpsAgent(httpsOptions);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, sonarjs/no-identical-functions
  return (input, init) => {
    const initWithKeepalive = {
      ...(init === undefined ? {} : init),
      agent: httpAgent
    };
    // need to cast to any since node-fetch has a slightly different type
    // signature that DOM's fetch
    // TODO: possibly avoid using DOM's fetch type altoghether?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return nodeFetch(input as any, initWithKeepalive as any) as any;
  };
};

// HTTP-only fetch, with optional keepalive agent
// Note: extra options are valid only when FETCH_KEEPALIVE_ENABLED=true
export const getHttpFetch = (
  env: typeof process.env,
  extraOptions: agentkeepalive.HttpOptions = {}
): typeof fetch =>
  isFetchKeepaliveEnabled(env)
    ? getKeepaliveHttpFetch({
        ...getKeepAliveAgentOptions(env),
        ...extraOptions
      })
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nodeFetch as any);

// HTTPs-only fetch, with optional keepalive agent
// Note: extra options are valid only when FETCH_KEEPALIVE_ENABLED=true
export const getHttpsFetch = (
  env: typeof process.env,
  extraOptions: agentkeepalive.HttpsOptions = {}
): typeof fetch =>
  isFetchKeepaliveEnabled(env)
    ? getKeepaliveHttpsFetch({
        ...getKeepAliveAgentOptions(env),
        ...extraOptions
      })
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nodeFetch as any);

// Wraps both HTTP and HTTPS agents and serve the correct one based on the protocol of the request url
// Note: extra options are valid only when FETCH_KEEPALIVE_ENABLED=true
export const getFetch = (
  env: typeof process.env,
  extraOptions: agentkeepalive.HttpOptions /* same as agentkeepalive.HttpsOptions */ = {}
): typeof fetch => {
  const httpAgent = getHttpFetch(env, extraOptions);
  const httpsAgent = getHttpsFetch(env, extraOptions);
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return (input, init) => {
    const url =
      input instanceof URL
        ? input.toString()
        : input instanceof Request
        ? input.url
        : input;
    return url.startsWith("https://")
      ? httpsAgent(input, init)
      : httpAgent(input, init);
  };
};
