import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersResponse,
  SingleUserResponse
} from "../types/reqres";
import { isIsoDate } from "../utils/timing";

/**
 * UsersClient
 * - Encapsulates /api/users endpoints.
 * - Keeps tests readable and reduces duplication.
 */
export class UsersClient {
  constructor(private readonly api: APIRequestContext) {}

  /**
   * Low-level GET /api/users/:id (no assertions).
   */
  async getUserRaw(id: number): Promise<APIResponse> {
    return this.api.get(`/api/users/${id}`);
  }

  /**
   * High-level GET /api/users/:id
   * - Expects 200
   * - Validates stable contract fields (data/support)
   */
  async getUser(id: number): Promise<SingleUserResponse> {
    const res = await this.getUserRaw(id);

    expect(res.status(), "GET /api/users/:id must return 200").toBe(200);

    const body = (await res.json()) as SingleUserResponse;

    // Minimal but meaningful contract checks (avoid overfitting to provider internals)
    expect(body.data, "response must contain data").toBeTruthy();
    expect(body.data.id, "data.id must match requested id").toBe(id);
    expect(body.data.email, "data.email must exist").toBeTruthy();
    expect(body.data.first_name, "data.first_name must exist").toBeTruthy();
    expect(body.data.last_name, "data.last_name must exist").toBeTruthy();
    expect(body.data.avatar, "data.avatar must exist").toBeTruthy();
    expect(body.support?.url, "support.url must exist").toBeTruthy();
    expect(body.support?.text, "support.text must exist").toBeTruthy();

    return body;
  }

  /**
   * Low-level GET /api/users with optional query params.
   * Supports:
   * - page (pagination)
   * - delay (artificial delay scenario)
   */
  async listUsersRaw(params?: { page?: number; delay?: number }): Promise<APIResponse> {
    const query = new URLSearchParams();

    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.delay !== undefined) query.set("delay", String(params.delay));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.api.get(`/api/users${suffix}`);
  }

  /**
   * High-level list users:
   * - Expects 200
   * - Validates stable schema: data[] + support
   * - Optionally validates page echo when requested
   *
   * Returns both body and raw response (URL checks, headers, etc.).
   */
  async listUsers(params?: { page?: number; delay?: number }): Promise<{ body: ListUsersResponse; res: APIResponse }> {
    const res = await this.listUsersRaw(params);

    expect(res.status(), "GET /api/users must return 200").toBe(200);

    const body = (await res.json()) as ListUsersResponse;

    // Contract checks
    expect(Array.isArray(body.data), "data must be an array").toBeTruthy();
    expect(body.support?.url, "support.url must exist").toBeTruthy();
    expect(body.support?.text, "support.text must exist").toBeTruthy();

    // Keep page assertion conditional (avoid brittle assumptions)
    if (params?.page !== undefined) {
      expect(body.page, "page must match requested page").toBe(params.page);
    }

    return { body, res };
  }

  /**
   * Low-level POST /api/users (no assertions).
   * Used for provider-dependent negative cases.
   */
  async createUserRaw(data: CreateUserRequest): Promise<APIResponse> {
    return this.api.post("/api/users", { data });
  }

  /**
   * Valid create user:
   * - Expects 201
   * - Validates id/createdAt and echoes name/job
   */
  async createUserOk(name: string, job: string): Promise<CreateUserResponse> {
    const res = await this.createUserRaw({ name, job });

    expect(res.status(), "POST /api/users valid must return 201").toBe(201);

    const body = (await res.json()) as CreateUserResponse;

    expect(body.id, "response must contain id").toBeTruthy();
    expect(body.createdAt, "response must contain createdAt").toBeTruthy();

    // createdAt format sanity check
    expect(isIsoDate(body.createdAt), "createdAt must be ISO date parseable").toBeTruthy();

    // Echo validation (provider behavior on ReqRes)
    expect(body.name, "response must echo name").toBe(name);
    expect(body.job, "response must echo job").toBe(job);

    return body;
  }
}
