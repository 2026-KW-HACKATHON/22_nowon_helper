import { router, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { C } from '@/report/ui';

/**
 * Create path: 01 home → camera → 02 (1/2) → 03 duplicate (2/2) | done.
 *
 * Leaving it always goes through router.dismissTo('/'): it pops back to the
 * home screen already in the stack. router.replace('/') would put a second
 * home screen on top of the first.
 */
export default function ReportLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: C.text,
        headerStyle: { backgroundColor: C.bg },
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
        headerBackButtonDisplayMode: 'minimal',
        headerRight: () => (
          <Pressable onPress={() => router.dismissTo('/')} hitSlop={12} accessibilityRole="button">
            <Text style={{ color: C.textSoft, fontSize: 16 }}>취소</Text>
          </Pressable>
        ),
      }}>
      <Stack.Screen name="index" options={{ title: '사진 찍기', headerShown: false }} />
      <Stack.Screen name="category" options={{ title: '신고 작성 1/2' }} />
      <Stack.Screen name="duplicate" options={{ title: '신고 작성 2/2' }} />
      {/* No swipe back: behind done is the camera with the draft just sent. */}
      <Stack.Screen name="done" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}
