import { test, expect } from '../src/fixtures/api';
import { AuthClient } from '../src/clients/auth.client';

test.describe('Auth /api/login', () => {
  test('Login OK: devuelve token', async ({ api }) => {
    const auth = new AuthClient(api);
    const body = await auth.loginOk('eve.holt@reqres.in', 'cityslicka');
    expect(body.token).toBeTruthy();
  });

  test('Login KO: password missing', async ({ api }) => {
    const auth = new AuthClient(api);
    const body = await auth.loginError('peter@klaven', undefined);
    expect(body.error.toLowerCase()).toContain('password');
  });

  test('Login KO: email missing', async ({ api }) => {
    const auth = new AuthClient(api);
    const body = await auth.loginError(undefined, 'whatever');
    // ReqRes suele responder "Missing email or username"
    expect(body.error.toLowerCase()).toContain('email');
  });
});
