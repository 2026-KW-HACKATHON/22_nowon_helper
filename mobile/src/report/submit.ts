import type { Report } from '../../../contract/types';
import { createReport } from '@/api';
import { uploadPhoto } from '@/api/upload';
import { getDraft, updateDraft } from './draft';
import { locate } from './location';

/**
 * POST /api/reports from the current draft. Called from 02 (no duplicate
 * nearby) and from 03 ("다른 문제입니다 · 새로 신고"). Throws with a message
 * the screen can show as is.
 */
export async function submitDraft(): Promise<Report> {
  const { photo, category, severity, groups, voice } = getDraft();
  if (!photo || !category || !severity) throw new Error('사진, 종류, 위험도를 먼저 골라 주세요.');

  const coords = await locate();
  const uploaded = await uploadPhoto(photo);
  const note = voice?.transcript.trim();
  const report = await createReport({
    ...coords,
    category,
    severity,
    affected_groups: groups,
    ...uploaded,
    ...(note ? { description: note } : {}),
  });
  updateDraft({ created: report });
  return report;
}
