/**
 * Create-path settings (FE-1).
 *
 * EXPO_PUBLIC_API_URL unset → fixtures mode: every call answers from
 * contract/fixtures.json, so the flow runs for any teammate without a server.
 * Set it to the mock (:3001) or the real API (:3000) to go live.
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const USE_FIXTURES = API_BASE_URL === '';

/** Supabase Storage is not wired yet — uploads return the fixture links. */
export const USE_MOCK_UPLOAD = true;

export const API_TIMEOUT_MS = 10_000;
/** AI classification and speech recognition: 3 s, then fail quietly. */
export const OPTIONAL_TIMEOUT_MS = 3_000;
/** Below this confidence screen 02 shows no hint. */
export const CLASSIFY_MIN_CONFIDENCE = 0.6;

/** On-device compression before upload: 1280 px / q70, thumbnail 200 px. */
export const PHOTO_MAX_PX = 1280;
export const THUMB_MAX_PX = 200;
export const PHOTO_QUALITY = 0.7;
