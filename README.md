## Known limitation: ReqRes `/api/login` is not a real auth system

ReqRes is a demo/teaching API (mock backend). During the implementation of this technical assignment, we observed that the `/api/login` endpoint (does not validate credential correctness)

## Observed behavior (project execution):
- If the request contains **both** `email` and `password` fields, the API responds with **HTTP 200** and returns a `token`, even when the credentials are not “real”.
- Therefore, “negative login” validations are effectively limited to **missing required fields** (e.g., missing `email`, missing `password`, or both), which return an error response.

## Why this matters for the assignment:
- The assignment requests testing *valid* and *invalid* credentials, but ReqRes does not provide a reliable server-side behavior to assert “invalid credentials” as a rejection (e.g., 401/403).
- This suite covers the negative space that ReqRes actually enforces: required-field validation and response contract assertions.



# Technical Assignment €” API Testing (ReqRes) with Playwright + TypeScript

API automation suite for ReqRes using Playwright Test + TypeScript. Focused on clean code, maintainability, stable assertions (anti-flaky), and environment-based configuration (no hardcoded secrets).

## Requirements

- Node.js 18+ (20+ recommended)
- npm

## Project Structure

- `src/config/` €” environment loading + validation (BASE_URL, X_API_KEY)
- `src/fixtures/` €” Playwright fixtures (APIRequestContext with baseURL + headers)
- `src/clients/` €” API clients (AuthClient, UsersClient) to centralize request logic
- `src/types/` €” TypeScript types for ReqRes contracts and Evidence
- `src/utils/` €” utilities (timing/measurement used for observability only)
- `tests/` €” spec files aligned with the assignment scenarios

## Design Notes (Clean Code & Maintainability)

- Configuration is environment-driven: `BASE_URL` and `X_API_KEY` are read from `.env` locally or CI secrets. No secrets are hardcoded or committed (`.env` is git-ignored; `.env.example` contains placeholders only).
- A single API fixture (`src/fixtures/api.ts`) centralizes `baseURL` and common headers (including `x-api-key`) so tests stay consistent and avoid duplication.
- Request logic is encapsulated in small API clients (`src/clients/*`) to keep specs readable and to isolate endpoint changes from tests.
- Assertions focus on stable contracts and required fields; the `delay` scenario avoids strict time-based checks to prevent flakiness on a public API (CDN/cache variability).
- A CI-safe mode (`npm run test:ci`) is provided to reduce parallelism and mitigate public API rate limits; `npm run verify` runs typecheck + CI-safe tests for reproducible validation.
- Playwright HTML reporting is generated for submission (`playwright-report/`) as required by the assignment.

## Setup

1) Install dependencies:

- `npm install`
- `npx playwright install`

2) Environment variables (no hardcoded secrets)

**Important (per assignment):** the `x-api-key` header is required for requests to work.  
This project injects it automatically via the API fixture (`src/fixtures/api.ts`) using `X_API_KEY` from environment variables.

- Copy `.env.example` to `.env`
- Set in `.env`:
  - `BASE_URL=https://reqres.in`
  - `X_API_KEY=<YOUR_API_KEY>`

Notes:
- `.env` is ignored by git and must not be committed.
- `.env.example` contains placeholders only (never real keys).
- If you do not have an API key, generate one on ReqRes (as described in the assignment).

## Running

- Run full suite:
  - `npm test`

- Typecheck only:
  - `npm run typecheck`

- CI-safe run (lower parallelism to avoid public API limitations):
  - `npm run test:ci`

- Verify (typecheck + CI-safe tests):
  - `npm run verify`

- Clean artifacts:
  - `npm run clean`

## HTML Report (required)

- Generate report:
  - `npm run test:html`

- Open report locally:
  - `npm run report`

Report output folder:
- `playwright-report/`

## Reproducibility (local)

The project was validated from a clean install using:

- `npm ci`
- `npm run verify` (typecheck + CI-safe tests with 2 workers)
- `npm run test:html` (HTML report generation)

This is intentionally designed to be stable against public API limitations (rate limits / variability).

## CI (GitHub Actions)

This repository includes a CI workflow that runs `npm run verify` and uploads the Playwright HTML report as an artifact.

Required secret:
- `X_API_KEY` (Repository Settings †’ Secrets and variables †’ Actions †’ New repository secret)

Where to download the report:
- GitHub †’ Actions †’ select a workflow run †’ Artifacts †’ `playwright-report`

## Submission

Submission ZIP must include:
- source code + `playwright-report/`
- exclude `node_modules/`
- exclude `.env`

## Coverage vs Assignment

1) POST `/api/login`
- Success: valid credentials -> `200` + `token`
- Failure: invalid credentials with both email+password present -> `4xx` + error
- Missing fields: email missing, password missing, both missing -> `4xx` + error
- Extra checks: status codes + basic response contract (token or error)

2) GET `/api/users/2`
- `200` + required structure (`data`, `support`)
- Content checks (id/email/names/avatar)

3) POST `/api/users` (create user)
- Valid case -> `201` + `id` + `createdAt` + echo `name/job`
- Invalid inputs (provider-dependent behavior):
  - never allow `5xx`
  - branch validation: if `201` validate `id/createdAt`; if `4xx` validate `error/message`

4) Pagination GET `/api/users?page=2`
- "Correct number of users" (per_page logic)
- `page`, `per_page`, `total`, `total_pages` accuracy checks
- Page 1 vs Page 2: no overlapping user ids

5) Delay GET `/api/users?delay=<n>`
- Anti-flaky validations: request contains `delay`, status `200`, stable schema checks
- No strict time assertions (public APIs may vary due to cache/CDN/routing)

6) Bonus 1 (chained requests)
- list -> pick user -> detail
- consistency validation between list item and user detail

## Bonus 2 €” Token-based auth (design proposal)

If the `/api/login` token were required for other endpoints:

- Store & reuse tokens securely
  - credentials in `.env` locally or CI secrets (never hardcoded)
  - obtain token once per worker/suite and cache in memory
  - never persist tokens in the repo

- Add auth headers automatically
  - create an `authApi` fixture that logs in during setup and injects:
    `Authorization: Bearer <token>`
  - alternative: a BaseClient that attaches common headers to all requests

- Handle token expiration
  - on `401/403`, refresh token and retry once (avoid loops)
  - if refresh tokens exist: TokenProvider with TTL and proactive refresh
  - do not reuse tokens across CI pipeline runs
