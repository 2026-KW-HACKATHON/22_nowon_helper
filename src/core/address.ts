/**
 * Coordinates → "월계동 광운로 20" for a new report.
 *
 * Owner: BE-1. The create request carries no address (contract), so the
 * server looks it up with the Kakao Local REST API. An external feature,
 * so it can be switched off and fails quietly: no KAKAO_REST_API_KEY, a
 * timeout or any error gives '' and the report is still created.
 */

const TIMEOUT_MS = 3_000;

export async function lookupAddress(lat: number, lng: number): Promise<string> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return '';

  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return '';

    const data = (await res.json()) as {
      documents?: { road_address?: { address_name?: string } | null; address?: { address_name?: string } | null }[];
    };
    const place = data.documents?.[0];
    return place?.road_address?.address_name ?? place?.address?.address_name ?? '';
  } catch {
    return '';
  }
}
