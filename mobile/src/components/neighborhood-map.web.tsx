/**
 * The map with the report pins (FE-2), web build.
 *
 * react-native-webview has no web version, so the same page runs in an
 * iframe. An iframe from srcDoc has no domain Kakao would accept, so on
 * the web the page falls back to OpenStreetMap by itself.
 */

import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { mapHtml, type MapData, type MapMessage } from './map-html';
import type { NeighborhoodMapProps } from './neighborhood-map';

const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY ?? '';

export function NeighborhoodMap({ bbox, data, onSelect, style }: NeighborhoodMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef(data);

  const [minLng, minLat, maxLng, maxLat] = bbox;
  const html = useMemo(
    () => mapHtml(KAKAO_JS_KEY, [minLng, minLat, maxLng, maxLat]),
    [minLng, minLat, maxLng, maxLat],
  );

  const push = (next: MapData) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify(next), '*');
  };

  useEffect(() => {
    latest.current = data;
    if (ready.current) push(data);
  }, [data]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || typeof event.data !== 'string') return;
      const message = JSON.parse(event.data) as MapMessage;
      if (message.type === 'ready') {
        ready.current = true;
        push(latest.current);
      } else if (message.type === 'select') {
        onSelect(message.id);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSelect]);

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#EEF1EF' }, style]}>
      <iframe
        ref={frame}
        srcDoc={html}
        title="map"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
}
