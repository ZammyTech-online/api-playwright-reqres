export async function measure<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now();
  const result = await fn();
  const ms = Date.now() - start;
  return { result, ms };
}
