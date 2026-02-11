import { test, expect } from "../src/fixtures/api";
import { UsersClient } from "../src/clients/users.client";
import { measure } from "../src/utils/timing";

test.describe("Users API", () => {
  test("GET /api/users/2 -> 200 + required fields + support", async ({ api }) => {
    const users = new UsersClient(api);

    // Act: fetch a single known user
    const body = await users.getUser(2);

    // Assert: core content checks + minimal contract checks
    expect(body.data.id).toBe(2);
    expect(body.data.email).toContain("@");
    expect(body.support.url).toBeTruthy();
    expect(body.support.text).toBeTruthy();
  });

  test("POST /api/users -> 201 + id + createdAt (valid)", async ({ api }) => {
    const users = new UsersClient(api);

    // Act: create a valid user
    const created = await users.createUserOk("John", "developer");

    // Assert: required fields for a successful creation
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBe("John");
    expect(created.job).toBe("developer");
  });

  test("POST /api/users -> invalid inputs (no 5xx; validar por rama 201 o 4xx)", async ({ api }) => {
    const users = new UsersClient(api);

    // Provider-dependent behavior: some public APIs may still return 201 for odd payloads.
    // Goal: ensure it never returns 5xx, and validate by branch (201 vs 4xx).
    const cases = [
      { name: "missing name", payload: { job: "dev" } },
      { name: "missing job", payload: { name: "John" } },
      { name: "empty strings", payload: { name: "", job: "" } },
      { name: "nulls", payload: { name: null, job: null } as any },
      { name: "unexpected fields", payload: { name: "John", job: "dev", extra: 123 } },
    ];

    for (const c of cases) {
      const res = await users.createUserRaw(c.payload as any);
      const status = res.status();

      // Guardrails: must be a valid HTTP status and never 5xx for invalid inputs
      expect(status, `${c.name} status`).toBeGreaterThanOrEqual(200);
      expect(status, `${c.name} status`).toBeLessThan(600);
      expect(status, `${c.name} no 5xx`).toBeLessThan(500);

      const body = await res.json();

      if (status === 201) {
        // If provider accepts it, validate the success contract fields
        expect(body.id, `${c.name} id`).toBeTruthy();
        expect(body.createdAt, `${c.name} createdAt`).toBeTruthy();
      } else {
        // If provider rejects it, ensure there is an error signal (shape may vary)
        expect(body.error || body.message, `${c.name} error/message`).toBeTruthy();
      }
    }
  });

  test("GET /api/users?page=2 -> per_page/data length + totals accurate", async ({ api }) => {
    const users = new UsersClient(api);

    // Act: list page 2
    const { body } = await users.listUsers({ page: 2 });

    // Assert: base pagination fields exist and make sense
    expect(body.page).toBe(2);
    expect(body.per_page).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);
    expect(body.data.length).toBeGreaterThan(0);

    // Typical trap: validate that total_pages is mathematically consistent
    expect(body.total_pages, "total_pages must be ceil(total/per_page)").toBe(
      Math.ceil(body.total / body.per_page)
    );

    // “Correct number of users” without fragile assumptions:
    // - If not last page -> length must equal per_page
    // - If last page -> length must be <= per_page
    if (body.page < body.total_pages) {
      expect(body.data.length, "If not last page, data.length should equal per_page").toBe(body.per_page);
    } else {
      expect(body.data.length, "If last page, data.length should be <= per_page").toBeLessThanOrEqual(body.per_page);
    }

    // Minimal coherence check
    expect(body.total_pages).toBeGreaterThanOrEqual(body.page);
  });

  test("GET /api/users pagination: no solape de usuarios entre page 1 y 2", async ({ api }) => {
    const users = new UsersClient(api);

    // Act: fetch two pages and ensure no duplicated users between them
    const page1 = (await users.listUsers({ page: 1 })).body;
    const page2 = (await users.listUsers({ page: 2 })).body;

    const ids1 = new Set(page1.data.map((u) => u.id));
    const overlap = page2.data.filter((u) => ids1.has(u.id));

    // Assert: pages should not overlap in user ids
    expect(overlap, "No user ids should repeat between page 1 and page 2").toHaveLength(0);
  });

  test("GET /api/users?delay=3 -> 200 + schema + request contiene delay (anti-flaky)", async ({ api }) => {
    const users = new UsersClient(api);

    // Measure for observability only (public API timing can vary due to cache/CDN)
    const { result, ms } = await measure(async () => {
      return users.listUsers({ delay: 3 });
    });

    // Log timing but do not assert on it
    console.log(`delay request completed in ~${Math.round(ms)}ms`);

    // Assert: URL includes delay param and response has stable fields
    expect(result.res.url(), "Request URL should contain delay=3").toContain("delay=3");
    expect(Array.isArray(result.body.data)).toBeTruthy();
    expect(result.body.support.url).toBeTruthy();
  });

  test("Bonus 1: chained list -> pick user -> detail consistency", async ({ api }) => {
    const users = new UsersClient(api);

    // Act: list users, pick one, then fetch details for the same id
    const list = (await users.listUsers({ page: 2 })).body;
    expect(list.data.length).toBeGreaterThan(0);

    const pick = list.data[0];
    const detail = await users.getUser(pick.id);

    // Assert: selected list item matches the detail response
    expect(detail.data.id).toBe(pick.id);
    expect(detail.data.email).toBe(pick.email);
    expect(detail.data.first_name).toBe(pick.first_name);
    expect(detail.data.last_name).toBe(pick.last_name);
  });
});
