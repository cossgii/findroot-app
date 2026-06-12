import { useState, useEffect } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchDistrictPlaces, fetchDistrictRoutes } from '../../services/districts';
import { PlaceCard, RouteCard } from '../../components';
import { BackButton, Chip, EmptyText, Screen } from '../../components/ui';
import { CATEGORY_LABELS, PURPOSE_LABELS } from '../../types';
import { userAtom } from '../../store/auth';
import { colors, font, radius, spacing } from '../../constants/theme';
import type { PlaceCategory, RoutePurpose, Place, Route } from '../../types';

type Mode = 'places' | 'routes';
type Sort = 'recent' | 'likes';

const ALL_PURPOSES = Object.keys(PURPOSE_LABELS) as RoutePurpose[];

export default function DistrictScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);

  const [mode, setMode] = useState<Mode>('places');
  const [placeSort, setPlaceSort] = useState<Sort>('recent');
  const [routeSort, setRouteSort] = useState<Sort>('recent');
  const [category, setCategory] = useState<PlaceCategory | undefined>(undefined);
  const [purpose, setPurpose] = useState<RoutePurpose | undefined>(undefined);
  const [purposeModalVisible, setPurposeModalVisible] = useState(false);

  const [placePage, setPlacePage] = useState(1);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [routePage, setRoutePage] = useState(1);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);

  const districtName = decodeURIComponent(name ?? id);
  const isAll = id === 'all';

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['district-places', id, placeSort, category, placePage],
    queryFn: () => fetchDistrictPlaces({
      districtName: isAll ? '전체' : districtName,
      sort: placeSort,
      category,
      page: placePage,
    }),
    enabled: mode === 'places',
  });

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['district-routes', id, routeSort, purpose, routePage],
    queryFn: () => fetchDistrictRoutes({
      districtId: isAll ? undefined : id,
      sort: routeSort,
      purpose,
      page: routePage,
    }),
    enabled: mode === 'routes' && !!purpose,
  });

  useEffect(() => {
    if (placesData?.places) {
      setAllPlaces((prev) => placePage === 1 ? placesData.places : [...prev, ...placesData.places]);
    }
  }, [placesData]);

  useEffect(() => {
    if (routesData?.routes) {
      setAllRoutes((prev) => routePage === 1 ? routesData.routes : [...prev, ...routesData.routes]);
    }
  }, [routesData]);

  function resetPlaces() {
    setPlacePage(1);
    setAllPlaces([]);
  }

  function resetRoutes() {
    setRoutePage(1);
    setAllRoutes([]);
  }

  function handleRouteToggle() {
    if (!user) {
      Alert.alert('로그인 필요', '루트를 보려면 로그인이 필요합니다.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setPurposeModalVisible(true);
  }

  function handlePurposeSelect(p: RoutePurpose) {
    setPurpose(p);
    setPurposeModalVisible(false);
    resetRoutes();
    setMode('routes');
  }

  function handlePlaceToggle() {
    setMode('places');
    setPurpose(undefined);
  }

  function handlePlaceSortChange(s: Sort) {
    setPlaceSort(s);
    resetPlaces();
  }

  function handleCategoryChange(c: PlaceCategory | undefined) {
    setCategory(c);
    resetPlaces();
  }

  function handleRouteSortChange(s: Sort) {
    setRouteSort(s);
    resetRoutes();
  }

  return (
    <Screen style={styles.container}>
      <BackButton style={styles.back} />
      <Text style={styles.heading}>{districtName}</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'places' && styles.toggleActive]}
          onPress={handlePlaceToggle}
        >
          <Text style={[styles.toggleText, mode === 'places' && styles.toggleTextActive]}>장소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'routes' && styles.toggleActive]}
          onPress={mode === 'routes' ? undefined : handleRouteToggle}
        >
          <Text style={[styles.toggleText, mode === 'routes' && styles.toggleTextActive]}>
            루트{purpose ? ` · ${PURPOSE_LABELS[purpose]}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'places' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Chip label="최신순" active={placeSort === 'recent'} onPress={() => handlePlaceSortChange('recent')} style={styles.chip} />
          <Chip label="인기순" active={placeSort === 'likes'} onPress={() => handlePlaceSortChange('likes')} style={styles.chip} />
          <Chip label="전체" active={category === undefined} onPress={() => handleCategoryChange(undefined)} style={styles.chip} />
          {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => handleCategoryChange(c)} style={styles.chip} />
          ))}
        </ScrollView>
      )}

      {mode === 'routes' && (
        <View style={styles.routeFilterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip label="최신순" active={routeSort === 'recent'} onPress={() => handleRouteSortChange('recent')} style={styles.chip} />
            <Chip label="인기순" active={routeSort === 'likes'} onPress={() => handleRouteSortChange('likes')} style={styles.chip} />
          </ScrollView>
          <TouchableOpacity style={styles.purposeChange} onPress={() => setPurposeModalVisible(true)}>
            <Text style={styles.purposeChangeText}>목적 변경</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'places' ? (
        placesLoading && placePage === 1 ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={allPlaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={!placesLoading ? <EmptyText>장소가 없습니다.</EmptyText> : null}
            onEndReached={() => {
              if (placesData && placePage < placesData.totalPages && !placesLoading) setPlacePage((p) => p + 1);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={placesLoading && placePage > 1 ? <ActivityIndicator style={styles.footerLoader} /> : null}
          />
        )
      ) : (
        !purpose ? null :
        routesLoading && routePage === 1 ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={allRoutes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RouteCard route={item} showCreator />}
            ListEmptyComponent={!routesLoading ? <EmptyText>루트가 없습니다.</EmptyText> : null}
            onEndReached={() => {
              if (routesData && routePage < routesData.totalPages && !routesLoading) setRoutePage((p) => p + 1);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={routesLoading && routePage > 1 ? <ActivityIndicator style={styles.footerLoader} /> : null}
          />
        )
      )}

      <Modal
        visible={purposeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPurposeModalVisible(false);
          if (!purpose) setMode('places');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setPurposeModalVisible(false);
            if (!purpose) setMode('places');
          }}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>어떤 목적으로 탐색하시나요?</Text>
            {ALL_PURPOSES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.purposeItem, purpose === p && styles.purposeItemActive]}
                onPress={() => handlePurposeSelect(p)}
              >
                <Text style={[styles.purposeItemText, purpose === p && styles.purposeItemTextActive]}>
                  {PURPOSE_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg.white },
  back: { padding: spacing.lg, paddingBottom: 0 },
  heading: { fontSize: font['3xl'], fontWeight: 'bold', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, color: colors.text.primary },

  toggle: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.bg.white },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: font.base, fontWeight: '600', color: colors.text.secondary },
  toggleTextActive: { color: '#fff' },

  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexGrow: 0 },
  chip: { marginRight: 6 },

  routeFilterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  purposeChange: { marginLeft: spacing.sm },
  purposeChangeText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },

  list: { padding: spacing.lg, gap: 10 },
  footerLoader: { marginVertical: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg * 2, borderTopRightRadius: radius.lg * 2, padding: spacing.xl, paddingBottom: 40 },
  modalTitle: { fontSize: font.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.lg, textAlign: 'center' },
  purposeItem: { paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.bg.muted },
  purposeItemActive: { backgroundColor: colors.primary },
  purposeItemText: { fontSize: font.lg, fontWeight: '600', color: colors.text.body, textAlign: 'center' },
  purposeItemTextActive: { color: '#fff' },
});
