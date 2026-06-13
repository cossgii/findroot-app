import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import * as ImagePicker from 'expo-image-picker';
import { fetchMe, updateMe, updatePassword } from '@/services/users';
import { getStoredUser, setStoredUser } from '@/lib/storage';
import { uploadImage } from '@/services/images';
import { userAtom } from '@/store/auth';
import { BackButton, Button, Card, Input, UserAvatar } from '@/components/ui';
import { colors, font } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useSetAtom(userAtom);

  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

  const [name, setName] = useState('');
  const [nameReady, setNameReady] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNew: '' });

  if (me && !nameReady) { setName(me.name); setNameReady(true); }

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  const nameMutation = useMutation({
    mutationFn: async () => {
      let imageUrl: string | undefined;
      if (imageUri) {
        setUploadingImage(true);
        try {
          const ext = imageUri.split('.').pop() ?? 'jpg';
          imageUrl = await uploadImage(imageUri, `profile_${Date.now()}.${ext}`);
        } finally {
          setUploadingImage(false);
        }
      }
      return updateMe({ name: name.trim(), ...(imageUrl !== undefined ? { image: imageUrl } : {}) });
    },
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      const stored = await getStoredUser();
      if (stored) await setStoredUser({ ...stored, name: updated.name });
      setUser((prev) => prev ? { ...prev, name: updated.name } : prev);
      setImageUri(null);
      Alert.alert('완료', '프로필이 변경됐습니다.');
    },
    onError: () => Alert.alert('오류', '프로필 변경에 실패했습니다.'),
  });

  const pwMutation = useMutation({
    mutationFn: () => updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    onSuccess: () => {
      setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' });
      Alert.alert('완료', '비밀번호가 변경됐습니다.');
    },
    onError: () => Alert.alert('오류', '비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.'),
  });

  const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$&*?!%])[A-Za-z\d!@$%&*?]{8,15}$/;

  function handlePasswordChange() {
    const { currentPassword, newPassword, confirmNew } = pwForm;
    if (!currentPassword || !newPassword || !confirmNew) { Alert.alert('오류', '모든 항목을 입력해주세요.'); return; }
    if (newPassword !== confirmNew) { Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.'); return; }
    if (!pwRegex.test(newPassword)) { Alert.alert('오류', '영문, 숫자, 특수문자(@$&*?!%)를 모두 포함한 8~15자여야 합니다.'); return; }
    pwMutation.mutate();
  }

  function setPw(key: keyof typeof pwForm) {
    return (v: string) => setPwForm((prev) => ({ ...prev, [key]: v }));
  }

  if (isLoading) return null;

  const currentImage = imageUri ?? me?.image;
  const isPending = nameMutation.isPending || uploadingImage;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackButton style={styles.back} />
        <Text style={styles.title}>프로필 편집</Text>

        <Card>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <TouchableOpacity style={styles.avatarRow} onPress={handlePickImage}>
            <UserAvatar name={me?.name ?? ''} image={currentImage} size={80} colorful />
            <Text style={styles.avatarHint}>탭하여 변경</Text>
          </TouchableOpacity>

          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>이메일</Text>
            <Text style={styles.readonlyValue}>{me?.email}</Text>
          </View>

          <Input label="이름" value={name} onChangeText={setName} placeholder="이름" autoCapitalize="none" />
          <Button label="프로필 저장" onPress={() => nameMutation.mutate()} loading={isPending} style={styles.mt} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>비밀번호 변경</Text>
          <Input label="현재 비밀번호" value={pwForm.currentPassword} onChangeText={setPw('currentPassword')} placeholder="현재 비밀번호" secureTextEntry autoCapitalize="none" />
          <Input label="새 비밀번호" value={pwForm.newPassword} onChangeText={setPw('newPassword')} placeholder="영문+숫자+특수문자(@$&*?!%) 8~15자" secureTextEntry autoCapitalize="none" />
          <Input label="새 비밀번호 확인" value={pwForm.confirmNew} onChangeText={setPw('confirmNew')} placeholder="새 비밀번호 확인" secureTextEntry autoCapitalize="none" />
          <Button label="비밀번호 변경" onPress={handlePasswordChange} loading={pwMutation.isPending} style={styles.mt} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg.page, flexGrow: 1, gap: 16 },
  back: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: colors.text.primary },
  sectionTitle: { fontSize: font.xl, fontWeight: '700' },
  avatarRow: { alignItems: 'center', gap: 6, marginVertical: 4 },
  avatarHint: { fontSize: font.md, color: colors.text.hint },
  readonlyField: { gap: 4 },
  readonlyLabel: { fontSize: font.md, fontWeight: '600', color: colors.text.secondary, marginTop: 8 },
  readonlyValue: { fontSize: font.lg, color: colors.text.hint, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 8, padding: 12, backgroundColor: '#f5f5f5' },
  mt: { marginTop: 4 },
});
