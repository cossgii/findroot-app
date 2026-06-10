import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchDistrictPlaces, fetchDistrictRoutes } from '../../services/districts';
import { PURPOSE_LABELS, CATEGORY_LABELS } from '../../types';
import type { Place, Route, PlaceCategory } from '../../types';

type Tab = 'places' | 'routes';
type Sort = 'recent' | 'likes';

function PlaceCard({ place }: { place: Place }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/places/${place.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{place.name}</Text>
        <Text style={styles.badge}>{CATEGORY_LABELS[place.category]}</Text>
      </View>
      {place.address ? <Text style={styles.cardSub} numberOfLines={1}>{place.address}</Text> : null}
      <Text style={styles.cardMeta}>♡ {place.likesCount}</Text>
    </TouchableOpacity>
  );
}

function RouteCard({ route }: { route: Route }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/routes/${route.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{route.name}</Text>
        <Text style={styles.badge}>{PURPOSE_LABELS[route.purpose]}</Text>
      </View>
      <Text style={styles.cardSub} numberOfLines={2}>{route.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>by {route.creator.name}</Text>
        <Text style={styles.cardMeta}>경유지 {route.places.length}곳  ♡ {route.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DistrictScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('places');
  const [sort, setSort] = useState<Sort>('recent');
  const [category, setCategory] = useState<PlaceCategory | undefined>(undefined);

  const districtName = decodeURIComponent(name ?? id);
  const isAll = id === 'all';

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['district-places', id, sort, category],
    queryFn: () => fetchDistrictPlaces({
      districtName: isAll ? '전체' : districtName,
      sort,
      category,
    }),
    enabled: tab === 'places',
  });

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['district-routes', id],
    queryFn: () => fetchDistrictRoutes(isAll ? '' : id),
    enabled: tab === 'routes',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>{districtName}</Text>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(['places', 'routes'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'places' ? '장소' : '루트'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 장소 필터 */}
      {tab === 'places' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['recent', 'likes'] as Sort[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, sort === s && styles.filterChipActive]}
              onPress={() => setSort(s)}
            >
              <Text style={[styles.filterChipText, sort === s && styles.filterChipTextActive]}>
                {s === 'recent' ? '최신순' : '인기순'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.filterChip, category === undefined && styles.filterChipActive]}
            onPress={() => setCategory(undefined)}
          >
            <Text style={[styles.filterChipText, category === undefined && styles.filterChipTextActive]}>전체</Text>
          </TouchableOpacity>
          {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.filterChip, category === c && styles.filterChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.filterChipText, category === c && styles.filterChipTextActive]}>
                {CATEGORY_LABELS[c]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 목록 */}
      {tab === 'places' ? (
        placesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={placesData?.places}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={<Text style={styles.empty}>장소가 없습니다.</Text>}
          />
        )
      ) : (
        routesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={routes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RouteCard route={item} />}
            ListEmptyComponent={<Text style={styles.empty}>루트가 없습니다.</Text>}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { padding: 16, paddingBottom: 0 },
  backText: { color: '#3B82F6', fontSize: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 15, color: '#999' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },

  filterRow: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 0 },
  filterChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  filterChipActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  filterChipText: { fontSize: 13, color: '#666' },
  filterChipTextActive: { color: '#3B82F6', fontWeight: '600' },

  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { fontSize: 11, color: '#10B981', borderWidth: 1, borderColor: '#10B981', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  cardSub: { fontSize: 13, color: '#666' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', color: '#bbb', paddingVertical: 40 },
});
