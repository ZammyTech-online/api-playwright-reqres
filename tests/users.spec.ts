// tests/users.spec.ts
import { test, expect } from "../src/fixtures/api";
import { UsersClient } from "../src/clients/users.client";
import { measure } from "../src/utils/timing";

test.describe("Users API", () => {
  // Scenario 2 — GET /api/users/2
  test("Scenario 2 — S2.1 GET /api/users/2 — 200 OK + validate response contract and specific user data", async ({ api }) => {
    const users = new UsersClient(api);

    const body = await users.getUser(2);

    expect(body.data.id).toBe(2);
    expect(body.data.email).toContain("@");

    expect(body.support, "response must contain support").toBeTruthy();
    const support = body.support!;
    expect(typeof support.url, "support.url must be string").toBe("string");
    expect(support.url.length, "support.url must be non-empty").toBeGreaterThan(0);
    expect(typeof support.text, "support.text must be string").toBe("string");
    expect(support.text.length, "support.text must be non-empty").toBeGreaterThan(0);
  });

  // Scenario 2 — Not Found evidence
  test("Scenario 2 — S2.2 GET /api/users/13 — 404 Not Found returns empty body {}", async ({ api }) => {
    const users = new UsersClient(api);

    const res = await users.getUserRaw(13);
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body).toEqual({});
  });

  test("Scenario 2 — S2.3 GET /api/users/23 — 404 Not Found returns empty body {}", async ({ api }) => {
    const users = new UsersClient(api);

    const res = await users.getUserRaw(23);
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body).toEqual({});
  });

  // Scenario 3 — POST /api/users
  test("Scenario 3 — S3.1 POST /api/users — 201 Created + validate id, createdAt and echoed fields", async ({ api }) => {
    const users = new UsersClient(api);

    const created = await users.createUserOk("John", "developer");

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBe("John");
    expect(created.job).toBe("developer");
  });

  test("Scenario 3 — S3.2 POST /api/users missing job — 201 Created + validate permissive behavior", async ({ api }) => {
    const users = new UsersClient(api);

    const res = await users.createUserRaw({ name: "John" });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.name).toBe("John");
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.job).toBeUndefined();
  });

  test("Scenario 3 — S3.3 POST /api/users missing name — 201 Created + validate permissive behavior", async ({ api }) => {
    const users = new UsersClient(api);

    const res = await users.createUserRaw({ job: "developer" });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.job).toBe("developer");
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.name).toBeUndefined();
  });

  test("Scenario 3 — S3.4 POST /api/users empty body {} — 201 Created + validate id and createdAt only", async ({ api }) => {
    const users = new UsersClient(api);

    const res = await users.createUserRaw({});
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
    expect(body.name).toBeUndefined();
    expect(body.job).toBeUndefined();
  });

  // Scenario 4 — Pagination
  test("Scenario 4 — S4.1 GET /api/users?page=2 — validate pagination metadata and data consistency", async ({ api }) => {
    const users = new UsersClient(api);

    const { body } = await users.listUsers({ page: 2 });

    expect(body.page).toBe(2);
    expect(body.per_page).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);

    expect(body.data.length).toBeGreaterThan(0);
    if (body.page < body.total_pages) {
      expect(body.data.length).toBe(body.per_page);
    } else {
      expect(body.data.length).toBeLessThanOrEqual(body.per_page);
    }

    expect(body.total_pages).toBe(Math.ceil(body.total / body.per_page));

    expect(body.support, "response must contain support").toBeTruthy();
    const support = body.support!;
    expect(support.url).toBeTruthy();
    expect(support.text).toBeTruthy();
  });

  test("Scenario 4 — S4.2 GET /api/users page 1 vs page 2 — ensure users are unique across pages", async ({ api }) => {
    const users = new UsersClient(api);

    const page1 = (await users.listUsers({ page: 1 })).body;
    const page2 = (await users.listUsers({ page: 2 })).body;

    const ids1 = new Set(page1.data.map((u) => u.id));
    const overlap = page2.data.filter((u) => ids1.has(u.id));

    expect(overlap).toHaveLength(0);
  });

  // Scenario 5 — Delay
  test("Scenario 5 — GET /api/users?delay=3 — 200 OK + validate response contract without time-based assertions", async ({ api }) => {
    const users = new UsersClient(api);

    const { result, ms } = await measure(async () => users.listUsers({ delay: 3 }));
    console.log(`delay request completed in ~${Math.round(ms)}ms`);

    expect(result.res.url()).toContain("delay=3");
    expect(Array.isArray(result.body.data)).toBeTruthy();

    expect(result.body.support, "response must contain support").toBeTruthy();
    const support = result.body.support!;
    expect(support.url).toBeTruthy();
  });

  // Bonus
  // Bonus: list -> details (validate data integrity for ALL users in the page)
test("Bonus: chained list -> pick user -> detail consistency", async ({ api }) => {
  const users = new UsersClient(api);

  const list = (await users.listUsers({ page: 2 })).body;
  expect(list.data.length).toBeGreaterThan(0);

  const pick = list.data[0];

  // LOG de trazabilidad (no assertion)
  console.log(`Picked user from list: page=${list.page}, id=${pick.id}`);

  const detail = await users.getUser(pick.id);

  expect(detail.data.id).toBe(pick.id);
  expect(detail.data.email).toBe(pick.email);
  expect(detail.data.first_name).toBe(pick.first_name);
  expect(detail.data.last_name).toBe(pick.last_name);

  // EXTRA: avatar coherente (si viene en list, en ReqRes viene)
  expect(detail.data.avatar).toBe(pick.avatar);
});

});
