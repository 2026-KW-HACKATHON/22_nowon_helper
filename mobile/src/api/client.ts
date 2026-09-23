/**
 * Shared HTTP layer for every endpoint (FE-1 + FE-2): one ApiRequestError,
 * one request() that always sends X-Device-Id and always aborts after a
 * timeout. Endpoint-specific functions live in create.ts (FE-1) and
 * browse.ts (FE-2); both import from here so error handling stays identical.
 */

import { DEVICE_ID_HEADER, type ApiError, type ErrorCode } from '../../../contract/types';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';
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

type Method = 'GET' | 'POST' | 'PATCH';
type Body = { json: unknown } | { form: FormData } | undefined;

export async function request<T>(
  method: Method,
  path: string,
  body: Body,
  timeoutMs = API_TIMEOUT_MS,
): Promise<T> {
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
      method,
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
export function fileForm(field: string, uri: string, name: string, type: string): FormData {
  const form = new FormData();
  form.append(field, { uri, name, type } as unknown as Blob);
  return form;
}
