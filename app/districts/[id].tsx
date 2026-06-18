import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { fetchDistrictPlaces, fetchDistrictRoutes } from '@/services/districts';
import { fetchPlaceLocations } from '@/services/places';
import { fetchFollowing, searchUsers } from '@/services/users';
import { PlaceCard, RouteCard } from '@/components';
import FeaturedRouteCarousel from '@/components/FeaturedRouteCarousel';
import KakaoMap from '@/components/KakaoMap';
import { BackButton, Chip, EmptyText, Screen, UserAvatar } from '@/components/ui';
import { CATEGORY_LABELS, PURPOSE_LABELS } from '@/types';
import { userAtom } from '@/store/auth';
import { SEOUL_DISTRICTS } from '@/constants/districts';
import { colors, font, radius, spacing } from '@/constants/theme';
import type { PlaceCategory, RoutePurpose, Place, Route, UserSummary } from '@/types';

type Mode = 'places' | 'routes';
type Sort = 'recent' | 'likes';

type ContentCreator =
  | { type: 'recommended' }
  | { type: 'me' }
  | { type: 'user'; userId: string; userName: string; userImage: string | null };

const ALL_PURPOSES = Object.keys(PURPOSE_LABELS) as RoutePurpose[];

export default function DistrictScreen() {
  const { id, creator: creatorParam, creatorName: creatorNameParam } =
    useLocalSearchParams<{ id: string; creator?: string; creatorName?: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);

  const isAll = id === 'all';
  const districtInfo = SEOUL_DISTRICTS.find((d) => d.id === id);
  const districtName = districtInfo?.name ?? '전체';
  const mapCenter = districtInfo
    ? { lat: districtInfo.lat, lng: districtInfo.lng }
    : { lat: 37.5665, lng: 126.978 };

  const [mode, setMode] = useState<Mode>('places');
  const [placeSort, setPlaceSort] = useState<Sort>('recent');
  const [routeSort, setRouteSort] = useState<Sort>('recent');
  const [category, setCategory] = useState<PlaceCategory | undefined>(undefined);
  const [purpose, setPurpose] = useState<RoutePurpose | undefined>(undefined);
  const [purposeReady, setPurposeReady] = useState(false);
  const [purposeModalVisible, setPurposeModalVisible] = useState(false);

  const [placePage, setPlacePage] = useState(1);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [routePage, setRoutePage] = useState(1);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);

  // 크리에이터 필터
  const [creator, setCreator] = useState<ContentCreator>(() =>
    creatorParam
      ? { type: 'user', userId: creatorParam, userName: decodeURIComponent(creatorNameParam ?? ''), userImage: null }
      : { type: 'recommended' }
  );
  const [showCreatorPanel, setShowCreatorPanel] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  function handleSearchChange(text: string) {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 400);
  }

  const targetUserId =
    creator.type === 'user' ? creator.userId :
    creator.type === 'me' ? user?.id :
    undefined;

  // 팔로잉 목록
  const { data: followingData } = useQuery({
    queryKey: ['following'],
    queryFn: () => fetchFollowing(),
    enabled: showCreatorPanel && !!user,
  });
  const followingList: UserSummary[] = followingData?.data ?? [];

  // 유저 검색
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['creator-search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  const { data: placeLocations = [] } = useQuery({
    queryKey: ['place-locations', id, targetUserId],
    queryFn: () => fetchPlaceLocations(isAll ? '전체' : districtName, targetUserId),
    enabled: mode === 'places',
  });

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['district-places', id, placeSort, category, placePage, targetUserId],
    queryFn: () => fetchDistrictPlaces({
      districtName: isAll ? '전체' : districtName,
      sort: placeSort,
      category,
      page: placePage,
      targetUserId,
    }),
    enabled: mode === 'places',
  });

  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ['district-routes', id, routeSort, purpose, routePage, targetUserId],
    queryFn: () => fetchDistrictRoutes({
      districtId: isAll ? undefined : id,
      sort: routeSort,
      purpose,
      page: routePage,
      targetUserId,
    }),
    enabled: mode === 'routes' && purposeReady,
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

  function resetPlaces() { setPlacePage(1); setAllPlaces([]); }
  function resetRoutes() { setRoutePage(1); setAllRoutes([]); }

  function handleCreatorSelect(next: ContentCreator) {
    setCreator(next);
    setShowCreatorPanel(false);
    setDebouncedSearch('');
    searchInputRef.current?.clear();
    resetPlaces();
    resetRoutes();
  }

  function handleRouteToggle() {
    if (!user) {
      Alert.alert('로그인 필요', '루트를 보려면 로그인이 필요합니다.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setMode('routes');
    if (!purposeReady) setPurposeModalVisible(true);
  }

  function handlePurposeSelect(p: RoutePurpose | 'ALL') {
    setPurpose(p === 'ALL' ? undefined : p);
    setPurposeReady(true);
    setPurposeModalVisible(false);
    resetRoutes();
  }

  function creatorLabel(): string {
    if (creator.type === 'recommended') return '⭐ 추천';
    if (creator.type === 'me') return '👤 내 콘텐츠';
    return creator.userName;
  }

  const displayUsers: UserSummary[] = debouncedSearch.length > 0 ? searchResults : followingList;

  return (
    <Screen style={styles.container}>
      <BackButton style={styles.back} />
      <Text style={styles.heading}>{districtName}</Text>

      {mode === 'places' && (
        <KakaoMap
          center={mapCenter}
          level={isAll ? 8 : 6}
          markers={placeLocations.map((p: any) => ({
            id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude,
          }))}
          onMarkerPress={(placeId) => router.push(`/places/${placeId}`)}
          style={styles.map}
        />
      )}
      {mode === 'routes' && purposeReady && (
        <FeaturedRouteCarousel districtId={id} purpose={purpose} creatorId={targetUserId} />
      )}

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'places' && styles.toggleActive]}
          onPress={() => { setMode('places'); setPurpose(undefined); setPurposeReady(false); }}
        >
          <Text style={[styles.toggleText, mode === 'places' && styles.toggleTextActive]}>장소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'routes' && styles.toggleActive]}
          onPress={mode === 'routes' ? undefined : handleRouteToggle}
        >
          <Text style={[styles.toggleText, mode === 'routes' && styles.toggleTextActive]}>루트</Text>
        </TouchableOpacity>
      </View>

      {/* 크리에이터 필터 칩 */}
      <View style={styles.creatorRow}>
        <TouchableOpacity
          style={[styles.creatorChip, creator.type !== 'recommended' && styles.creatorChipActive]}
          onPress={() => user ? setShowCreatorPanel(true) : Alert.alert('로그인 필요', '로그인 후 이용하세요.')}
        >
          {creator.type === 'user' && (
            <UserAvatar name={creator.userName} image={creator.userImage} size={18} />
          )}
          <Text style={[styles.creatorChipText, creator.type !== 'recommended' && styles.creatorChipTextActive]}>
            {creatorLabel()}
          </Text>
          <Text style={styles.creatorChipArrow}>▾</Text>
        </TouchableOpacity>
      </View>

      {mode === 'places' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Chip label="최신순" active={placeSort === 'recent'} onPress={() => { setPlaceSort('recent'); resetPlaces(); }} style={styles.chip} />
          <Chip label="인기순" active={placeSort === 'likes'} onPress={() => { setPlaceSort('likes'); resetPlaces(); }} style={styles.chip} />
          <Chip label="전체" active={category === undefined} onPress={() => { setCategory(undefined); resetPlaces(); }} style={styles.chip} />
          {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => { setCategory(c); resetPlaces(); }} style={styles.chip} />
          ))}
        </ScrollView>
      )}

      {mode === 'routes' && (
        <View style={styles.routeFilterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip label="최신순" active={routeSort === 'recent'} onPress={() => { setRouteSort('recent'); resetRoutes(); }} style={styles.chip} />
            <Chip label="인기순" active={routeSort === 'likes'} onPress={() => { setRouteSort('likes'); resetRoutes(); }} style={styles.chip} />
          </ScrollView>
          <TouchableOpacity style={styles.purposeChange} onPress={() => setPurposeModalVisible(true)}>
            <Text style={styles.purposeChangeText}>{purposeReady ? (purpose ? PURPOSE_LABELS[purpose] : '전체') : '목적'} ▾</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'places' ? (
        placesLoading && placePage === 1 ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            style={{ flex: 1 }}
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
            style={{ flex: 1 }}
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

      {/* 목적 선택 모달 */}
      <Modal
        visible={purposeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setPurposeModalVisible(false); if (!purposeReady) setMode('places'); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setPurposeModalVisible(false); if (!purposeReady) setMode('places'); }}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>어떤 목적으로 탐색하시나요?</Text>
            <TouchableOpacity
              style={[styles.purposeItem, purposeReady && !purpose && styles.purposeItemActive]}
              onPress={() => handlePurposeSelect('ALL')}
            >
              <Text style={[styles.purposeItemText, purposeReady && !purpose && styles.purposeItemTextActive]}>전체</Text>
            </TouchableOpacity>
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

      {/* 크리에이터 선택 패널 */}
      <Modal
        visible={showCreatorPanel}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowCreatorPanel(false); setDebouncedSearch(''); searchInputRef.current?.clear(); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setShowCreatorPanel(false); setDebouncedSearch(''); searchInputRef.current?.clear(); }}
        >
          <View style={[styles.modalSheet, styles.creatorSheet]}>
            <Text style={styles.modalTitle}>콘텐츠 필터</Text>

            {/* 퀵 선택 */}
            <View style={styles.creatorQuickRow}>
              <TouchableOpacity
                style={[styles.creatorQuickBtn, creator.type === 'recommended' && styles.creatorQuickActive]}
                onPress={() => handleCreatorSelect({ type: 'recommended' })}
              >
                <Text style={styles.creatorQuickIcon}>⭐</Text>
                <Text style={[styles.creatorQuickText, creator.type === 'recommended' && styles.creatorQuickTextActive]}>추천</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.creatorQuickBtn, creator.type === 'me' && styles.creatorQuickActive]}
                onPress={() => handleCreatorSelect({ type: 'me' })}
              >
                <Text style={styles.creatorQuickIcon}>👤</Text>
                <Text style={[styles.creatorQuickText, creator.type === 'me' && styles.creatorQuickTextActive]}>내 콘텐츠</Text>
              </TouchableOpacity>
            </View>

            {/* 유저 검색 */}
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="이름으로 검색"
              placeholderTextColor={colors.text.hint}
              onChangeText={handleSearchChange}
            />

            <Text style={styles.panelSectionTitle}>
              {debouncedSearch.length > 0 ? '검색 결과' : '팔로잉'}
            </Text>

            {isSearching ? (
              <ActivityIndicator style={{ marginTop: 16 }} />
            ) : displayUsers.length === 0 ? (
              <Text style={styles.panelEmpty}>
                {debouncedSearch.length > 0 ? '검색 결과가 없습니다.' : '팔로잉하는 사용자가 없습니다.'}
              </Text>
            ) : (
              <FlatList
                data={displayUsers}
                keyExtractor={(item) => item.id}
                style={styles.userList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      creator.type === 'user' && creator.userId === item.id && styles.userItemActive,
                    ]}
                    onPress={() => handleCreatorSelect({
                      type: 'user',
                      userId: item.id,
                      userName: item.name ?? '사용자',
                      userImage: item.image,
                    })}
                  >
                    <UserAvatar name={item.name ?? '?'} image={item.image} size={36} />
                    <Text style={styles.userItemName}>{item.name ?? '사용자'}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
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
  map: { height: 260, marginBottom: 4 },
  toggle: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.bg.white },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: font.base, fontWeight: '600', color: colors.text.secondary },
  toggleTextActive: { color: '#fff' },

  creatorRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  creatorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.bg.white,
  },
  creatorChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  creatorChipText: { fontSize: font.sm, fontWeight: '600', color: colors.text.secondary },
  creatorChipTextActive: { color: colors.primary },
  creatorChipArrow: { fontSize: 10, color: colors.text.hint },

  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexGrow: 0 },
  chip: { marginRight: 6 },
  routeFilterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  purposeChange: { marginLeft: spacing.sm },
  purposeChangeText: { fontSize: font.sm, color: colors.primary, fontWeight: '600' },

  list: { gap: 10, paddingBottom: spacing.lg },
  footerLoader: { marginVertical: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg * 2, borderTopRightRadius: radius.lg * 2, padding: spacing.xl, paddingBottom: 40 },
  creatorSheet: { maxHeight: '75%' },
  modalTitle: { fontSize: font.xl, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.lg, textAlign: 'center' },
  purposeItem: { paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.bg.muted },
  purposeItemActive: { backgroundColor: colors.primary },
  purposeItemText: { fontSize: font.lg, fontWeight: '600', color: colors.text.body, textAlign: 'center' },
  purposeItemTextActive: { color: '#fff' },

  creatorQuickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  creatorQuickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg.white },
  creatorQuickActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  creatorQuickIcon: { fontSize: 16 },
  creatorQuickText: { fontSize: font.base, fontWeight: '600', color: colors.text.secondary },
  creatorQuickTextActive: { color: colors.primary },

  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: font.base, color: colors.text.primary, marginBottom: spacing.md },
  panelSectionTitle: { fontSize: font.sm, fontWeight: '600', color: colors.text.hint, marginBottom: spacing.sm },
  panelEmpty: { textAlign: 'center', color: colors.text.muted, marginTop: spacing.lg, fontSize: font.sm },
  userList: { flexGrow: 0, maxHeight: 220 },
  userItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, paddingHorizontal: spacing.sm, borderRadius: radius.md },
  userItemActive: { backgroundColor: colors.primary + '15' },
  userItemName: { fontSize: font.base, fontWeight: '500', color: colors.text.primary },
});
