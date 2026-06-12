import { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '../components/ui';
import { useRouter } from 'expo-router';
import { searchUsers } from '../services/users';
import { UserListItem } from '../components';
import { EmptyText } from '../components/ui';
import { colors, font } from '../constants/theme';
import type { UserSummary } from '../types';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchUsers(query.trim()));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>사용자 검색</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="이름으로 검색..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
          returnKeyType="search"
        />
        {loading && <ActivityIndicator style={styles.spinner} />}
      </View>

      {query.trim().length > 0 && !loading && (
        <Text style={styles.count}>검색 결과 {results.length}명</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <UserListItem user={item} showChevron />}
        ListEmptyComponent={
          query.trim() && !loading ? <EmptyText>검색 결과가 없습니다.</EmptyText> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg.white },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: font.lg, backgroundColor: colors.bg.input },
  spinner: { marginLeft: 10 },
  count: { fontSize: font.md, color: colors.text.hint, paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16 },
});
