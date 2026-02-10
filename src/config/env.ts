import * as dotenv from "dotenv";

dotenv.config();

export type EnvConfig = Readonly<{
  baseURL: string;
  apiKey: string;
}>;

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" ? v : undefined;
}

function requireEnv(name: string): string {
  const v = getEnv(name)?.trim();
  if (!v) {
    throw new Error(
      `Falta ${name}. Crea .env desde .env.example y define ${name}. ` +
        `No se debe hardcodear en el repo.`
    );
  }
  return v;
}

export function loadEnvConfig(): EnvConfig {
  const baseURL = (getEnv("BASE_URL") ?? "https://reqres.in").trim();
  const apiKey = requireEnv("X_API_KEY");

  if (!/^https?:\/\//i.test(baseURL)) {
    throw new Error(`BASE_URL inválida: "${baseURL}". Debe comenzar por http(s)://`);
  }

  return Object.freeze({ baseURL, apiKey });
}
