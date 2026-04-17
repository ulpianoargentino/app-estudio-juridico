import { apiClient } from "./api";
import type { AuthUser, RegisterRequest } from "@shared";

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiClient.post<{ user: AuthUser }>("/auth/login", { email, password });
  return res.data.user;
}

export async function register(data: RegisterRequest): Promise<AuthUser> {
  const res = await apiClient.post<{ user: AuthUser }>("/auth/register", data);
  return res.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get<{ user: AuthUser }>("/auth/me");
  return res.data.user;
}
