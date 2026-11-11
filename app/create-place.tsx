import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useKakaoPlaceSearch } from '@/hooks/useKakaoPlaceSearch';
import { useCreatePlaceForm } from '@/hooks/useCreatePlaceForm';
import { PlaceSearchInput } from '@/components/PlaceSearchInput';
import KakaoMap from '@/components/KakaoMap';
import { CATEGORY_LABELS } from '@/types';
import type { PlaceCategory } from '@/types';
import { colors, font, radius, spacing } from '@/constants/theme';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export default function CreatePlaceScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const { results, searching, searched, search, clearResults } = useKakaoPlaceSearch();
  const {
    selected, handleSelect,
    duplicateError, checkingDuplicate,
    description, setDescription,
    link, setLink, linkError,
    category, setCategory,
    loading, handleSubmit,
  } = useCreatePlaceForm();

  function handleSelectPlace(place: Parameters<typeof handleSelect>[0]) {
    setSearchText(place.place_name);
    clearResults();
    handleSelect(place);
  }

  const mapCenter = selected ? { lat: selected.latitude, lng: selected.longitude } : DEFAULT_CENTER;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>장소 추가</Text>

          <Text style={styles.label}>장소 검색</Text>
          <PlaceSearchInput
            value={searchText}
            onChangeText={(t) => { setSearchText(t); clearResults(); }}
            onSearch={() => search(searchText)}
            results={results}
            searched={searched}
            onSelect={handleSelectPlace}
            searching={searching}
          />

          <KakaoMap
            center={mapCenter}
            level={selected ? 3 : 8}
            markers={selected ? [{ id: selected.id, name: selected.name, latitude: selected.latitude, longitude: selected.longitude }] : []}
            style={styles.map}
          />

          {selected && (
            <>
              <Text style={styles.label}>이름</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>{selected.name}</Text>
              </View>

              <Text style={styles.label}>주소</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>{selected.address}</Text>
                {checkingDuplicate && <Text style={styles.hintText}>기존 장소 확인 중...</Text>}
                {duplicateError && <Text style={styles.errorText}>{duplicateError}</Text>}
              </View>

              <Text style={styles.label}>설명 *</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="이 장소에 대한 설명을 적어주세요"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>링크 (선택)</Text>
              <TextInput style={styles.input} value={link} onChangeText={setLink}
                placeholder="https://..." keyboardType="url" autoCapitalize="none" />
              {linkError && <Text style={styles.errorText}>{linkError}</Text>}

              <Text style={styles.label}>카테고리 *</Text>
              <View style={styles.categoryRow}>
                {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryBtn, category === c && styles.categoryBtnActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.categoryBtnText, category === c && styles.categoryBtnTextActive]}>
                      {CATEGORY_LABELS[c]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (!!duplicateError || loading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!!duplicateError || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>장소 등록</Text>}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.white },
  container: { padding: spacing.xl, flexGrow: 1 },
  backButton: { marginBottom: spacing.sm },
  backText: { color: colors.primary, fontSize: font.base },
  title: { fontSize: font['3xl'], fontWeight: 'bold', marginBottom: spacing.xl, color: colors.text.primary },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: 6, marginTop: spacing.md },
  map: { height: 240, borderRadius: radius.md, marginTop: spacing.md, overflow: 'hidden' },
  readonlyField: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bg.muted },
  readonlyText: { fontSize: font.base, color: colors.text.primary },
  hintText: { fontSize: font.sm, color: colors.text.hint, marginTop: 4 },
  errorText: { fontSize: font.sm, color: '#e53e3e', marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: font.base, backgroundColor: colors.bg.input },
  multiline: { height: 88, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 10 },
  categoryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  categoryBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  categoryBtnText: { fontSize: font.base, color: colors.text.secondary },
  categoryBtnTextActive: { color: colors.primary, fontWeight: '600' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xl * 1.5 },
  submitBtnDisabled: { backgroundColor: colors.text.hint },
  submitBtnText: { color: '#fff', fontSize: font.base, fontWeight: '700' },
});
