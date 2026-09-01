import { useEffect, useState } from 'react';

/**
 * Shared Cache API store for story media. The loading-screen preloader writes
 * here, and Workbox's runtime video/audio rule uses the same name so playback
 * and preload see the same files.
 */
export const MEDIA_CACHE_NAME = 'tippy-media';

export interface CachedMediaSrc {
  /** blob: URL when a cached copy exists, otherwise the original path. */
  playbackSrc: string;
  /** False until the cache lookup has finished (hit or miss). */
  ready: boolean;
  /** True when playbackSrc is a blob from the Cache API. */
  cached: boolean;
}

/**
 * Resolves a media path to a blob URL from the Cache API when possible.
 *
 * iOS Safari / installed PWAs often let <video src="/videos/..."> bypass the
 * service worker (range requests), so a cached file would never be used.
 * Feeding the element a blob: URL reads the bytes that the preloader stored.
 */
export function useCachedMediaSrc(src: string): CachedMediaSrc {
  const [state, setState] = useState<CachedMediaSrc>({
    playbackSrc: src,
    ready: false,
    cached: false,
  });

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    setState({ playbackSrc: src, ready: false, cached: false });

    void (async () => {
      try {
        if (typeof caches !== 'undefined') {
          const cached = await caches.match(src);
          if (cancelled) return;
          if (cached) {
            const blob = await cached.blob();
            if (cancelled) return;
            blobUrl = URL.createObjectURL(blob);
            if (cancelled) {
              URL.revokeObjectURL(blobUrl);
              return;
            }
            setState({ playbackSrc: blobUrl, ready: true, cached: true });
            return;
          }
        }
      } catch {
        // Quota / private mode / missing Cache API: fall back to the network.
      }
      if (!cancelled) setState({ playbackSrc: src, ready: true, cached: false });
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  return state;
}
