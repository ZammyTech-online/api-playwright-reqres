import { test, expect } from "../src/fixtures/api";
import { AuthClient } from "../src/clients/auth.client";

test.describe("Auth /api/login", () => {
  test("Login OK: devuelve token", async ({ api }) => {
    const auth = new AuthClient(api);
    const body = await auth.loginOk("eve.holt@reqres.in", "cityslicka");
    expect(body.token).toBeTruthy();
  });

  test("Login KO: credenciales inválidas (email+password presentes)", async ({ api }) => {
    const auth = new AuthClient(api);
    const { status, body } = await auth.loginError("peter@klaven", "wrong_password");
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
    expect(body.error).toBeTruthy();
  });

  test("Login KO: missing fields (email/password/both)", async ({ api }) => {
    const auth = new AuthClient(api);

    const cases = [
      { name: "password missing", email: "eve.holt@reqres.in", password: undefined },
      { name: "email missing", email: undefined, password: "cityslicka" },
      { name: "both missing", email: undefined, password: undefined }
    ];

    for (const c of cases) {
      const { status, body } = await auth.loginError(c.email as any, c.password as any);
      expect(status, c.name).toBeGreaterThanOrEqual(400);
      expect(status, c.name).toBeLessThan(500);
      expect(body.error, c.name).toBeTruthy();
    }
  });
});
