import { performance } from "node:perf_hooks";

// Measures async execution time for observability/debugging (NOT used for assertions)
export async function measure<T>(
  fn: () => Promise<T>
): Promise<{ result: T; ms: number }> {
  const t0 = performance.now();
  const result = await fn();
  const ms = performance.now() - t0;
  return { result, ms };
}

// Lightweight ISO date validation: checks if Date parsing results in a valid timestamp
export function isIsoDate(value: string): boolean {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}
