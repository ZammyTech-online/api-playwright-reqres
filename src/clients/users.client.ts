import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersResponse,
  SingleUserResponse
} from "../types/reqres";
import { isIsoDate } from "../utils/timing";

export class UsersClient {
  constructor(private readonly api: APIRequestContext) {}

  async getUserRaw(id: number): Promise<APIResponse> {
    return this.api.get(`/api/users/${id}`);
  }

  async getUser(id: number): Promise<SingleUserResponse> {
    const res = await this.getUserRaw(id);
    expect(res.status(), "GET /api/users/:id debe devolver 200").toBe(200);

    const body = (await res.json()) as SingleUserResponse;
    expect(body.data, "Debe existir data").toBeTruthy();
    expect(body.data.id, "Debe devolver id").toBe(id);
    expect(body.data.email, "Debe devolver email").toBeTruthy();
    expect(body.data.first_name, "Debe devolver first_name").toBeTruthy();
    expect(body.data.last_name, "Debe devolver last_name").toBeTruthy();
    expect(body.data.avatar, "Debe devolver avatar").toBeTruthy();
    expect(body.support?.url, "Debe devolver support.url").toBeTruthy();
    expect(body.support?.text, "Debe devolver support.text").toBeTruthy();

    return body;
  }

  async listUsersRaw(params?: { page?: number; delay?: number }): Promise<APIResponse> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.delay !== undefined) query.set("delay", String(params.delay));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.api.get(`/api/users${suffix}`);
  }

  async listUsers(params?: { page?: number; delay?: number }): Promise<{ body: ListUsersResponse; res: APIResponse }> {
    const res = await this.listUsersRaw(params);
    expect(res.status(), "GET /api/users debe devolver 200").toBe(200);

    const body = (await res.json()) as ListUsersResponse;
    expect(Array.isArray(body.data), "data debe ser array").toBeTruthy();
    expect(body.support?.url, "support.url debe existir").toBeTruthy();
    expect(body.support?.text, "support.text debe existir").toBeTruthy();

    if (params?.page !== undefined) {
      expect(body.page, "page debe coincidir").toBe(params.page);
    }

    return { body, res };
  }

  async createUserRaw(data: CreateUserRequest): Promise<APIResponse> {
    return this.api.post("/api/users", { data });
  }

  async createUserOk(name: string, job: string): Promise<CreateUserResponse> {
    const res = await this.createUserRaw({ name, job });
    expect(res.status(), "POST /api/users válido debe devolver 201").toBe(201);

    const body = (await res.json()) as CreateUserResponse;
    expect(body.id, "Debe devolver id").toBeTruthy();
    expect(body.createdAt, "Debe devolver createdAt").toBeTruthy();
    expect(isIsoDate(body.createdAt), "createdAt debe ser ISO date parseable").toBeTruthy();
    expect(body.name, "Debe eco de name").toBe(name);
    expect(body.job, "Debe eco de job").toBe(job);

    return body;
  }
}
