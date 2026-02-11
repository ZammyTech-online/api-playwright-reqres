import { test, expect } from "../src/fixtures/api";
import { UsersClient } from "../src/clients/users.client";
import { measure } from "../src/utils/timing";

test.describe("Users API", () => {
  /**
   * Scenario 2 — GET /api/users/2
   * 1) verifies response
   * 2) other validations (not found + optional _meta)
   */
  test("E2.1 GET /api/users/2 -> 200 + estructura + contenido específico", async ({ api }) => {
    const users = new UsersClient(api);
    const body = await users.getUser(2);

    // Specific content for id=2 (ReqRes stable dataset)
    expect(body.data.id).toBe(2);
    expect(body.data.email).toBe("janet.weaver@reqres.in");
    expect(body.data.first_name).toBe("Janet");
    expect(body.data.last_name).toBe("Weaver");

    // Optional support: if present, it must be valid
    if (body.support) {
      expect(body.support.url).toBeTruthy();
      expect(body.support.text).toBeTruthy();
    }
  });

  test("E2.3 GET /api/users/13 -> 404 + {}", async ({ api }) => {
    const users = new UsersClient(api);
    await users.getUserNotFound(13);
  });

  test("E2.3 GET /api/users/23 -> 404 + {}", async ({ api }) => {
    const users = new UsersClient(api);
    await users.getUserNotFound(23);
  });

  /**
   * Scenario 3 — POST /api/users
   * 1) valid name+job (201 + echo + id + createdAt)
   * 2) invalid inputs (ReqRes is permissive) -> still 201 with reduced echo
   */
  test("E3.1 POST /api/users (name+job) -> 201 + echo + id + createdAt", async ({ api }) => {
    const users = new UsersClient(api);
    const created = await users.createUserOk("John", "developer");

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBe("John");
    expect(created.job).toBe("developer");
  });

  test("E3.2 POST /api/users missing job -> 201 + name + id + createdAt (sin job)", async ({ api }) => {
    const users = new UsersClient(api);
    const created = await users.createUser({ name: "John" });

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBe("John");
    expect(created.job).toBeUndefined();
  });

  test("E3.3 POST /api/users missing name -> 201 + job + id + createdAt (sin name)", async ({ api }) => {
    const users = new UsersClient(api);
    const created = await users.createUser({ job: "developer" });

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.job).toBe("developer");
    expect(created.name).toBeUndefined();
  });

  test("E3.4 POST /api/users body {} -> 201 + id + createdAt (sin name/job)", async ({ api }) => {
    const users = new UsersClient(api);
    const created = await users.createUser({});

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBeUndefined();
    expect(created.job).toBeUndefined();
  });

  /**
   * The rest are “bonus” / stability checks you already had (kept, but robust).
   */

  test("GET /api/users?page=2 -> per_page/data length + totals accurate", async ({ api }) => {
    const users = new UsersClient(api);
    const { body } = await users.listUsers({ page: 2 });

    expect(body.page).toBe(2);
    expect(body.per_page).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);
    expect(body.data.length).toBeGreaterThan(0);

    expect(body.total_pages, "total_pages must be ceil(total/per_page)").toBe(
      Math.ceil(body.total / body.per_page)
    );

    if (body.page < body.total_pages) {
      expect(body.data.length, "If not last page, data.length should equal per_page").toBe(body.per_page);
    } else {
      expect(body.data.length, "If last page, data.length should be <= per_page").toBeLessThanOrEqual(body.per_page);
    }

    expect(body.total_pages).toBeGreaterThanOrEqual(body.page);
  });

  test("GET /api/users pagination: no solape de usuarios entre page 1 y 2", async ({ api }) => {
    const users = new UsersClient(api);

    const page1 = (await users.listUsers({ page: 1 })).body;
    const page2 = (await users.listUsers({ page: 2 })).body;

    const ids1 = new Set(page1.data.map((u) => u.id));
    const overlap = page2.data.filter((u) => ids1.has(u.id));

    expect(overlap, "No user ids should repeat between page 1 and page 2").toHaveLength(0);
  });

  test("GET /api/users?delay=3 -> 200 + schema + request contiene delay (anti-flaky)", async ({ api }) => {
    const users = new UsersClient(api);

    const { result, ms } = await measure(async () => users.listUsers({ delay: 3 }));
    console.log(`delay request completed in ~${Math.round(ms)}ms`);

    expect(result.res.url(), "Request URL should contain delay=3").toContain("delay=3");
    expect(Array.isArray(result.body.data)).toBeTruthy();

    // support is optional; validate only if present
    if (result.body.support) {
      expect(result.body.support.url).toBeTruthy();
    }
  });

  test("Bonus: chained list -> pick user -> detail consistency", async ({ api }) => {
    const users = new UsersClient(api);

    const list = (await users.listUsers({ page: 2 })).body;
    expect(list.data.length).toBeGreaterThan(0);

    const pick = list.data[0];
    const detail = await users.getUser(pick.id);

    expect(detail.data.id).toBe(pick.id);
    expect(detail.data.email).toBe(pick.email);
    expect(detail.data.first_name).toBe(pick.first_name);
    expect(detail.data.last_name).toBe(pick.last_name);
  });
});
