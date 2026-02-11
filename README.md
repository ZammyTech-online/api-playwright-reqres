# API Testing (ReqRes) with Playwright + TypeScript

This repo contains a small API automation suite for the **ReqRes demo API** built with **Playwright Test + TypeScript**.

The goal is simple: keep the suite **easy to read**, **easy to maintain**, and **stable** (no flaky assertions), while using **environment-based config** (no hardcoded secrets).

---

## Requirements

* Node.js 18+ (Node 20+ recommended)
* npm

---

## Quick start

### 1) Install dependencies

```bash
npm install
npx playwright install
```

### 2) Configure environment (no hardcoded secrets)

ReqRes requires an `x-api-key` header for requests to work.

* Copy `.env.example` → `.env`
* Update `.env` with your values:

  * `BASE_URL=https://reqres.in`
  * `X_API_KEY=YOUR_API_KEY`

Notes:

* `.env` is gitignored and must **not** be committed.
* `.env.example` only contains placeholders.

---

## Running

```bash
# Run full suite
npm test

# Typecheck only
npm run typecheck

# CI-safe run (lower parallelism to reduce rate-limit issues on the public API)
npm run test:ci

# Verify (typecheck + CI-safe tests)
npm run verify

# Generate Playwright HTML report
npm run test:html

# Open report locally
npm run report
```

---

## Project layout

* `src/config/` — loads + validates env (`BASE_URL`, `X_API_KEY`)
* `src/fixtures/` — creates the `APIRequestContext` with baseURL + default headers
* `src/clients/` — small API clients (`AuthClient`, `UsersClient`) to keep specs clean
* `src/types/` — TypeScript types for ReqRes contracts
* `src/utils/` — utilities (timing/observability only)
* `tests/` — specs mapped to the assignment scenarios

---

## Why it’s structured this way

* Config is **environment-driven** (`BASE_URL`, `X_API_KEY` from `.env` locally or CI secrets).
* A single API fixture centralizes **baseURL + shared headers** (including `x-api-key`).
* Endpoint calls live in clients so specs stay focused on **behavior + assertions**.
* Assertions focus on **stable contracts**, not timing.
* There’s a CI-safe mode to reduce flakiness caused by **public API rate limits**.

---

## Coverage (mapped to the assignment)

### 1) `POST /api/login`

* Valid credentials → expect **200** + `token`
* Missing fields → expect **400** + error message
* “Invalid credentials” with email + password present → executed as required by the assignment
  *(see Known limitations below — ReqRes behaves like a mock here)*

### 2) `GET /api/users/2`

* Expect **200**
* Validate response shape: `data` + `support`
* Validate key fields: `id`, `email`, `first_name`, `last_name`, `avatar`

### 3) `POST /api/users` (create user)

* Valid payload (`name` + `job`) → expect **201**, `id`, `createdAt`, and echo of sent fields
* Negative variants included to explore behavior
  *(see Known limitations — ReqRes is permissive and still returns 201)*

### 4) Pagination `GET /api/users?page=2`

* Validate pagination metadata: `page`, `per_page`, `total`, `total_pages`
* Validate `per_page` matches `data.length`
* Fetch page 1 + page 2 and ensure **no overlap** in user IDs

### 5) Delay `GET /api/users?delay=<n>`

* Ensure request includes `delay`
* Expect **200** + stable schema
* No strict time assertions (public API variability)

### 6) Bonus 1: Chained requests

* List users → pick one user → fetch detail by id
* Validate basic consistency between list item and detail response

---

## Known limitations (ReqRes is a demo/mock API)

### 1) `/api/login` is not real authentication

Observed behavior:

* If both `email` and `password` are present, ReqRes returns **200 + token** even if the password is “wrong”.

Impact:

* Realistic “wrong password” negative testing isn’t possible here.
* The suite documents and asserts the behavior actually returned by the API.

### 2) `/api/users` create is permissive

Observed behavior:

* It returns **201** even when `job` or `name` is missing (and even for `{}`).

Impact:

* For negative variants, tests validate the **contract** (`id`, `createdAt`) and ensure stability (no 5xx),
  instead of expecting server-side validation that doesn’t exist in ReqRes.

---

## Bonus Question 2 (Theory): token-based auth in a real system

ReqRes doesn’t require the token, but in a real Bearer/JWT setup I’d do this:

* Login once via an `AuthClient` (credentials from `.env` locally and secrets in CI/CD).
* Cache the token in memory (ideally per worker so parallel runs don’t fight each other).
* Build the API request context already authenticated (`Authorization: Bearer <token>`), so specs stay clean.
* Handle expiration: on **401/403**, refresh once and retry once (no infinite loops).
* Never print tokens in logs (at most mask them).

---

## CI (GitHub Actions)

* CI runs: `npm run verify`
* Playwright HTML report is uploaded as an artifact

Required secret:

* `X_API_KEY` (GitHub repo → Settings → Secrets and variables → Actions)

---

## Submission

The submission zip should include:

* Source code
* `playwright-report/` (HTML report)

It must exclude:

* `node_modules/`
* `.env`

---
