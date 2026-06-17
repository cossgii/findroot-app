import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: '탐색' }} />
      <Tabs.Screen name="mypage" options={{ title: '마이페이지' }} />
      <Tabs.Screen name="districts/[id]" options={{ href: null }} />
    </Tabs>
  );
}
