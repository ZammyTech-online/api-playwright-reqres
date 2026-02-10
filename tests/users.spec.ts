import { test, expect } from "../src/fixtures/api";
import { UsersClient } from "../src/clients/users.client";
import { measure } from "../src/utils/timing";

test.describe("Users API", () => {
  test("GET /api/users/2 -> 200 + required fields + support", async ({ api }) => {
    const users = new UsersClient(api);
    const body = await users.getUser(2);

    expect(body.data.id).toBe(2);
    expect(body.data.email).toContain("@");
    expect(body.support.url).toBeTruthy();
    expect(body.support.text).toBeTruthy();
  });

  test("POST /api/users -> 201 + id + createdAt (valid)", async ({ api }) => {
    const users = new UsersClient(api);
    const created = await users.createUserOk("John", "developer");

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBe("John");
    expect(created.job).toBe("developer");
  });

  test("POST /api/users -> invalid inputs (no 5xx; validar por rama 201 o 4xx)", async ({ api }) => {
    const users = new UsersClient(api);

    const cases = [
      { name: "missing name", payload: { job: "dev" } },
      { name: "missing job", payload: { name: "John" } },
      { name: "empty strings", payload: { name: "", job: "" } },
      { name: "nulls", payload: { name: null, job: null } as any },
      { name: "unexpected fields", payload: { name: "John", job: "dev", extra: 123 } }
    ];

    for (const c of cases) {
      const res = await users.createUserRaw(c.payload as any);
      const status = res.status();

      expect(status, `${c.name} status`).toBeGreaterThanOrEqual(200);
      expect(status, `${c.name} status`).toBeLessThan(600);
      expect(status, `${c.name} no 5xx`).toBeLessThan(500);

      const body = await res.json();

      if (status === 201) {
        expect(body.id, `${c.name} id`).toBeTruthy();
        expect(body.createdAt, `${c.name} createdAt`).toBeTruthy();
      } else {
        // provider-dependent: 4xx con {error} o {message}
        expect(body.error || body.message, `${c.name} error/message`).toBeTruthy();
      }
    }
  });

  test("GET /api/users?page=2 -> per_page/data length + totals accurate", async ({ api }) => {
    const users = new UsersClient(api);
    const { body } = await users.listUsers({ page: 2 });

    // Campos base
    expect(body.page).toBe(2);
    expect(body.per_page).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);
    expect(body.data.length).toBeGreaterThan(0);

    // Trampa típica: totals "accurate"
    expect(
      body.total_pages,
      "total_pages debe ser ceil(total/per_page)"
    ).toBe(Math.ceil(body.total / body.per_page));

    // "Correct number of users" sin suposiciones frágiles:
    // - Si NO es última página -> data.length debe ser per_page
    // - Si es última página -> data.length <= per_page
    if (body.page < body.total_pages) {
      expect(body.data.length, "Si no es última página, data.length debe ser per_page").toBe(body.per_page);
    } else {
      expect(body.data.length, "Si es última página, data.length <= per_page").toBeLessThanOrEqual(body.per_page);
    }

    // coherencia mínima
    expect(body.total_pages).toBeGreaterThanOrEqual(body.page);
  });

  test("GET /api/users pagination: no solape de usuarios entre page 1 y 2", async ({ api }) => {
    const users = new UsersClient(api);
    const page1 = (await users.listUsers({ page: 1 })).body;
    const page2 = (await users.listUsers({ page: 2 })).body;

    const ids1 = new Set(page1.data.map((u) => u.id));
    const overlap = page2.data.filter((u) => ids1.has(u.id));

    expect(overlap, "No debe haber usuarios repetidos entre page 1 y page 2").toHaveLength(0);
  });

  test("GET /api/users?delay=3 -> 200 + schema + request contiene delay (anti-flaky)", async ({ api }) => {
    const users = new UsersClient(api);

    const { result, ms } = await measure(async () => {
      return users.listUsers({ delay: 3 });
    });

    // Observabilidad (NO assert por tiempo)
    console.log(`delay request completed in ~${Math.round(ms)}ms`);

    expect(result.res.url(), "La URL debe contener delay=3").toContain("delay=3");
    expect(Array.isArray(result.body.data)).toBeTruthy();
    expect(result.body.support.url).toBeTruthy();
  });

  test("Bonus 1: chained list -> pick user -> detail consistency", async ({ api }) => {
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
