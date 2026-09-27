/**
 * 동네 SOS — data contract.
 *
 * The single source of truth. Imported by the mobile app, the admin panel
 * and the server. Frozen after T+2.
 *
 * Naming rule: the field names here = the column names in the database = the
 * keys in JSON. snake_case everywhere, no camelCase conversion anywhere.
 */

// ─────────────────────────────────────────────────────────────
// Enums — closed lists, no new values
// ─────────────────────────────────────────────────────────────

/** Exactly 4 categories. UI labels are Korean; the data carries these codes. */
export type Category =
  | 'fallen_tree'      // 쓰러진 나무
  | 'broken_sidewalk'  // 파손된 보도
  | 'blocked_ramp'     // 막힌 경사로
  | 'broken_facility'; // 고장난 시설

export type Status =
  | 'new'          // 신규
  | 'in_progress'  // 처리중
  | 'resolved';    // 해결

export type Severity =
  | 'low'      // 낮음  → 12 points
  | 'medium'   // 보통  → 22 points
  | 'high';    // 높음  → 35 points

export type AffectedGroup =
  | 'wheelchair'         // 휠체어 이용자
  | 'elderly'            // 고령자
  | 'stroller'           // 유아차
  | 'visually_impaired'; // 시각장애

export type PhotoKind = 'before' | 'after';

// ─────────────────────────────────────────────────────────────
// Core objects
// ─────────────────────────────────────────────────────────────

/** Priority breakdown. Shown to the user — this is the "why it matters". */
export interface PriorityBreakdown {
  confirmations: number; // min(30, count * 2.5)
  severity: number;      // 12 | 22 | 35
  duration: number;      // min(15, days_open * 0.75)
  impact: number;        // min(20, groups * 5)
}

export interface ReportPhotos {
  /** 200 px thumbnail — for the map and lists. This is the only one we load in bulk. */
  before_thumb_url: string | null;
  /** Full 1280 px image — detail screen only. */
  before_url: string | null;
  /** Appears when the report moves to resolved. Null until then. */
  after_url: string | null;
}

export interface StatusLogEntry {
  from_status: Status | null; // null on the very first entry
  to_status: Status;
  note: string | null;        // "노원구 도로과"
  created_at: string;         // ISO 8601, UTC
}

/**
 * A problem. The same object in every response — only which optional fields
 * are filled in changes (see the comments).
 */
export interface Report {
  id: string;                  // uuid
  category: Category;
  severity: Severity;
  status: Status;

  lat: number;                 // rounded to ~4 decimals on the public map
  lng: number;
  address: string;             // "월계동 광운로 20 앞"

  priority_score: number;      // 0–100, integer
  /** Present in details and in the admin panel; may be missing in map lists. */
  priority_breakdown?: PriorityBreakdown;

  confirmation_count: number;
  affected_groups: AffectedGroup[];
  photos: ReportPhotos;

  created_at: string;          // ISO 8601
  resolved_at: string | null;

  /** Computed from the X-Device-Id header. Drives the "확인 +1" button. */
  confirmed_by_me: boolean;

  /** Only in the nearby response — distance to the requested point, in meters. */
  distance_m?: number;

  /** Only in the detail response — history for the 진행 상황 block. */
  status_log?: StatusLogEntry[];
}

// ─────────────────────────────────────────────────────────────
// Requests and responses — one pair per endpoint
// ─────────────────────────────────────────────────────────────

/** POST /api/reports/nearby — is there already a problem like this nearby. */
export interface NearbyRequest {
  lat: number;
  lng: number;
  category: Category;
}
export interface NearbyResponse {
  /** null = no duplicate, show the create form. */
  duplicate: Report | null;
  /** The radius we searched. Shown in the UI: "within 50 m". */
  radius_m: number;
}

/** POST /api/reports — create a new problem. */
export interface CreateReportRequest {
  lat: number;
  lng: number;
  category: Category;
  severity: Severity;
  affected_groups: AffectedGroup[];
  /** Path in Supabase Storage; the phone uploads the file itself and sends the link. */
  photo_url: string;
  photo_thumb_url: string;
  description?: string;
}
export type CreateReportResponse = Report;

/** POST /api/reports/:id/confirm — 확인 +1. */
export interface ConfirmResponse {
  /** The updated problem: counter and priority are already the new ones. */
  report: Report;
  /** The new and the previous value — for the "12 → 13" animation. */
  previous_confirmation_count: number;
  previous_priority_score: number;
}

/** GET /api/reports?bbox=minLng,minLat,maxLng,maxLat — points for the map. */
export interface MapResponse {
  reports: Report[];
  /** How many in the area in total — for the "전체 8 · 신규 3 · 처리중 4" chips. */
  counts: Record<Status, number>;
}

/** GET /api/reports/:id — details. The Report arrives with breakdown and status_log. */
export type ReportDetailResponse = Report;

/** POST /api/classify — photo to category. Always answers, even on failure. */
export interface ClassifyResponse {
  /** null = the service did not answer. This is NOT an error: show the buttons without a hint. */
  category: Category | null;
  /** 0–1. Below 0.6 we do not show the hint. */
  confidence: number;
}

/** POST /api/voice/draft — speech to a draft report. */
export interface VoiceDraftResponse {
  transcript: string;
  category: Category | null;
  affected_groups: AffectedGroup[];
}

/** PATCH /api/admin/reports/:id/status */
export interface UpdateStatusRequest {
  status: Status;
  note?: string; // "노원구 도로과"
}

/** PATCH /api/admin/reports/:id/resolve */
export interface ResolveRequest {
  after_photo_url: string;
  note?: string;
}

// ─────────────────────────────────────────────────────────────
// Errors — one shape, codes as a closed list
// ─────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'already_confirmed'   // this device already confirmed → 409
  | 'report_not_found'    // 404
  | 'rate_limited'        // daily limit exceeded → 429
  | 'invalid_payload'     // 400
  | 'unauthorized'        // no operator rights → 401
  | 'internal';           // 500

export interface ApiError {
  error: {
    code: ErrorCode;
    /** Text for the user, in Korean. Show it as is. */
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Constants — use these, not bare numbers in the code
// ─────────────────────────────────────────────────────────────

export const DUPLICATE_RADIUS_M = 50;
export const DUPLICATE_MAX_AGE_DAYS = 30;

export const SEVERITY_POINTS: Record<Severity, number> = {
  low: 12,
  medium: 22,
  high: 35,
};

export const PRIORITY_CAPS = {
  confirmations: 30,
  severity: 35,
  duration: 15,
  impact: 20,
} as const;

export const POINTS_PER_CONFIRMATION = 2.5;
export const POINTS_PER_DAY = 0.75;
export const POINTS_PER_GROUP = 5;

/** Header carrying the anonymous device identifier. Required everywhere. */
export const DEVICE_ID_HEADER = 'X-Device-Id';

/**
 * Reference case. If calcPriority() does not produce 78, the code is wrong.
 * 13 confirmations, high, 4 days, 2 groups:
 *   min(30, 13 * 2.5) = 30
 *   SEVERITY_POINTS.high = 35
 *   min(15, 4 * 0.75)    = 3
 *   min(20, 2 * 5)       = 10
 *   ─────────────────────────
 *   total                  78
 */
export const PRIORITY_REFERENCE_CASE = {
  input: { confirmations: 13, severity: 'high' as Severity, days_open: 4, groups: 2 },
  expected_score: 78,
  expected_breakdown: { confirmations: 30, severity: 35, duration: 3, impact: 10 },
};
