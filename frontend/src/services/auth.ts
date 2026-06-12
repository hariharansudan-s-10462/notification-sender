import { apiFetch } from './api';

interface User {
  user_id: string;
  email_id: string;
  first_name: string;
  last_name: string;
}

export async function getCurrentUser(): Promise<User> {
  const data = await apiFetch<{ user: User }>('/auth/me');
  return data.user;
}
