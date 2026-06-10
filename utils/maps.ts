import { Linking, Alert } from 'react-native';

export function openInMap(name: string, lat: number, lng: number) {
  Alert.alert('지도 앱 선택', undefined, [
    {
      text: '카카오맵',
      onPress: async () => {
        const appUrl = `kakaomap://look?p=${lat},${lng}`;
        const webUrl = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
        const canOpen = await Linking.canOpenURL(appUrl);
        Linking.openURL(canOpen ? appUrl : webUrl);
      },
    },
    {
      text: '네이버지도',
      onPress: async () => {
        const appUrl = `nmap://place?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}&appname=com.findroot.app`;
        const webUrl = `https://map.naver.com/v5/search/${encodeURIComponent(name)}`;
        const canOpen = await Linking.canOpenURL(appUrl);
        Linking.openURL(canOpen ? appUrl : webUrl);
      },
    },
    {
      text: '구글지도',
      onPress: () => Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`),
    },
    { text: '취소', style: 'cancel' },
  ]);
}
