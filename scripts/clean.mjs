import { existsSync, rmSync } from "node:fs";

for (const dir of ["playwright-report", "test-results"]) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}