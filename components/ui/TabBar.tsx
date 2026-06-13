import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, font } from '@/constants/theme';

type Tab<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function TabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {tabs.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.tab, active === key && styles.tabActive]}
          onPress={() => onChange(key)}
        >
          <Text style={[styles.text, active === key && styles.textActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  text: { fontSize: font.lg, color: colors.text.hint },
  textActive: { color: colors.primary, fontWeight: '600' },
});
