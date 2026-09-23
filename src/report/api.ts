import fixtures from '../../contract/fixtures.json';
import {
  DEVICE_ID_HEADER,
  type ApiError,
  type ClassifyResponse,
  type ConfirmResponse,
  type CreateReportRequest,
  type CreateReportResponse,
  type ErrorCode,
  type NearbyRequest,
  type NearbyResponse,
  type VoiceDraftResponse,
} from '../../contract/types';
import { API_BASE_URL, API_TIMEOUT_MS, OPTIONAL_TIMEOUT_MS, USE_FIXTURES } from './config';
import { getDeviceId } from './device-id';

const NETWORK_MESSAGE = '네트워크 연결을 확인해 주세요.';
const GENERIC_MESSAGE = '잠시 후 다시 시도해 주세요.';

/** error.message is Korean text from the server — show it as is. */
export class ApiRequestError extends Error {
  constructor(
    readonly code: ErrorCode | 'network',
    message: string,
  ) {
    super(message);
  }
}

type Body = { json: unknown } | { form: FormData } | undefined;

async function request<T>(path: string, body: Body, timeoutMs = API_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { [DEVICE_ID_HEADER]: await getDeviceId() };
    let payload: string | FormData | undefined;
    if (body && 'json' in body) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body.json);
    } else if (body) {
      payload = body.form;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: payload,
      signal: controller.signal,
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const error = (data as ApiError | null)?.error;
      throw new ApiRequestError(error?.code ?? 'internal', error?.message ?? GENERIC_MESSAGE);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiRequestError) throw e;
    throw new ApiRequestError('network', NETWORK_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}

/** React Native's FormData takes a { uri, name, type } file descriptor. */
function fileForm(field: string, uri: string, name: string, type: string): FormData {
  const form = new FormData();
  form.append(field, { uri, name, type } as unknown as Blob);
  return form;
}

// ─── 1. POST /api/reports/nearby ────────────────────────────

export function checkNearby(req: NearbyRequest): Promise<NearbyResponse> {
  if (USE_FIXTURES) return fixtureNearby(req);
  return request<NearbyResponse>('/api/reports/nearby', { json: req });
}

// ─── 2. POST /api/reports ───────────────────────────────────

export function createReport(req: CreateReportRequest): Promise<CreateReportResponse> {
  if (USE_FIXTURES) return fixtureCreate(req);
  return request<CreateReportResponse>('/api/reports', { json: req });
}

// ─── 3. POST /api/reports/:id/confirm ───────────────────────

export function confirmReport(id: string): Promise<ConfirmResponse> {
  if (USE_FIXTURES) return fixtureConfirm();
  return request<ConfirmResponse>(`/api/reports/${encodeURIComponent(id)}/confirm`, undefined);
}

// ─── 6. POST /api/classify — optional, fails quietly ────────

const NO_CLASSIFY: ClassifyResponse = { category: null, confidence: 0 };

export async function classifyPhoto(photoUri: string): Promise<ClassifyResponse> {
  if (USE_FIXTURES) return delay(fixtures['POST /api/classify'].response as ClassifyResponse);
  try {
    return await request<ClassifyResponse>(
      '/api/classify',
      { form: fileForm('photo', photoUri, 'photo.jpg', 'image/jpeg') },
      OPTIONAL_TIMEOUT_MS,
    );
  } catch {
    return NO_CLASSIFY;
  }
}

// ─── 7. POST /api/voice/draft — optional, fails quietly ─────

const NO_VOICE: VoiceDraftResponse = { transcript: '', category: null, affected_groups: [] };

export async function voiceDraft(audioUri: string): Promise<VoiceDraftResponse> {
  if (USE_FIXTURES) return delay(fixtures['POST /api/voice/draft'].response as VoiceDraftResponse);
  try {
    return await request<VoiceDraftResponse>(
      '/api/voice/draft',
      { form: fileForm('audio', audioUri, 'voice.m4a', 'audio/mp4') },
      OPTIONAL_TIMEOUT_MS,
    );
  } catch {
    return NO_VOICE;
  }
}

// ─── Fixtures mode — answers straight from contract/fixtures.json ──

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function fixtureNearby(req: NearbyRequest): Promise<NearbyResponse> {
  const f = fixtures['POST /api/reports/nearby'];
  // The fixture duplicate is a broken_sidewalk — other categories show the "no duplicate" path.
  const hit = req.category === f.request.category;
  return delay((hit ? f.response : f.response_when_no_duplicate) as NearbyResponse);
}

let fixtureConfirmed = false;

function fixtureConfirm(): Promise<ConfirmResponse> {
  const f = fixtures['POST /api/reports/:id/confirm'];
  if (fixtureConfirmed) {
    const { error } = f.response_when_already_confirmed;
    return Promise.reject(new ApiRequestError(error.code as ErrorCode, error.message));
  }
  fixtureConfirmed = true;
  return delay(f.response as ConfirmResponse);
}

function fixtureCreate(req: CreateReportRequest): Promise<CreateReportResponse> {
  // Shape per fixtures "POST /api/reports".response_note. The score is the
  // fixture's number, not computed here — priority lives on the server only.
  return delay({
    id: 'fixture-new-report',
    category: req.category,
    severity: req.severity,
    status: 'new',
    lat: req.lat,
    lng: req.lng,
    address: '월계동',
    priority_score: 30,
    confirmation_count: 1,
    affected_groups: req.affected_groups,
    photos: { before_thumb_url: req.photo_thumb_url, before_url: req.photo_url, after_url: null },
    created_at: new Date().toISOString(),
    resolved_at: null,
    confirmed_by_me: true,
  });
}
