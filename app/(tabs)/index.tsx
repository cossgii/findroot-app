import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator, Alert, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useAtomValue } from 'jotai';
import { fetchPlaceLocations, searchPlaces } from '@/services/places';
import { fetchDistrictRoutes } from '@/services/districts';
import { PlaceCard, RouteCard, KakaoMap } from '@/components';
import { Chip, EmptyText, Screen } from '@/components/ui';
import { SEOUL_DISTRICTS } from '@/constants/districts';
import { userAtom } from '@/store/auth';
import { colors, font, radius, spacing } from '@/constants/theme';
import { CATEGORY_LABELS, PURPOSE_LABELS } from '@/types';
import type { Place, PlaceCategory, Route, RoutePurpose } from '@/types';

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const ALL_PURPOSES = Object.keys(PURPOSE_LABELS) as RoutePurpose[];
const EMPTY_LOCS: PlaceLoc[] = [];
const DROPDOWN_OPTIONS = [
  { id: 'nearby', name: '📍 내 주변' },
  // SEOUL_DISTRICTS already contains { id: 'all', name: '전체' } as first item
  ...SEOUL_DISTRICTS,
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function getNearestDistrictName(lat: number, lng: number): string {
  const districts = SEOUL_DISTRICTS.filter((d) => d.id !== 'all');
  let nearest = districts[0];
  let minDist = Infinity;
  for (const d of districts) {
    const dist = haversineKm(lat, lng, d.lat, d.lng);
    if (dist < minDist) { minDist = dist; nearest = d; }
  }
  return nearest.name;
}

type PlaceLoc = { id: string; name: string; latitude: number; longitude: number };
type NearbyItem = PlaceLoc & { distance: number };

function NearbyPlaceItem({ item, onPress }: { item: NearbyItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.nearbyItem} onPress={onPress}>
      <Text style={styles.nearbyName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.nearbyDist}>{fmtDist(item.distance)}</Text>
    </TouchableOpacity>
  );
}

