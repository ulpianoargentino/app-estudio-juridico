import { apiClient } from "./api";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  firm: { id: string; name: string };
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  firmName: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiClient.post<{ user: AuthUser }>("/auth/login", { email, password });
  return res.data.user;
}

export async function register(data: RegisterData): Promise<AuthUser> {
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

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.put("/auth/change-password", { currentPassword, newPassword });
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
}): Promise<AuthUser> {
  const res = await apiClient.put<{ user: AuthUser }>("/auth/profile", data);
  return res.data.user;
}
