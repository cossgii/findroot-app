import * as SecureStore from 'expo-secure-store';
import type { AppUser } from '@/store/auth';

const TOKEN_KEY = 'app_token';
const USER_KEY = 'app_user';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AppUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as AppUser) : null;
}

export async function setStoredUser(user: AppUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

const PUSH_TOKEN_KEY = 'push_token';

export async function getPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function setPushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
