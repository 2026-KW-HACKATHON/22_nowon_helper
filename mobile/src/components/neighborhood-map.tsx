/**
 * The map with the report pins (FE-2), native build.
 *
 * Kakao Maps JS inside a WebView: it runs in Expo Go, no native SDK and
 * no custom build. The page is loaded with baseUrl http://localhost —
 * that is the domain registered for the JavaScript key in the Kakao
 * console. See map-html.ts for the page and the OpenStreetMap fallback.
 */

import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { Bbox } from '@/api';
import { mapHtml, type MapData, type MapMessage } from './map-html';

const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY ?? '';

export interface NeighborhoodMapProps {
  bbox: Bbox;
  data: MapData;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export function NeighborhoodMap({ bbox, data, onSelect, style }: NeighborhoodMapProps) {
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const html = useMemo(
    () => mapHtml(KAKAO_JS_KEY, [minLng, minLat, maxLng, maxLat]),
    [minLng, minLat, maxLng, maxLat],
  );

  const push = (next: MapData) => {
    web.current?.injectJavaScript(`window.setMapData(${JSON.stringify(next)}); true;`);
  };

  // New pins after a refresh or a 확인 +1: redraw without reloading the page.
  useEffect(() => {
    if (ready.current) push(data);
  }, [data]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as MapMessage;
    if (message.type === 'ready') {
      ready.current = true;
      push(data);
    } else if (message.type === 'select') {
      onSelect(message.id);
    }
  };

  return (
    <View style={[styles.box, style]}>
      <WebView
        ref={web}
        source={{ html, baseUrl: 'http://localhost' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        onLoadStart={() => {
          ready.current = false;
        }}
        nestedScrollEnabled
        scrollEnabled={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: '#EEF1EF' },
  web: { flex: 1, backgroundColor: '#EEF1EF' },
});
