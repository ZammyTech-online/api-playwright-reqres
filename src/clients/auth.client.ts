import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import type { ErrorResponse, LoginResponse } from "../types/reqres";

/**
 * AuthClient
 * - Encapsulates /api/login request logic.
 * - Keeps specs clean and isolates endpoint changes from tests.
 */
export class AuthClient {
  constructor(private readonly api: APIRequestContext) {}

  /**
   * Low-level request (no assertions).
   * Useful when you want to validate status codes and payloads in different ways.
   */
  async loginRaw(email?: string, password?: string): Promise<APIResponse> {
    // NOTE: Passing undefined is intentional for "missing field" scenarios.
    return this.api.post("/api/login", { data: { email, password } });
  }

  /**
   * Happy path:
   * - Expects 200
   * - Expects token in response body
   */
   async loginOk(email: string, password: string): Promise<LoginResponse> {
    const res = await this.loginRaw(email, password);

    expect(res.status(), "login OK must return 200").toBe(200);

    const body = (await res.json()) as LoginResponse;

    expect(typeof body.token, "token must be a string").toBe("string");
    expect(body.token.length, "token must be non-empty").toBeGreaterThan(0);

    return body;
  }

  /**
   * Negative path (provider-dependent):
   * - Expects any 4xx (avoid brittle exact code assumptions on public APIs)
   * - Expects { error } in body
   *
   * Returns status/body/raw for additional validations from the spec if needed.
   */
  async loginError(
    email?: string,
    password?: string
  ): Promise<{ status: number; body: ErrorResponse; raw: APIResponse }> {
    const res = await this.loginRaw(email, password);
    const status = res.status();

    // Guardrail: should not be success (2xx) nor server-side (5xx).
    expect(status, "login KO must be 4xx (not 2xx/3xx/5xx)").toBeGreaterThanOrEqual(400);
    expect(status, "login KO must be 4xx (not 5xx)").toBeLessThan(500);

    const body = (await res.json()) as ErrorResponse;

    // Contract assertion: error message must exist.
    expect(body.error, "login KO must return error field").toBeTruthy();

    return { status, body, raw: res };
  }
    /**
   * Empty request body (truly empty, not {}).
   * Observed behavior: 400 with { error, message, ... }.
   */
  /**
 * Empty request body (truly empty, not {}).
 * Observed behavior: 400 with { error, message }.
 */
 /**
 * Empty request body (truly empty, not {}).
 *
 * Observed variability:
 * - Postman: 400 + { error: "Empty request body", message: "Request body cannot be empty for JSON endpoints" }
 * - Playwright APIRequestContext: 400 + { error: "Missing email or username" }
 *
 * Enterprise rule: assert status=400 and an error string; if the "Empty request body" branch appears,
 * then assert the message too (exact).
 */
async loginEmptyBody(): Promise<{ status: number; body: any; raw: APIResponse }> {
  // No "data" field at all -> attempt a truly empty body
  const res = await this.api.post("/api/login");

  const status = res.status();
  expect(status, "empty body must be 400").toBe(400);

  const body = await res.json();

  // Always require an error field (string, non-empty)
  expect(typeof body.error, "empty body must return error string").toBe("string");
  expect(String(body.error).length, "empty body error must be non-empty").toBeGreaterThan(0);

  // If ReqRes returns the 'Empty request body' branch, validate message strictly
  if (body.error === "Empty request body") {
    expect(body.message).toBe("Request body cannot be empty for JSON endpoints");
  }

  // If it returns the other branch, accept it (still consistent with 400 + error)
  // e.g. "Missing email or username"
  return { status, body, raw: res };
}


}
