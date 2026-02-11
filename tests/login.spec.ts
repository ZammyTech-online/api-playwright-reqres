// tests/login.spec.ts
import { test, expect } from "../src/fixtures/api";
import { AuthClient } from "../src/clients/auth.client";

test.describe("Scenario 1 — Auth /api/login", () => {
  test("S1.1 (L1) POST /api/login — 200 OK returns token (valid credentials)", async ({ api }) => {
    const auth = new AuthClient(api);

    const body = await auth.loginOk("eve.holt@reqres.in", "cityslicka");

    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  test("S1.2 (L5) POST /api/login — 200 OK returns token even with wrong password (ReqRes permissive)", async ({
    api,
  }) => {
    const auth = new AuthClient(api);

    const body = await auth.loginOk("eve.holt@reqres.in", "wrong_password");

    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  test("S1.3 (L2) POST /api/login — 400 Missing password (exact error)", async ({ api }) => {
    const auth = new AuthClient(api);

    const { status, body } = await auth.loginError("eve.holt@reqres.in", undefined);

    expect(status).toBe(400);
    expect(body.error).toBe("Missing password");
  });

  test("S1.4 (L3) POST /api/login — 400 Missing email or username (exact error)", async ({ api }) => {
    const auth = new AuthClient(api);

    const { status, body } = await auth.loginError(undefined, "cityslicka");

    expect(status).toBe(400);
    expect(body.error).toBe("Missing email or username");
  });

  test("S1.5 (L4) POST /api/login — 400 Empty request body (message asserted only if that branch appears)", async ({
    api,
  }) => {
    const auth = new AuthClient(api);

    const { status, body } = await auth.loginEmptyBody();

    expect(status).toBe(400);
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);

    // Strict only when ReqRes returns that specific branch (confirmed via Postman evidence)
    if (body.error === "Empty request body") {
      expect(body.message).toBe("Request body cannot be empty for JSON endpoints");
    }
  });
});
