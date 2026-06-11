import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedRoutes } from '../../services/routes';
import { RouteCard } from '../../components';
import { colors, font } from '../../constants/theme';

export default function HomeScreen() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['routes', 'featured'],
    queryFn: fetchFeaturedRoutes,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (isError) return <View style={styles.center}><Text>추천 루트를 불러오지 못했습니다.</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.heading}>추천 루트</Text>}
      renderItem={({ item }) => <RouteCard route={item} showCreator />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: font['3xl'], fontWeight: 'bold', marginBottom: 8, color: colors.text.primary },
});
