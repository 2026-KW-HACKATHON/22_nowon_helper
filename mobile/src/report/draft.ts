import { useSyncExternalStore } from 'react';

import type { AffectedGroup, Category, Report, Severity, VoiceDraftResponse } from '../../../contract/types';
import type { CompressedPhoto } from './photo';

/** What the resident has entered so far, shared across 01 home → camera → 02 → 03. */
export interface ReportDraft {
  photo: CompressedPhoto | null;
  category: Category | null;
  /** From AI classification (confidence ≥ 0.6) or voice — only a hint, never auto-submitted. */
  hint: Category | null;
  /** AI confidence for `hint`, 0–1. Null when the hint came from voice. */
  confidence: number | null;
  severity: Severity | null;
  groups: AffectedGroup[];
  voice: VoiceDraftResponse | null;
  /** Set by screen 02 when /nearby found an existing problem. */
  duplicate: Report | null;
  /** The report just created — shown on the done screen. */
  created: Report | null;
}

const EMPTY: ReportDraft = {
  photo: null,
  category: null,
  hint: null,
  confidence: null,
  severity: null,
  groups: [],
  voice: null,
  duplicate: null,
  created: null,
};

let draft = EMPTY;
const listeners = new Set<() => void>();

export function updateDraft(patch: Partial<ReportDraft>) {
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
}

/** A new report starts empty — or with the category the resident tapped on the home screen. */
export function resetDraft(category: Category | null = null) {
  draft = { ...EMPTY, category };
  listeners.forEach((l) => l());
}

export function getDraft(): ReportDraft {
  return draft;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDraft(): ReportDraft {
  return useSyncExternalStore(subscribe, () => draft);
}
