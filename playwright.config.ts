import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3344",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    port: 3344,
    timeout: 60_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
