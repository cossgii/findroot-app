import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signup } from '@/services/auth';
import { signupSchema } from '@/lib/schemas/auth';
import { getErrorMessage } from '@/lib/errors';
import { Button, Input } from '@/components/ui';
import { colors, font } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', loginId: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSignup() {
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      Alert.alert('오류', result.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      return;
    }
    setLoading(true);
    try {
      await signup(result.data);
      Alert.alert('가입 완료', '로그인해주세요.', [{ text: '확인', onPress: () => router.replace('/login') }]);
    } catch (error) {
      Alert.alert('가입 실패', getErrorMessage(error, '이미 사용 중인 아이디 또는 이메일일 수 있습니다.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>회원가입</Text>
      <Input placeholder="이름" value={form.name} onChangeText={set('name')} style={styles.mb} />
      <Input placeholder="아이디" value={form.loginId} onChangeText={set('loginId')} autoCapitalize="none" style={styles.mb} />
      <Input placeholder="이메일" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" style={styles.mb} />
      <Input placeholder="비밀번호 (8-15자, 영문+숫자+특수문자)" value={form.password} onChangeText={set('password')} secureTextEntry style={styles.mb} />
      <Input placeholder="비밀번호 확인" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry style={styles.mb} />
      <Button label="가입하기" onPress={handleSignup} loading={loading} />
      <TouchableOpacity onPress={() => router.back()} style={styles.link}>
        <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
      </TouchableOpacity>
      {router.canGoBack() && (
        <TouchableOpacity onPress={() => router.back()} style={styles.link}>
          <Text style={styles.hint}>나중에 할게요</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg.white },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 28, textAlign: 'center' },
  mb: { marginBottom: 12 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: font.base },
  hint: { color: colors.text.hint, fontSize: font.md },
});
