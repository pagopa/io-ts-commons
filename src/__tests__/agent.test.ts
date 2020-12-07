import * as dns from "dns";
import { IncomingMessage } from "http";
import ServerMock = require("mock-http-server");
import { getHttpFetch, getHttpsFetch } from "../agent";

//@ts-ignore
const compose = (...fns) => value => fns.reduce((p, e) => e(p), value);

const HTTP_TEST_HOST = "localhost";
const HTTP_TEST_PORT = 40004;

const HTTPS_TEST_HOST = "localhost";
const HTTPS_TEST_PORT = 40005;

const publicKey = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUTOqXX7vFzk6rnygi/Rm7p9y8tMgwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMDA0MDYxMzQ2MjNaFw0yMDA1
MDYxMzQ2MjNaMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDCgabCqZs65pBXVhABH1PV8Lh9MTJYlbin6DExohe1
379K4Xku9rVfvCPn/LEGT66nkEGg0LO4paHi51Wv4wjMHGFe99GRnnIXEXMAtfho
6F1IJmndpEbmEeejkeAs7X+gfYGKsJ9I2nPmhp5loIQkj90vs5cgv920ALnATwdJ
lHOBkwotPs4YYPznT6y2zCETNyV9KHGvlKBzfW2G3kp/GqoEKFwIEg17ls1Xl0JA
OElfx7fHYm0QO+2UjyG7P+ZaYYu3OiuuLIeY5Gn91gpjwBlXfhzZMjrSP5QJi2WQ
EzNonuSboRHzH7iBeO0ObgVhmUw8lJZcZ/gepFHRSIYVAgMBAAGjUzBRMB0GA1Ud
DgQWBBRCcWs5SD0WAlOyM59ORmpekpI5fzAfBgNVHSMEGDAWgBRCcWs5SD0WAlOy
M59ORmpekpI5fzAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQC3
LVTYi7+06wTfL+pitFd1xoLFsPGycIvd91VUT9nvkNhf8x4aUEBLc3BV6019t07t
Hw94gEKgDaNLAXIQ1VvsBOkt9uTISMlNGGre3WlFp9De9YNasNMPiFviuioeOCDM
ObQVHk9YIGFed5x7tdZJy9xIaOrTVmPu/TvfVVT3mryUhonXSslDP8huM1ZZeDo0
U2Ohp6D7Gl89sYOQCBE9HEBQp6tn0rVPbmRaERBKBwmGLRCvzZMtWmVO6Z+Dao7v
sFMlnsP+RkL1Th+U7ugvnovtiIpIrFiZYLT2aapYaHO0mgUynGLcwMcbHTjQyA54
qcw9mQOa41cSKQbFLM6v
-----END CERTIFICATE-----`;

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDCgabCqZs65pBX
VhABH1PV8Lh9MTJYlbin6DExohe1379K4Xku9rVfvCPn/LEGT66nkEGg0LO4paHi
51Wv4wjMHGFe99GRnnIXEXMAtfho6F1IJmndpEbmEeejkeAs7X+gfYGKsJ9I2nPm
hp5loIQkj90vs5cgv920ALnATwdJlHOBkwotPs4YYPznT6y2zCETNyV9KHGvlKBz
fW2G3kp/GqoEKFwIEg17ls1Xl0JAOElfx7fHYm0QO+2UjyG7P+ZaYYu3OiuuLIeY
5Gn91gpjwBlXfhzZMjrSP5QJi2WQEzNonuSboRHzH7iBeO0ObgVhmUw8lJZcZ/ge
pFHRSIYVAgMBAAECggEBAKY/CJiTPMFwNejf/1fmPdK7KAShGwYKGkUxOXLRt3BV
KHxJETnp1gZYmVv8aBYb3w0LSHy6RRJKR37X+S4XX/qNO1BfgnjzM1KyMFhoMEUC
blBvvMabVZnprdHpqfDcodw7yZAP/GTZinx7jUERnEBf0k6mMkLkmwryH9HV+kWR
JbiuC7b+wBoKF+Il/QzsPvPNA/m9c843Q0gkxcyQtMs+cofK8iwGoeTeSAuDx1om
gkhTNWUGvpmJn1KyG1q2C6mlg6n9NJknPNrUCP2qcA0lx/xnYnNdTa43/5dzBxPW
C4bznq3/MnCXE3XXjuoXprJ0cKVytuqjXp2bIRmwCNUCgYEA7J44RnvQnzQaJfUv
ci4thd0bxtPhfwLbSyUpzVbdLUVw/PPIcuhTsa1e5CUUxe8rXMZjZD4UeAz35/da
rAjLfLiAzIfryML6VkcpoEdPFeYX9HK8UPgOtumwp/TxeUTKuBePEalTd7alAgai
QDvFnTlxtPMK3ncf8FsgoKcGFq8CgYEA0nBeiHVfCFH0xwNR0IAyACKNGIOoZ7JA
63Z2Qk4JlMOEcGS2BcisRlGXuvBJyvcv672hod+GfgIGsxakdiZ+tlAIrN6jW4bu
XJScSrMBky3r1TKQJEzjEhNyUXIQTXiQbJiVuA6iZ7tdOJbgbv+uUAHll5k6Go0P
uDzawXtGYHsCgYEA3LxVX1uOKZbfdd2fX3M4wJKeoQN0b5ponVeUAZ0xRFRtrWx2
6MtXmH9V8JuvH1+ZIjlo61EGo1/lvR6CFc82lalBboy2J1nNU8ObT4x2eMVoP4Dx
sM9YWsbzKBxXUHweaVKBA0blON7IXHV301hvZ9b4/odk8lhLEVzRuU1XXr0CgYEA
yPXIQPYdF7v0TmzsH3mcxiY4qdVo6AYBGxsYmf8eBTOlcROsA9/8LHbUuA+p2Kqv
16dTCFuGeyUCMtoHmlDuprnNXxCJ3ekADedZTbieY2fyE7nijtfh7KwneoG78c+V
1C7uo0NOclMqFdV3ZGjElOEK2PfZ1espvN5YZXaM4asCgYAQ6uw1QFMK8V6+3d39
wKHqUsgwogWk8nwkg6sB7WjrUlN9EhYIOeEVUxdTr03qJKMGGnaP9czQlOLG0MAo
01CnmfPz9kYgg1QPnSsbUSdd82q8Yc87BbboOhqV/sQtOnDrNRj9SgdC/FgL2iUQ
oJORZxgOh5GqevhTgkKoPDlNkw==
-----END PRIVATE KEY-----`;

