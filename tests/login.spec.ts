// tests/login.spec.ts
import { test, expect } from "../src/fixtures/api";
import { AuthClient } from "../src/clients/auth.client";

test.describe("Auth /api/login", () => {
  test("L1 Login OK: devuelve token (200)", async ({ api }) => {
    const auth = new AuthClient(api);

    const body = await auth.loginOk("eve.holt@reqres.in", "cityslicka");

    // token must be a non-empty string (client already asserts it, this is explicit for the spec)
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  test("L5 Login con password incorrecto (credenciales presentes): devuelve 200 + token (comportamiento real ReqRes)", async ({
    api,
  }) => {
    const auth = new AuthClient(api);

    // ReqRes is permissive: if both fields exist, it returns 200 even if password is wrong
    const body = await auth.loginOk("eve.holt@reqres.in", "wrong_password");

    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  test("L2 Missing password: devuelve 400 + error exacto", async ({ api }) => {
    const auth = new AuthClient(api);

    const { status, body } = await auth.loginError("eve.holt@reqres.in", undefined);

    expect(status).toBe(400);
    expect(body.error).toBe("Missing password");
  });

  test("L3 Missing email: devuelve 400 + error exacto", async ({ api }) => {
    const auth = new AuthClient(api);

    const { status, body } = await auth.loginError(undefined, "cityslicka");

    expect(status).toBe(400);
    expect(body.error).toBe("Missing email or username");
  });

  test("L4 Empty request body real (NO {}): devuelve 400 + error (message si aplica)", async ({ api }) => {
  const auth = new AuthClient(api);

  const { status, body } = await auth.loginEmptyBody();

  expect(status).toBe(400);
  expect(typeof body.error).toBe("string");
  expect(body.error.length).toBeGreaterThan(0);

  // Si cae en rama Empty request body, validamos message exacto
  if (body.error === "Empty request body") {
    expect(body.message).toBe("Request body cannot be empty for JSON endpoints");
  }
});


});
