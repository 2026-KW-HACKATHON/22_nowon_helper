import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

export class LocationError extends Error {
  constructor(readonly reason: 'denied' | 'unavailable') {
    super(reason === 'denied' ? '위치 권한이 필요해요.' : '현재 위치를 확인할 수 없어요.');
  }
}

const FIX_TIMEOUT_MS = 10_000;

let pending: Promise<Coords> | null = null;

/**
 * One GPS fix per report. Screen 01 starts it early, later screens await the
 * same promise. Coordinates are never logged (see CLAUDE.md rule 10).
 */
export function locate(): Promise<Coords> {
  if (!pending) {
    pending = fetchCoords().catch((e: unknown) => {
      pending = null; // let the user retry
      throw e;
    });
  }
  return pending;
}

export function resetLocation() {
  pending = null;
}

async function fetchCoords(): Promise<Coords> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new LocationError('denied');

  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), FIX_TIMEOUT_MS)),
    ]);
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    throw new LocationError('unavailable');
  }
}
