import fixtures from '../../contract/fixtures.json';
import { USE_MOCK_UPLOAD } from './config';
import type { CompressedPhoto } from './photo';

export interface UploadedPhoto {
  photo_url: string;
  photo_thumb_url: string;
}

/**
 * The phone uploads to Supabase Storage itself and sends the two links.
 * Until the bucket and keys exist, this returns the fixture links — replace
 * only this function when Supabase is ready.
 */
export async function uploadPhoto(_photo: CompressedPhoto): Promise<UploadedPhoto> {
  if (USE_MOCK_UPLOAD) {
    const { photo_url, photo_thumb_url } = fixtures['POST /api/reports'].request;
    return { photo_url, photo_thumb_url };
  }
  throw new Error('Supabase upload is not configured');
}
