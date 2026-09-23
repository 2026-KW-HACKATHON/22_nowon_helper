import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY = 'dongne_sos_device_id';

let cached: string | null = null;

/** Anonymous device identifier for the X-Device-Id header. Created once, kept forever. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await SecureStore.getItemAsync(KEY);
    if (stored) return (cached = stored);
    const fresh = randomUUID();
    await SecureStore.setItemAsync(KEY, fresh);
    return (cached = fresh);
  } catch {
    // SecureStore is unavailable on web — keep an id for this session only.
    return (cached = randomUUID());
  }
}
