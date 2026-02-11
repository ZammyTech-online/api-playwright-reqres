import { test, expect } from "../src/fixtures/api";
import { AuthClient } from "../src/clients/auth.client";

test.describe("Auth /api/login", () => {
  test("Login OK: devuelve token", async ({ api }) => {
    // Arrange: create a client bound to the shared APIRequestContext fixture
    const auth = new AuthClient(api);

    // Act: perform a valid login
    const body = await auth.loginOk("eve.holt@reqres.in", "cityslicka");

    // Assert: token must be present
    expect(body.token).toBeTruthy();
  });

  test("Login KO: credenciales inválidas (email+password presentes)", async ({ api }) => {
    const auth = new AuthClient(api);

    // Act: attempt login with invalid credentials (both fields present)
    const { status, body } = await auth.loginError("peter@klaven", "wrong_password");

    // Assert: must be 4xx (never 5xx) and include an error message
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
    expect(body.error).toBeTruthy();
  });

  test("Login KO: missing fields (email/password/both)", async ({ api }) => {
    const auth = new AuthClient(api);

    // Table-driven cases for missing required fields
    const cases = [
      { name: "password missing", email: "eve.holt@reqres.in", password: undefined },
      { name: "email missing", email: undefined, password: "cityslicka" },
      { name: "both missing", email: undefined, password: undefined },
    ];

    // Validate each case independently with stable 4xx assertions
    for (const c of cases) {
      const { status, body } = await auth.loginError(c.email as any, c.password as any);
      expect(status, c.name).toBeGreaterThanOrEqual(400);
      expect(status, c.name).toBeLessThan(500);
      expect(body.error, c.name).toBeTruthy();
    }
  });
});
