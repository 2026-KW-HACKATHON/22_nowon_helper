/**
 * 동네 SOS — контракт данных.
 *
 * Единственный источник правды. Импортируется мобильным приложением,
 * админкой и сервером. Заморожен после T+2.
 *
 * Правило именования: имена полей здесь = имена колонок в базе = ключи в JSON.
 * snake_case везде, преобразования в camelCase нет нигде.
 */

// ─────────────────────────────────────────────────────────────
// Перечисления — закрытые списки, новых значений не добавляем
// ─────────────────────────────────────────────────────────────

/** Ровно 4 категории. Подписи в UI — на корейском, в данных — эти коды. */
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
  | 'low'      // 낮음  → 12 баллов
  | 'medium'   // 보통  → 22 балла
  | 'high';    // 높음  → 35 баллов

export type AffectedGroup =
  | 'wheelchair'         // 휠체어 이용자
  | 'elderly'            // 고령자
  | 'stroller'           // 유아차
  | 'visually_impaired'; // 시각장애

export type PhotoKind = 'before' | 'after';

// ─────────────────────────────────────────────────────────────
// Основные объекты
// ─────────────────────────────────────────────────────────────

/** Разбивка приоритета. Показывается пользователю — это «почему важно». */
export interface PriorityBreakdown {
  confirmations: number; // min(30, count * 2.5)
  severity: number;      // 12 | 22 | 35
  duration: number;      // min(15, days_open * 0.75)
  impact: number;        // min(20, groups * 5)
}

export interface ReportPhotos {
  /** Превью 200 px — для карты и списков. Только это грузим массово. */
  before_thumb_url: string | null;
  /** Полный снимок 1280 px — только на экране деталей. */
  before_url: string | null;
  /** Появляется при переводе в resolved. До этого null. */
  after_url: string | null;
}

export interface StatusLogEntry {
  from_status: Status | null; // null у самой первой записи
  to_status: Status;
  note: string | null;        // «노원구 도로과»
  created_at: string;         // ISO 8601, UTC
}

/**
 * Проблема. Один и тот же объект во всех ответах — меняется только то,
 * какие необязательные поля заполнены (см. комментарии).
 */
export interface Report {
  id: string;                  // uuid
  category: Category;
  severity: Severity;
  status: Status;

  lat: number;                 // на публичной карте округлено до ~4 знаков
  lng: number;
  address: string;             // «월계동 광운로 20 앞»

  priority_score: number;      // 0–100, целое
  /** Приходит в деталях и в админке; в списках карты может отсутствовать. */
  priority_breakdown?: PriorityBreakdown;

  confirmation_count: number;
  affected_groups: AffectedGroup[];
  photos: ReportPhotos;

  created_at: string;          // ISO 8601
  resolved_at: string | null;

  /** Посчитано по заголовку X-Device-Id. Управляет кнопкой «확인 +1». */
  confirmed_by_me: boolean;

  /** Только в ответе nearby — расстояние до точки из запроса, метры. */
  distance_m?: number;

  /** Только в ответе деталей — история для блока 진행 상황. */
  status_log?: StatusLogEntry[];
}

// ─────────────────────────────────────────────────────────────
// Запросы и ответы — по одному на каждый endpoint
// ─────────────────────────────────────────────────────────────

/** POST /api/reports/nearby — есть ли уже такая проблема рядом. */
export interface NearbyRequest {
  lat: number;
  lng: number;
  category: Category;
}
export interface NearbyResponse {
  /** null = дубля нет, показываем форму создания. */
  duplicate: Report | null;
  /** Радиус, по которому искали. Показываем в UI: «в 50 м». */
  radius_m: number;
}

/** POST /api/reports — создать новую проблему. */
export interface CreateReportRequest {
  lat: number;
  lng: number;
  category: Category;
  severity: Severity;
  affected_groups: AffectedGroup[];
  /** Путь в Supabase Storage, телефон грузит файл сам и присылает ссылку. */
  photo_url: string;
  photo_thumb_url: string;
  description?: string;
}
export type CreateReportResponse = Report;

/** POST /api/reports/:id/confirm — 확인 +1. */
export interface ConfirmResponse {
  /** Обновлённая проблема: счётчик и приоритет уже новые. */
  report: Report;
  /** Сколько стало и сколько было — для анимации «12 → 13». */
  previous_confirmation_count: number;
  previous_priority_score: number;
}

/** GET /api/reports?bbox=minLng,minLat,maxLng,maxLat — точки для карты. */
export interface MapResponse {
  reports: Report[];
  /** Сколько всего в области — для чипов «전체 8 · 신규 3 · 처리중 4». */
  counts: Record<Status, number>;
}

/** GET /api/reports/:id — детали. Report придёт с breakdown и status_log. */
export type ReportDetailResponse = Report;

/** POST /api/classify — фото в категорию. Всегда отвечает, даже при сбое. */
export interface ClassifyResponse {
  /** null = сервис не ответил. Это НЕ ошибка: показываем кнопки без подсказки. */
  category: Category | null;
  /** 0–1. Ниже 0.6 подсказку не показываем. */
  confidence: number;
}

/** POST /api/voice/draft — речь в черновик заявки. */
export interface VoiceDraftResponse {
  transcript: string;
  category: Category | null;
  affected_groups: AffectedGroup[];
}

/** PATCH /api/admin/reports/:id/status */
export interface UpdateStatusRequest {
  status: Status;
  note?: string; // «노원구 도로과»
}

/** PATCH /api/admin/reports/:id/resolve */
export interface ResolveRequest {
  after_photo_url: string;
  note?: string;
}

// ─────────────────────────────────────────────────────────────
// Ошибки — единая форма, коды закрытым списком
// ─────────────────────────────────────────────────────────────

export type ErrorCode =
  | 'already_confirmed'   // это устройство уже подтверждало → 409
  | 'report_not_found'    // 404
  | 'rate_limited'        // превышен лимит суток → 429
  | 'invalid_payload'     // 400
  | 'unauthorized'        // нет прав оператора → 401
  | 'internal';           // 500

export interface ApiError {
  error: {
    code: ErrorCode;
    /** Текст для пользователя, по-корейски. Показываем как есть. */
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Константы — используем их, а не числа в коде
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

/** Заголовок с анонимным идентификатором устройства. Обязателен везде. */
export const DEVICE_ID_HEADER = 'X-Device-Id';

/**
 * Контрольный пример. Если calcPriority() даёт не 78 — код неправильный.
 * 13 подтверждений, high, 4 дня, 2 группы:
 *   min(30, 13 * 2.5) = 30
 *   SEVERITY_POINTS.high = 35
 *   min(15, 4 * 0.75)    = 3
 *   min(20, 2 * 5)       = 10
 *   ─────────────────────────
 *   итого                  78
 */
export const PRIORITY_REFERENCE_CASE = {
  input: { confirmations: 13, severity: 'high' as Severity, days_open: 4, groups: 2 },
  expected_score: 78,
  expected_breakdown: { confirmations: 30, severity: 35, duration: 3, impact: 10 },
};