const createServerMock = () => {
  const server = new ServerMock(
    { host: HTTP_TEST_HOST, port: HTTP_TEST_PORT },
    {
      cert: publicKey,
      host: HTTPS_TEST_HOST,
      key: privateKey,
      port: HTTPS_TEST_PORT
    }
  );

  server.on({
    method: "GET",
    path: "/agent",
    reply: {
      // tslint:disable-next-line: no-any
      body: (req: IncomingMessage, reply: any) => {
        reply(JSON.stringify({ port: req.connection.remotePort }));
      },
      headers: { "content-type": "application/json" },
      status: 200
    }
  });

  return server;
};

const anEnv: typeof process.env = {};

const withKeepalive = (e = anEnv) => ({
  ...e,
  FETCH_KEEPALIVE_ENABLED: "true"
});
const withDnsResolve = (e = anEnv) => ({
  ...e,
  FETCH_USE_DNS_RESOLVE: "true"
});

const anHttpUrl = `http://${HTTP_TEST_HOST}:${HTTP_TEST_PORT}/agent`;
const anHttpsUrl = `https://${HTTPS_TEST_HOST}:${HTTPS_TEST_PORT}/agent`;

describe("HttpAgentKeepAlive", () => {
  const server = createServerMock();
  beforeAll(server.start);
  afterAll(server.stop);
  afterEach(() => jest.clearAllMocks());

  it("should use keepalive for http request", async () => {
    const env = compose(withKeepalive)(anEnv);
    const fetch = getHttpFetch(env);
    const res = await fetch(anHttpUrl);
    expect(res.headers.get("connection")).toContain("keep-alive");
    const res2 = await fetch(anHttpUrl);
    expect(await res2.json()).toEqual(await res.json());
  });

  it("should not use keepalive for http request", async () => {
    const fetch = getHttpFetch(anEnv);
    const res = await fetch(anHttpUrl);
    expect(res.headers.get("connection")).toContain("close");
    const res2 = await fetch(anHttpUrl);
    expect(await res2.json()).not.toEqual(await res.json());
  });

  it("should use keepalive for https request", async () => {
    const env = compose(withKeepalive)(anEnv);
    const fetch = getHttpsFetch(env);
    const res = await fetch(anHttpsUrl);
    expect(res.headers.get("connection")).toContain("keep-alive");
    const res2 = await fetch(anHttpsUrl);
    expect(await res2.json()).toEqual(await res.json());
  });

  it("should not use keepalive for https request", async () => {
    const fetch = getHttpsFetch({});
    const res = await fetch(anHttpsUrl);
    expect(res.headers.get("connection")).toContain("close");
    const res2 = await fetch(anHttpsUrl);
    expect(await res2.json()).not.toEqual(await res.json());
  });

  it("should use dns.resolve() on http client", async () => {
    jest.spyOn(dns, "resolve");
    jest.spyOn(dns, "lookup");
    jest.spyOn(dns, "lookupService");

    const env = compose(withDnsResolve)(anEnv);
    const fetch = getHttpFetch(env);
    await fetch(anHttpUrl);
    expect(dns.resolve).toHaveBeenCalled();
    expect(dns.lookup).not.toHaveBeenCalled();
    expect(dns.lookupService).not.toHaveBeenCalled();
  });

  it("should use dns.resolve() on https client", async () => {
    jest.spyOn(dns, "resolve");
    jest.spyOn(dns, "lookup");
    jest.spyOn(dns, "lookupService");

    const env = compose(withDnsResolve)(anEnv);
    const fetch = getHttpFetch(env);
    await fetch(anHttpUrl);
    expect(dns.resolve).toHaveBeenCalled();
    expect(dns.lookup).not.toHaveBeenCalled();
    expect(dns.lookupService).not.toHaveBeenCalled();
  });

  it("should use dns.resolve() on http client with keepalive", async () => {
    jest.spyOn(dns, "resolve");
    jest.spyOn(dns, "lookup");
    jest.spyOn(dns, "lookupService");

    const env = compose(withDnsResolve, withKeepalive)(anEnv);
    const fetch = getHttpFetch(env);
    await fetch(anHttpUrl);
    expect(dns.resolve).toHaveBeenCalled();
    expect(dns.lookup).not.toHaveBeenCalled();
    expect(dns.lookupService).not.toHaveBeenCalled();
  });

  it("should use dns.resolve() on https client with keepalive", async () => {
    jest.spyOn(dns, "resolve");
    jest.spyOn(dns, "lookup");
    jest.spyOn(dns, "lookupService");

    const env = compose(withDnsResolve, withKeepalive)(anEnv);
    const fetch = getHttpsFetch(env);
    await fetch(anHttpsUrl);
    expect(dns.resolve).toHaveBeenCalled();
    expect(dns.lookup).not.toHaveBeenCalled();
    expect(dns.lookupService).not.toHaveBeenCalled();
  });
});
