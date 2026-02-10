import { existsSync, rmSync } from "node:fs";

// Cross-platform cleanup: remove Playwright artifacts without relying on shell-specific commands.
// Kept intentionally small and dependency-free.
for (const dir of ["playwright-report", "test-results"]) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}
