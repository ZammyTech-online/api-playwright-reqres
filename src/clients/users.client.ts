import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersResponse,
  SingleUserResponse,
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
   * - Validates stable contract fields: data
   * - Treats support/_meta as optional (provider may vary)
   */
  async getUser(id: number): Promise<SingleUserResponse> {
    const res = await this.getUserRaw(id);
    expect(res.status(), "GET /api/users/:id must return 200").toBe(200);

    const body = (await res.json()) as SingleUserResponse;

    // Stable contract: data
    expect(body.data, "response must contain data").toBeTruthy();
    expect(body.data.id, "data.id must match requested id").toBe(id);

    // Basic type sanity (avoid overfitting)
    expect(typeof body.data.email, "data.email must be string").toBe("string");
    expect(typeof body.data.first_name, "data.first_name must be string").toBe("string");
    expect(typeof body.data.last_name, "data.last_name must be string").toBe("string");
    expect(typeof body.data.avatar, "data.avatar must be string").toBe("string");

    // Optional support (seen in ReqRes, but do not make required)
    if (body.support) {
      expect(typeof body.support.url, "support.url must be string").toBe("string");
      expect(typeof body.support.text, "support.text must be string").toBe("string");
      expect(body.support.url.length, "support.url must be non-empty").toBeGreaterThan(0);
      expect(body.support.text.length, "support.text must be non-empty").toBeGreaterThan(0);
    }

    // Optional _meta (observed in /users/2 only sometimes)
    if ((body as any)._meta !== undefined) {
      expect(typeof (body as any)._meta, "_meta must be object when present").toBe("object");
    }

    return body;
  }

  /**
   * GET /api/users/:id Not Found
   * - Expects 404
   * - ReqRes returns {} (per your evidence)
   */
  async getUserNotFound(id: number): Promise<void> {
    const res = await this.getUserRaw(id);
    expect(res.status(), "GET /api/users/:id must return 404 for missing user").toBe(404);

    const text = (await res.text()).trim();
    expect(text, "404 body must be {}").toBe("{}");
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
   * - Validates stable schema: data[] (+ pagination fields)
   * - Treat support as optional (robust)
   */
  async listUsers(params?: {
    page?: number;
    delay?: number;
  }): Promise<{ body: ListUsersResponse; res: APIResponse }> {
    const res = await this.listUsersRaw(params);
    expect(res.status(), "GET /api/users must return 200").toBe(200);

    const body = (await res.json()) as ListUsersResponse;

    // Stable contract
    expect(Array.isArray(body.data), "data must be an array").toBeTruthy();

    // Optional support
    if (body.support) {
      expect(typeof body.support.url).toBe("string");
      expect(typeof body.support.text).toBe("string");
    }

    // Conditional page echo
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
   * Create user (ReqRes is permissive):
   * - Always expects 201 for JSON payloads (per your evidence)
   * - Validates stable fields: id + createdAt
   * - Validates echo only when fields exist in request
   */
  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const res = await this.createUserRaw(data);
    expect(res.status(), "POST /api/users must return 201 (ReqRes behavior)").toBe(201);

    const body = (await res.json()) as CreateUserResponse;

    expect(body.id, "response must contain id").toBeTruthy();
    expect(typeof body.id, "id must be string").toBe("string");

    expect(body.createdAt, "response must contain createdAt").toBeTruthy();
    expect(typeof body.createdAt, "createdAt must be string").toBe("string");
    expect(isIsoDate(body.createdAt), "createdAt must be ISO date parseable").toBeTruthy();

    // Echo rules (observed behavior)
    if (data.name !== undefined) {
      expect(body.name, "response must echo name when sent").toBe(data.name);
    } else {
      expect(body.name, "response must not include name when not sent").toBeUndefined();
    }

    if (data.job !== undefined) {
      expect(body.job, "response must echo job when sent").toBe(data.job);
    } else {
      expect(body.job, "response must not include job when not sent").toBeUndefined();
    }

    return body;
  }

  /**
   * Convenience for the happy-path signature from the statement.
   */
  async createUserOk(name: string, job: string): Promise<CreateUserResponse> {
    return this.createUser({ name, job });
  }
}
