export type LoginResponse = { token: string };
export type ErrorResponse = { error: string };

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
};

export type Support = { url: string; text: string };

export type SingleUserResponse = { data: User; support: Support };

export type ListUsersResponse = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: User[];
  support: Support;
};

export type CreateUserRequest = { name: string; job: string };

export type CreateUserResponse = {
  name: string;
  job: string;
  id: string;
  createdAt: string;
};
