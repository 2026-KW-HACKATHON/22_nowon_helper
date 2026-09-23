/**
 * Temporary home — only an entry to the create path (FE-1).
 * FE-2's map screen replaces this; keep the 신고하기 entry to /screens/report.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { USE_FIXTURES } from '@/report/config';
import { C } from '@/report/ui';

/** Text follows the phone's font size setting (many residents are elderly); the circle grows with it. */
const BUTTON_SIZE = 220;
const MAX_TEXT_SCALE = 1.5;

export default function HomeScreen() {
  const { fontScale, width } = useWindowDimensions();
  const size = Math.min(BUTTON_SIZE * Math.min(fontScale, MAX_TEXT_SCALE), width - 48);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <View style={s.center}>
        <Text style={s.title}>동네 SOS</Text>
        <Text style={s.body}>우리 동네 불편한 곳을 알려 주세요.</Text>

        <Pressable
          onPress={() => router.push('/screens/report')}
          accessibilityRole="button"
          accessibilityLabel="신고하기"
          style={({ pressed }) => [s.button, circle, pressed && s.buttonPressed]}>
          <Text style={s.buttonIcon} maxFontSizeMultiplier={MAX_TEXT_SCALE}>📷</Text>
          <Text style={s.buttonText} maxFontSizeMultiplier={MAX_TEXT_SCALE}>신고하기</Text>
          <Text style={s.buttonSub} maxFontSizeMultiplier={MAX_TEXT_SCALE}>사진 한 장이면 돼요</Text>
        </Pressable>
      </View>

      {USE_FIXTURES ? <Text style={s.mode}>fixtures 모드 · 서버 없이 동작</Text> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { color: C.text, fontSize: 36, fontWeight: '800' },
  body: { color: C.textSoft, fontSize: 19, textAlign: 'center', marginBottom: 32 },
  button: {
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 8,
    borderColor: C.greenSoft,
    shadowColor: C.green,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  buttonPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  buttonIcon: { fontSize: 48 },
  buttonText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  buttonSub: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },
  mode: { color: C.textMuted, fontSize: 15, textAlign: 'center', paddingBottom: 12 },
});
