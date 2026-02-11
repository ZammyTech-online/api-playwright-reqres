// src/types/reqres.ts
// Type contracts for ReqRes API responses/requests used by the test suite.

export interface Support {
  url: string;
  text: string;
}

export interface ReqResUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface SingleUserResponse {
  data: ReqResUser;

  // In practice appears, but keep optional for robustness.
  support?: Support;

  // Observed sometimes (e.g. /users/2). Not stable across IDs.
  _meta?: Record<string, unknown>;
}

export interface ListUsersResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: ReqResUser[];
  support?: Support;
  _meta?: Record<string, unknown>;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;

  // Observed in empty-body error case.
  message?: string;

  // Allow provider-specific fields without breaking typing.
  [k: string]: unknown;
}

export interface CreateUserRequest {
  name?: string;
  job?: string;
  [k: string]: unknown;
}

export interface CreateUserResponse {
  // ReqRes echoes these only if present in request
  name?: string;
  job?: string;

  // Observed as string in your evidence.
  id: string;
  createdAt: string;

  [k: string]: unknown;
}
