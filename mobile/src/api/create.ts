/**
 * Create path (FE-1): duplicate check, new report, 확인 +1, and the two
 * optional AI helpers. Shares request()/ApiRequestError with the browse
 * path — see client.ts.
 */

import fixtures from '../../../contract/fixtures.json';
import {
  type ClassifyResponse,
  type ConfirmResponse,
  type CreateReportRequest,
  type CreateReportResponse,
  type ErrorCode,
  type NearbyRequest,
  type NearbyResponse,
  type VoiceDraftResponse,
} from '../../../contract/types';
import { OPTIONAL_TIMEOUT_MS, USE_FIXTURES } from './config';
import { ApiRequestError, fileForm, request } from './client';

// ─── 1. POST /api/reports/nearby ────────────────────────────

export function checkNearby(req: NearbyRequest): Promise<NearbyResponse> {
  if (USE_FIXTURES) return fixtureNearby(req);
  return request<NearbyResponse>('POST', '/api/reports/nearby', { json: req });
}

// ─── 2. POST /api/reports ───────────────────────────────────

export function createReport(req: CreateReportRequest): Promise<CreateReportResponse> {
  if (USE_FIXTURES) return fixtureCreate(req);
  return request<CreateReportResponse>('POST', '/api/reports', { json: req });
}

// ─── 3. POST /api/reports/:id/confirm ───────────────────────

export function confirmReport(id: string): Promise<ConfirmResponse> {
  if (USE_FIXTURES) return fixtureConfirm();
  return request<ConfirmResponse>('POST', `/api/reports/${encodeURIComponent(id)}/confirm`, undefined);
}

// ─── 6. POST /api/classify — optional, fails quietly ────────

const NO_CLASSIFY: ClassifyResponse = { category: null, confidence: 0 };

export async function classifyPhoto(photoUri: string): Promise<ClassifyResponse> {
  if (USE_FIXTURES) return delay(fixtures['POST /api/classify'].response as ClassifyResponse);
  try {
    return await request<ClassifyResponse>(
      'POST',
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
      'POST',
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
