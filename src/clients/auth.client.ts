import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import type { ErrorResponse, LoginResponse } from "../types/reqres";

export class AuthClient {
  constructor(private readonly api: APIRequestContext) {}

  async loginRaw(email?: string, password?: string): Promise<APIResponse> {
    return this.api.post("/api/login", { data: { email, password } });
  }

  async loginOk(email: string, password: string): Promise<LoginResponse> {
    const res = await this.loginRaw(email, password);
    expect(res.status(), "login OK debe devolver 200").toBe(200);

    const body = (await res.json()) as LoginResponse;
    expect(body.token, "Debe devolver token").toBeTruthy();
    return body;
  }

  async loginError(
    email?: string,
    password?: string
  ): Promise<{ status: number; body: ErrorResponse; raw: APIResponse }> {
    const res = await this.loginRaw(email, password);
    const status = res.status();

    expect(status, "login KO debe devolver 4xx (no 2xx/3xx/5xx)").toBeGreaterThanOrEqual(400);
    expect(status, "login KO debe devolver 4xx (no 5xx)").toBeLessThan(500);

    const body = (await res.json()) as ErrorResponse;
    expect(body.error, "Debe devolver campo error").toBeTruthy();

    return { status, body, raw: res };
  }
}
