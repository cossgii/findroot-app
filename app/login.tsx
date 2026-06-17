import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/store/auth';
import { login } from '@/services/auth';
import { getErrorMessage } from '@/lib/errors';
import { Button, Input, Screen } from '@/components/ui';
import { colors, font } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!loginId || !password) return;
    setLoading(true);
    try {
      const user = await login(loginId, password);
      setUser(user);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('로그인 실패', getErrorMessage(error, '로그인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Findroot</Text>
      <Input placeholder="아이디" value={loginId} onChangeText={setLoginId} autoCapitalize="none" style={styles.mb} />
      <Input placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry style={styles.mb} />
      <Button label="로그인" onPress={handleLogin} loading={loading} />
      <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.link}>
        <Text style={styles.hint}>비밀번호를 잊으셨나요?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/signup')} style={styles.link}>
        <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>
      {router.canGoBack() && (
        <TouchableOpacity onPress={() => router.back()} style={styles.link}>
          <Text style={styles.hint}>나중에 할게요</Text>
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', padding: 24, backgroundColor: colors.bg.white },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  mb: { marginBottom: 12 },
  link: { marginTop: 12, alignItems: 'center' },
  hint: { color: colors.text.hint, fontSize: font.md },
  linkText: { color: colors.primary, fontSize: font.base },
});
