import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '동네 SOS' }} />
      <Stack.Screen name="explore" />
      <Stack.Screen name="screens/report" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
