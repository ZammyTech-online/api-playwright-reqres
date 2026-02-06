import { APIRequestContext, expect } from '@playwright/test';
import type { LoginResponse, ErrorResponse } from '../types/reqres';

export class AuthClient {
  constructor(private readonly api: APIRequestContext) {}

  async login(email: string, password: string) {
    const res = await this.api.post('/api/login', { data: { email, password } });
    return res;
  }

  async loginOk(email: string, password: string): Promise<LoginResponse> {
    const res = await this.login(email, password);
    expect(res.status(), 'login OK debe devolver 200').toBe(200);
    const body = (await res.json()) as LoginResponse;
    expect(body.token, 'Debe devolver token').toBeTruthy();
    return body;
  }

  async loginError(email?: string, password?: string): Promise<ErrorResponse> {
    const res = await this.api.post('/api/login', { data: { email, password } });
    expect(res.status(), 'login KO debe devolver 400').toBe(400);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error, 'Debe devolver error').toBeTruthy();
    return body;
  }
}
