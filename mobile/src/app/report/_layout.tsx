import { Stack } from 'expo-router';

import { C } from '@/report/ui';

/** Create path: 01 camera → 02 category → 07 duplicate | 03 details. */
export default function ReportLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: C.text,
        headerStyle: { backgroundColor: C.bg },
        headerTitleStyle: { fontSize: 20, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="index" options={{ title: '사진 찍기', headerShown: false }} />
      <Stack.Screen name="category" options={{ title: '어떤 문제인가요?' }} />
      <Stack.Screen name="duplicate" options={{ title: '이미 신고된 문제' }} />
      <Stack.Screen name="details" options={{ title: '상세 정보' }} />
    </Stack>
  );
}
