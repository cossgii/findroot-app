import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { userAtom } from '../store/auth';
import { getStoredUser } from '../lib/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);

  useEffect(() => {
    getStoredUser().then((user) => {
      if (user) {
        setUser(user);
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
