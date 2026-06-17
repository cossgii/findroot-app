import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, font, radius, spacing } from '@/constants/theme';
import type { KakaoPlaceResult } from '@/hooks/useKakaoPlaceSearch';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  results: KakaoPlaceResult[];
  onSelect: (place: KakaoPlaceResult) => void;
  searching: boolean;
  searched?: boolean;
};

export function PlaceSearchInput({ value, onChangeText, onSearch, results, onSelect, searching, searched }: Props) {
  return (
    <View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          placeholder="장소 이름 또는 주소를 검색하세요"
          returnKeyType="search"
        />
        <TouchableOpacity style={[styles.btn, searching && styles.btnDisabled]} onPress={onSearch} disabled={searching}>
          {searching
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.btnText}>검색</Text>
          }
        </TouchableOpacity>
      </View>

      {results.length > 0 ? (
        <View style={styles.dropdown}>
          {results.map((place) => (
            <TouchableOpacity key={place.id} style={styles.item} onPress={() => onSelect(place)}>
              <Text style={styles.itemName}>{place.place_name}</Text>
              <Text style={styles.itemAddr}>{place.address_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : searched && !searching ? (
        <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: font.base, backgroundColor: colors.bg.input,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', minWidth: 56,
  },
  btnDisabled: { backgroundColor: colors.text.hint },
  btnText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
  dropdown: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: '#fff', marginTop: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 8,
  },
  item: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: font.base, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  itemAddr: { fontSize: font.sm, color: colors.text.secondary },
  emptyText: { fontSize: font.sm, color: colors.text.hint, marginTop: 8, textAlign: 'center' },
});
