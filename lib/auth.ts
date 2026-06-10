import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export async function login(loginId: string, password: string) {
  const { data } = await api.post('/api/auth/app-login', { loginId, password });
  await SecureStore.setItemAsync('app_token', data.token);
  await SecureStore.setItemAsync('app_user', JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  await SecureStore.deleteItemAsync('app_token');
  await SecureStore.deleteItemAsync('app_user');
}

export async function getStoredUser() {
  const raw = await SecureStore.getItemAsync('app_user');
  return raw ? JSON.parse(raw) : null;
}
