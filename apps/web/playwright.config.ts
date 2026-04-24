import { defineConfig } from "@playwright/test";

const DEFAULT_PORT = 3000;

function resolvePort() {
  const rawPort = process.env.PW_PORT;
  if (!rawPort) return DEFAULT_PORT;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `PW_PORT must be an integer between 1 and 65535. Received: ${rawPort}`,
    );
  }
  return port;
}

const port = resolvePort();
const baseURL = `http://127.0.0.1:${port}`;

// `reuseExistingServer` previously defaulted to true locally, which means a
// stale `next dev` (or any other process) bound to port 3000 would silently
// take over the test run and produce confusing failures. Default to
// launching a dedicated static-export server for every run, and let
// developers opt back into reuse via `PW_REUSE_SERVER=1` when they want fast
// iteration against an already-running `serve -l <PW_PORT> out`.
const reuseExistingServer =
  !process.env.CI && process.env.PW_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL,
  },
  webServer: {
    command: `pnpm exec serve -l ${port} out --no-clipboard --no-port-switching`,
    port,
    reuseExistingServer,
    timeout: 60_000,
  },
});
