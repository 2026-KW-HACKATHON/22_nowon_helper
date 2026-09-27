/**
 * The page the map runs in (FE-2). Native: inside a WebView. Web: inside
 * an iframe. The RN screen stays the owner of the data; the page only
 * draws what it is sent and reports taps back.
 *
 * Kakao Maps JS first. No key, a key the domain check rejects, Kakao Map
 * not enabled for the app, or no answer in 5 s → Leaflet with
 * OpenStreetMap tiles, so the map works for every teammate without a key.
 *
 * Messages:
 *   RN → page   window.setMapData({ reports: MapPin[], me })
 *   page → RN   { type: 'ready', engine: 'kakao' | 'leaflet' }
 *               { type: 'select', id }
 */

import type { Bbox } from '@/api';

/** What the page needs for one pin. Colors come from RN (labels.ts). */
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  score: number;
  color: string;
  faded: boolean;
}

export interface MapData {
  reports: MapPin[];
  me: { lat: number; lng: number } | null;
}

export type MapMessage =
  | { type: 'ready'; engine: 'kakao' | 'leaflet' }
  | { type: 'select'; id: string };

export function mapHtml(kakaoKey: string, bbox: Bbox): string {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #EEF1EF; }
  .pin {
    display: flex; align-items: center; justify-content: center;
    border: 3px solid #fff; border-radius: 50%; box-sizing: border-box;
    color: #fff; font: 900 16px -apple-system, system-ui, sans-serif;
    box-shadow: 0 2px 5px rgba(0,0,0,.25); cursor: pointer;
  }
  .me { width: 22px; height: 22px; border-radius: 50%; background: #2878F0;
        border: 4px solid #fff; box-sizing: border-box; box-shadow: 0 0 0 14px rgba(40,120,240,.2); }
  .leaflet-div-icon { background: none; border: none; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var KAKAO_KEY = ${JSON.stringify(kakaoKey)};
  var BBOX = ${JSON.stringify(bbox)}; // minLng, minLat, maxLng, maxLat
  var engine = null;
  var pending = null;

  function send(message) {
    var text = JSON.stringify(message);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else window.parent.postMessage(text, '*');
  }

  function pinElement(pin) {
    var size = 34 + Math.round(pin.score / 5);
    var el = document.createElement('div');
    el.className = 'pin';
    el.style.width = el.style.height = size + 'px';
    el.style.background = pin.color;
    el.style.opacity = pin.faded ? '0.55' : '1';
    el.textContent = pin.score;
    return el;
  }

  function meElement() {
    var el = document.createElement('div');
    el.className = 'me';
    return el;
  }

  function start(name, make) {
    if (engine) return;
    try {
      engine = make();
    } catch (e) {
      engine = null;
      if (name === 'kakao') useLeaflet();
      return;
    }
    send({ type: 'ready', engine: name });
    if (pending) engine.draw(pending);
    setTimeout(function () { engine.fit(); }, 50);
  }

  function kakaoEngine() {
    var maps = kakao.maps;
    var map = new maps.Map(document.getElementById('map'), {
      center: new maps.LatLng((BBOX[1] + BBOX[3]) / 2, (BBOX[0] + BBOX[2]) / 2),
      level: 5,
    });
    var bounds = new maps.LatLngBounds(
      new maps.LatLng(BBOX[1], BBOX[0]),
      new maps.LatLng(BBOX[3], BBOX[2])
    );
    map.setBounds(bounds);
    var overlays = [];
    return {
      fit: function () { map.relayout(); map.setBounds(bounds); },
      draw: function (data) {
        overlays.forEach(function (o) { o.setMap(null); });
        overlays = data.reports.map(function (pin) {
          var el = pinElement(pin);
          el.onclick = function () { send({ type: 'select', id: pin.id }); };
          return new maps.CustomOverlay({
            map: map, position: new maps.LatLng(pin.lat, pin.lng),
            content: el, xAnchor: 0.5, yAnchor: 0.5, zIndex: pin.score + 1, clickable: true,
          });
        });
        if (data.me) {
          overlays.push(new maps.CustomOverlay({
            map: map, position: new maps.LatLng(data.me.lat, data.me.lng),
            content: meElement(), xAnchor: 0.5, yAnchor: 0.5, zIndex: 0,
          }));
        }
      },
    };
  }

  function leafletEngine() {
    var map = L.map('map', { zoomControl: false });
    var bounds = [[BBOX[1], BBOX[0]], [BBOX[3], BBOX[2]]];
    map.fitBounds(bounds);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    var layer = L.layerGroup().addTo(map);
    return {
      fit: function () { map.invalidateSize(); map.fitBounds(bounds); },
      draw: function (data) {
        layer.clearLayers();
        if (data.me) {
          L.marker([data.me.lat, data.me.lng], {
            icon: L.divIcon({ html: meElement(), iconSize: [22, 22] }), interactive: false,
          }).addTo(layer);
        }
        data.reports.forEach(function (pin) {
          var size = 34 + Math.round(pin.score / 5);
          L.marker([pin.lat, pin.lng], {
            icon: L.divIcon({ html: pinElement(pin), iconSize: [size, size] }),
            zIndexOffset: pin.score,
          }).on('click', function () { send({ type: 'select', id: pin.id }); }).addTo(layer);
        });
      },
    };
  }

  function loadScript(src, onload, onerror) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    s.onerror = onerror;
    document.head.appendChild(s);
  }

  var leafletRequested = false;
  function useLeaflet() {
    if (engine || leafletRequested) return;
    leafletRequested = true;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
      function () { start('leaflet', leafletEngine); }, function () {});
  }

  window.setMapData = function (data) {
    pending = data;
    if (engine) engine.draw(data);
  };
  // The WebView or the iframe may get its final size after the map was
  // made: re-measure, then show the whole neighborhood again.
  var lastSize = '';
  window.addEventListener('resize', function () {
    var size = window.innerWidth + 'x' + window.innerHeight;
    if (engine && size !== lastSize) { lastSize = size; engine.fit(); }
  });

  // The web build posts into the iframe instead of injecting.
  window.addEventListener('message', function (event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.reports) window.setMapData(data);
    } catch (e) {}
  });

  if (KAKAO_KEY) {
    setTimeout(useLeaflet, 5000);
    loadScript('https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=' + encodeURIComponent(KAKAO_KEY),
      function () {
        try { kakao.maps.load(function () { start('kakao', kakaoEngine); }); }
        catch (e) { useLeaflet(); }
      },
      useLeaflet);
  } else {
    useLeaflet();
  }
</script>
</body>
</html>`;
}
