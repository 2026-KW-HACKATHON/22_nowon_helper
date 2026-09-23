/**
 * Checks for request bodies. Anything that fails is `invalid_payload`.
 *
 * Owner: BE-1. The enum lists repeat contract/types.ts at runtime:
 * types vanish when Node strips them, the lists stay. `satisfies` makes
 * TypeScript complain if a list drifts from the contract. The database
 * enums are the last line of defence; these checks give the app a 400
 * instead of a 500.
 */

import type { AffectedGroup, Category, Severity, Status } from '../../contract/types.ts';
import { ApiFailure } from './errors.ts';

export const CATEGORIES = ['fallen_tree', 'broken_sidewalk', 'blocked_ramp', 'broken_facility'] as const satisfies readonly Category[];
export const SEVERITIES = ['low', 'medium', 'high'] as const satisfies readonly Severity[];
export const STATUSES = ['new', 'in_progress', 'resolved'] as const satisfies readonly Status[];
export const GROUPS = ['wheelchair', 'elderly', 'stroller', 'visually_impaired'] as const satisfies readonly AffectedGroup[];

/** The request body as an object, or invalid_payload. */
export function body(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiFailure('invalid_payload');
  }
  return value as Record<string, unknown>;
}

export function oneOf<T extends string>(list: readonly T[], value: unknown): T {
  if (typeof value !== 'string' || !list.includes(value as T)) throw new ApiFailure('invalid_payload');
  return value as T;
}

export function latLng(lat: unknown, lng: unknown): { lat: number; lng: number } {
  if (
    typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    throw new ApiFailure('invalid_payload');
  }
  return { lat, lng };
}

/** Each group once: the impact part of the score counts groups. */
export function groups(value: unknown): AffectedGroup[] {
  if (!Array.isArray(value)) throw new ApiFailure('invalid_payload');
  return [...new Set(value.map((group) => oneOf(GROUPS, group)))];
}

/** Trimmed text; empty counts as missing. */
export function text(value: unknown, { max, required }: { max: number; required: boolean }): string | null {
  if (value !== undefined && value !== null) {
    if (typeof value !== 'string' || value.length > max) throw new ApiFailure('invalid_payload');
    const trimmed = value.trim();
    if (trimmed !== '') return trimmed;
  }
  if (required) throw new ApiFailure('invalid_payload');
  return null;
}

/** A photo link. Only http(s): the app renders it as an image source. */
export function url(value: unknown): string {
  const link = text(value, { max: 2048, required: true }) as string;
  if (!/^https?:\/\//i.test(link)) throw new ApiFailure('invalid_payload');
  return link;
}
