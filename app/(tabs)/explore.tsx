import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SEOUL_DISTRICTS } from '../../constants/districts';

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <FlatList
      data={SEOUL_DISTRICTS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.heading}>지역 탐색</Text>}
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
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  chip: {
    flex: 1,
    margin: 4,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '500', color: '#111' },
});
