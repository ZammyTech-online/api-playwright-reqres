import * as dotenv from "dotenv";

/**
 * Load .env into process.env for local runs.
 * In CI, values should come from GitHub Actions Secrets (env vars).
 */
dotenv.config();

export type EnvConfig = Readonly<{
  baseURL: string;
  apiKey: string;
}>;

/**
 * Safe getter:
 * - Returns undefined if missing
 * - Keeps type narrow and avoids accidental non-string usage
 */
function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" ? v : undefined;
}

/**
 * Required env var:
 * - Trims whitespace
 * - Throws a clear error message if missing
 */
function requireEnv(name: string): string {
  const v = getEnv(name)?.trim();
  if (!v) {
    throw new Error(
      `Missing ${name}. Create .env from .env.example and set ${name}. ` +
        `Do not hardcode secrets into the repository.`
    );
  }
  return v;
}

/**
 * Loads and validates runtime configuration.
 * - BASE_URL defaults to ReqRes (stable for this assignment)
 * - X_API_KEY is mandatory (ReqRes requires it)
 */
export function loadEnvConfig(): EnvConfig {
  const baseURL = (getEnv("BASE_URL") ?? "https://reqres.in").trim();
  const apiKey = requireEnv("X_API_KEY");

  // Basic URL validation to fail fast with a clear message
  if (!/^https?:\/\//i.test(baseURL)) {
    throw new Error(`Invalid BASE_URL: "${baseURL}". Must start with http(s)://`);
  }

  return Object.freeze({ baseURL, apiKey });
}
