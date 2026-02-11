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
   * Negative path (missing fields):
   * - Expects 4xx
   * - Expects { error } in body
   */
  async loginError(
    email?: string,
    password?: string
  ): Promise<{ status: number; body: ErrorResponse; raw: APIResponse }> {
    const res = await this.loginRaw(email, password);
    const status = res.status();

    expect(status, "login KO must be 4xx").toBeGreaterThanOrEqual(400);
    expect(status, "login KO must be < 500").toBeLessThan(500);

    const body = (await res.json()) as ErrorResponse;
    expect(typeof body.error, "login KO must return error string").toBe("string");
    expect(body.error.length, "login KO error must be non-empty").toBeGreaterThan(0);

    return { status, body, raw: res };
  }

  /**
   * Empty request body (truly empty, not {}).
   *
   * Confirmed behavior differs by client:
   * - Postman (empty body): 400 + { error: "Empty request body", message: "Request body cannot be empty for JSON endpoints" }
   * - Playwright APIRequestContext (no data): 400 + { error: "Missing email or username" } (observed)
   *
   * Enterprise approach:
   * - Assert 400 + error string (stable)
   * - If the "Empty request body" branch appears, assert message exact (strict, but conditional)
   */
  async loginEmptyBody(): Promise<{ status: number; body: ErrorResponse & { message?: string }; raw: APIResponse }> {
    // IMPORTANT: do not send "data" or "{}" to attempt a truly empty body
    const res = await this.api.post("/api/login");

    const status = res.status();
    expect(status, "empty body must be 400").toBe(400);

    const body = (await res.json()) as ErrorResponse & { message?: string };

    expect(typeof body.error, "empty body must return error string").toBe("string");
    expect(body.error.length, "empty body error must be non-empty").toBeGreaterThan(0);

    // Strict only when that branch appears
    if (body.error === "Empty request body") {
      expect(body.message).toBe("Request body cannot be empty for JSON endpoints");
    }

    return { status, body, raw: res };
  }
}
