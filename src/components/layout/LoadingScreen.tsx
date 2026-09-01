import React, { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import {
  ASSET_MANIFEST,
  preloadAssets,
  type PreloadProgress,
} from '../../utils/assetPreloader';

interface LoadingScreenProps {
  onComplete: () => void;
}

// Let large videos finish. A hung network still cannot trap a child forever.
const SAFETY_TIMEOUT_MS = 180_000;

/**
 * Full-screen asset preloader shown before the game starts. Downloads every
 * asset in the manifest to the device (with a friendly progress meter) so
 * gameplay has no on-the-fly loading hitches.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState<number>(0);
  const [done, setDone] = useState<number>(0);
  const [hadErrors, setHadErrors] = useState<boolean>(false);

  useEffect(() => {
    // Each mount starts its own run and aborts on cleanup. This is safe under
    // React StrictMode (which mounts effects twice in dev): the first run is
    // aborted and the second run drives the UI to completion.
    let cancelled = false;
    let finished = false;
    const controller = new AbortController();

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      onComplete();
    };

    const timeout = window.setTimeout(finish, SAFETY_TIMEOUT_MS);

    preloadAssets(
      (p: PreloadProgress) => {
        if (cancelled) return;
        setPercent(Math.round(p.percent));
        setDone(p.completedCount);
      },
      ASSET_MANIFEST,
      controller.signal,
    )
      .then((res) => {
        if (cancelled) return;
        if (res.failed.length > 0) setHadErrors(true);
        setPercent(100);
        // Brief pause so kids see the meter reach full before starting.
        window.setTimeout(finish, 500);
      })
      .catch(() => {
        if (cancelled) return;
        setHadErrors(true);
        window.setTimeout(finish, 500);
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [onComplete]);

  const total = ASSET_MANIFEST.length;

  return (
    <div className="w-full h-screen h-[100dvh] bg-gradient-to-b from-emerald-600 to-emerald-800 text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Mascot */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center mb-6 shadow-lg animate-bounce">
        <Droplets className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
      </div>

      <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-1 drop-shadow">
        Getting Tippy ready...
      </h1>
      <p className="text-emerald-100 text-sm sm:text-base font-medium mb-6">
        Saving the videos and pictures so they play even without internet.
      </p>

      {/* Progress meter */}
      <div className="w-full max-w-md">
        <div
          className="h-5 sm:h-6 w-full rounded-full bg-emerald-950/40 border border-white/20 overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full transition-[width] duration-200 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs sm:text-sm text-emerald-100 font-semibold">
          <span>{percent}%</span>
          <span>
            {done} / {total} items
          </span>
        </div>
      </div>

      {hadErrors && (
        <p className="mt-5 text-emerald-100/90 text-xs sm:text-sm text-center max-w-sm">
          Some parts could not be saved. They will play from the internet if
          needed.
        </p>
      )}
    </div>
  );
};
