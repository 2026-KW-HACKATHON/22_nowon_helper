/**
 * The one error shape from contract/types.ts: { error: { code, message } }.
 *
 * Owner: BE-1. Handlers throw an ApiFailure; the error handler in
 * server.ts turns it into the response. The message is Korean text the
 * app shows as is.
 */

import type { ApiError, ErrorCode } from '../../contract/types.ts';

const STATUS: Record<ErrorCode, number> = {
  already_confirmed: 409,
  report_not_found: 404,
  rate_limited: 429,
  invalid_payload: 400,
  unauthorized: 401,
  internal: 500,
};

const MESSAGE: Record<ErrorCode, string> = {
  already_confirmed: '이미 확인하신 문제입니다.',
  report_not_found: '문제를 찾을 수 없습니다.',
  rate_limited: '오늘은 더 이상 확인할 수 없습니다. 내일 다시 시도해 주세요.',
  invalid_payload: '요청 형식이 올바르지 않습니다.',
  unauthorized: '권한이 없습니다.',
  internal: '잠시 후 다시 시도해 주세요.',
};

export class ApiFailure extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(MESSAGE[code]);
    this.code = code;
  }

  get status(): number {
    return STATUS[this.code];
  }

  toBody(): ApiError {
    return { error: { code: this.code, message: this.message } };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
