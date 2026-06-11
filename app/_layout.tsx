import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, useSetAtom } from 'jotai';
import { getStoredUser } from '../lib/auth';
import { userAtom } from '../store/auth';

const queryClient = new QueryClient();

function AuthRestorer() {
  const setUser = useSetAtom(userAtom);
  useEffect(() => {
    getStoredUser().then((user) => {
      if (user) setUser(user);
    });
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <AuthRestorer />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </JotaiProvider>
  );
}
