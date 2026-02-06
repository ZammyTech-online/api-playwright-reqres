import { test as base, request, APIRequestContext, expect } from '@playwright/test';

type Fixtures = {
  api: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  api: async ({ baseURL, extraHTTPHeaders }, use) => {
    // Validación temprana: si no hay x-api-key, fallar de forma explícita
    const apiKey = extraHTTPHeaders?.['x-api-key'];
    expect(apiKey, 'Debes configurar X_API_KEY en .env para que la API responda').toBeTruthy();

    const ctx = await request.newContext({
      baseURL,
      extraHTTPHeaders
    });
    await use(ctx);
    await ctx.dispose();
  }
});

export { expect } from '@playwright/test';
