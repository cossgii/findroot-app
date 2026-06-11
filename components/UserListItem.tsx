import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { UserAvatar } from './ui';
import { colors, font } from '../constants/theme';
import type { UserSummary } from '../types';

type Props = { user: UserSummary; showChevron?: boolean };

export function UserListItem({ user, showChevron = false }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/users/${user.id}`)}>
      <UserAvatar name={user.name} image={user.image} size={38} />
      <Text style={styles.name}>{user.name}</Text>
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  name: { flex: 1, fontSize: font.lg },
  chevron: { fontSize: 20, color: colors.border },
});
