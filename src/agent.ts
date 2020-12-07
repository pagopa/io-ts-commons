import * as agentkeepalive from "agentkeepalive";
import * as dns from "dns";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import nodeFetch from "node-fetch";

// override the host resolution mechanism of an agent to use dns.resolve instead of dns.lookup
function overrideDnsLookup<
  // tslint:disable-next-line: max-union-size
  A extends agentkeepalive | agentkeepalive.HttpsAgent | HttpAgent | HttpsAgent
>(agent: A): A {
  // wraps dns.resolve to use a signature like dns.lookup
  const lookupToResolveAdapter = (
    hostname: string,
    _: 4 | 6 | object,
    cb: (
      err: NodeJS.ErrnoException | null,
      resolved?: string,
      arg2?: number
    ) => void
  ) =>
    dns.resolve(hostname, (err, ips) => (err ? cb(err) : cb(null, ips[0], 4)));

  // @ts-ignore createConnection is a public method of both http.Agent and https.Agent, but it's not defined in their type declaration files
  const oldCreateConnection = agent.createConnection;
  // @ts-ignore createConnection is a public method of both http.Agent and https.Agent, but it's not defined in their type declaration files
  // tslint:disable-next-line: typedef
  const createConnection = (options, cb): void => {
    return oldCreateConnection.call(
      agent,
      { ...options, lookup: lookupToResolveAdapter },
      cb
    );
  };
  // @ts-ignore createConnection is a public method of both http.Agent and https.Agent, but it's not defined in their type declaration files
  // tslint:disable-next-line: no-object-mutation
  agent.createConnection = createConnection;
  return agent;
}

// whether we want to use dns.resolve instead of dns.lookup for domain resoltion
export const isDnsOverridden = (env: typeof process.env) =>
  env.FETCH_USE_DNS_RESOLVE === "true";

// whether we want to reuse sockets in the fetch client
// this is expecially useful to avoid SNAT exhaustion in Azure
// see https://blog.botframework.com/2018/03/05/fix-snat-exhaustion-node-js-bots/
export const isFetchKeepaliveEnabled = (env: typeof process.env) =>
  env.FETCH_KEEPALIVE_ENABLED === "true";

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
export const newHttpAgent = (httpOptions: agentkeepalive.HttpOptions) =>
  new agentkeepalive(httpOptions);

// HTTPs-only agent, with optional keepalive agent
export const newHttpsAgent = (httpsOptions: agentkeepalive.HttpsOptions) =>
  new agentkeepalive.HttpsAgent(httpsOptions);

// apply a custom agent to a given htto client instance
const withCustomAgent = (customAgent?: HttpAgent | HttpsAgent) => (
  fetchApi: typeof nodeFetch
): typeof fetch => (input, init) => {
  const initWithKeepalive = {
    ...(init === undefined ? {} : init),
    agent: customAgent
  };
  // need to cast to any since node-fetch has a slightly different type
  // signature that DOM's fetch
  // TODO: possibly avoid using DOM's fetch type altoghether?
  // tslint:disable-next-line: no-any
  return fetchApi(input as any, initWithKeepalive as any) as any;
};

// HTTP-only fetch, with optional keepalive agent
// Note: extra options are valid only when FETCH_KEEPALIVE_ENABLED=true
export const getHttpFetch = (
  env: typeof process.env,
  extraOptions: agentkeepalive.HttpOptions = {}
): typeof fetch => {
  const withKeepaliveOrDefault = isFetchKeepaliveEnabled(env)
    ? newHttpAgent({
        ...getKeepAliveAgentOptions(env),
        ...extraOptions
      })
    : undefined;
  const customAgent = isDnsOverridden(env)
    ? overrideDnsLookup(withKeepaliveOrDefault || new HttpAgent())
    : withKeepaliveOrDefault;
  return withCustomAgent(customAgent)(nodeFetch);
};

// HTTPs-only fetch, with optional keepalive agent
// Note: extra options are valid only when FETCH_KEEPALIVE_ENABLED=true
export const getHttpsFetch = (
  env: typeof process.env,
  extraOptions: agentkeepalive.HttpsOptions = {}
): typeof fetch => {
  const withKeepaliveOrDefault = isFetchKeepaliveEnabled(env)
    ? newHttpsAgent({
        ...getKeepAliveAgentOptions(env),
        ...extraOptions
      })
    : undefined;
  const customAgent = isDnsOverridden(env)
    ? overrideDnsLookup(withKeepaliveOrDefault || new HttpsAgent())
    : withKeepaliveOrDefault;
  return withCustomAgent(customAgent)(nodeFetch);
};
