/**
 * The two optional helpers: photo → category, speech → draft.
 *
 * Owner: BE-1. Neither service is connected yet, so both answer the
 * contract's "service down" shape at once. That is not an error: the
 * app shows no hint and the resident fills in the form by hand. When a
 * real service arrives, it goes here behind a 3 s timeout, and any
 * failure still ends in these same answers.
 *
 * The uploaded photo or audio is not read: nothing would use it.
 */

import type { Request, Response } from 'express';
import type { ClassifyResponse, VoiceDraftResponse } from '../../contract/types.ts';

const NO_CLASSIFY: ClassifyResponse = { category: null, confidence: 0 };
const NO_VOICE: VoiceDraftResponse = { transcript: '', category: null, affected_groups: [] };

export function classify(_req: Request, res: Response<ClassifyResponse>) {
  res.json(NO_CLASSIFY);
}

export function voiceDraft(_req: Request, res: Response<VoiceDraftResponse>) {
  res.json(NO_VOICE);
}
