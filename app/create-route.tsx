import { useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { searchPlaces } from '@/services/places';
import { useCreateRouteForm } from '@/hooks/useCreateRouteForm';
import { PURPOSE_LABELS, STOP_LABELS, CATEGORY_LABELS } from '@/types';
import { SEOUL_DISTRICTS } from '@/constants/districts';
import { colors, font, radius, spacing } from '@/constants/theme';
import type { RoutePurpose, RouteStopLabel, Place } from '@/types';

const DISTRICT_OPTIONS = SEOUL_DISTRICTS.filter((d) => d.id !== 'all');

function StopRow({ stop, index, total, onRemove, onMove }: {
  stop: { place: Place; label: RouteStopLabel };
  index: number; total: number;
  onRemove: () => void; onMove: (dir: -1 | 1) => void;
}) {
  return (
    <View style={styles.stopRow}>
      <View style={styles.stopOrder}><Text style={styles.stopOrderText}>{index + 1}</Text></View>
      <View style={styles.stopInfo}>
        <Text style={styles.stopName}>{stop.place.name}</Text>
        <Text style={styles.stopLabel}>{STOP_LABELS[stop.label]}</Text>
      </View>
      <View style={styles.stopActions}>
        <TouchableOpacity onPress={() => onMove(-1)} disabled={index === 0} style={styles.arrowBtn}>
          <Text style={[styles.arrowText, index === 0 && styles.arrowDisabled]}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMove(1)} disabled={index === total - 1} style={styles.arrowBtn}>
          <Text style={[styles.arrowText, index === total - 1 && styles.arrowDisabled]}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreateRouteScreen() {
  const router = useRouter();
  const {
    name, setName, description, setDescription,
    purpose, setPurpose, districtId, setDistrictId,
    stops, addStop, removeStop, moveStop,
    handleSubmit, isPending,
  } = useCreateRouteForm();

  const [showPicker, setShowPicker] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);
  const [pendingLabel, setPendingLabel] = useState<RouteStopLabel>('MEAL');

  const selectedDistrictName = DISTRICT_OPTIONS.find((d) => d.id === districtId)?.name;

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['searchPlaces', districtId],
    queryFn: () => searchPlaces({ district: selectedDistrictName, sort: 'recent' }),
    enabled: showPicker && !pendingPlace && !!districtId,
  });

  function handleAddStop() {
    if (!pendingPlace) return;
    const ok = addStop(pendingPlace, pendingLabel);
    if (ok) { setPendingPlace(null); setPendingLabel('MEAL'); setShowPicker(false); }
  }

  function handleClosePicker() {
    setShowPicker(false);
    setPendingPlace(null);
    setPendingLabel('MEAL');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>루트 만들기</Text>

          <Text style={styles.label}>루트 이름 *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="루트 이름" />

          <Text style={styles.label}>설명 (선택)</Text>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
            placeholder="루트 설명" multiline numberOfLines={3} />

          <Text style={styles.label}>자치구 *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {DISTRICT_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, districtId === d.id && styles.chipActive]}
                onPress={() => setDistrictId(d.id)}
              >
                <Text style={[styles.chipText, districtId === d.id && styles.chipTextActive]}>{d.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>목적 *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {(Object.keys(PURPOSE_LABELS) as RoutePurpose[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, purpose === p && styles.chipActive]}
                onPress={() => setPurpose(p)}
              >
                <Text style={[styles.chipText, purpose === p && styles.chipTextActive]}>{PURPOSE_LABELS[p]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.stopsHeader}>
            <Text style={styles.label}>경유지 ({stops.length}/5) *</Text>
            <TouchableOpacity
              style={[styles.addStopBtn, (stops.length >= 5 || !districtId) && styles.addStopBtnDisabled]}
              onPress={() => { if (stops.length < 5) setShowPicker(true); }}
              disabled={stops.length >= 5 || !districtId}
            >
              <Text style={[styles.addStopBtnText, (stops.length >= 5 || !districtId) && styles.addStopBtnTextDisabled]}>
                + 추가
              </Text>
            </TouchableOpacity>
          </View>

          {stops.length === 0 && (
            <Text style={styles.emptyStops}>경유지를 최소 2개 추가해주세요.</Text>
          )}
          {stops.map((stop, i) => (
            <StopRow
              key={stop.place.id}
              stop={stop}
              index={i}
              total={stops.length}
              onRemove={() => removeStop(i)}
              onMove={(dir) => moveStop(i, dir)}
            />
          ))}

          <TouchableOpacity style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit} disabled={isPending}>
            {isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>루트 생성</Text>
            }
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showPicker} animationType="slide" onRequestClose={handleClosePicker}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.white }} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pendingPlace ? '레이블 선택' : '장소 선택'}</Text>
              <TouchableOpacity onPress={handleClosePicker}>
                <Text style={styles.modalClose}>닫기</Text>
              </TouchableOpacity>
            </View>

            {!pendingPlace ? (
              placesLoading
                ? <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
                : (
                  <FlatList
                    data={placesData?.places}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.placeItem} onPress={() => setPendingPlace(item)}>
                        <Text style={styles.placeItemName}>{item.name}</Text>
                        <Text style={styles.placeItemSub}>
                          {CATEGORY_LABELS[item.category]}{item.address ? ` · ${item.address}` : ''}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyStops}>사용 가능한 장소가 없습니다. 먼저 장소를 추가해주세요.</Text>
                    }
                  />
                )
            ) : (
              <View style={styles.labelPicker}>
                <Text style={styles.labelPickerTitle}>"{pendingPlace.name}"의 레이블</Text>
                {(Object.keys(STOP_LABELS) as RouteStopLabel[]).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.labelOption, pendingLabel === l && styles.labelOptionActive]}
                    onPress={() => setPendingLabel(l)}
                  >
                    <Text style={[styles.labelOptionText, pendingLabel === l && styles.labelOptionTextActive]}>
                      {STOP_LABELS[l]}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddStop}>
                  <Text style={styles.submitBtnText}>추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </Modal>
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
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: font.base, backgroundColor: colors.bg.input },
  multiline: { height: 80, textAlignVertical: 'top' },

  chipScroll: { flexGrow: 0, marginBottom: 4 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  chipText: { color: colors.text.secondary, fontSize: font.sm },
  chipTextActive: { color: colors.primary, fontWeight: '600' },

  stopsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  addStopBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  addStopBtnDisabled: { borderColor: colors.border },
  addStopBtnText: { color: colors.primary, fontWeight: '600', fontSize: font.sm },
  addStopBtnTextDisabled: { color: colors.text.hint },
  emptyStops: { color: colors.text.hint, textAlign: 'center', paddingVertical: spacing.lg, fontSize: font.sm },

  stopRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, gap: 10 },
  stopOrder: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  stopOrderText: { color: '#fff', fontWeight: '700', fontSize: font.xs },
  stopInfo: { flex: 1 },
  stopName: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  stopLabel: { fontSize: font.xs, color: colors.text.secondary, marginTop: 2 },
  stopActions: { flexDirection: 'row', gap: 4 },
  arrowBtn: { padding: 4 },
  arrowText: { fontSize: font.lg, color: colors.primary },
  arrowDisabled: { color: colors.border },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: font.sm, color: '#EF4444' },

  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xl * 1.5 },
  submitBtnDisabled: { backgroundColor: colors.text.hint },
  submitBtnText: { color: '#fff', fontSize: font.base, fontWeight: '700' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: font.xl, fontWeight: 'bold', color: colors.text.primary },
  modalClose: { color: colors.primary, fontSize: font.base },
  placeItem: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  placeItemName: { fontSize: font.base, fontWeight: '600', color: colors.text.primary },
  placeItemSub: { fontSize: font.sm, color: colors.text.secondary, marginTop: 2 },
  labelPicker: { padding: spacing.xl, gap: spacing.sm },
  labelPickerTitle: { fontSize: font.base, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  labelOption: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  labelOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  labelOptionText: { fontSize: font.base, color: colors.text.secondary },
  labelOptionTextActive: { color: colors.primary, fontWeight: '700' },
});
