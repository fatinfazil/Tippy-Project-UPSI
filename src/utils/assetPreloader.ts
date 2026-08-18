import { PRELOAD_CHARACTER_GIFS } from '../components/shared/CharacterLayer';
import { MEDIA_CACHE_NAME } from './cachedMedia';

/**
 * Central manifest of all runtime media assets that should be fully downloaded
 * to the device before gameplay begins (videos, backgrounds, character GIFs).
 * Paths are served statically from `public/`.
 */
const SCENE_ASSETS: string[] = [
  // Videos (largest assets)
  '/videos/scene1-video.mp4',
  '/videos/scene2-video.mp4',
  // Backgrounds
  '/bg/bg_scene1_park.png',
  '/bg/bg_scene2_gadern.png',
  // Misc
  '/characters/droplet.png',
];

export const ASSET_MANIFEST: string[] = Array.from(
  new Set([...SCENE_ASSETS, ...PRELOAD_CHARACTER_GIFS]),
);

const CACHE_NAME = MEDIA_CACHE_NAME;
// Fallback per-asset size used for progress weighting when the server does not
// report Content-Length (keeps the progress bar reasonable rather than jumpy).
const DEFAULT_SIZE = 400 * 1024;

export interface PreloadProgress {
  loadedBytes: number;
  totalBytes: number;
  percent: number; // 0..100
  completedCount: number;
  totalCount: number;
  currentUrl: string;
}

export interface PreloadResult {
  ok: string[];
  failed: string[];
}

const headSize = async (
  url: string,
  signal?: AbortSignal,
): Promise<number | null> => {
  try {
    const res = await fetch(url, { method: 'HEAD', signal });
    if (!res.ok) return null;
    const len = res.headers.get('content-length');
    return len ? parseInt(len, 10) : null;
  } catch {
    return null;
  }
};

/**
 * Downloads every asset in the manifest, reporting byte-accurate progress and
 * storing responses in the Cache API (best-effort) so playback is instant and
 * works offline. Failures are tolerated: a single missing/failed asset never
 * blocks completion, so a child is never trapped on the loading screen.
 */
export const preloadAssets = async (
  onProgress: (p: PreloadProgress) => void,
  manifest: string[] = ASSET_MANIFEST,
  signal?: AbortSignal,
): Promise<PreloadResult> => {
  const totalCount = manifest.length;

  // 1) Best-effort size discovery for byte-weighted progress.
  const rawSizes = await Promise.all(manifest.map((u) => headSize(u, signal)));
  const sizes = rawSizes.map((s) => (s && s > 0 ? s : DEFAULT_SIZE));
  const totalBytes = sizes.reduce((a, b) => a + b, 0);

  const cache =
    typeof caches !== 'undefined'
      ? await caches.open(CACHE_NAME).catch(() => null)
      : null;

  let loadedBytes = 0;
  let completedCount = 0;
  const ok: string[] = [];
  const failed: string[] = [];

  const emit = (currentUrl: string) =>
    onProgress({
      loadedBytes,
      totalBytes,
      percent:
        totalBytes > 0 ? Math.min(100, (loadedBytes / totalBytes) * 100) : 0,
      completedCount,
      totalCount,
      currentUrl,
    });

  for (let i = 0; i < manifest.length; i++) {
    const url = manifest[i];
    const expected = sizes[i];
    let fileLoaded = 0;

    // Reuse a previously downloaded copy instead of hitting the network again.
    // Search every Cache API store so copies left in the older `tippy-assets`
    // name still count, then copy them into the shared store.
    const existing =
      typeof caches !== 'undefined'
        ? await caches.match(url).catch(() => undefined)
        : undefined;
    if (existing) {
      if (cache) {
        await cache.put(url, existing.clone()).catch(() => undefined);
      }
      loadedBytes += expected;
      completedCount += 1;
      ok.push(url);
      emit(url);
      continue;
    }

    try {
      const res = await fetch(url, { signal });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const contentType = res.headers.get('content-type') || '';
      const chunks: BlobPart[] = [];

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          fileLoaded += value.length;
          loadedBytes += value.length;
          emit(url);
        }
      }

      // Store for instant reuse / offline (best-effort).
      if (cache) {
        try {
          const blob = new Blob(chunks, { type: contentType || undefined });
          await cache.put(
            url,
            new Response(blob, {
              headers: contentType ? { 'Content-Type': contentType } : undefined,
            }),
          );
        } catch {
          // Ignore cache write failures (e.g. quota) - HTTP cache is warmed anyway.
        }
      }

      ok.push(url);
    } catch {
      failed.push(url);
      // Count the estimated size so the bar still advances past a failed asset.
      loadedBytes += Math.max(0, expected - fileLoaded);
    } finally {
      completedCount += 1;
      emit(url);
    }
  }

  return { ok, failed };
};
