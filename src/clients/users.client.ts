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

    expect(body.data, "response must contain data").toBeTruthy();
    expect(body.data.id, "data.id must match requested id").toBe(id);

    expect(typeof body.data.email, "data.email must be string").toBe("string");
    expect(body.data.email.length, "data.email must be non-empty").toBeGreaterThan(0);

    expect(typeof body.data.first_name, "data.first_name must be string").toBe("string");
    expect(body.data.first_name.length, "data.first_name must be non-empty").toBeGreaterThan(0);

    expect(typeof body.data.last_name, "data.last_name must be string").toBe("string");
    expect(body.data.last_name.length, "data.last_name must be non-empty").toBeGreaterThan(0);

    expect(typeof body.data.avatar, "data.avatar must be string").toBe("string");
    expect(body.data.avatar.length, "data.avatar must be non-empty").toBeGreaterThan(0);

    // ✅ TS-safe narrowing: expect + local const with !
    expect(body.support, "response must contain support").toBeTruthy();
    const support = body.support!;
    expect(typeof support.url, "support.url must be string").toBe("string");
    expect(support.url.length, "support.url must be non-empty").toBeGreaterThan(0);

    expect(typeof support.text, "support.text must be string").toBe("string");
    expect(support.text.length, "support.text must be non-empty").toBeGreaterThan(0);

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
  async listUsers(
    params?: { page?: number; delay?: number }
  ): Promise<{ body: ListUsersResponse; res: APIResponse }> {
    const res = await this.listUsersRaw(params);
    expect(res.status(), "GET /api/users must return 200").toBe(200);

    const body = (await res.json()) as ListUsersResponse;

    expect(Array.isArray(body.data), "data must be an array").toBeTruthy();

    // ✅ TS-safe narrowing
    expect(body.support, "response must contain support").toBeTruthy();
    const support = body.support!;
    expect(typeof support.url, "support.url must be string").toBe("string");
    expect(support.url.length, "support.url must be non-empty").toBeGreaterThan(0);

    expect(typeof support.text, "support.text must be string").toBe("string");
    expect(support.text.length, "support.text must be non-empty").toBeGreaterThan(0);

    if (params?.page !== undefined) {
      expect(body.page, "page must match requested page").toBe(params.page);
    }

    return { body, res };
  }

  /**
   * Low-level POST /api/users (no assertions).
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
    expect(typeof body.id, "id must be string").toBe("string");

    expect(body.createdAt, "response must contain createdAt").toBeTruthy();
    expect(typeof body.createdAt, "createdAt must be string").toBe("string");
    expect(isIsoDate(body.createdAt), "createdAt must be ISO date parseable").toBeTruthy();

    expect(body.name, "response must echo name").toBe(name);
    expect(body.job, "response must echo job").toBe(job);

    return body;
  }
}
