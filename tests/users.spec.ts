import { test, expect } from '../src/fixtures/api';
import { UsersClient } from '../src/clients/users.client';
import { measure } from '../src/utils/timing';

test.describe('Users API', () => {
  test('GET /api/users/2 devuelve datos consistentes', async ({ api }) => {
    const users = new UsersClient(api);
    const body = await users.getUserOk(2);
    expect(body.data.id).toBe(2);
  });

  test('POST /api/users crea usuario y devuelve 201', async ({ api }) => {
    const users = new UsersClient(api);
    const body = await users.createUserOk({ name: 'Raul', job: 'QA Automation' });
    expect(body.id).toBeTruthy();
  });

  test('GET /api/users paginación: no solape de usuarios entre page 1 y 2', async ({ api }) => {
    const users = new UsersClient(api);
    const p1 = await users.listUsersOk(1);
    const p2 = await users.listUsersOk(2);

    const ids1 = new Set(p1.data.map(u => u.id));
    const overlap = p2.data.some(u => ids1.has(u.id));
    expect(overlap, 'No debe haber IDs solapados entre page 1 y 2').toBe(false);

    // coherencia: total y total_pages
    expect(p1.total).toBe(p2.total);
    expect(p1.total_pages).toBe(p2.total_pages);
  });

  test('GET /api/users?delay=3 respeta delay (con tolerancia)', async ({ api }) => {
    const users = new UsersClient(api);
    const { result: res, ms } = await measure(async () => users.listUsers(1, 3));
    expect(res.status()).toBe(200);

    // Tolerancia para evitar flaky en CI (por ejemplo -400ms)
    expect(ms, `Duración (${ms}ms) debería ser ~>= 2600ms para delay=3`).toBeGreaterThanOrEqual(2600);
  });

  test('Chained request: listar usuarios y consultar detalle del primer id', async ({ api }) => {
    const users = new UsersClient(api);
    const list = await users.listUsersOk(1);
    expect(list.data.length).toBeGreaterThan(0);

    const firstId = list.data[0]!.id;
    const detail = await users.getUserOk(firstId);
    expect(detail.data.id).toBe(firstId);
  });
});
