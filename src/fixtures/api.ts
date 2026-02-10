import { test as base, expect, request, APIRequestContext } from "@playwright/test";

type ApiFixtures = { api: APIRequestContext };

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    const baseURL = process.env.BASE_URL?.trim() || "https://reqres.in";
    const apiKey = process.env.X_API_KEY?.trim();

    if (!apiKey) {
      throw new Error(
        "Falta X_API_KEY. Crea .env (desde .env.example) y define X_API_KEY. " +
          "El header x-api-key es obligatorio."
      );
    }

    const api = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        "x-api-key": apiKey,
        accept: "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    await use(api);
    await api.dispose();
  }
});

export { expect };
