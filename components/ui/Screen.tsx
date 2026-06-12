import { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, style }: Props) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}
