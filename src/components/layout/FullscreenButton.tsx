import React, { useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import {
  isFullscreenActive,
  isFullscreenSupported,
  toggleFullscreen,
} from '../../utils/fullscreen';

/**
 * Fullscreen toggle button.
 *
 * Shown only in landscape orientation (via the `landscape-only` CSS helper).
 * Uses the Fullscreen API to hide the browser UI (URL bar, tabs) and render
 * the story edge-to-edge. Falls back gracefully where the API is unavailable
 * (e.g. iPhone Safari, which does not support element fullscreen).
 */
export const FullscreenButton: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  // Hide the button entirely if the Fullscreen API is not supported.
  if (!isFullscreenSupported()) {
    return null;
  }

  return (
    <button
      onClick={() => {
        void toggleFullscreen();
      }}
      aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
      title={isFullscreen ? 'Exit full screen' : 'Full screen'}
      className="landscape-only inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border shadow-sm bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700"
    >
      {isFullscreen ? (
        <Minimize className="w-3.5 h-3.5" />
      ) : (
        <Maximize className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {isFullscreen ? 'Exit' : 'Full Screen'}
      </span>
    </button>
  );
};
