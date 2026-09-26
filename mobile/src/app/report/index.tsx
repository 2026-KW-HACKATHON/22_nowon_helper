/** Camera + GPS — opened from the home screen (01), leads to 02. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Category } from '../../../../contract/types';
import { resetDraft, updateDraft } from '@/report/draft';
import { CATEGORIES } from '@/report/labels';
import { locate, resetLocation } from '@/report/location';
import { Icon } from '@/components/icon';
import { compressPhoto } from '@/report/photo';
import { C, ErrorText, PrimaryButton, SecondaryButton } from '@/report/ui';

type GpsState = 'searching' | 'ready' | 'failed';

export default function CameraScreen() {
  const camera = useRef<CameraView>(null);
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [gps, setGps] = useState<GpsState>('searching');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A new report starts here: clear the previous draft (keeping the category
  // tapped on the home screen) and get the GPS fix while the resident is
  // still aiming the camera.
  useEffect(() => {
    resetDraft(CATEGORIES.includes(category as Category) ? (category as Category) : null);
    resetLocation();
    locate().then(
      () => setGps('ready'),
      () => setGps('failed'),
    );
    // Once per opened camera: the category param never changes on this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retryGps() {
    setGps('searching');
    locate().then(
      () => setGps('ready'),
      () => setGps('failed'),
    );
  }

  async function shoot() {
    if (!camera.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 1 });
      const photo = await compressPhoto(picture.uri, picture.width, picture.height);
      updateDraft({ photo });
      router.push('/report/category');
    } catch {
      setError('사진을 찍지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  if (!permission) return <View style={s.fill} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permission}>
        <Icon name="camera" size={48} color={C.green} />
        <Text style={s.permissionTitle}>카메라 권한이 필요해요</Text>
        <Text style={s.permissionBody}>문제가 있는 곳을 사진으로 남겨 주세요.</Text>
        <PrimaryButton label="권한 허용하기" onPress={requestPermission} />
        {/* This screen has no header, and iOS cannot swipe a full-screen modal away. */}
        <SecondaryButton label="닫기" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={s.fill}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" animateShutter />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Icon name="close" size={26} color="#FFFFFF" />
          </Pressable>
          <GpsBadge state={gps} onRetry={retryGps} />
        </View>

        <View style={s.bottom}>
          <ErrorText message={error} />
          <Text style={s.hint}>문제가 잘 보이게 찍어 주세요</Text>
          <Pressable
            onPress={shoot}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="사진 찍기"
            style={({ pressed }) => [s.shutter, pressed && s.shutterPressed]}>
            {busy ? <ActivityIndicator color={C.green} /> : <View style={s.shutterInner} />}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function GpsBadge({ state, onRetry }: { state: GpsState; onRetry: () => void }) {
  if (state === 'failed') {
    return (
      <Pressable onPress={onRetry} style={[s.badge, s.badgeFailed]} accessibilityRole="button">
        <Text style={s.badgeText}>위치 확인 실패 · 다시 시도</Text>
      </Pressable>
    );
  }
  return (
    <View style={s.badge}>
      <Icon name="location" size={14} color={state === 'ready' ? '#3DDC97' : '#F5C451'} />
      <Text style={s.badgeText}>{state === 'ready' ? '위치 확인됨' : '위치 찾는 중…'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeFailed: { backgroundColor: C.red },
  badgeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  bottom: { alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 24 },
  hint: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { opacity: 0.7 },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
  permission: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 24, gap: 12 },
  permissionTitle: { color: C.text, fontSize: 26, fontWeight: '700' },
  permissionBody: { color: C.textSoft, fontSize: 18, marginBottom: 12 },
});
