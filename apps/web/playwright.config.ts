import { defineConfig } from "@playwright/test";

// `reuseExistingServer` previously defaulted to true locally, which means a
// stale `next dev` (or any other process) bound to port 3000 would silently
// take over the test run and produce confusing failures. Default to
// launching a dedicated static-export server for every run, and let
// developers opt back into reuse via `PW_REUSE_SERVER=1` when they want fast
// iteration against an already-running `serve -l 3000 out`.
const reuseExistingServer =
  !process.env.CI && process.env.PW_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "pnpm exec serve -l 3000 out --no-clipboard --no-port-switching",
    port: 3000,
    reuseExistingServer,
    timeout: 60_000,
  },
});
