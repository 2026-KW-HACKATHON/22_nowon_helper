/**
 * The only place the app gets data from. Screens call these functions
 * and never know where the data comes from.
 *
 * Split by path so FE-1 and FE-2 each own their own file (see CLAUDE.md's
 * ownership map): client.ts is the shared HTTP layer, browse.ts is FE-2's
 * map/detail endpoints, create.ts is FE-1's create/confirm/AI endpoints.
 * This file just re-exports both, so screens keep importing from '@/api'.
 */

export { ApiRequestError } from './client';
export { DEMO_BBOX, getMap, getReport, type Bbox } from './browse';
export { checkNearby, classifyPhoto, confirmReport, createReport, voiceDraft } from './create';
