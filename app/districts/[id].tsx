import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchDistrictPlaces, fetchDistrictRoutes } from '../../services/districts';
import { PlaceCard, RouteCard } from '../../components';
import { BackButton, Chip, EmptyText, TabBar } from '../../components/ui';
import { CATEGORY_LABELS } from '../../types';
import { colors, font } from '../../constants/theme';
import type { PlaceCategory } from '../../types';

type Tab = 'places' | 'routes';
type Sort = 'recent' | 'likes';

export default function DistrictScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [tab, setTab] = useState<Tab>('places');
  const [sort, setSort] = useState<Sort>('recent');
  const [category, setCategory] = useState<PlaceCategory | undefined>(undefined);

  const districtName = decodeURIComponent(name ?? id);
  const isAll = id === 'all';

  const { data: placesData, isLoading: placesLoading } = useQuery({
    queryKey: ['district-places', id, sort, category],
    queryFn: () => fetchDistrictPlaces({ districtName: isAll ? '전체' : districtName, sort, category }),
    enabled: tab === 'places',
  });

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['district-routes', id],
    queryFn: () => fetchDistrictRoutes(isAll ? '' : id),
    enabled: tab === 'routes',
  });

  return (
    <View style={styles.container}>
      <BackButton style={styles.back} />
      <Text style={styles.heading}>{districtName}</Text>

      <TabBar
        tabs={[{ key: 'places', label: '장소' }, { key: 'routes', label: '루트' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'places' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Chip label="최신순" active={sort === 'recent'} onPress={() => setSort('recent')} style={styles.chip} />
          <Chip label="인기순" active={sort === 'likes'} onPress={() => setSort('likes')} style={styles.chip} />
          <Chip label="전체" active={category === undefined} onPress={() => setCategory(undefined)} style={styles.chip} />
          {(['MEAL', 'DRINK'] as PlaceCategory[]).map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(c)} style={styles.chip} />
          ))}
        </ScrollView>
      )}

      {tab === 'places' ? (
        placesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={placesData?.places}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PlaceCard place={item} />}
            ListEmptyComponent={<EmptyText>장소가 없습니다.</EmptyText>}
          />
        )
      ) : (
        routesLoading ? <ActivityIndicator style={{ flex: 1 }} size="large" /> : (
          <FlatList
            data={routes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <RouteCard route={item} showCreator />}
            ListEmptyComponent={<EmptyText>루트가 없습니다.</EmptyText>}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.white },
  back: { padding: 16, paddingBottom: 0 },
  heading: { fontSize: font['3xl'], fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, color: colors.text.primary },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 0 },
  chip: { marginRight: 6 },
  list: { padding: 16, gap: 10 },
});
