import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedRoutes } from '../../services/routes';
import { RouteCard } from '../../components';
import { Chip, EmptyText } from '../../components/ui';
import { PURPOSE_LABELS } from '../../types';
import { colors, font } from '../../constants/theme';
import type { RoutePurpose } from '../../types';

const ALL_PURPOSES = Object.keys(PURPOSE_LABELS) as RoutePurpose[];

export default function RoutesScreen() {
  const [purpose, setPurpose] = useState<RoutePurpose | undefined>(undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['routes', 'browse', purpose],
    queryFn: () => fetchFeaturedRoutes(purpose ? { purpose } : undefined),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>루트 탐색</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <Chip label="전체" active={purpose === undefined} onPress={() => setPurpose(undefined)} style={styles.chip} />
        {ALL_PURPOSES.map((p) => (
          <Chip key={p} label={PURPOSE_LABELS[p]} active={purpose === p} onPress={() => setPurpose(p)} style={styles.chip} />
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      ) : isError ? (
        <View style={styles.center}><Text>불러오기 실패</Text></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RouteCard route={item} showCreator />}
          ListEmptyComponent={<EmptyText>루트가 없습니다.</EmptyText>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.white },
  heading: { fontSize: font['3xl'], fontWeight: 'bold', padding: 16, paddingBottom: 8, color: colors.text.primary },
  filterRow: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  chip: { marginRight: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
});
