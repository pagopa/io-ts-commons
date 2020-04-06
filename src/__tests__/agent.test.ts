import ServerMock = require("mock-http-server");
import { getHttpFetch, getHttpsFetch } from "../agent";

const TEST_HOST = "localhost";
const TEST_PORT = 40001;

// tslint:disable-next-line: no-any
function createServerMock(): any {
  const server = new ServerMock(
    { host: TEST_HOST, port: TEST_PORT },
    undefined
  );

  server.on({
    method: "GET",
    path: "/agent",
    reply: {
      status: 200
    }
  });

  return server;
}

// tslint:disable-next-line: no-object-mutation
const envWithKeepalive = {
  FETCH_KEEPALIVE_ENABLED: "true"
};

describe("HttpAgentKeepAlive", () => {
  const server = createServerMock();

  beforeEach(server.start);
  afterEach(server.stop);

  it("should set the keepalive http header", async () => {
    const fetch = getHttpFetch(envWithKeepalive);
    const res = await fetch(`http://${TEST_HOST}:${TEST_PORT}/agent`);
    expect(res.headers.get("connection")).toContain("keep-alive");
  });

  it("should not set the keepalive http header", async () => {
    const fetch = getHttpFetch({});
    const res = await fetch(`http://${TEST_HOST}:${TEST_PORT}/agent`);
    expect(res.headers.get("connection")).toContain("close");
  });

  it("should not set the keepalive https header", async () => {
    const fetch = getHttpsFetch({});
    const res = await fetch(`http://${TEST_HOST}:${TEST_PORT}/agent`);
    expect(res.headers.get("connection")).toContain("close");
  });

  it("should not set the keepalive https header", async () => {
    const fetch = getHttpsFetch({});
    const res = await fetch(`http://${TEST_HOST}:${TEST_PORT}/agent`);
    expect(res.headers.get("connection")).toContain("close");
  });
});
