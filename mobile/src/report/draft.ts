import { useSyncExternalStore } from 'react';

import type { Category, Report, VoiceDraftResponse } from '../../../contract/types';
import type { CompressedPhoto } from './photo';

/** What the resident has entered so far, shared across screens 01 → 02 → 03 / 07. */
export interface ReportDraft {
  photo: CompressedPhoto | null;
  category: Category | null;
  /** From AI classification (confidence ≥ 0.6) or voice — only a hint, never auto-submitted. */
  hint: Category | null;
  voice: VoiceDraftResponse | null;
  /** Set by screen 02 when /nearby found an existing problem. */
  duplicate: Report | null;
}

const EMPTY: ReportDraft = { photo: null, category: null, hint: null, voice: null, duplicate: null };

let draft = EMPTY;
const listeners = new Set<() => void>();

export function updateDraft(patch: Partial<ReportDraft>) {
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
}

export function resetDraft() {
  draft = EMPTY;
  listeners.forEach((l) => l());
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
