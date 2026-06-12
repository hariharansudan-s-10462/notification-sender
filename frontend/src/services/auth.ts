import { apiFetch } from './api';

interface User {
  user_id: string;
  email_id: string;
  first_name: string;
  last_name: string;
}

interface AuthUrls {
  loginUrl: string;
  signupUrl: string;
  logoutUrl: string;
}

export async function getCurrentUser(): Promise<User> {
  const data = await apiFetch<{ user: User }>('/auth/me');
  return data.user;
}

export async function getAuthUrls(): Promise<AuthUrls> {
  return apiFetch<AuthUrls>('/auth/urls');
}
