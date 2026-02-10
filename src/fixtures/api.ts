import { test as base, expect, request, APIRequestContext } from "@playwright/test";
import { loadEnvConfig } from "../config/env";

type ApiFixtures = { api: APIRequestContext };

const DEFAULT_HEADERS: Record<string, string> = {
  accept: "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    const { baseURL, apiKey } = loadEnvConfig();

    const api = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        ...DEFAULT_HEADERS,
        "x-api-key": apiKey
      }
    });

    await use(api);
    await api.dispose();
  }
});

export { expect };
