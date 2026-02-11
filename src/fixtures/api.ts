import { test as base, expect, request, APIRequestContext } from "@playwright/test";
import { loadEnvConfig } from "../config/env";

// Fixture types: exposes { api } to all tests
type ApiFixtures = { api: APIRequestContext };

// Shared default headers for all requests in the suite
// - accept: enforce JSON responses
// - user-agent: helps avoid odd CDN/bot mitigations on public APIs
const DEFAULT_HEADERS: Record<string, string> = {
  accept: "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// Extend Playwright's test to inject a preconfigured APIRequestContext
export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    // Load config from .env / environment variables (never hardcode secrets)
    const { baseURL, apiKey } = loadEnvConfig();

    // Reusable HTTP context per worker:
    // - baseURL: avoids repeating the host in every request
    // - extraHTTPHeaders: applies headers to every request (including x-api-key)
    const api = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        ...DEFAULT_HEADERS,
        "x-api-key": apiKey,
      },
    });

    // Provide the context to the test
    await use(api);

    // Cleanup to avoid resource leaks
    await api.dispose();
  },
});

// Re-export expect so specs can import from this module
export { expect };
