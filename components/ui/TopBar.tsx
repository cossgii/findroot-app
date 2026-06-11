import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BackButton } from './BackButton';

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <View style={styles.bar}>
      <BackButton />
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  right: { flexDirection: 'row', gap: 8 },
});
