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

    // Strong assertion: valid credentials must produce 200.
    expect(res.status(), "login OK must return 200").toBe(200);

    const body = (await res.json()) as LoginResponse;

    // Contract assertion: token must exist and be non-empty.
    expect(body.token, "login OK must return token").toBeTruthy();
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
}
