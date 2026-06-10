import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchFeaturedRoutes } from '../../services/routes';
import { PURPOSE_LABELS } from '../../types';
import type { Route } from '../../types';

function RouteCard({ route }: { route: Route }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/routes/${route.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{route.name}</Text>
        <Text style={styles.badge}>{PURPOSE_LABELS[route.purpose]}</Text>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{route.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>by {route.creator.name}</Text>
        <Text style={styles.cardMeta}>경유지 {route.places.length}곳  ♡ {route.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RoutesScreen() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['routes', 'featured'], queryFn: fetchFeaturedRoutes });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (isError) return <View style={styles.center}><Text>불러오기 실패</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.heading}>추천 루트</Text>}
      renderItem={({ item }) => <RouteCard route={item} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#eee', gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', flex: 1 },
  badge: { fontSize: 12, color: '#3B82F6', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  cardDesc: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { fontSize: 12, color: '#999' },
});
