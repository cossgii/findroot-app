import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { fetchPlace, updatePlace } from '../../services/places';
import { CATEGORY_LABELS } from '../../types';
import type { PlaceCategory } from '../../types';

export default function EditPlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    link: '',
    category: 'MEAL' as PlaceCategory,
    latitude: '',
    longitude: '',
  });
  const [locating, setLocating] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: place, isLoading } = useQuery({
    queryKey: ['place', id],
    queryFn: () => fetchPlace(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (place && !initialized) {
      setForm({
        name: place.name,
        description: place.description,
        address: place.address ?? '',
        link: place.link ?? '',
        category: place.category,
        latitude: place.latitude.toString(),
        longitude: place.longitude.toString(),
      });
      setInitialized(true);
    }
  }, [place, initialized]);

  const mutation = useMutation({
    mutationFn: () => {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      return updatePlace(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        latitude: lat,
        longitude: lng,
        address: form.address.trim() || undefined,
        link: form.link.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place', id] });
      Alert.alert('완료', '장소가 수정됐습니다.', [
        { text: '확인', onPress: () => router.replace(`/places/${id}`) },
      ]);
    },
    onError: () => Alert.alert('오류', '장소 수정에 실패했습니다.'),
  });

  function set(key: keyof typeof form) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function fillCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('위치 권한이 필요합니다.'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setForm((prev) => ({
        ...prev,
        latitude: loc.coords.latitude.toString(),
        longitude: loc.coords.longitude.toString(),
      }));
    } catch {
      Alert.alert('오류', '위치를 가져오지 못했습니다.');
    } finally {
      setLocating(false);
    }
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert('오류', '이름과 설명을 입력해주세요.');
      return;
    }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('오류', '올바른 좌표를 입력해주세요.');
      return;
    }
    mutation.mutate();
  }

  if (isLoading || !initialized) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>장소 수정</Text>

        <Text style={styles.label}>이름 *</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={set('name')} placeholder="장소 이름" />

        <Text style={styles.label}>설명 *</Text>
        <TextInput style={[styles.input, styles.multiline]} value={form.description} onChangeText={set('description')} placeholder="장소 설명" multiline numberOfLines={3} />

        <Text style={styles.label}>카테고리 *</Text>
        <View style={styles.categoryRow}>
          {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryBtn, form.category === c && styles.categoryBtnActive]}
              onPress={() => setForm((prev) => ({ ...prev, category: c }))}
            >
              <Text style={[styles.categoryBtnText, form.category === c && styles.categoryBtnTextActive]}>
                {CATEGORY_LABELS[c]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>주소 (선택)</Text>
        <TextInput style={styles.input} value={form.address} onChangeText={set('address')} placeholder="주소 입력" />

        <Text style={styles.label}>링크 (선택)</Text>
        <TextInput style={styles.input} value={form.link} onChangeText={set('link')} placeholder="https://..." autoCapitalize="none" keyboardType="url" />

        <Text style={styles.label}>좌표 *</Text>
        <TouchableOpacity style={styles.gpsButton} onPress={fillCurrentLocation} disabled={locating}>
          {locating ? <ActivityIndicator size="small" color="#3B82F6" /> : <Text style={styles.gpsButtonText}>현재 위치 사용</Text>}
        </TouchableOpacity>
        <View style={styles.coordRow}>
          <TextInput style={[styles.input, styles.coordInput]} value={form.latitude} onChangeText={set('latitude')} placeholder="위도" keyboardType="numeric" />
          <TextInput style={[styles.input, styles.coordInput]} value={form.longitude} onChangeText={set('longitude')} placeholder="경도" keyboardType="numeric" />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
          <Text style={styles.submitButtonText}>{mutation.isPending ? '수정 중...' : '장소 수정'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  backButton: { marginBottom: 8 },
  backText: { color: '#3B82F6', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  multiline: { height: 80, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 10 },
  categoryBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  categoryBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  categoryBtnText: { fontSize: 15, color: '#666' },
  categoryBtnTextActive: { color: '#3B82F6', fontWeight: '600' },
  gpsButton: { borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  gpsButtonText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  coordRow: { flexDirection: 'row', gap: 10 },
  coordInput: { flex: 1 },
  submitButton: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
