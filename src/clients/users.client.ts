import { APIRequestContext, expect } from '@playwright/test';
import type { SingleUserResponse, ListUsersResponse, CreateUserRequest, CreateUserResponse } from '../types/reqres';

export class UsersClient {
  constructor(private readonly api: APIRequestContext) {}

  async getUser(id: number) {
    const res = await this.api.get(`/api/users/${id}`);
    return res;
  }

  async getUserOk(id: number): Promise<SingleUserResponse> {
    const res = await this.getUser(id);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as SingleUserResponse;

    expect(body.data).toBeTruthy();
    expect(body.data.id).toBe(id);
    expect(body.data.email).toMatch(/@/);
    expect(body.data.first_name).toBeTruthy();
    expect(body.data.last_name).toBeTruthy();
    expect(body.support?.url).toBeTruthy();
    expect(body.support?.text).toBeTruthy();

    return body;
  }

  async listUsers(page: number, delaySeconds?: number) {
    const params = new URLSearchParams({ page: String(page) });
    if (delaySeconds !== undefined) params.set('delay', String(delaySeconds));
    const res = await this.api.get(`/api/users?${params.toString()}`);
    return res;
  }

  async listUsersOk(page: number, delaySeconds?: number): Promise<ListUsersResponse> {
    const res = await this.listUsers(page, delaySeconds);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as ListUsersResponse;

    expect(body.page).toBe(page);
    expect(body.per_page).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);
    expect(Array.isArray(body.data)).toBe(true);

    return body;
  }

  async createUser(payload: CreateUserRequest) {
    const res = await this.api.post('/api/users', { data: payload });
    return res;
  }

  async createUserOk(payload: CreateUserRequest): Promise<CreateUserResponse> {
    const res = await this.createUser(payload);
    expect(res.status()).toBe(201);
    const body = (await res.json()) as CreateUserResponse;

    expect(body.name).toBe(payload.name);
    expect(body.job).toBe(payload.job);
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();

    return body;
  }
}
