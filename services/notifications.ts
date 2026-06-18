import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '@/lib/api';
import { getPushToken, setPushToken, clearPushToken } from '@/lib/storage';

export async function registerPushToken(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getDevicePushTokenAsync();

  await api.post('/api/device-tokens', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });

  await setPushToken(token);
}

export async function unregisterPushToken(): Promise<void> {
  const token = await getPushToken();
  if (!token) return;
  try {
    await api.delete(`/api/device-tokens?token=${encodeURIComponent(token)}`);
  } finally {
    await clearPushToken();
  }
}
