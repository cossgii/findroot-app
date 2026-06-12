import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { forgotPassword } from '../services/auth';
import { Button, Input, BackButton } from '../components/ui';
import { colors, font } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!loginId.trim() || !email.trim()) {
      Alert.alert('오류', '아이디와 이메일을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(loginId.trim(), email.trim());
      setSent(true);
    } catch {
      Alert.alert('오류', '요청에 실패했습니다. 아이디와 이메일을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackButton style={styles.back} />
        <Text style={styles.title}>비밀번호 찾기</Text>

        {sent ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentIcon}>✉️</Text>
            <Text style={styles.sentTitle}>이메일을 보냈습니다</Text>
            <Text style={styles.sentDesc}>
              {email}으로{'\n'}비밀번호 재설정 링크를 보냈습니다.{'\n'}받은 편지함을 확인해주세요.
            </Text>
            <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/login')}>
              <Text style={styles.backToLoginText}>로그인으로 돌아가기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.desc}>
              가입 시 사용한 아이디와 이메일을 입력하면{'\n'}비밀번호 재설정 링크를 보내드립니다.
            </Text>
            <Input
              placeholder="아이디 입력"
              value={loginId}
              onChangeText={setLoginId}
              autoCapitalize="none"
              autoFocus
              style={styles.mb}
            />
            <Input
              placeholder="이메일 입력"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
              style={styles.mb}
            />
            <Button label="재설정 링크 보내기" onPress={handleSubmit} loading={loading} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg.white, padding: 24 },
  back: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  desc: { fontSize: font.lg, color: colors.text.muted, lineHeight: 22, marginBottom: 28 },
  mb: { marginBottom: 10 },
  sentBox: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  sentIcon: { fontSize: 48 },
  sentTitle: { fontSize: 20, fontWeight: 'bold' },
  sentDesc: { fontSize: font.lg, color: colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  backToLogin: { marginTop: 16, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  backToLoginText: { color: colors.primary, fontWeight: '600', fontSize: font.lg },
});
