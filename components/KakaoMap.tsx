import { useMemo } from "react";
import { ViewStyle } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? "";

export type MapMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  label?: string;
};

type Props = {
  center: { lat: number; lng: number };
  level?: number;
  markers?: MapMarker[];
  polyline?: { lat: number; lng: number }[];
  onMarkerPress?: (id: string) => void;
  style?: ViewStyle;
};

const BASE_URL = "https://www.findroot.kr";
function toScriptJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function isAllowedNavigation(url: string) {
  return url.startsWith(BASE_URL) || url === "about:blank";
}

function buildHtml(
  center: { lat: number; lng: number },
  level: number,
  markers: MapMarker[],
  polyline: { lat: number; lng: number }[],
) {
  const markersJson = toScriptJson(markers);
  const polylineJson = toScriptJson(polyline);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .num-marker {
      background:#3B82F6; color:#fff; border-radius:50%;
      width:30px; height:30px; line-height:30px; text-align:center;
      font-size:13px; font-weight:bold; cursor:pointer;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <script>
    var MARKERS = ${markersJson};
    var POLYLINE = ${polylineJson};

    kakao.maps.load(function() {
      var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(${center.lat}, ${center.lng}),
        level: ${level}
      });

      function sendClick(id) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_CLICK', id: id }));
        }
      }

      MARKERS.forEach(function(m) {
        var pos = new kakao.maps.LatLng(m.latitude, m.longitude);
        if (m.label) {
          var div = document.createElement('div');
          div.className = 'num-marker';
          div.textContent = m.label;
          (function(id) {
            div.addEventListener('click', function(e) { e.stopPropagation(); sendClick(id); });
            div.addEventListener('touchend', function(e) { e.stopPropagation(); sendClick(id); });
          })(m.id);
          new kakao.maps.CustomOverlay({ map: map, position: pos, content: div, yAnchor: 1.2 });
        } else {
          var marker = new kakao.maps.Marker({ map: map, position: pos, title: m.name });
          kakao.maps.event.addListener(marker, 'click', (function(id) { return function() {
            sendClick(id);
          }; })(m.id));
        }
      });

      if (POLYLINE.length > 1) {
        new kakao.maps.Polyline({
          map: map,
          path: POLYLINE.map(function(pt) { return new kakao.maps.LatLng(pt.lat, pt.lng); }),
          strokeWeight: 4,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        });
      }
    });
  </script>
</body>
</html>`;
}

export default function KakaoMap({
  center,
  level = 5,
  markers = [],
  polyline = [],
  onMarkerPress,
  style,
}: Props) {
  const source = useMemo(
    () => ({
      html: buildHtml(center, level, markers, polyline),
      baseUrl: BASE_URL,
    }),
    // JSON.stringify로 깊은 비교 — center/markers 객체 참조가 달라도 내용 같으면 리로드 안 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      JSON.stringify(center),
      level,
      JSON.stringify(markers),
      JSON.stringify(polyline),
    ],
  );

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "MARKER_CLICK") onMarkerPress?.(msg.id);
    } catch {}
  }

  return (
    <WebView
      source={source}
      style={style}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
      onShouldStartLoadWithRequest={(req) => isAllowedNavigation(req.url)}
      scrollEnabled={false}
    />
  );
}