type Mode = 'places' | 'routes';
type Sort = 'recent' | 'likes';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAtomValue(userAtom);

  const [selectedDistrict, setSelectedDistrict] = useState('nearby');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [mode, setMode] = useState<Mode>('places');
  const [placeSort, setPlaceSort] = useState<Sort>('recent');
  const [category, setCategory] = useState<PlaceCategory | undefined>();
  const [routeSort, setRouteSort] = useState<Sort>('recent');
  const [purpose, setPurpose] = useState<RoutePurpose | undefined>();
  const [showPurposeModal, setShowPurposeModal] = useState(false);

  const [placePage, setPlacePage] = useState(1);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [routePage, setRoutePage] = useState(1);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const isNearby = selectedDistrict === 'nearby';
  const isAll = selectedDistrict === 'all';
  const districtInfo = SEOUL_DISTRICTS.find((d) => d.id === selectedDistrict);
  const districtName = districtInfo?.name;

  const mapLevel = isNearby ? 5 : isAll ? 8 : 6;

  // For nearby mode: find the closest district to the user's coordinates
  const nearbyDistrictName = useMemo(() => {
    if (!isNearby) return undefined;
    const c = userLocation ?? SEOUL_CENTER;
    return getNearestDistrictName(c.lat, c.lng);
  }, [isNearby, userLocation]);

  const { data: placeLocations = EMPTY_LOCS, isLoading: placeLocsLoading } = useQuery<PlaceLoc[]>({
    queryKey: ['place-locations', selectedDistrict, nearbyDistrictName],
    queryFn: () => fetchPlaceLocations(isNearby ? nearbyDistrictName : isAll ? '전체' : districtName),
    enabled: mode === 'places',
  });

  const nearbyItems = useMemo<NearbyItem[]>(() => {
    if (!isNearby) return [];
    const c = userLocation ?? SEOUL_CENTER;
    return [...placeLocations]
      .filter((p) => p.latitude && p.longitude)
      .map((p) => ({ ...p, distance: haversineKm(c.lat, c.lng, p.latitude, p.longitude) }))
      .sort((a, b) => a.distance - b.distance);
  }, [isNearby, placeLocations, userLocation]);

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['home-places', selectedDistrict, placeSort, category, placePage],
    queryFn: () => searchPlaces({ district: isAll ? undefined : districtName, sort: placeSort, category, page: placePage }),
    enabled: !isNearby && mode === 'places',
  });

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['home-routes', selectedDistrict, routeSort, purpose, routePage],
    queryFn: () =>
      fetchDistrictRoutes({
        districtId: isAll ? undefined : selectedDistrict,
        sort: routeSort,
        purpose,
        page: routePage,
      }),
    enabled: mode === 'routes' && !!purpose && !isNearby,
  });

  useEffect(() => {
    if (placesData?.places) {
      setAllPlaces((prev) => (placePage === 1 ? placesData.places : [...prev, ...placesData.places]));
    }
  }, [placesData]);

  useEffect(() => {
    if (routesData?.routes) {
      setAllRoutes((prev) => (routePage === 1 ? routesData.routes : [...prev, ...routesData.routes]));
    }
  }, [routesData]);

  function selectDistrict(id: string) {
    setSelectedDistrict(id);
    setShowDropdown(false);
    if (id === 'nearby') setMode('places');
    setPlacePage(1);
    setAllPlaces([]);
    setRoutePage(1);
    setAllRoutes([]);
    setCategory(undefined);
  }

  function switchToRoutes() {
    if (!user) {
      Alert.alert('로그인 필요', '루트를 보려면 로그인이 필요합니다.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setMode('routes');
    if (!purpose) setShowPurposeModal(true);
  }

  const selectedLabel = DROPDOWN_OPTIONS.find((o) => o.id === selectedDistrict)?.name ?? '내 주변';

  const mapMarkers = useMemo(
    () =>
      isNearby
        ? nearbyItems.map((p) => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude }))
        : placeLocations.map((p) => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude })),
    [isNearby, nearbyItems, placeLocations],
  );

  const mapCenter = useMemo(
    () =>
      isNearby
        ? (userLocation ?? SEOUL_CENTER)
        : isAll
        ? SEOUL_CENTER
        : { lat: districtInfo?.lat ?? SEOUL_CENTER.lat, lng: districtInfo?.lng ?? SEOUL_CENTER.lng },
    [isNearby, isAll, userLocation, districtInfo],
  );

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDropdown(true)}>
          <Text style={styles.dropdownText}>{selectedLabel}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/search')}>
          <Text style={styles.searchBtnText}>사용자 검색</Text>
        </TouchableOpacity>
      </View>

      {mode === 'places' && (
        <KakaoMap
          center={mapCenter}
          level={mapLevel}
          markers={mapMarkers}
          onMarkerPress={(id) => router.push(`/places/${id}`)}
          style={styles.map}
        />
      )}

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'places' && styles.toggleActive]}
          onPress={() => setMode('places')}
        >
          <Text style={[styles.toggleText, mode === 'places' && styles.toggleTextActive]}>장소</Text>
        </TouchableOpacity>
        {!isNearby && (
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'routes' && styles.toggleActive]}
            onPress={mode === 'routes' ? undefined : switchToRoutes}
          >
            <Text style={[styles.toggleText, mode === 'routes' && styles.toggleTextActive]}>
              루트{purpose ? ` · ${PURPOSE_LABELS[purpose]}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isNearby ? (
        placeLocsLoading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={nearbyItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <NearbyPlaceItem item={item} onPress={() => router.push(`/places/${item.id}`)} />
            )}
            ListEmptyComponent={<EmptyText>주변 장소가 없습니다.</EmptyText>}
          />
        )
      ) : mode === 'places' ? (
        placesLoading && placePage === 1 ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={allPlaces}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                <Chip label="최신순" active={placeSort === 'recent'} onPress={() => { setPlaceSort('recent'); setPlacePage(1); setAllPlaces([]); }} style={styles.chip} />
                <Chip label="인기순" active={placeSort === 'likes'} onPress={() => { setPlaceSort('likes'); setPlacePage(1); setAllPlaces([]); }} style={styles.chip} />
                <Chip label="전체" active={!category} onPress={() => { setCategory(undefined); setPlacePage(1); setAllPlaces([]); }} style={styles.chip} />
                {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
                  <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => { setCategory(c); setPlacePage(1); setAllPlaces([]); }} style={styles.chip} />
                ))}
              </ScrollView>
            }
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={!placesLoading ? <EmptyText>장소가 없습니다.</EmptyText> : null}
            onEndReached={() => {
              if (placesData && placePage < placesData.totalPages && !placesLoading) setPlacePage((p) => p + 1);
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={placesLoading && placePage > 1 ? <ActivityIndicator style={styles.footerLoader} /> : null}
          />
        )
      ) : !purpose ? null : routesLoading && routePage === 1 ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={allRoutes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.routeFilterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chip label="최신순" active={routeSort === 'recent'} onPress={() => { setRouteSort('recent'); setRoutePage(1); setAllRoutes([]); }} style={styles.chip} />
                <Chip label="인기순" active={routeSort === 'likes'} onPress={() => { setRouteSort('likes'); setRoutePage(1); setAllRoutes([]); }} style={styles.chip} />
              </ScrollView>
              <TouchableOpacity style={styles.purposeChange} onPress={() => setShowPurposeModal(true)}>
                <Text style={styles.purposeChangeText}>목적 변경</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <RouteCard route={item} showCreator />}
          ListEmptyComponent={!routesLoading ? <EmptyText>루트가 없습니다.</EmptyText> : null}
          onEndReached={() => {
            if (routesData && routePage < routesData.totalPages && !routesLoading) setRoutePage((p) => p + 1);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={routesLoading && routePage > 1 ? <ActivityIndicator style={styles.footerLoader} /> : null}
        />
      )}

      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDropdown(false)} />
          <View style={styles.dropdownSheet}>
            <Text style={styles.modalTitle}>지역 선택</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DROPDOWN_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.dropdownItem, selectedDistrict === item.id && styles.dropdownItemActive]}
                  onPress={() => selectDistrict(item.id)}
                >
                  <Text style={[styles.dropdownItemText, selectedDistrict === item.id && styles.dropdownItemTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPurposeModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowPurposeModal(false); if (!purpose) setMode('places'); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowPurposeModal(false); if (!purpose) setMode('places'); }}
        >
          <View style={styles.purposeSheet}>
            <Text style={styles.modalTitle}>어떤 목적으로 탐색하시나요?</Text>
            {ALL_PURPOSES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.purposeItem, purpose === p && styles.purposeItemActive]}
                onPress={() => { setPurpose(p); setShowPurposeModal(false); setRoutePage(1); setAllRoutes([]); }}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg.muted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  dropdownText: { fontSize: font.lg, fontWeight: '700', color: colors.text.primary },
  dropdownArrow: { fontSize: 10, color: colors.text.secondary },
  searchBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  searchBtnText: { color: colors.primary, fontSize: font.sm, fontWeight: '600' },

  map: { height: 240 },

  toggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.bg.white },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: font.base, fontWeight: '600', color: colors.text.secondary },
  toggleTextActive: { color: '#fff' },

  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexGrow: 0 },
  chip: { marginRight: 6 },
  routeFilterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  purposeChange: { marginLeft: spacing.sm },
  purposeChangeText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },

  list: { gap: 10, padding: spacing.lg },
  footerLoader: { marginVertical: 16 },

  nearbyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.muted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  nearbyName: { fontSize: font.base, fontWeight: '600', color: colors.text.primary, flex: 1 },
  nearbyDist: { fontSize: font.sm, color: colors.primary, fontWeight: '700', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dropdownSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg * 2,
    borderTopRightRadius: radius.lg * 2,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  purposeSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg * 2,
    borderTopRightRadius: radius.lg * 2,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: font.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.lg, textAlign: 'center' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: spacing.lg, borderRadius: radius.md, marginBottom: 4 },
  dropdownItemActive: { backgroundColor: colors.primary + '20' },
  dropdownItemText: { fontSize: font.lg, color: colors.text.body },
  dropdownItemTextActive: { color: colors.primary, fontWeight: '700' },
  purposeItem: { paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.bg.muted },
  purposeItemActive: { backgroundColor: colors.primary },
  purposeItemText: { fontSize: font.lg, fontWeight: '600', color: colors.text.body, textAlign: 'center' },
  purposeItemTextActive: { color: '#fff' },
});
