import { api } from '@/lib/api';
import { getStoredUser, setToken, setStoredUser, clearToken, clearStoredUser } from '@/lib/storage';
import { registerPushToken, unregisterPushToken } from '@/services/notifications';
import type { AppUser } from '@/store/auth';

export { getStoredUser };

export async function login(loginId: string, password: string): Promise<AppUser> {
  const { data } = await api.post('/api/auth/app-login', { loginId, password });
  await setToken(data.token);
  const user: AppUser = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    image: data.user.image ?? null,
  };
  await setStoredUser(user);
  registerPushToken().catch((e) => console.error('[FCM]', e));
  return user;
}

export async function logout(): Promise<void> {
  await unregisterPushToken();
  await clearToken();
  await clearStoredUser();
}

export async function signup(payload: {
  name: string;
  loginId: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AppUser> {
  const { data } = await api.post('/api/signup', payload);
  return data.user;
}

export async function forgotPassword(loginId: string, email: string): Promise<void> {
  await api.post('/api/auth/password-reset/request', { loginId, email });
}
