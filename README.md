# findroot-app

서울 자치구별 맛집과, 맛집들을 엮은 루트를 지도에서 찾고 공유하는 [findroot](https://www.findroot.kr) 서비스의 React Native 앱입니다.
웹 서비스와 같은 API 서버를 사용하고, 앱에서는 쿠키 대신 Bearer JWT로 인증합니다.

## 화면
<table>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/e904f55e-047b-4e91-83ab-274cc7aba0a9" width="200" /><br />지도 탐색</td>
    <td align="center"><img src="https://github.com/user-attachments/assets/d301738e-00ae-4150-af29-6fde53491c36" width="200" /><br />장소 상세</td>
    <td align="center"><img src="https://github.com/user-attachments/assets/45c53333-62fd-43a9-89e0-41e74f81dbd8" width="200" /><br />루트 만들기</td>
    <td align="center"><img src="https://github.com/user-attachments/assets/dddd4825-bee8-4a6e-a1ef-1ff1ad8bd334" width="200" /><br />푸시 알림</td>
  </tr>
</table>

## 주요 기능

- **지도 탐색**: 자치구를 고르거나 현재 위치로 가까운 자치구를 찾아 장소와 루트를 지도와 목록으로 봅니다.
- **장소 등록**: 카카오 장소 검색으로 장소를 고르면 좌표와 자치구가 자동으로 채워지고, 이미 등록된 장소인지 확인합니다.
- **루트 만들기·수정**: 경유지 2~5곳의 순서와 성격(밥, 카페, 술집)을 정하고, 경유지마다 예비 장소를 둘 수 있습니다.
- **콘텐츠 필터**: 추천 콘텐츠, 내 콘텐츠, 특정 사용자 콘텐츠를 골라 볼 수 있습니다.
- **소셜**: 좋아요, 댓글, 팔로우.
- **푸시 알림**: 좋아요·댓글·팔로우 알림을 FCM으로 받고, 알림을 누르면 해당 화면으로 이동합니다. 앱이 꺼진 상태에서 알림으로 실행된 경우도 처리합니다.

## 기술 스택

| 영역                | 사용 기술                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------- |
| 앱                  | Expo SDK 56 (dev build), React Native 0.85, React 19, TypeScript                          |
| 라우팅              | expo-router 56 (탭 + 스택)                                                                |
| 서버 상태 / UI 상태 | TanStack Query 5 / Jotai                                                                  |
| 입력 검증           | Zod 4                                                                                     |
| 지도                | 카카오맵 JavaScript SDK를 WebView에 띄우고 `postMessage`로 마커 이벤트 전달               |
| 기타                | expo-secure-store (토큰 보관), expo-notifications (FCM), expo-location, expo-image-picker |

## 구조

```
app/            expo-router 화면 (탭: 탐색, 마이페이지 / 스택: 상세, 등록, 수정)
components/     카드, 지도 등 화면 단위 컴포넌트
components/ui/  버튼, 입력창 등 공용 UI 컴포넌트
hooks/          폼 로직, 카카오 장소 검색
services/       API 호출 함수
lib/            axios 인스턴스, 스키마, 저장소, 캐시 무효화 헬퍼
store/          Jotai 전역 상태 (로그인 사용자)
```

## 실행 방법

Android만 실행해 봤습니다. iOS 빌드는 확인하지 않았습니다.

**준비물**: Node 22, pnpm 10, JDK 17, Android SDK (Android Studio), 실기기 또는 에뮬레이터

1. 의존성 설치

   ```bash
   pnpm install
   ```

2. 프로젝트 루트에 `.env.local` 작성

   ```
   EXPO_PUBLIC_API_URL=        # findroot API 서버 주소
   EXPO_PUBLIC_KAKAO_APP_KEY=  # 카카오 JavaScript 키 (지도)
   EXPO_PUBLIC_KAKAO_REST_KEY= # 카카오 REST API 키 (장소 검색)
   ```

3. Firebase 콘솔에서 Android 앱용 `google-services.json`을 받아 프로젝트 루트에 둡니다. 저장소에는 포함하지 않았습니다.

4. 실행

   ```bash
   pnpm android
   ```
