import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { PHOTO_MAX_PX, PHOTO_QUALITY, THUMB_MAX_PX } from './config';

export interface CompressedPhoto {
  uri: string;       // ≤1280 px, q70 — goes to photo_url
  thumb_uri: string; // ≤200 px — goes to photo_thumb_url
}

/** Compress on the device before upload: the long side is capped, never upscaled. */
export async function compressPhoto(uri: string, width: number, height: number): Promise<CompressedPhoto> {
  const [full, thumb] = await Promise.all([
    resizeLongSide(uri, width, height, PHOTO_MAX_PX),
    resizeLongSide(uri, width, height, THUMB_MAX_PX),
  ]);
  return { uri: full, thumb_uri: thumb };
}

async function resizeLongSide(uri: string, width: number, height: number, max: number): Promise<string> {
  const size = width >= height ? { width: Math.min(max, width) } : { height: Math.min(max, height) };
  const image = await ImageManipulator.manipulate(uri).resize(size).renderAsync();
  const saved = await image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG });
  return saved.uri;
}
