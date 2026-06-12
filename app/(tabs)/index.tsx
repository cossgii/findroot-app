import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/ui';
import { SEOUL_DISTRICTS } from '../../constants/districts';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <Screen>
    <FlatList
      data={SEOUL_DISTRICTS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.headingRow}>
          <Text style={styles.heading}>지역 탐색</Text>
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/search')}>
            <Text style={styles.searchBtnText}>사용자 검색</Text>
          </TouchableOpacity>
        </View>
      }
      numColumns={3}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.chip}
          onPress={() => router.push(`/districts/${item.id}?name=${encodeURIComponent(item.name)}`)}
        >
          <Text style={styles.chipText}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: 'bold' },
  searchBtn: { borderWidth: 1, borderColor: '#3B82F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  searchBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  chip: { flex: 1, margin: 4, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 10, alignItems: 'center' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#111' },
});
