import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoute } from '../services/routes';
import { searchPlaces } from '../services/places';
import { PURPOSE_LABELS, STOP_LABELS, CATEGORY_LABELS } from '../types';
import { SEOUL_DISTRICTS } from '../constants/districts';
import type { RoutePurpose, RouteStopLabel, Place } from '../types';

const DISTRICT_OPTIONS = SEOUL_DISTRICTS.filter((d) => d.id !== 'all');

type Stop = { place: Place; label: RouteStopLabel };

function StopRow({ stop, index, total, onRemove, onMove }: {
  stop: Stop; index: number; total: number;
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
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState<RoutePurpose>('ENTIRE');
  const [districtId, setDistrictId] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);
  const [pendingLabel, setPendingLabel] = useState<RouteStopLabel>('MEAL');

  const selectedDistrictName = DISTRICT_OPTIONS.find((d) => d.id === districtId)?.name;

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['searchPlaces', districtId],
    queryFn: () => searchPlaces({ district: selectedDistrictName, sort: 'recent' }),
    enabled: showPicker && !pendingPlace && !!districtId,
  });

  const mutation = useMutation({
    mutationFn: createRoute,
    onSuccess: (route) => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'featured'] });
      Alert.alert('완료', '루트가 생성됐습니다.', [
        { text: '루트 보기', onPress: () => router.replace(`/routes/${route.id}`) },
      ]);
    },
    onError: () => Alert.alert('오류', '루트 생성에 실패했습니다.'),
  });

  function addStop() {
    if (!pendingPlace) return;
    if (stops.length >= 5) {
      Alert.alert('경유지는 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    if (stops.some((s) => s.place.id === pendingPlace.id)) {
      Alert.alert('이미 추가된 장소입니다.');
      return;
    }
    setStops((prev) => [...prev, { place: pendingPlace, label: pendingLabel }]);
    setPendingPlace(null);
    setPendingLabel('MEAL');
    setShowPicker(false);
  }

  function moveStop(index: number, dir: -1 | 1) {
    setStops((prev) => {
      const arr = [...prev];
      const target = index + dir;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  }

  function handleSubmit() {
    if (!name.trim()) { Alert.alert('오류', '루트 이름을 입력해주세요.'); return; }
    if (!districtId) { Alert.alert('오류', '자치구를 선택해주세요.'); return; }
    if (stops.length < 2) { Alert.alert('오류', '경유지를 최소 2개 추가해주세요.'); return; }
    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      purpose,
      districtId,
      places: stops.map((s, i) => ({ placeId: s.place.id, order: i + 1, label: s.label })),
    });
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>루트 만들기</Text>

        <Text style={styles.label}>루트 이름 *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="루트 이름" />

        <Text style={styles.label}>설명 (선택)</Text>
        <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="루트 설명" multiline numberOfLines={3} />

        <Text style={styles.label}>자치구 *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.purposeRow}>
          {DISTRICT_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.purposeChip, districtId === d.id && styles.purposeChipActive]}
              onPress={() => setDistrictId(d.id)}
            >
              <Text style={[styles.purposeChipText, districtId === d.id && styles.purposeChipTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>목적 *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.purposeRow}>
          {(Object.keys(PURPOSE_LABELS) as RoutePurpose[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.purposeChip, purpose === p && styles.purposeChipActive]}
              onPress={() => setPurpose(p)}
            >
              <Text style={[styles.purposeChipText, purpose === p && styles.purposeChipTextActive]}>
                {PURPOSE_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.stopsHeader}>
          <Text style={styles.label}>경유지 ({stops.length}/5) *</Text>
          <TouchableOpacity
            style={[styles.addStopBtn, (stops.length >= 5 || !districtId) && styles.addStopBtnDisabled]}
            onPress={() => {
              if (!districtId) { Alert.alert('자치구를 먼저 선택해주세요.'); return; }
              if (stops.length < 5) setShowPicker(true);
            }}
          >
            <Text style={[styles.addStopBtnText, (stops.length >= 5 || !districtId) && styles.addStopBtnTextDisabled]}>+ 추가</Text>
          </TouchableOpacity>
        </View>
        {stops.length === 0 && <Text style={styles.emptyStops}>경유지를 최소 2개 추가해주세요.</Text>}
        {stops.map((stop, i) => (
          <StopRow
            key={stop.place.id}
            stop={stop}
            index={i}
            total={stops.length}
            onRemove={() => setStops((prev) => prev.filter((_, idx) => idx !== i))}
            onMove={(dir) => moveStop(i, dir)}
          />
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={mutation.isPending}>
          <Text style={styles.submitButtonText}>{mutation.isPending ? '생성 중...' : '루트 생성'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 장소 선택 모달 */}
      <Modal visible={showPicker} animationType="slide" onRequestClose={() => { setShowPicker(false); setPendingPlace(null); }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pendingPlace ? '레이블 선택' : '장소 선택'}</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setPendingPlace(null); }}>
              <Text style={styles.modalClose}>닫기</Text>
            </TouchableOpacity>
          </View>

          {!pendingPlace ? (
            placesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
              <FlatList
                data={placesData?.places}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.placeItem} onPress={() => setPendingPlace(item)}>
                    <Text style={styles.placeItemName}>{item.name}</Text>
                    <Text style={styles.placeItemSub}>{CATEGORY_LABELS[item.category]}{item.address ? ` · ${item.address}` : ''}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyStops}>사용 가능한 장소가 없습니다. 먼저 장소를 추가해주세요.</Text>}
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
              <TouchableOpacity style={styles.confirmBtn} onPress={addStop}>
                <Text style={styles.confirmBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </SafeAreaView>
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

  purposeRow: { flexGrow: 0, marginBottom: 4 },
  purposeChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  purposeChipActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  purposeChipText: { color: '#666', fontSize: 14 },
  purposeChipTextActive: { color: '#3B82F6', fontWeight: '600' },

  stopsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  addStopBtn: { borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addStopBtnDisabled: { borderColor: '#ccc' },
  addStopBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 13 },
  addStopBtnTextDisabled: { color: '#ccc' },
  emptyStops: { color: '#bbb', textAlign: 'center', paddingVertical: 16, fontSize: 13 },

  stopRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginTop: 8, gap: 10 },
  stopOrder: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  stopOrderText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '600' },
  stopLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  stopActions: { flexDirection: 'row', gap: 4 },
  arrowBtn: { padding: 4 },
  arrowText: { fontSize: 16, color: '#3B82F6' },
  arrowDisabled: { color: '#ccc' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: '#EF4444' },

  submitButton: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalClose: { color: '#3B82F6', fontSize: 15 },

  placeItem: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 14 },
  placeItemName: { fontSize: 15, fontWeight: '600' },
  placeItemSub: { fontSize: 13, color: '#888', marginTop: 2 },

  labelPicker: { padding: 24, gap: 12 },
  labelPickerTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  labelOption: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  labelOptionActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  labelOptionText: { fontSize: 16, color: '#555' },
  labelOptionTextActive: { color: '#3B82F6', fontWeight: '700' },
  confirmBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
