import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, useAtomValue, useSetAtom } from 'jotai';
import * as Notifications from 'expo-notifications';
import { getStoredUser } from '@/services/auth';
import { registerPushToken } from '@/services/notifications';
import { userAtom, authReadyAtom } from '@/store/auth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient();

function AuthRestorer() {
  const setUser = useSetAtom(userAtom);
  const setAuthReady = useSetAtom(authReadyAtom);
  useEffect(() => {
    getStoredUser().then((user) => {
      if (user) {
        setUser(user);
        registerPushToken().catch((e) => console.error('[FCM]', e));
      }
      setAuthReady(true);
    });
  }, []);
  return null;
}

function navigateFromNotification(router: ReturnType<typeof useRouter>, data: Record<string, string>) {
  if (data.screen === 'route' && data.id) router.push(`/routes/${data.id}`);
  else if (data.screen === 'place' && data.id) router.push(`/places/${data.id}`);
  else if (data.screen === 'user' && data.id) router.push(`/users/${data.id}`);
}

function NotificationListener() {
  const router = useRouter();
  const authReady = useAtomValue(authReadyAtom);
  const pendingData = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      pendingData.current = response.notification.request.content.data as Record<string, string>;
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      navigateFromNotification(router, data);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (authReady && pendingData.current) {
      navigateFromNotification(router, pendingData.current);
      pendingData.current = null;
    }
  }, [authReady]);

  return null;
}

export default function RootLayout() {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <AuthRestorer />
        <NotificationListener />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
