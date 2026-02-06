import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://reqres.in',
    extraHTTPHeaders: {
      // La API de reqres.in (plan con API key) exige x-api-key
      'x-api-key': process.env.X_API_KEY || '',
      'content-type': 'application/json',
      'accept': 'application/json'
    }
  }
});
