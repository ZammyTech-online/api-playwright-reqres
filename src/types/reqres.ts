// src/types/reqres.ts
// Type contracts for ReqRes API responses/requests used by the test suite.

export interface Support {
  // Link to documentation/support page.
  url: string;
  // Human-readable support message.
  text: string;
}

export interface ReqResUser {
  // Unique user identifier.
  id: number;
  // User email address.
  email: string;
  // Given name.
  first_name: string;
  // Family name.
  last_name: string;
  // Avatar image URL.
  avatar: string;
}

export interface SingleUserResponse {
  // User payload.
  data: ReqResUser;
  // Support metadata.
  support: Support;
}

export interface ListUsersResponse {
  // Current page number.
  page: number;
  // Items per page.
  per_page: number;
  // Total number of items across all pages.
  total: number;
  // Total pages (should match ceil(total/per_page)).
  total_pages: number;
  // Page data.
  data: ReqResUser[];
  // Support metadata.
  support: Support;
}

export interface LoginRequest {
  // Optional in the contract to allow testing missing-field scenarios.
  email?: string;
  // Optional in the contract to allow testing missing-field scenarios.
  password?: string;
}

export interface LoginResponse {
  // Token returned on successful login.
  token: string;
}

export interface ErrorResponse {
  // Error message returned by the API on failed requests.
  error: string;
}

export interface CreateUserRequest {
  // Optional to support negative tests (missing/empty fields).
  name?: string;
  // Optional to support negative tests (missing/empty fields).
  job?: string;
  // Allow extra/unexpected fields for robustness testing.
  [k: string]: unknown;
}

export interface CreateUserResponse {
  // Echoed name from request (provider-dependent but stable in ReqRes).
  name: string;
  // Echoed job from request.
  job: string;
  // Server-generated id.
  id: string;
  // ISO timestamp string when created.
  createdAt: string;
}
